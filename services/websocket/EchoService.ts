/**
 * Laravel Echo WebSocket Service
 * 整合 Laravel Echo 與 WebSocket Manager
 */

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { WebSocketManager } from './WebSocketManager';
import {
  WebSocketEventType,
  MessageNewEvent,
  GameStartEvent,
  GameEndedEvent
} from './types';

// Configure Pusher for Laravel Echo (Platform-safe)
if (typeof window !== 'undefined') {
  window.Pusher = Pusher;
}

export interface EchoServiceConfig {
  wsHost: string;
  wsPort: number;
  scheme: string;
  authEndpoint: string;
}

export interface EchoEventMap {
  'message.new': (event: MessageNewEvent) => void;
  'game.invitation.sent': (event: any) => void;
  'game.invitation.accepted': (event: any) => void;
  'game.invitation.declined': (event: any) => void;
  'game.started': (event: GameStartEvent) => void;
  'game.move': (event: any) => void;
  'game.ended': (event: GameEndedEvent) => void;
  'game.timeout': (event: any) => void;
  'user.joined': (event: any) => void;
  'user.left': (event: any) => void;
}

export class EchoService {
  private echo: Echo | null = null;
  private wsManager: WebSocketManager | null = null;
  private authToken: string | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private config: EchoServiceConfig;
  private subscribedChannels: Map<string, any> = new Map();

  private isEchoAvailable: boolean = false;
  private initializationTimeout: number;

  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number;
  private maxReconnectDelay: number;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isReconnecting: boolean = false;

  private healthCheckInterval: number;
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private lastHealthCheck: number = Date.now();

  constructor(config: EchoServiceConfig) {
    this.config = config;
    this.initializationTimeout = parseInt(
      process.env.EXPO_PUBLIC_ECHO_INIT_TIMEOUT || '5000'
    );
    this.maxReconnectAttempts = parseInt(
      process.env.EXPO_PUBLIC_MAX_RECONNECT_ATTEMPTS || '10'
    );
    this.maxReconnectDelay = parseInt(
      process.env.EXPO_PUBLIC_MAX_RECONNECT_DELAY || '1800000' // 30 分鐘
    );
    this.healthCheckInterval = parseInt(
      process.env.EXPO_PUBLIC_HEALTH_CHECK_INTERVAL || '30000' // 30 秒
    );
  }

  /**
   * 初始化 Echo 服務
   */
  async initialize(authToken: string): Promise<void> {
    this.authToken = authToken;

    // Try to initialize Echo with timeout
    try {
      await this.initializeEchoWithTimeout(authToken);
      this.isEchoAvailable = true;
      this.reconnectAttempts = 0; // 重置重連計數
      console.log('Echo service initialized successfully');

      this.startHealthCheck();
    } catch (error) {
      console.warn('Echo initialization failed, will retry:', error);
      this.isEchoAvailable = false;

      this.scheduleReconnect();
    }
  }

