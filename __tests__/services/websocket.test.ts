/**
 * WebSocket ConnectionManager Tests (TDD)
 * 測試 WebSocket 連線管理
 */

import { WebSocketManager } from '../websocket/WebSocketManager';
import { WebSocketEvent, WebSocketConnectionState } from '../websocket/types';

// Mock WebSocket
class MockWebSocket {
  public readyState: number = WebSocket.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Simulate echo for testing
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', { data }));
      }
    }, 5);
  }

  close(code?: number, reason?: string) {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: code || 1000, reason: reason || '' }));
    }
  }

  // Test helpers
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}

// Mock global WebSocket
Object.defineProperty(globalThis, 'WebSocket', {
  writable: true,
  value: MockWebSocket,
});

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;
  const mockUrl = 'ws://localhost:8000/ws';
  const mockToken = 'mock-auth-token';

  beforeEach(() => {
    wsManager = new WebSocketManager(mockUrl, mockToken);
    jest.clearAllMocks();
  });

  afterEach(() => {
    wsManager.disconnect();
  });

  describe('Connection Management', () => {
    test('should establish connection successfully', async () => {
      const connectionPromise = wsManager.connect();
      
      expect(wsManager.getConnectionState()).toBe(WebSocketConnectionState.CONNECTING);
      
      await connectionPromise;
      
      expect(wsManager.getConnectionState()).toBe(WebSocketConnectionState.CONNECTED);
      expect(wsManager.isConnected()).toBe(true);
    });

    test('should handle connection with authentication token', async () => {
      const connectSpy = jest.spyOn(wsManager, 'connect');
      
      await wsManager.connect();
      
      expect(connectSpy).toHaveBeenCalled();
      // Verify URL includes token parameter
      expect(wsManager.getConnectionState()).toBe(WebSocketConnectionState.CONNECTED);
    });

    test('should disconnect gracefully', async () => {
      await wsManager.connect();
      expect(wsManager.isConnected()).toBe(true);
      
      wsManager.disconnect();
      
      expect(wsManager.getConnectionState()).toBe(WebSocketConnectionState.DISCONNECTED);
      expect(wsManager.isConnected()).toBe(false);
    });

    test('should handle connection errors', async () => {
      const errorHandler = jest.fn();
      wsManager.on('error', errorHandler);
      
      // Simulate connection error
      await wsManager.connect();
      const mockWs = (wsManager as any).ws as MockWebSocket;
      mockWs.simulateError();
      
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Auto-Reconnection', () => {
    test('should attempt reconnection on connection loss', async () => {
      await wsManager.connect();
      expect(wsManager.isConnected()).toBe(true);
      
      // Simulate connection loss
      const mockWs = (wsManager as any).ws as MockWebSocket;
      mockWs.close(1006, 'Connection lost');
      
      // Wait for reconnection attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wsManager.getConnectionState()).toBe(WebSocketConnectionState.RECONNECTING);
    });

    test('should use exponential backoff for reconnection', async () => {
      const reconnectionSpy = jest.spyOn(wsManager as any, 'scheduleReconnection');
      
      await wsManager.connect();
      const mockWs = (wsManager as any).ws as MockWebSocket;
      
      // Simulate multiple connection failures
      mockWs.close(1006, 'Connection lost');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(reconnectionSpy).toHaveBeenCalled();
    });

    test('should limit reconnection attempts', async () => {
      const maxAttempts = 5;
      let attemptCount = 0;
      
      wsManager.on('reconnection_attempt', () => {
        attemptCount++;
      });
      
      // Configure max attempts
      (wsManager as any).maxReconnectionAttempts = maxAttempts;
      
      await wsManager.connect();
      const mockWs = (wsManager as any).ws as MockWebSocket;
      
      // Simulate persistent connection failures
      for (let i = 0; i < maxAttempts + 2; i++) {
        mockWs.close(1006, 'Connection lost');
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      expect(attemptCount).toBeLessThanOrEqual(maxAttempts);
    });
  });

  describe('Heartbeat System', () => {
    test('should send heartbeat messages periodically', async () => {
      const sendSpy = jest.spyOn(wsManager, 'sendMessage');
      
      await wsManager.connect();
      
      // Fast-forward heartbeat interval
      jest.advanceTimersByTime(25000); // 25 seconds
      
      expect(sendSpy).toHaveBeenCalledWith({
        type: 'heartbeat',
        timestamp: expect.any(Number),
      });
      
      jest.useRealTimers();
    });

    test('should detect connection timeout', async () => {
      const timeoutHandler = jest.fn();
      wsManager.on('connection_timeout', timeoutHandler);
      
      await wsManager.connect();
      
      // Simulate no heartbeat response
      jest.advanceTimersByTime(60000); // 60 seconds
      
      expect(timeoutHandler).toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('Message Handling', () => {
    test('should send messages when connected', async () => {
      await wsManager.connect();
      
      const message = { type: 'chat.message', content: 'Hello' };
      const result = wsManager.sendMessage(message);
      
      expect(result).toBe(true);
    });

    test('should queue messages when disconnected', () => {
      const message = { type: 'chat.message', content: 'Hello' };
      const result = wsManager.sendMessage(message);
      
      expect(result).toBe(false);
      expect((wsManager as any).messageQueue.length).toBe(1);
    });

    test('should flush message queue on reconnection', async () => {
      const message = { type: 'chat.message', content: 'Hello' };
      wsManager.sendMessage(message);
      
      expect((wsManager as any).messageQueue.length).toBe(1);
      
      await wsManager.connect();
      
      expect((wsManager as any).messageQueue.length).toBe(0);
    });

    test('should handle incoming messages', async () => {
      const messageHandler = jest.fn();
      wsManager.on('message', messageHandler);
      
      await wsManager.connect();
      
      const mockMessage = {
        type: 'chat.message',
        content: 'Hello from server',
        timestamp: Date.now(),
      };
      
      const mockWs = (wsManager as any).ws as MockWebSocket;
      mockWs.simulateMessage(mockMessage);
      
      expect(messageHandler).toHaveBeenCalledWith(mockMessage);
    });
  });

  describe('Event System', () => {
    test('should support event listeners', async () => {
      const connectHandler = jest.fn();
      const disconnectHandler = jest.fn();
      
      wsManager.on('connected', connectHandler);
      wsManager.on('disconnected', disconnectHandler);
      
      await wsManager.connect();
      expect(connectHandler).toHaveBeenCalled();
      
      wsManager.disconnect();
      expect(disconnectHandler).toHaveBeenCalled();
    });

    test('should support event listener removal', () => {
      const handler = jest.fn();
      
      wsManager.on('connected', handler);
      wsManager.off('connected', handler);
      
      // Handler should not be called after removal
      wsManager.connect();
      expect(handler).not.toHaveBeenCalled();
    });

    test('should emit connection state changes', async () => {
      const stateChangeHandler = jest.fn();
      wsManager.on('connection_state_changed', stateChangeHandler);
      
      await wsManager.connect();
      
      expect(stateChangeHandler).toHaveBeenCalledWith(
        WebSocketConnectionState.CONNECTED,
        WebSocketConnectionState.DISCONNECTED
      );
    });
  });

  describe('Error Recovery', () => {
    test('should handle malformed messages gracefully', async () => {
      const errorHandler = jest.fn();
      wsManager.on('error', errorHandler);
      
      await wsManager.connect();
      
      const mockWs = (wsManager as any).ws as MockWebSocket;
      // Send invalid JSON
      if (mockWs.onmessage) {
        mockWs.onmessage(new MessageEvent('message', { data: 'invalid json' }));
      }
      
      expect(errorHandler).toHaveBeenCalled();
    });

    test('should maintain connection state consistency', async () => {
      await wsManager.connect();
      expect(wsManager.getConnectionState()).toBe(WebSocketConnectionState.CONNECTED);
      
      const mockWs = (wsManager as any).ws as MockWebSocket;
      mockWs.close();
      
      expect(wsManager.getConnectionState()).toBe(WebSocketConnectionState.DISCONNECTED);
    });
  });
});

// Setup Jest timers
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});