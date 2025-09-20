/**
 * WebSocket 連接管理器
 * 統一管理 EchoService 連接和各個 Store 的 WebSocket 事件監聽
 */

import { echoService } from './EchoService';
import { useGameStore } from '@/stores/game';
import { useAuthStore } from '@/stores/auth';

export interface WebSocketConnectionConfig {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

class WebSocketConnectionManager {
  private isConnected = false;
  private isInitialized = false;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private currentAuthToken: string | null = null;

  private config: WebSocketConnectionConfig = {
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 3000, // 3 seconds
  };

  /**
   * 初始化 WebSocket 連接和事件監聽
   */
  async initialize(authToken: string, config?: WebSocketConnectionConfig): Promise<boolean> {
    if (this.isInitialized) {
      console.log('WebSocket connection manager already initialized');
      return this.isConnected;
    }

    try {
      this.config = { ...this.config, ...config };
      this.currentAuthToken = authToken;

      console.log('Initializing WebSocket connection manager...');

      // 初始化 EchoService
      await echoService.initialize(authToken);

      // 設置連接狀態監聽
      this.setupConnectionListeners();

      // 初始化各個 Store 的 WebSocket 監聽器
      this.initializeStoreListeners();

      this.isInitialized = true;
      this.isConnected = echoService.isConnected();

      console.log('WebSocket connection manager initialized successfully');
      return this.isConnected;
    } catch (error) {
      console.error('Failed to initialize WebSocket connection manager:', error);
      this.isInitialized = false;
      this.isConnected = false;
      return false;
    }
  }

  /**
   * 設置 EchoService 連接狀態監聽
   */
  private setupConnectionListeners(): void {
    echoService.on('connected', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.clearReconnectTimer();
    });

    echoService.on('disconnected', () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;

      if (this.config.autoReconnect && this.currentAuthToken) {
        this.scheduleReconnect();
      }
    });

    echoService.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      this.isConnected = false;

      if (this.config.autoReconnect && this.currentAuthToken) {
        this.scheduleReconnect();
      }
    });

    echoService.on('connection_state_changed', (currentState: string, previousState: string) => {
      console.log(`WebSocket state changed: ${previousState} -> ${currentState}`);

      if (currentState === 'connected') {
        this.isConnected = true;
        this.reconnectAttempts = 0;
      } else if (currentState === 'disconnected' || currentState === 'failed') {
        this.isConnected = false;
      }
    });
  }

  /**
   * 初始化各個 Store 的 WebSocket 監聽器
   */
  private initializeStoreListeners(): void {
    // 初始化 GameStore 的 WebSocket 監聽器
    const gameStore = useGameStore.getState();
    if (gameStore.initializeWebSocketListeners) {
      gameStore.initializeWebSocketListeners();
      console.log('GameStore WebSocket listeners initialized');
    }

    // 這裡可以添加其他 Store 的初始化
    // 例如: chatStore.initializeWebSocketListeners();
    //      notificationStore.initializeWebSocketListeners();
  }

  /**
   * 清理各個 Store 的 WebSocket 監聽器
   */
  private cleanupStoreListeners(): void {
    // 清理 GameStore 的 WebSocket 監聽器
    const gameStore = useGameStore.getState();
    if (gameStore.cleanupWebSocketListeners) {
      gameStore.cleanupWebSocketListeners();
      console.log('GameStore WebSocket listeners cleaned up');
    }

    // 這裡可以添加其他 Store 的清理
    // 例如: chatStore.cleanupWebSocketListeners();
    //      notificationStore.cleanupWebSocketListeners();
  }

  /**
   * 安排重連
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      console.error('Max reconnect attempts reached, giving up');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(
      (this.config.reconnectDelay || 3000) * Math.pow(2, this.reconnectAttempts),
      30000 // Maximum 30 seconds
    );

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.attemptReconnect();
    }, delay);
  }

  /**
   * 嘗試重連
   */
  private async attemptReconnect(): Promise<void> {
    if (!this.currentAuthToken) {
      console.error('No auth token available for reconnect');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);

    try {
      // 斷開當前連接
      echoService.disconnect();

      // 重新初始化
      await echoService.initialize(this.currentAuthToken);

      if (echoService.isConnected()) {
        console.log('Reconnect successful');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      } else {
        throw new Error('Reconnect failed - not connected');
      }
    } catch (error) {
      console.error(`Reconnect attempt ${this.reconnectAttempts} failed:`, error);

      if (this.reconnectAttempts < (this.config.maxReconnectAttempts || 5)) {
        this.scheduleReconnect();
      } else {
        console.error('All reconnect attempts failed');
      }
    }
  }

  /**
   * 清除重連計時器
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 訂閱對話頻道
   */
  subscribeToConversation(conversationId: number): void {
    if (!this.isConnected) {
      console.warn('Cannot subscribe to conversation - WebSocket not connected');
      return;
    }

    echoService.subscribeToConversation(conversationId);
  }

  /**
   * 取消訂閱對話頻道
   */
  unsubscribeFromConversation(conversationId: number): void {
    echoService.unsubscribeFromConversation(conversationId);
  }

  /**
   * 更新認證令牌
   */
  async updateAuthToken(newToken: string): Promise<boolean> {
    this.currentAuthToken = newToken;

    if (this.isInitialized) {
      try {
        echoService.updateAuthToken(newToken);
        return true;
      } catch (error) {
        console.error('Failed to update auth token:', error);
        return false;
      }
    }

    return true;
  }

  /**
   * 斷開連接並清理
   */
  disconnect(): void {
    console.log('Disconnecting WebSocket connection manager...');

    this.clearReconnectTimer();
    this.cleanupStoreListeners();

    if (this.isInitialized) {
      echoService.disconnect();
    }

    this.isConnected = false;
    this.isInitialized = false;
    this.currentAuthToken = null;
    this.reconnectAttempts = 0;

    console.log('WebSocket connection manager disconnected');
  }

  /**
   * 獲取連接狀態
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isInitialized: this.isInitialized,
      reconnectAttempts: this.reconnectAttempts,
      echoStats: echoService.getConnectionStats(),
    };
  }

  /**
   * 檢查是否已連接
   */
  isServiceConnected(): boolean {
    return this.isConnected && echoService.isConnected();
  }

  /**
   * 手動觸發重連
   */
  async forceReconnect(): Promise<boolean> {
    if (!this.currentAuthToken) {
      console.error('No auth token available for force reconnect');
      return false;
    }

    console.log('Force reconnecting WebSocket...');
    this.reconnectAttempts = 0;
    await this.attemptReconnect();

    return this.isConnected;
  }
}

// 全局 WebSocket 連接管理器實例
export const webSocketConnectionManager = new WebSocketConnectionManager();

export default WebSocketConnectionManager;