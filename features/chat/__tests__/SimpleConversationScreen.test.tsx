/**
 * SimpleConversationScreen Tests
 * 驗證簡化聊天頁面與聊天 store 的整合
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SimpleConversationScreen } from '../SimpleConversationScreen';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { WebSocketConnectionState } from '@/services/websocket/types';

jest.mock('@/stores/chat');
jest.mock('@/stores/auth');

var mockRouter: {
  back: jest.Mock;
  push: jest.Mock;
  replace: jest.Mock;
};

jest.mock('expo-router', () => {
  mockRouter = {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  };

  return {
    router: mockRouter,
    useRouter: () => mockRouter,
    useLocalSearchParams: jest.fn(() => ({ id: '1' })),
  };
});

const mockUseChatStore = useChatStore as jest.MockedFunction<typeof useChatStore>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const { useLocalSearchParams } = require('expo-router') as {
  useLocalSearchParams: jest.Mock;
};

describe('SimpleConversationScreen', () => {
  const conversationId = 1;

  const mockMessages = [
    {
      id: 10,
      conversation_id: conversationId,
      sender_id: 2,
      content: 'Hello from Alex!',
      sequence_number: 1,
      client_nonce: 'nonce-1',
      sent_at: '2024-01-01T10:00:00Z',
      created_at: '2024-01-01T10:00:00Z',
      sender: {
        id: 2,
        name: 'Alex',
        profile: {
          display_name: 'Alex Johnson',
          primary_photo_url: 'https://example.com/alex.jpg',
        },
      },
    },
    {
      id: 11,
      conversation_id: conversationId,
      sender_id: 1,
      content: 'Hi Alex!',
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

  const mockPendingMessages = [
    {
      client_nonce: 'pending-1',
      conversation_id: conversationId,
      content: 'This is pending',
      sent_at: '2024-01-01T10:02:00Z',
      status: 'sending' as const,
    },
  ];

  const defaultStore = {
    conversations: [
      {
        id: conversationId,
        match_id: 1,
        created_at: '2024-01-01T09:00:00Z',
        updated_at: '2024-01-01T10:02:00Z',
        participants: [
          { id: 1, name: 'User' },
          {
            id: 2,
            name: 'Alex',
            profile: {
              display_name: 'Alex Johnson',
              primary_photo_url: 'https://example.com/alex.jpg',
            },
          },
        ],
        last_message: mockMessages[1],
        unread_count: 0,
      },
    ],
    messages: { [conversationId]: mockMessages },
    pendingMessages: { [conversationId]: mockPendingMessages },
    connectionState: WebSocketConnectionState.CONNECTED,
    currentConversationId: conversationId,
    isLoadingMessages: {},
    messagesError: {},
    searchResults: [],
    initializeEcho: jest.fn(),
    loadConversations: jest.fn(),
    loadMessages: jest.fn(),
    setCurrentConversation: jest.fn(),
    sendMessage: jest.fn().mockResolvedValue(undefined),
    markAsRead: jest.fn().mockResolvedValue(undefined),
    retryMessage: jest.fn(),
    subscribeToConversation: jest.fn(),
    unsubscribeFromConversation: jest.fn(),
  };

  const defaultAuth = {
    user: { id: 1, name: 'User' },
    token: 'mock-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChatStore.mockReturnValue(defaultStore as any);
    mockUseAuthStore.mockReturnValue(defaultAuth as any);
    useLocalSearchParams.mockReturnValue({ id: '1' });
  });

  it('renders messages from chat store', () => {
    const { getByTestId } = render(<SimpleConversationScreen />);

    expect(getByTestId('message-text-10').props.children).toContain('Hello from Alex!');
    expect(getByTestId('message-text-11').props.children).toContain('Hi Alex!');
    expect(getByTestId('message-text-pending-1').props.children).toContain('This is pending');
  });

  it('initializes conversation data on mount', async () => {
    const loadMessages = jest.fn().mockResolvedValue(undefined);
    const setCurrentConversation = jest.fn();
    const subscribeToConversation = jest.fn();
    const markAsRead = jest.fn().mockResolvedValue(undefined);
    const unsubscribeFromConversation = jest.fn();

    mockUseChatStore.mockReturnValue({
      ...defaultStore,
      loadMessages,
      setCurrentConversation,
      subscribeToConversation,
      markAsRead,
      unsubscribeFromConversation,
    } as any);

    const { unmount } = render(<SimpleConversationScreen />);

    await waitFor(() => {
      expect(setCurrentConversation).toHaveBeenCalledWith(conversationId);
      expect(loadMessages).toHaveBeenCalledWith(conversationId, 1);
      expect(subscribeToConversation).toHaveBeenCalledWith(conversationId);
      expect(markAsRead).toHaveBeenCalledWith(conversationId);
    });

    unmount();
    expect(unsubscribeFromConversation).toHaveBeenCalledWith(conversationId);
  });

  it('sends message through chat store', async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);

    mockUseChatStore.mockReturnValue({
      ...defaultStore,
      sendMessage,
    } as any);

    const { getByTestId } = render(<SimpleConversationScreen />);

    const input = getByTestId('message-input');
    const button = getByTestId('send-button');

    fireEvent.changeText(input, 'New message');
    fireEvent.press(button);

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith(conversationId, 'New message');
    });
    expect(input.props.value).toBe('');
  });
});
