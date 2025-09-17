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

// Configure Pusher for Laravel Echo
window.Pusher = Pusher;

export interface EchoServiceConfig {
  wsHost: string;
  wsPort: number;
  scheme: string;
  authEndpoint: string;
}

export interface EchoEventMap {
  'message.new': (event: MessageNewEvent) => void;
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

  constructor(config: EchoServiceConfig) {
    this.config = config;
  }

  /**
   * 初始化 Echo 服務
   */
  async initialize(authToken: string): Promise<void> {
    this.authToken = authToken;

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

      // Initialize WebSocket Manager as fallback
      this.wsManager = new WebSocketManager(
        `${this.config.scheme}://${this.config.wsHost}:${this.config.wsPort}/app/app-key`,
        authToken
      );

      // Setup Echo connection listeners
      this.setupEchoListeners();

      console.log('Echo service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Echo service:', error);
      throw error;
    }
  }

  /**
   * 設置 Echo 連線監聽器
   */
  private setupEchoListeners(): void {
    if (!this.echo) return;

    // Connection state listeners
    this.echo.connector.pusher.connection.bind('connected', () => {
      console.log('Echo connected');
      this.emit('connected');
    });

    this.echo.connector.pusher.connection.bind('disconnected', () => {
      console.log('Echo disconnected');
      this.emit('disconnected');
    });

    this.echo.connector.pusher.connection.bind('error', (error: any) => {
      console.error('Echo connection error:', error);
      this.emit('error', error);
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
    if (!this.echo) {
      console.error('Echo not initialized');
      return;
    }

    const channelName = `conversation.${conversationId}`;

    if (this.subscribedChannels.has(channelName)) {
      console.log(`Already subscribed to ${channelName}`);
      return;
    }

    try {
      const channel = this.echo.private(channelName);

      // Listen for new messages
      channel.listen('MessageSent', (event: MessageNewEvent) => {
        console.log('New message received:', event);
        this.emit('message.new', event);
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
      console.log(`Subscribed to ${channelName}`);
    } catch (error) {
      console.error(`Failed to subscribe to ${channelName}:`, error);
      throw error;
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
   * 發送訊息 (使用 WebSocket Manager)
   */
  sendMessage(conversationId: number, content: string, clientNonce: string): boolean {
    if (!this.wsManager) {
      console.error('WebSocket Manager not available');
      return false;
    }

    return this.wsManager.sendMessage({
      type: 'message.send',
      conversation_id: conversationId,
      content,
      client_nonce: clientNonce,
      sent_at: new Date().toISOString(),
    });
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
   * 獲取連線統計
   */
  getConnectionStats() {
    const echoState = this.echo?.connector.pusher.connection.state || 'unknown';
    const wsStats = this.wsManager?.getConnectionStats();

    return {
      echo: {
        state: echoState,
        connected: echoState === 'connected',
      },
      websocket: wsStats,
      subscribedChannels: Array.from(this.subscribedChannels.keys()),
      isConnected: this.isConnected(),
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
   * 斷開連線
   */
  disconnect(): void {
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
  authEndpoint: `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080'}/broadcasting/auth`,
});