  /**
   * 初始化 Echo
   */
  private async initializeEchoWithTimeout(authToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Echo initialization timeout after ${this.initializationTimeout}ms`));
      }, this.initializationTimeout);

      try {
        // Initialize Laravel Echo
        this.echo = new Echo({
          broadcaster: 'reverb',
          key: process.env.EXPO_PUBLIC_REVERB_APP_KEY || 'app-key',
          wsHost: this.config.wsHost,
          wsPort: this.config.wsPort,
          wssPort: this.config.wsPort,
          forceTLS: this.config.scheme === 'https',
          enabledTransports: ['ws', 'wss'],
          auth: {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
          authorizer: (channel: any) => {
            return {
              authorize: (socketId: string, callback: Function) => {
                fetch(this.config.authEndpoint, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                  },
                  body: JSON.stringify({
                    socket_id: socketId,
                    channel_name: channel.name,
                  }),
                })
                  .then(response => response.json())
                  .then(data => callback(null, data))
                  .catch(error => callback(error));
              }
            };
          },
        });

        // Setup Echo connection listeners
        this.setupEchoListeners();

        // Wait for connection or timeout
        const checkConnection = () => {
          if (this.echo?.connector.pusher.connection.state === 'connected') {
            clearTimeout(timeoutId);
            resolve();
          } else if (this.echo?.connector.pusher.connection.state === 'failed') {
            clearTimeout(timeoutId);
            reject(new Error('Echo connection failed'));
          }
        };

        // Check connection state immediately and periodically
        checkConnection();
        const intervalId = setInterval(() => {
          checkConnection();
          if (this.echo?.connector.pusher.connection.state === 'connected') {
            clearInterval(intervalId);
          }
        }, 100);

        // Also listen for connected event
        this.echo.connector.pusher.connection.bind('connected', () => {
          clearTimeout(timeoutId);
          clearInterval(intervalId);
          resolve();
        });

      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * 設置 Echo 連線監聽器
   */
  private setupEchoListeners(): void {
    if (!this.echo) return;

    // Connection state listeners
    this.echo.connector.pusher.connection.bind('connected', () => {
      console.log('Echo connected');
      this.reconnectAttempts = 0; // 重置重連計數
      this.isReconnecting = false;
      this.lastHealthCheck = Date.now();
      this.emit('connected');

      // 重連成功後同步狀態
      this.syncStateAfterReconnect();
    });

    this.echo.connector.pusher.connection.bind('disconnected', () => {
      console.log('Echo disconnected');
      this.emit('disconnected');

      // 啟動自動重連
      if (!this.isReconnecting) {
        this.scheduleReconnect();
      }
    });

    this.echo.connector.pusher.connection.bind('error', (error: any) => {
      console.error('Echo connection error:', error);
      this.emit('error', error);

      // 啟動自動重連
      if (!this.isReconnecting) {
        this.scheduleReconnect();
      }
    });

    this.echo.connector.pusher.connection.bind('state_change', (states: any) => {
      console.log('Echo state change:', states.previous, '->', states.current);
      this.emit('connection_state_changed', states.current, states.previous);
    });
  }

  /**
   * 訂閱對話頻道
   */
  subscribeToConversation(conversationId: number): void {
    const channelName = `conversation.${conversationId}`;

    if (this.subscribedChannels.has(channelName)) {
      console.log(`Already subscribed to ${channelName}`);
      return;
    }

    // Try Echo first if available
    if (this.isEchoAvailable && this.echo) {
      try {
        const channel = this.echo.private(channelName);

        // Listen for new messages
        channel.listen('MessageSent', (event: MessageNewEvent) => {
          console.log('New message received:', event);
          this.emit('message.new', event);
        });

        // Listen for game invitation events
        channel.listen('GameInvitationSent', (event: any) => {
          console.log('Game invitation sent:', event);
          this.emit('game.invitation.sent', event);
        });

        channel.listen('GameInvitationAccepted', (event: any) => {
          console.log('Game invitation accepted:', event);
          this.emit('game.invitation.accepted', event);
        });

        channel.listen('GameInvitationDeclined', (event: any) => {
          console.log('Game invitation declined:', event);
          this.emit('game.invitation.declined', event);
        });

        // Listen for game events
        channel.listen('GameStarted', (event: GameStartEvent) => {
          console.log('Game started:', event);
          this.emit('game.started', event);
        });

        channel.listen('GameMoveMade', (event: any) => {
          console.log('Game move made:', event);
          this.emit('game.move', event);
        });

        channel.listen('GameEnded', (event: GameEndedEvent) => {
          console.log('Game ended:', event);
          this.emit('game.ended', event);
        });

        channel.listen('GameTimeout', (event: any) => {
          console.log('Game timeout:', event);
          this.emit('game.timeout', event);
        });

        // Listen for user presence
        channel.listen('UserJoinedConversation', (event: any) => {
          console.log('User joined:', event);
          this.emit('user.joined', event);
        });

        this.subscribedChannels.set(channelName, channel);
        console.log(`Subscribed to ${channelName} via Echo`);
        return;
      } catch (error) {
        console.error(`Failed to subscribe to ${channelName} via Echo:`, error);
        // Fall through to WebSocket Manager
      }
    }

    // Fallback to WebSocket Manager
    if (this.wsManager && this.wsManager.isConnected()) {
      console.log(`Falling back to WebSocket Manager for ${channelName}`);
      // WebSocket Manager handles subscriptions differently
      // Just mark as subscribed so we don't try again
      this.subscribedChannels.set(channelName, { type: 'websocket_manager' });
    } else {
      console.warn(`Cannot subscribe to ${channelName}: No connection available`);
    }
  }

  /**
   * 取消訂閱對話頻道
   */
  unsubscribeFromConversation(conversationId: number): void {
    if (!this.echo) return;

    const channelName = `conversation.${conversationId}`;
    const channel = this.subscribedChannels.get(channelName);

    if (channel) {
      this.echo.leave(channelName);
      this.subscribedChannels.delete(channelName);
      console.log(`Unsubscribed from ${channelName}`);
    }
  }

  /**
   * 發送訊息
   * 注意：Reverb/Pusher WebSocket 只用於接收訊息，不用於發送
   * 訊息發送應該透過 HTTP API
   */
  sendMessage(conversationId: number, content: string, clientNonce: string): boolean {
    console.warn('WebSocket is for receiving messages only. Please use HTTP API to send messages.');
    return false;
  }

  /**
   * 加入聊天室
   */
  joinChat(conversationId: number, userId: number): boolean {
    if (!this.wsManager) {
      console.error('WebSocket Manager not available');
      return false;
    }

    return this.wsManager.sendMessage({
      type: 'chat.join',
      conversation_id: conversationId,
      user_id: userId,
    });
  }

  /**
   * 發送遊戲移動
   */
  sendGameMove(gameSessionId: number, roundNumber: number, choice: 'rock' | 'paper' | 'scissors', playerId: number): boolean {
    if (!this.wsManager) {
      console.error('WebSocket Manager not available');
      return false;
    }

    return this.wsManager.sendMessage({
      type: 'game.play',
      game_session_id: gameSessionId,
      round_number: roundNumber,
      choice,
      player_id: playerId,
    });
  }

  /**
   * 獲取連線狀態
   */
  isConnected(): boolean {
    if (this.echo?.connector.pusher.connection.state === 'connected') {
      return true;
    }

    return this.wsManager?.isConnected() || false;
  }

  /**
   * 獲取連線統計（方案 2: 加入重連信息）
   */
  getConnectionStats() {
    const echoState = this.echo?.connector.pusher.connection.state || 'unknown';
    const wsStats = this.wsManager?.getConnectionStats();

    return {
      echo: {
        state: echoState,
        connected: echoState === 'connected',
        available: this.isEchoAvailable,
      },
      websocket: wsStats,
      subscribedChannels: Array.from(this.subscribedChannels.keys()),
      isConnected: this.isConnected(),
      reconnection: {
        isReconnecting: this.isReconnecting,
        attempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
      },
      healthCheck: {
        lastCheck: this.lastHealthCheck,
        interval: this.healthCheckInterval,
      },
    };
  }

  /**
   * 更新認證令牌
   */
  updateAuthToken(token: string): void {
    this.authToken = token;

    if (this.wsManager) {
      this.wsManager.updateAuthToken(token);
    }

    // Reinitialize Echo with new token
    if (this.echo) {
      this.disconnect();
      setTimeout(() => {
        this.initialize(token);
      }, 100);
    }
  }


  /**
   * 排程重連
   */
  private scheduleReconnect(): void {
    if (this.isReconnecting) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      this.emit('reconnect_failed');
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    // 指數退避：2s, 4s, 8s, 16s, 32s, ..., 最多 30 分鐘
    const baseDelay = 2000; // 2 秒
    const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempts - 1);
    const delay = Math.min(exponentialDelay, this.maxReconnectDelay);

    console.log(
      `Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimer = setTimeout(() => {
      this.attemptReconnect();
    }, delay);

    this.emit('reconnecting', this.reconnectAttempts, delay);
  }

