/**
 * ChatScreen Component Tests
 * 測試聊天畫面組件
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ChatScreen } from '../ChatScreen';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { WebSocketConnectionState } from '@/services/websocket/types';

// Mock dependencies
jest.mock('@/stores/chat');
jest.mock('@/stores/auth');
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
  useLocalSearchParams: () => ({ id: '1' }),
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockUseChatStore = useChatStore as jest.MockedFunction<typeof useChatStore>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

describe('ChatScreen', () => {
  const mockMessages = [
    {
      id: 1,
      conversation_id: 1,
      sender_id: 2,
      content: 'Hello!',
      sequence_number: 1,
      client_nonce: 'nonce-1',
      sent_at: '2024-01-01T10:00:00Z',
      created_at: '2024-01-01T10:00:00Z',
      sender: {
        id: 2,
        name: 'Alice',
        profile: {
          display_name: 'Alice Chen',
          primary_photo_url: 'https://example.com/alice.jpg',
        },
      },
    },
    {
      id: 2,
      conversation_id: 1,
      sender_id: 1,
      content: 'Hi there!',
      sequence_number: 2,
      client_nonce: 'nonce-2',
      sent_at: '2024-01-01T10:01:00Z',
      created_at: '2024-01-01T10:01:00Z',
      sender: {
        id: 1,
        name: 'User',
      },
    },
  ];

  const mockConversations = [
    {
      id: 1,
      match_id: 1,
      created_at: '2024-01-01T09:00:00Z',
      updated_at: '2024-01-01T10:01:00Z',
      participants: [
        {
          id: 1,
          name: 'User',
        },
        {
          id: 2,
          name: 'Alice',
          profile: {
            display_name: 'Alice Chen',
            primary_photo_url: 'https://example.com/alice.jpg',
          },
        },
      ],
      last_message: mockMessages[1],
      unread_count: 0,
    },
  ];

  const defaultMockStore = {
    conversations: mockConversations,
    messages: { 1: mockMessages },
    pendingMessages: {},
    connectionState: WebSocketConnectionState.CONNECTED,
    currentConversationId: 1,
    isLoadingMessages: {},
    messagesError: {},
    echoService: {
      isConnected: () => true,
    },
    initializeEcho: jest.fn(),
    loadConversations: jest.fn(),
    loadMessages: jest.fn(),
    setCurrentConversation: jest.fn(),
    sendMessage: jest.fn(),
    markAsRead: jest.fn(),
    retryMessage: jest.fn(),
  };

  const defaultMockAuth = {
    user: { id: 1, name: 'User' },
    token: 'mock-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChatStore.mockReturnValue(defaultMockStore as any);
    mockUseAuthStore.mockReturnValue(defaultMockAuth as any);
  });

  describe('Rendering', () => {
    it('renders chat screen with messages', () => {
      const { getByTestId, getByText } = render(<ChatScreen />);

      expect(getByTestId('chat-screen')).toBeTruthy();
      expect(getByTestId('participant-name')).toBeTruthy();
      expect(getByText('Alice Chen')).toBeTruthy();
      expect(getByTestId('messages-list')).toBeTruthy();
      expect(getByTestId('message-input')).toBeTruthy();
    });

    it('shows participant avatar and name in header', () => {
      const { getByTestId } = render(<ChatScreen />);

      expect(getByTestId('participant-avatar')).toBeTruthy();
      expect(getByTestId('participant-name')).toBeTruthy();
    });

    it('shows connection indicator when not connected', () => {
      mockUseChatStore.mockReturnValue({
        ...defaultMockStore,
        connectionState: WebSocketConnectionState.DISCONNECTED,
      } as any);

      const { getByTestId } = render(<ChatScreen />);

      expect(getByTestId('connection-indicator')).toBeTruthy();
    });
  });

  describe('Initialization', () => {
    it('initializes echo service and loads data on mount', async () => {
      const mockInitializeEcho = jest.fn().mockResolvedValue(undefined);
      const mockLoadConversations = jest.fn().mockResolvedValue(undefined);
      const mockLoadMessages = jest.fn().mockResolvedValue(undefined);
      const mockSetCurrentConversation = jest.fn();
      const mockMarkAsRead = jest.fn().mockResolvedValue(undefined);

      mockUseChatStore.mockReturnValue({
        ...defaultMockStore,
        conversations: [],
        echoService: { isConnected: () => false },
        initializeEcho: mockInitializeEcho,
        loadConversations: mockLoadConversations,
        loadMessages: mockLoadMessages,
        setCurrentConversation: mockSetCurrentConversation,
        markAsRead: mockMarkAsRead,
      } as any);

      render(<ChatScreen />);

      await waitFor(() => {
        expect(mockInitializeEcho).toHaveBeenCalledWith('mock-token');
        expect(mockLoadConversations).toHaveBeenCalled();
        expect(mockSetCurrentConversation).toHaveBeenCalledWith(1);
        expect(mockLoadMessages).toHaveBeenCalledWith(1);
      });
    });

    it('handles initialization errors gracefully', async () => {
      const mockInitializeEcho = jest.fn().mockRejectedValue(new Error('Connection failed'));

      mockUseChatStore.mockReturnValue({
        ...defaultMockStore,
        echoService: { isConnected: () => false },
        initializeEcho: mockInitializeEcho,
      } as any);

      render(<ChatScreen />);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('錯誤', '無法連接聊天服務');
      });
    });

    it('redirects back when no auth token', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        token: null,
      } as any);

      render(<ChatScreen />);

      expect(mockAlert).toHaveBeenCalledWith('錯誤', '請先登入');
    });
  });

  describe('Message Sending', () => {
    it('sends message when input is submitted', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);

      mockUseChatStore.mockReturnValue({
        ...defaultMockStore,
        sendMessage: mockSendMessage,
      } as any);

      const { getByTestId } = render(<ChatScreen />);

      const messageInput = getByTestId('message-input-text');
      const sendButton = getByTestId('message-input-send');

      fireEvent.changeText(messageInput, 'Test message');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(1, 'Test message');
      });
    });

    it('handles send message errors', async () => {
      const mockSendMessage = jest.fn().mockRejectedValue(new Error('Send failed'));

      mockUseChatStore.mockReturnValue({
        ...defaultMockStore,
        sendMessage: mockSendMessage,
      } as any);

      const { getByTestId } = render(<ChatScreen />);

      const messageInput = getByTestId('message-input-text');
      const sendButton = getByTestId('message-input-send');

      fireEvent.changeText(messageInput, 'Test message');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('發送失敗', '訊息發送失敗，請重試');
      });
    });
  });

  describe('Message Display', () => {
    it('displays messages correctly', () => {
      const { getByTestId } = render(<ChatScreen />);

      expect(getByTestId('message-1')).toBeTruthy();
      expect(getByTestId('message-2')).toBeTruthy();
    });

    it('shows empty state when no messages', () => {
      mockUseChatStore.mockReturnValue({
        ...defaultMockStore,
        messages: { 1: [] },
      } as any);

      const { getByText } = render(<ChatScreen />);

      expect(getByText('還沒有訊息')).toBeTruthy();
      expect(getByText('發送第一條訊息開始聊天吧！')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('shows error state when messages fail to load', () => {
      mockUseChatStore.mockReturnValue({
        ...defaultMockStore,
        messages: { 1: [] },
        messagesError: { 1: 'Failed to load messages' },
      } as any);

      const { getByText, getByTestId } = render(<ChatScreen />);

      expect(getByText('Failed to load messages')).toBeTruthy();
      expect(getByTestId('messages-list')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('navigates back when back button is pressed', () => {
      const { router } = require('expo-router');

      const { getByTestId } = render(<ChatScreen />);

      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);

      expect(router.back).toHaveBeenCalled();
    });
  });

  describe('Pull to Refresh', () => {
    it('refreshes messages when pulled down', async () => {
      const mockLoadMessages = jest.fn().mockResolvedValue(undefined);

      mockUseChatStore.mockReturnValue({
        ...defaultMockStore,
        loadMessages: mockLoadMessages,
      } as any);

      const { getByTestId } = render(<ChatScreen />);

      const refreshControl = getByTestId('messages-refresh');
      fireEvent(refreshControl, 'refresh');

      await waitFor(() => {
        expect(mockLoadMessages).toHaveBeenCalledWith(1, 1);
      });
    });
  });
});