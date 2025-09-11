/**
 * WebSocket ConnectionManager
 * WebSocket 連線管理器 - 處理連線、重連、心跳、訊息佇列
 */

import {
  WebSocketConnectionState,
  WebSocketEvent,
  WebSocketEventType,
  WebSocketManagerConfig,
  WebSocketManagerEventMap,
  QueuedMessage,
  HeartbeatEvent,
} from './types';

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private connectionState: WebSocketConnectionState = WebSocketConnectionState.DISCONNECTED;
  private eventListeners: Map<string, Function[]> = new Map();
  private messageQueue: QueuedMessage[] = [];
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectionAttempts = 0;
  private lastHeartbeatSent = 0;
  private config: WebSocketManagerConfig;

  constructor(
    private url: string,
    private authToken?: string,
    config?: Partial<WebSocketManagerConfig>
  ) {
    this.config = {
      heartbeatInterval: 25000, // 25 seconds
      heartbeatTimeout: 60000, // 60 seconds
      reconnectionDelay: 1000, // 1 second
      maxReconnectionDelay: 8000, // 8 seconds
      maxReconnectionAttempts: 5,
      messageQueueMaxSize: 100,
      ...config,
    };
  }

  /**
   * 建立 WebSocket 連線
   */
  async connect(): Promise<void> {
    if (this.connectionState === WebSocketConnectionState.CONNECTED ||
        this.connectionState === WebSocketConnectionState.CONNECTING) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.setConnectionState(WebSocketConnectionState.CONNECTING);

        // Build connection URL with auth token
        const wsUrl = this.buildConnectionUrl();
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.onConnectionOpen();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.onMessage(event);
        };

        this.ws.onclose = (event) => {
          this.onConnectionClose(event);
        };

        this.ws.onerror = (error) => {
          this.onConnectionError();
          if (this.connectionState === WebSocketConnectionState.CONNECTING) {
            reject(new Error('WebSocket connection failed'));
          }
        };

        // Connection timeout
        setTimeout(() => {
          if (this.connectionState === WebSocketConnectionState.CONNECTING) {
            this.ws?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      } catch (error) {
        this.setConnectionState(WebSocketConnectionState.ERROR);
        reject(error);
      }
    });
  }

  /**
   * 斷開 WebSocket 連線
   */
  disconnect(): void {
    this.clearTimers();
    this.reconnectionAttempts = 0;

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;

      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client disconnect');
      }
      this.ws = null;
    }

    this.setConnectionState(WebSocketConnectionState.DISCONNECTED);
    this.emit('disconnected');
  }

  /**
   * 發送訊息
   */
  sendMessage(event: WebSocketEvent): boolean {
    if (this.isConnected() && this.ws) {
      try {
        this.ws.send(JSON.stringify(event));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        this.queueMessage(event);
        return false;
      }
    } else {
      this.queueMessage(event);
      return false;
    }
  }

  /**
   * 訊息加入佇列
   */
  private queueMessage(event: WebSocketEvent): void {
    if (this.messageQueue.length >= this.config.messageQueueMaxSize) {
      this.messageQueue.shift(); // Remove oldest message
    }

    this.messageQueue.push({
      event,
      timestamp: Date.now(),
      attempts: 0,
    });
  }

  /**
   * 處理佇列中的訊息
   */
  private flushMessageQueue(): void {
    const queue = [...this.messageQueue];
    this.messageQueue = [];

    queue.forEach((queuedMessage) => {
      if (queuedMessage.attempts < 3) {
        queuedMessage.attempts++;
        this.sendMessage(queuedMessage.event);
      }
    });
  }

  /**
   * 建立連線 URL
   */
  private buildConnectionUrl(): string {
    const url = new URL(this.url);
    if (this.authToken) {
      url.searchParams.set('token', this.authToken);
    }
    return url.toString();
  }

  /**
   * 連線開啟處理
   */
  private onConnectionOpen(): void {
    this.setConnectionState(WebSocketConnectionState.CONNECTED);
    this.reconnectionAttempts = 0;
    
    this.startHeartbeat();
    this.flushMessageQueue();
    
    this.emit('connected');
  }

  /**
   * 連線關閉處理
   */
  private onConnectionClose(event: CloseEvent): void {
    this.clearTimers();

    if (event.code === 1000) {
      // Normal closure
      this.setConnectionState(WebSocketConnectionState.DISCONNECTED);
      this.emit('disconnected');
    } else {
      // Unexpected closure, attempt reconnection
      this.setConnectionState(WebSocketConnectionState.DISCONNECTED);
      this.scheduleReconnection();
    }
  }

  /**
   * 連線錯誤處理
   */
  private onConnectionError(): void {
    this.emit('error', new Error('WebSocket connection error'));
  }

  /**
   * 訊息接收處理
   */
  private onMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as WebSocketEventType;
      
      // Handle heartbeat response
      if (data.type === 'heartbeat') {
        this.onHeartbeatResponse();
        return;
      }

      this.emit('message', data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      this.emit('error', new Error('Invalid WebSocket message format'));
    }
  }

  /**
   * 開始心跳檢測
   */
  private startHeartbeat(): void {
    this.clearHeartbeatTimers();

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  /**
   * 發送心跳
   */
  private sendHeartbeat(): void {
    if (!this.isConnected()) {
      return;
    }

    const heartbeat: HeartbeatEvent = {
      type: 'heartbeat',
      timestamp: Date.now(),
    };

    this.lastHeartbeatSent = Date.now();
    this.sendMessage(heartbeat);

    // Set timeout for heartbeat response
    this.heartbeatTimeout = setTimeout(() => {
      this.onHeartbeatTimeout();
    }, this.config.heartbeatTimeout);
  }

  /**
   * 心跳回應處理
   */
  private onHeartbeatResponse(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * 心跳超時處理
   */
  private onHeartbeatTimeout(): void {
    console.warn('WebSocket heartbeat timeout');
    this.emit('connection_timeout');
    this.ws?.close(1006, 'Heartbeat timeout');
  }

  /**
   * 安排重連
   */
  private scheduleReconnection(): void {
    if (this.reconnectionAttempts >= this.config.maxReconnectionAttempts) {
      console.error('Max reconnection attempts reached');
      this.setConnectionState(WebSocketConnectionState.ERROR);
      return;
    }

    this.setConnectionState(WebSocketConnectionState.RECONNECTING);
    this.emit('reconnecting');

    const delay = Math.min(
      this.config.reconnectionDelay * Math.pow(2, this.reconnectionAttempts),
      this.config.maxReconnectionDelay
    );

    this.reconnectionTimeout = setTimeout(() => {
      this.reconnectionAttempts++;
      this.emit('reconnection_attempt', this.reconnectionAttempts);
      
      this.connect().catch(() => {
        this.scheduleReconnection();
      });
    }, delay);
  }

  /**
   * 清除計時器
   */
  private clearTimers(): void {
    this.clearHeartbeatTimers();
    
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
      this.reconnectionTimeout = null;
    }
  }

  /**
   * 清除心跳計時器
   */
  private clearHeartbeatTimers(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * 設置連線狀態
   */
  private setConnectionState(newState: WebSocketConnectionState): void {
    const oldState = this.connectionState;
    this.connectionState = newState;
    
    if (oldState !== newState) {
      this.emit('connection_state_changed', newState, oldState);
    }
  }

  /**
   * 事件發射器
   */
  private emit(eventName: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(eventName) || [];
    listeners.forEach((listener) => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in WebSocket event listener for ${eventName}:`, error);
      }
    });
  }

  // Public API methods

  /**
   * 是否已連線
   */
  isConnected(): boolean {
    return this.connectionState === WebSocketConnectionState.CONNECTED;
  }

  /**
   * 獲取連線狀態
   */
  getConnectionState(): WebSocketConnectionState {
    return this.connectionState;
  }

  /**
   * 添加事件監聽器
   */
  on<K extends keyof WebSocketManagerEventMap>(
    eventName: K,
    listener: WebSocketManagerEventMap[K]
  ): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(listener);
  }

  /**
   * 移除事件監聽器
   */
  off<K extends keyof WebSocketManagerEventMap>(
    eventName: K,
    listener: WebSocketManagerEventMap[K]
  ): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 更新認證令牌
   */
  updateAuthToken(token: string): void {
    this.authToken = token;
    
    // If connected, reconnect with new token
    if (this.isConnected()) {
      this.disconnect();
      setTimeout(() => {
        this.connect();
      }, 100);
    }
  }

  /**
   * 獲取連線統計
   */
  getConnectionStats() {
    return {
      state: this.connectionState,
      reconnectionAttempts: this.reconnectionAttempts,
      messageQueueSize: this.messageQueue.length,
      lastHeartbeatSent: this.lastHeartbeatSent,
      isConnected: this.isConnected(),
    };
  }
}