  /**
   * 嘗試重連
   */
  private async attemptReconnect(): Promise<void> {
    if (!this.authToken) {
      console.error('Cannot reconnect: no auth token');
      this.isReconnecting = false;
      return;
    }

    console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts})...`);

    try {
      // 嘗試重新初始化 Echo
      await this.initializeEchoWithTimeout(this.authToken);
      this.isEchoAvailable = true;
      this.isReconnecting = false;
      this.reconnectAttempts = 0;
      console.log('Reconnection successful');

      // 啟動健康檢查
      this.startHealthCheck();

      this.emit('reconnected');
    } catch (error) {
      console.error('Reconnection attempt failed:', error);
      this.isReconnecting = false;

      // 繼續下一次重連
      this.scheduleReconnect();
    }
  }

  /**
   * 重連成功後同步狀態
   */
  private syncStateAfterReconnect(): void {
    console.log('Syncing state after reconnect...');

    // 重新訂閱所有頻道
    const channelNames = Array.from(this.subscribedChannels.keys());
    this.subscribedChannels.clear();

    channelNames.forEach(channelName => {
      const conversationId = parseInt(channelName.replace('conversation.', ''));
      if (!isNaN(conversationId)) {
        this.subscribeToConversation(conversationId);
      }
    });

    this.emit('state_synced');
  }

  /**
   * 啟動健康檢查
   */
  private startHealthCheck(): void {
    // 清除舊的定時器
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckInterval);

    console.log(`Health check started (interval: ${this.healthCheckInterval}ms)`);
  }

  /**
   * 執行健康檢查
   */
  private performHealthCheck(): void {
    // 檢查 Echo 連接狀態
    if (this.echo && this.echo.connector.pusher.connection.state !== 'connected') {
      console.warn('Health check failed: Echo not connected');

      // 嘗試重連
      if (!this.isReconnecting) {
        this.scheduleReconnect();
      }
    } else {
      this.lastHealthCheck = Date.now();
    }
  }

  /**
   * 停止健康檢查
   */
  private stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      console.log('Health check stopped');
    }
  }

  /**
   * 取消重連
   */
  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      this.isReconnecting = false;
    }
  }

  /**
   * 斷開連線
   */
  disconnect(): void {
    // 停止所有定時器
    this.stopHealthCheck();
    this.cancelReconnect();

    // Clear all subscriptions
    this.subscribedChannels.forEach((channel, channelName) => {
      this.echo?.leave(channelName);
    });
    this.subscribedChannels.clear();

    // Disconnect Echo
    if (this.echo) {
      this.echo.disconnect();
      this.echo = null;
    }

    // Disconnect WebSocket Manager
    if (this.wsManager) {
      this.wsManager.disconnect();
      this.wsManager = null;
    }

    this.emit('disconnected');
  }

  /**
   * 添加事件監聽器
   */
  on<K extends keyof EchoEventMap>(eventName: K, listener: EchoEventMap[K]): void;
  on(eventName: string, listener: Function): void;
  on(eventName: string, listener: Function): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(listener);
  }

  /**
   * 移除事件監聽器
   */
  off<K extends keyof EchoEventMap>(eventName: K, listener: EchoEventMap[K]): void;
  off(eventName: string, listener: Function): void;
  off(eventName: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
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
        console.error(`Error in Echo event listener for ${eventName}:`, error);
      }
    });
  }
}

// Global Echo service instance
export const echoService = new EchoService({
  wsHost: process.env.EXPO_PUBLIC_REVERB_HOST || 'localhost',
  wsPort: parseInt(process.env.EXPO_PUBLIC_REVERB_PORT || '8090'),
  scheme: process.env.EXPO_PUBLIC_REVERB_SCHEME || 'ws',
  // Broadcasting auth endpoint is NOT under /api prefix
  authEndpoint: `${(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/api$/, '')}/broadcasting/auth`,
});
