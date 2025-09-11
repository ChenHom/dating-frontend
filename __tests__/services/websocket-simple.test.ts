/**
 * WebSocket ConnectionManager Simple Tests
 * 簡化版 WebSocket 連線管理測試
 */

import { WebSocketManager } from '../websocket/WebSocketManager';
import { WebSocketConnectionState } from '../websocket/types';

describe('WebSocketManager (Simple)', () => {
  let wsManager: WebSocketManager;
  const mockUrl = 'ws://localhost:8000/ws';
  const mockToken = 'mock-auth-token';

  beforeEach(() => {
    wsManager = new WebSocketManager(mockUrl, mockToken, {
      heartbeatInterval: 1000,
      heartbeatTimeout: 2000,
      reconnectionDelay: 100,
      maxReconnectionDelay: 500,
      maxReconnectionAttempts: 3,
      messageQueueMaxSize: 10,
    });
  });

  afterEach(() => {
    wsManager.disconnect();
  });

  describe('Basic Functionality', () => {
    test('should initialize with disconnected state', () => {
      expect(wsManager.getConnectionState()).toBe(WebSocketConnectionState.DISCONNECTED);
      expect(wsManager.isConnected()).toBe(false);
    });

    test('should queue messages when disconnected', () => {
      const message = { type: 'chat.message', content: 'Hello' };
      const result = wsManager.sendMessage(message);
      
      expect(result).toBe(false);
      expect((wsManager as any).messageQueue.length).toBe(1);
    });

    test('should provide connection stats', () => {
      const stats = wsManager.getConnectionStats();
      
      expect(stats).toEqual({
        state: WebSocketConnectionState.DISCONNECTED,
        reconnectionAttempts: 0,
        messageQueueSize: 0,
        lastHeartbeatSent: 0,
        isConnected: false,
      });
    });

    test('should update auth token', () => {
      const newToken = 'new-auth-token';
      wsManager.updateAuthToken(newToken);
      
      expect((wsManager as any).authToken).toBe(newToken);
    });
  });

  describe('Event System', () => {
    test('should support adding event listeners', () => {
      const handler = jest.fn();
      
      wsManager.on('connected', handler);
      
      expect((wsManager as any).eventListeners.get('connected')).toContain(handler);
    });

    test('should support removing event listeners', () => {
      const handler = jest.fn();
      
      wsManager.on('connected', handler);
      wsManager.off('connected', handler);
      
      const listeners = (wsManager as any).eventListeners.get('connected');
      expect(listeners).not.toContain(handler);
    });
  });

  describe('Message Queue', () => {
    test('should limit message queue size', () => {
      const maxSize = (wsManager as any).config.messageQueueMaxSize;
      
      // Fill queue beyond limit
      for (let i = 0; i < maxSize + 5; i++) {
        wsManager.sendMessage({ type: 'test', content: `message ${i}` });
      }
      
      expect((wsManager as any).messageQueue.length).toBe(maxSize);
    });

    test('should store message metadata in queue', () => {
      const message = { type: 'chat.message', content: 'Hello' };
      wsManager.sendMessage(message);
      
      const queuedMessage = (wsManager as any).messageQueue[0];
      expect(queuedMessage.event).toEqual(message);
      expect(queuedMessage.timestamp).toBeGreaterThan(0);
      expect(queuedMessage.attempts).toBe(0);
    });
  });

  describe('Configuration', () => {
    test('should use custom configuration', () => {
      const customConfig = {
        heartbeatInterval: 5000,
        heartbeatTimeout: 10000,
        maxReconnectionAttempts: 10,
      };
      
      const customWsManager = new WebSocketManager(mockUrl, mockToken, customConfig);
      
      expect((customWsManager as any).config.heartbeatInterval).toBe(5000);
      expect((customWsManager as any).config.heartbeatTimeout).toBe(10000);
      expect((customWsManager as any).config.maxReconnectionAttempts).toBe(10);
    });

    test('should use default configuration when not specified', () => {
      const defaultWsManager = new WebSocketManager(mockUrl, mockToken);
      
      expect((defaultWsManager as any).config.heartbeatInterval).toBe(25000);
      expect((defaultWsManager as any).config.heartbeatTimeout).toBe(60000);
      expect((defaultWsManager as any).config.maxReconnectionAttempts).toBe(5);
    });
  });

  describe('URL Building', () => {
    test('should build connection URL with auth token', () => {
      const url = (wsManager as any).buildConnectionUrl();
      
      expect(url).toBe('ws://localhost:8000/ws?token=mock-auth-token');
    });

    test('should build connection URL without auth token', () => {
      const wsManagerNoToken = new WebSocketManager(mockUrl);
      const url = (wsManagerNoToken as any).buildConnectionUrl();
      
      expect(url).toBe('ws://localhost:8000/ws');
    });
  });

  describe('State Management', () => {
    test('should track connection state changes', () => {
      const stateChangeHandler = jest.fn();
      wsManager.on('connection_state_changed', stateChangeHandler);
      
      // Simulate state change
      (wsManager as any).setConnectionState(WebSocketConnectionState.CONNECTING);
      
      expect(stateChangeHandler).toHaveBeenCalledWith(
        WebSocketConnectionState.CONNECTING,
        WebSocketConnectionState.DISCONNECTED
      );
    });

    test('should not emit state change for same state', () => {
      const stateChangeHandler = jest.fn();
      wsManager.on('connection_state_changed', stateChangeHandler);
      
      // Set same state twice
      (wsManager as any).setConnectionState(WebSocketConnectionState.DISCONNECTED);
      (wsManager as any).setConnectionState(WebSocketConnectionState.DISCONNECTED);
      
      expect(stateChangeHandler).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle event listener errors gracefully', () => {
      const faultyHandler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });
      
      wsManager.on('connected', faultyHandler);
      
      // Should not throw when emitting event
      expect(() => {
        (wsManager as any).emit('connected');
      }).not.toThrow();
    });
  });
});

describe('WebSocket Event Types', () => {
  test('should properly type WebSocket events', () => {
    const heartbeatEvent = {
      type: 'heartbeat',
      timestamp: Date.now(),
    };

    const messageEvent = {
      type: 'message.send',
      conversation_id: 1,
      content: 'Hello',
      client_nonce: 'unique-id',
      sent_at: new Date().toISOString(),
    };

    const chatJoinEvent = {
      type: 'chat.join',
      conversation_id: 1,
      user_id: 123,
    };

    expect(heartbeatEvent.type).toBe('heartbeat');
    expect(messageEvent.type).toBe('message.send');
    expect(chatJoinEvent.type).toBe('chat.join');
  });
});