/**
 * Chat Store Tests (TDD)
 * 測試聊天系統狀態管理
 */

import { WebSocketConnectionState } from '../../services/websocket/types';
import { useChatStore, Message, Conversation } from '../chat';

// Mock fetch
Object.defineProperty(globalThis, 'fetch', {
  writable: true,
  value: jest.fn(),
});

jest.mock('../../services/websocket/WebSocketManager', () => ({
  WebSocketManager: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    sendMessage: jest.fn(),
    isConnected: jest.fn(),
    getConnectionState: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    updateAuthToken: jest.fn(),
  })),
}));

describe('Chat Store', () => {
  beforeEach(() => {
    // Reset store state
    useChatStore.setState({
      connectionState: WebSocketConnectionState.DISCONNECTED,
      wsManager: null,
      conversations: [],
      currentConversationId: null,
      isLoadingConversations: false,
      conversationsError: null,
      messages: {},
      isLoadingMessages: {},
      messagesError: {},
      pendingMessages: {},
      totalUnreadCount: 0,
    });

    // Reset mocks
    jest.clearAllMocks();
    (globalThis.fetch as jest.Mock).mockClear();
  });

  describe('Connection Management', () => {
    test.skip('should connect to WebSocket', () => {
      // Arrange
      const wsUrl = 'ws://localhost:8000/ws';
      const authToken = 'test-token';

      // Act
      useChatStore.getState().connect(wsUrl, authToken);

      // Assert
      const state = useChatStore.getState();
      expect(state.wsManager).toBeTruthy();
    });

    test('should disconnect from WebSocket', () => {
      // Arrange
      const mockManager = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        sendMessage: jest.fn(),
        isConnected: jest.fn(),
        getConnectionState: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        updateAuthToken: jest.fn(),
      };
      useChatStore.setState({ wsManager: mockManager as any });

      // Act
      useChatStore.getState().disconnect();

      // Assert
      expect(mockManager.disconnect).toHaveBeenCalled();
      const state = useChatStore.getState();
      expect(state.wsManager).toBeNull();
      expect(state.connectionState).toBe(WebSocketConnectionState.DISCONNECTED);
    });

    test('should handle connection state changes', () => {
      // Act
      useChatStore.getState().handleConnectionStateChange(WebSocketConnectionState.CONNECTED);

      // Assert
      const state = useChatStore.getState();
      expect(state.connectionState).toBe(WebSocketConnectionState.CONNECTED);
    });
  });

  describe('Conversation Management', () => {
    test('should load conversations successfully', async () => {
      // Arrange
      const mockConversations: Conversation[] = [
        {
          id: 1,
          match_id: 1,
          created_at: '2023-01-01T10:00:00Z',
          updated_at: '2023-01-01T12:00:00Z',
          participants: [
            {
              id: 1,
              name: 'Current User',
            },
            {
              id: 2,
              name: 'Other User',
            },
          ],
          unread_count: 1,
        },
      ];

      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockConversations }),
      });

      // Act
      await useChatStore.getState().loadConversations();

      // Assert
      const state = useChatStore.getState();
      expect(state.conversations).toEqual(mockConversations);
      expect(state.totalUnreadCount).toBe(1);
      expect(state.isLoadingConversations).toBe(false);
      expect(state.conversationsError).toBeNull();
    });

    test('should handle conversation loading error', async () => {
      // Arrange
      const errorMessage = 'Failed to load';
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: errorMessage,
      });

      // Act
      await useChatStore.getState().loadConversations();

      // Assert
      const state = useChatStore.getState();
      expect(state.conversationsError).toContain(errorMessage);
      expect(state.isLoadingConversations).toBe(false);
    });

    test('should set current conversation', () => {
      // Arrange
      const conversationId = 1;
      const mockManager = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        sendMessage: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true),
        getConnectionState: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        updateAuthToken: jest.fn(),
      };
      useChatStore.setState({ wsManager: mockManager as any });

      // Act
      useChatStore.getState().setCurrentConversation(conversationId);

      // Assert
      const state = useChatStore.getState();
      expect(state.currentConversationId).toBe(conversationId);
      expect(mockManager.sendMessage).toHaveBeenCalledWith({
        type: 'chat.join',
        conversation_id: conversationId,
        user_id: 1,
      });
    });
  });

  describe('Message Management', () => {
    test('should load messages for conversation', async () => {
      // Arrange
      const conversationId = 1;
      const mockMessages: Message[] = [
        {
          id: 1,
          conversation_id: conversationId,
          sender_id: 1,
          content: 'Hello!',
          sequence_number: 1,
          client_nonce: 'nonce-1',
          sent_at: '2023-01-01T12:00:00Z',
          created_at: '2023-01-01T12:00:00Z',
          sender: {
            id: 1,
            name: 'User 1',
          },
        },
      ];

      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockMessages }),
      });

      // Act
      await useChatStore.getState().loadMessages(conversationId);

      // Assert
      const state = useChatStore.getState();
      expect(state.messages[conversationId]).toEqual(mockMessages);
      expect(state.isLoadingMessages[conversationId]).toBe(false);
    });

    test('should send message via WebSocket', async () => {
      // Arrange
      const conversationId = 1;
      const content = 'Hello World';

      const mockManager = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        sendMessage: jest.fn().mockReturnValue(true),
        isConnected: jest.fn().mockReturnValue(true),
        getConnectionState: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        updateAuthToken: jest.fn(),
      };
      useChatStore.setState({ wsManager: mockManager as any });

      // Act
      await useChatStore.getState().sendMessage(conversationId, content);

      // Assert
      expect(mockManager.sendMessage).toHaveBeenCalledWith({
        type: 'message.send',
        conversation_id: conversationId,
        content: content,
        client_nonce: expect.any(String),
        sent_at: expect.any(String),
      });

      // Check pending message was added
      const state = useChatStore.getState();
      expect(state.pendingMessages[conversationId]).toHaveLength(1);
    });

    test('should fallback to HTTP when WebSocket unavailable', async () => {
      // Arrange
      const conversationId = 1;
      const content = 'Hello World';

      const mockMessage: Message = {
        id: 1,
        conversation_id: conversationId,
        sender_id: 1,
        content: content,
        sequence_number: 1,
        client_nonce: 'nonce-1',
        sent_at: '2023-01-01T12:00:00Z',
        created_at: '2023-01-01T12:00:00Z',
        sender: {
          id: 1,
          name: 'User 1',
        },
      };

      const mockManager = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        sendMessage: jest.fn(),
        isConnected: jest.fn().mockReturnValue(false),
        getConnectionState: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        updateAuthToken: jest.fn(),
      };
      useChatStore.setState({ wsManager: mockManager as any });

      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockMessage }),
      });

      // Act
      await useChatStore.getState().sendMessage(conversationId, content);

      // Assert
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/chat/conversations/${conversationId}/messages`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining(content),
        })
      );

      const state = useChatStore.getState();
      expect(state.messages[conversationId]).toContain(mockMessage);
    });
  });

  describe('Real-time Message Handling', () => {
    test('should handle message acknowledgment', () => {
      // Arrange
      const clientNonce = 'test-nonce';
      useChatStore.getState().addPendingMessage({
        client_nonce: clientNonce,
        conversation_id: 1,
        content: 'Test',
        sent_at: '2023-01-01T12:00:00Z',
        status: 'sending',
      });

      // Act
      useChatStore.getState().handleWebSocketMessage({
        type: 'message.ack',
        client_nonce: clientNonce,
        message_id: 1,
        sequence_number: 1,
        sent_at: '2023-01-01T12:00:00Z',
      });

      // Assert
      const state = useChatStore.getState();
      const pendingMsg = state.pendingMessages[1]?.[0];
      expect(pendingMsg?.status).toBe('sent');
    });

    test('should handle incoming new messages', () => {
      // Arrange
      const messageEvent = {
        type: 'message.new',
        id: 1,
        conversation_id: 1,
        sender_id: 2,
        content: 'New message!',
        sequence_number: 1,
        client_nonce: 'nonce-1',
        sent_at: '2023-01-01T12:00:00Z',
        created_at: '2023-01-01T12:00:00Z',
        sender: {
          id: 2,
          name: 'Other User',
        },
      };

      useChatStore.setState({
        conversations: [{
          id: 1,
          match_id: 1,
          created_at: '2023-01-01T10:00:00Z',
          updated_at: '2023-01-01T12:00:00Z',
          participants: [],
          unread_count: 0,
        }],
      });

      // Act
      useChatStore.getState().handleWebSocketMessage(messageEvent);

      // Assert
      const state = useChatStore.getState();
      const messages = state.messages[1] || [];

      expect(messages).toHaveLength(1);
      expect(messages[0]?.content).toBe('New message!');
      expect(state.totalUnreadCount).toBe(1);
    });

    test('should not duplicate messages', () => {
      // Arrange
      const existingMessage: Message = {
        id: 1,
        conversation_id: 1,
        sender_id: 1,
        content: 'Existing message',
        sequence_number: 1,
        client_nonce: 'duplicate-nonce',
        sent_at: '2023-01-01T12:00:00Z',
        created_at: '2023-01-01T12:00:00Z',
        sender: {
          id: 1,
          name: 'User 1',
        },
      };

      useChatStore.setState({
        messages: { 1: [existingMessage] },
      });

      const duplicateEvent = {
        type: 'message.new',
        id: 2,
        conversation_id: 1,
        sender_id: 1,
        content: 'Duplicate message',
        sequence_number: 2,
        client_nonce: 'duplicate-nonce',
        sent_at: '2023-01-01T12:01:00Z',
        created_at: '2023-01-01T12:01:00Z',
        sender: {
          id: 1,
          name: 'User 1',
        },
      };

      // Act
      useChatStore.getState().handleWebSocketMessage(duplicateEvent);

      // Assert
      const state = useChatStore.getState();
      expect(state.messages[1]).toHaveLength(1);
      expect(state.messages[1]?.[0]).toEqual(existingMessage);
    });
  });

  describe('Pending Message Management', () => {
    test('should add pending messages', () => {
      // Arrange
      const pendingMessage = {
        client_nonce: 'test-nonce',
        conversation_id: 1,
        content: 'Test message',
        sent_at: '2023-01-01T12:00:00Z',
        status: 'sending' as const,
      };

      // Act
      useChatStore.getState().addPendingMessage(pendingMessage);

      // Assert
      const state = useChatStore.getState();
      expect(state.pendingMessages[1]).toContain(pendingMessage);
    });

    test('should update pending message status', () => {
      // Arrange
      const clientNonce = 'test-nonce';
      useChatStore.getState().addPendingMessage({
        client_nonce: clientNonce,
        conversation_id: 1,
        content: 'Test',
        sent_at: '2023-01-01T12:00:00Z',
        status: 'sending',
      });

      // Act
      useChatStore.getState().updatePendingMessageStatus(clientNonce, 'sent');

      // Assert
      const state = useChatStore.getState();
      const pendingMsg = state.pendingMessages[1]?.[0];
      expect(pendingMsg?.status).toBe('sent');
    });

    test('should remove pending messages', () => {
      // Arrange
      const clientNonce = 'test-nonce';
      useChatStore.getState().addPendingMessage({
        client_nonce: clientNonce,
        conversation_id: 1,
        content: 'Test',
        sent_at: '2023-01-01T12:00:00Z',
        status: 'sending',
      });

      // Act
      useChatStore.getState().removePendingMessage(clientNonce);

      // Assert
      const state = useChatStore.getState();
      expect(state.pendingMessages[1]).toHaveLength(0);
    });
  });

  describe('Mark as Read', () => {
    test('should mark conversation as read', async () => {
      // Arrange
      const conversationId = 1;
      useChatStore.setState({
        conversations: [{
          id: conversationId,
          match_id: 1,
          created_at: '2023-01-01T10:00:00Z',
          updated_at: '2023-01-01T12:00:00Z',
          participants: [],
          unread_count: 5,
        }],
        totalUnreadCount: 5,
      });

      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      // Act
      await useChatStore.getState().markAsRead(conversationId);

      // Assert
      const state = useChatStore.getState();
      const conversation = state.conversations.find(c => c.id === conversationId);
      expect(conversation?.unread_count).toBe(0);
      expect(state.totalUnreadCount).toBe(0);
    });
  });

  describe('Retry Message', () => {
    test('should retry failed message', async () => {
      // Arrange
      const conversationId = 1;
      const clientNonce = 'failed-nonce';
      const content = 'Failed message';

      useChatStore.getState().addPendingMessage({
        client_nonce: clientNonce,
        conversation_id: conversationId,
        content,
        sent_at: '2023-01-01T12:00:00Z',
        status: 'failed',
      });

      const mockManager = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        sendMessage: jest.fn().mockReturnValue(true),
        isConnected: jest.fn().mockReturnValue(true),
        getConnectionState: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        updateAuthToken: jest.fn(),
      };
      useChatStore.setState({ wsManager: mockManager as any });

      // Act
      await useChatStore.getState().retryMessage(conversationId, clientNonce);

      // Assert
      expect(mockManager.sendMessage).toHaveBeenCalled();
    });
  });
});