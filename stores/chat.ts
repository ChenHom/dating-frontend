/**
 * Chat Store
 * 聊天狀態管理 - 使用 Zustand 管理對話、訊息與 WebSocket 連線
 */

import { create } from 'zustand';
import { WebSocketManager } from '../services/websocket/WebSocketManager';
import { EchoService, echoService } from '../services/websocket/EchoService';
import { WebSocketConnectionState, MessageNewEvent } from '../services/websocket/types';
import { chatNotificationIntegrator } from '../services/notifications/ChatNotificationIntegrator';
import { SearchResult } from '../features/chat/components/MessageSearchBar';
import { ReactionData } from '../features/chat/components/MessageReactions';

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  sequence_number: number;
  client_nonce: string;
  sent_at: string;
  created_at: string;
  sender: {
    id: number;
    name: string;
    profile?: {
      display_name: string;
      primary_photo_url?: string;
    };
  };
}

export interface Conversation {
  id: number;
  match_id: number;
  created_at: string;
  updated_at: string;
  participants: Array<{
    id: number;
    name: string;
    profile?: {
      display_name: string;
      primary_photo_url?: string;
    };
  }>;
  last_message?: Message;
  unread_count: number;
  is_muted?: boolean; // 是否已靜音
}

export interface PendingMessage {
  client_nonce: string;
  conversation_id: number;
  content: string;
  sent_at: string;
  status: 'sending' | 'sent' | 'failed';
  error?: string | undefined;
  reply_to_message_id?: string; // 新增回覆關係字段
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageState {
  status: MessageStatus;
  timestamp: number;
  error?: string;
}

interface ChatState {
  // Connection state
  connectionState: WebSocketConnectionState;
  wsManager: WebSocketManager | null;
  echoService: EchoService;
  isUsingHttpFallback: boolean;
  httpPollingInterval: number | null;

  // Conversations
  conversations: Conversation[];
  currentConversationId: number | null;
  isLoadingConversations: boolean;
  conversationsError: string | null;

  // Messages
  messages: { [conversationId: number]: Message[] };
  isLoadingMessages: { [conversationId: number]: boolean };
  messagesError: { [conversationId: number]: string | null };

  // Pending messages
  pendingMessages: { [conversationId: number]: PendingMessage[] };

  // Message states
  messageStates: { [messageId: string]: MessageState };

  // Search functionality
  searchResults: SearchResult[];
  searchQuery: string;
  isSearching: boolean;

  // Reply functionality
  replyToMessage: Message | null;
  replyRelations: { [messageId: string]: string }; // messageId -> originalMessageId

  // Reaction functionality
  messageReactions: { [messageId: string]: ReactionData[] };

  // Unread counts
  totalUnreadCount: number;

  // Actions
  initializeEcho: (authToken: string) => Promise<void>;
  connect: (wsUrl: string, authToken: string) => void;
  disconnect: () => void;
  subscribeToConversation: (conversationId: number) => void;
  unsubscribeFromConversation: (conversationId: number) => void;
  loadConversations: (authToken: string) => Promise<void>;
  loadMessages: (conversationId: number, page: number, authToken: string) => Promise<void>;
  setCurrentConversation: (conversationId: number | null) => void;
  sendMessage: (conversationId: number, content: string, authToken: string) => Promise<void>;
  markAsRead: (conversationId: number, authToken: string) => Promise<void>;
  retryMessage: (conversationId: number, clientNonce: string, authToken: string) => Promise<void>;

  // HTTP fallback
  startHttpPolling: (authToken: string) => void;
  stopHttpPolling: () => void;
  pollNewMessages: (authToken: string) => Promise<void>;

  // Internal methods
  handleWebSocketMessage: (event: any) => void;
  handleGameEvent: (eventType: string, event: any) => void;
  handleConnectionStateChange: (newState: WebSocketConnectionState) => void;
  updatePendingMessageStatus: (clientNonce: string, status: PendingMessage['status'], error?: string) => void;
  addPendingMessage: (message: PendingMessage) => void;
  removePendingMessage: (clientNonce: string) => void;

  // Message state management
  updateMessageState: (messageId: string, status: MessageStatus, error?: string) => void;
  getMessageState: (messageId: string) => MessageState | null;
  handleMessageDelivered: (messageId: string, userId: number) => void;
  handleMessageRead: (messageId: string, userId: number) => void;

  // Search functionality
  searchMessages: (query: string) => Promise<SearchResult[]>;
  clearSearchResults: () => void;

  // Reply functionality
  setReplyToMessage: (message: Message | null) => void;
  sendReplyMessage: (conversationId: number, content: string, replyToMessageId: string) => Promise<void>;
  getOriginalMessage: (messageId: string) => Message | null;

  // Reaction functionality
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  getMessageReactions: (messageId: string) => ReactionData[];
  handleReactionAdded: (messageId: string, emoji: string, userId: number, userName: string) => void;
  handleReactionRemoved: (messageId: string, emoji: string, userId: number) => void;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  connectionState: WebSocketConnectionState.DISCONNECTED,
  wsManager: null,
  echoService: echoService,
  isUsingHttpFallback: false,
  httpPollingInterval: null,
  conversations: [],
  currentConversationId: null,
  isLoadingConversations: false,
  conversationsError: null,
  messages: {},
  isLoadingMessages: {},
  messagesError: {},
  pendingMessages: {},
  messageStates: {},
  searchResults: [],
  searchQuery: '',
  isSearching: false,
  replyToMessage: null,
  replyRelations: {},
  messageReactions: {},
  totalUnreadCount: 0,

  // Echo service initialization
  initializeEcho: async (authToken: string) => {
    try {
      const { echoService } = get();

      // Setup Echo event listeners
      echoService.on('connected', () => {
        set({ connectionState: WebSocketConnectionState.CONNECTED });
      });

      echoService.on('disconnected', () => {
        set({ connectionState: WebSocketConnectionState.DISCONNECTED });
      });

      echoService.on('error', (error) => {
        console.error('Echo connection error:', error);
        set({ connectionState: WebSocketConnectionState.ERROR });
      });

      echoService.on('message.new', (event: MessageNewEvent) => {
        get().handleWebSocketMessage(event);
      });

      echoService.on('message.delivered', (event) => {
        get().handleMessageDelivered(event.message_id, event.user_id);
      });

      echoService.on('message.read', (event) => {
        get().handleMessageRead(event.message_id, event.user_id);
      });

      // Setup game event listeners
      echoService.on('game.invite.received', (event) => {
        get().handleGameEvent('game.invite.received', event);
      });

      echoService.on('game.invite.accepted', (event) => {
        get().handleGameEvent('game.invite.accepted', event);
      });

      echoService.on('game.invite.declined', (event) => {
        get().handleGameEvent('game.invite.declined', event);
      });

      echoService.on('game.started', (event) => {
        get().handleGameEvent('game.started', event);
      });

      echoService.on('game.move', (event) => {
        get().handleGameEvent('game.move', event);
      });

      echoService.on('game.ended', (event) => {
        get().handleGameEvent('game.ended', event);
      });

      echoService.on('game.timeout', (event) => {
        get().handleGameEvent('game.timeout', event);
      });

      echoService.on('connection_state_changed', (newState) => {
        get().handleConnectionStateChange(newState);
      });

      // 重連事件監聽
      echoService.on('reconnecting', (attempt: number, delay: number) => {
        console.log(`Reconnecting attempt ${attempt}, delay: ${delay}ms`);
        // 可以在這裡發出通知給使用者
      });

      echoService.on('reconnected', () => {
        console.log('Successfully reconnected to Echo service');
        set({ connectionState: WebSocketConnectionState.CONNECTED });

        // 重新訂閱當前對話
        const { currentConversationId } = get();
        if (currentConversationId) {
          get().subscribeToConversation(currentConversationId);
        }
      });

      echoService.on('reconnect_failed', () => {
        console.error('All reconnection attempts failed');
        set({
          connectionState: WebSocketConnectionState.ERROR,
          isUsingHttpFallback: true
        });
        // 啟動 HTTP 輪詢作為最後手段
        get().startHttpPolling(authToken);
      });

      echoService.on('state_synced', () => {
        console.log('State synced after reconnection');
        // 重新加載最新訊息
        const { currentConversationId } = get();
        if (currentConversationId) {
          get().loadMessages(currentConversationId, 1, authToken);
        }
      });

      await echoService.initialize(authToken);

      // 初始化聊天通知整合器
      try {
        await chatNotificationIntegrator.initialize();
      } catch (error) {
        console.error('Failed to initialize chat notification integrator:', error);
        // 不拋出錯誤，允許聊天功能繼續工作
      }

      // 檢測是否需要啟用 HTTP 輪詢
      const checkConnection = () => {
        const isConnected = echoService.isConnected();
        if (!isConnected) {
          console.log('WebSocket not connected, starting HTTP polling');
          set({ isUsingHttpFallback: true });
          get().startHttpPolling(authToken);
        }
      };

      // 給 Echo 一些時間連線，然後檢測
      setTimeout(checkConnection, 2000);

    } catch (error) {
      console.error('Failed to initialize Echo service:', error);
      set({ connectionState: WebSocketConnectionState.ERROR });
      throw error;
    }
  },

  subscribeToConversation: (conversationId: number) => {
    const { echoService } = get();
    echoService.subscribeToConversation(conversationId);
  },

  unsubscribeFromConversation: (conversationId: number) => {
    const { echoService } = get();
    echoService.unsubscribeFromConversation(conversationId);
  },

  // Connection management
  connect: (wsUrl: string, authToken: string) => {
    const { wsManager } = get();

    if (wsManager) {
      wsManager.disconnect();
    }

    const newWsManager = new WebSocketManager(wsUrl, authToken, {
      heartbeatInterval: 25000,
      heartbeatTimeout: 60000,
      reconnectionDelay: 1000,
      maxReconnectionDelay: 8000,
      maxReconnectionAttempts: 5,
      messageQueueMaxSize: 100,
    });

    // Event listeners
    newWsManager.on('connection_state_changed', (newState) => {
      get().handleConnectionStateChange(newState);
    });

    newWsManager.on('message', (event) => {
      get().handleWebSocketMessage(event);
    });

    set({ wsManager: newWsManager });
    newWsManager.connect();
  },

  disconnect: () => {
    const { wsManager, echoService } = get();

    // Stop HTTP polling
    get().stopHttpPolling();

    if (wsManager) {
      wsManager.disconnect();
      set({
        wsManager: null,
        connectionState: WebSocketConnectionState.DISCONNECTED
      });
    }

    echoService.disconnect();
  },

  // Conversations
  loadConversations: async (authToken: string) => {
    set({ isLoadingConversations: true, conversationsError: null });

    try {
      const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const conversations = data.data || [];

      // Calculate total unread count
      const totalUnreadCount = conversations.reduce((sum: number, conv: Conversation) => {
        return sum + (conv.unread_count || 0);
      }, 0);

      set({
        conversations,
        totalUnreadCount,
        isLoadingConversations: false
      });
    } catch (error) {
      set({
        conversationsError: error instanceof Error ? error.message : 'Failed to load conversations',
        isLoadingConversations: false
      });
    }
  },

  // Messages
  loadMessages: async (conversationId: number, page: number, authToken: string) => {
    const { isLoadingMessages } = get();

    if (isLoadingMessages[conversationId]) {
      return;
    }

    set({
      isLoadingMessages: { ...isLoadingMessages, [conversationId]: true },
      messagesError: { ...get().messagesError, [conversationId]: null }
    });

    try {
      const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const newMessages = data.data || [];

      const { messages } = get();
      const existingMessages = messages[conversationId] || [];

      // Merge messages (prepend for pagination)
      const mergedMessages = page === 1
        ? newMessages
        : [...newMessages, ...existingMessages];

      set({
        messages: { ...messages, [conversationId]: mergedMessages },
        isLoadingMessages: { ...get().isLoadingMessages, [conversationId]: false }
      });
    } catch (error) {
      set({
        messagesError: {
          ...get().messagesError,
          [conversationId]: error instanceof Error ? error.message : 'Failed to load messages'
        },
        isLoadingMessages: { ...get().isLoadingMessages, [conversationId]: false }
      });
    }
  },

  setCurrentConversation: (conversationId: number | null) => {
    const { currentConversationId } = get();

    // Unsubscribe from previous conversation
    if (currentConversationId && currentConversationId !== conversationId) {
      get().unsubscribeFromConversation(currentConversationId);
    }

    set({ currentConversationId: conversationId });

    // 更新聊天通知整合器的活躍對話
    try {
      chatNotificationIntegrator.setActiveConversation(conversationId);
    } catch (error) {
      console.error('Error setting active conversation in notification integrator:', error);
    }

    // Subscribe to new conversation
    if (conversationId) {
      get().subscribeToConversation(conversationId);

      // Join WebSocket room if connected (fallback for direct WebSocket)
      const { wsManager, echoService } = get();
      if (echoService.isConnected()) {
        echoService.joinChat(conversationId, 1); // TODO: Get from auth store
      } else if (wsManager && wsManager.isConnected()) {
        wsManager.sendMessage({
          type: 'chat.join',
          conversation_id: conversationId,
          user_id: 1, // TODO: Get from auth store
        });
      }
    }
  },

  // Message sending
  sendMessage: async (conversationId: number, content: string, authToken: string) => {
    const clientNonce = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const sentAt = new Date().toISOString();

    // Add pending message
    const pendingMessage: PendingMessage = {
      client_nonce: clientNonce,
      conversation_id: conversationId,
      content,
      sent_at: sentAt,
      status: 'sending'
    };

    get().addPendingMessage(pendingMessage);

    const { wsManager, echoService } = get();

    // Try Echo service first
    if (echoService.isConnected()) {
      const success = echoService.sendMessage(conversationId, content, clientNonce);

      if (success) {
        get().updatePendingMessageStatus(clientNonce, 'sending');
        return;
      }
    }

    // Try WebSocket fallback
    if (wsManager && wsManager.isConnected()) {
      const success = wsManager.sendMessage({
        type: 'message.send',
        conversation_id: conversationId,
        content,
        client_nonce: clientNonce,
        sent_at: sentAt,
      });

      if (success) {
        get().updatePendingMessageStatus(clientNonce, 'sending');
        return;
      }
    }

    // Fallback to HTTP
    try {
      const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          client_nonce: clientNonce,
          sent_at: sentAt,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Remove pending message and add real message
      get().removePendingMessage(clientNonce);

      const { messages } = get();
      const existingMessages = messages[conversationId] || [];

      // Initialize message state for the new message
      const newMessage = data.data;
      get().updateMessageState(newMessage.id.toString(), 'sent');

      set({
        messages: {
          ...messages,
          [conversationId]: [...existingMessages, newMessage]
        }
      });

    } catch (error) {
      get().updatePendingMessageStatus(
        clientNonce,
        'failed',
        error instanceof Error ? error.message : 'Failed to send message'
      );
    }
  },

  markAsRead: async (conversationId: number, authToken: string) => {
    try {
      await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Update local state
      const { conversations } = get();
      const updatedConversations = conversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, unread_count: 0 }
          : conv
      );

      const totalUnreadCount = updatedConversations.reduce((sum, conv) => {
        return sum + (conv.unread_count || 0);
      }, 0);

      set({
        conversations: updatedConversations,
        totalUnreadCount
      });

      // 通知聊天通知整合器標記為已讀
      try {
        chatNotificationIntegrator.markConversationAsRead(conversationId);
      } catch (error) {
        console.error('Error marking conversation as read in notification integrator:', error);
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  retryMessage: async (conversationId: number, clientNonce: string, authToken: string) => {
    const { pendingMessages } = get();
    const conversationPending = pendingMessages[conversationId] || [];
    const pendingMessage = conversationPending.find(msg => msg.client_nonce === clientNonce);

    if (!pendingMessage) {
      return;
    }

    // Retry the message
    await get().sendMessage(conversationId, pendingMessage.content, authToken);

    // Remove the original failed message
    get().removePendingMessage(clientNonce);
  },

  // WebSocket event handlers
  handleWebSocketMessage: (event: any) => {
    switch (event.type) {
      case 'message.ack':
        // Message was acknowledged by server
        get().updatePendingMessageStatus(event.client_nonce, 'sent');

        // If message ID is provided, initialize message state
        if (event.message_id) {
          get().updateMessageState(event.message_id.toString(), 'sent');
        }

        setTimeout(() => {
          get().removePendingMessage(event.client_nonce);
        }, 1000); // Keep for 1 second to show "sent" status
        break;

      case 'message.new':
        // New message received
        const { messages, conversations } = get();
        const conversationId = event.conversation_id;
        const existingMessages = messages[conversationId] || [];

        // Check for duplicates
        const isDuplicate = existingMessages.some(msg =>
          msg.client_nonce === event.client_nonce || msg.id === event.id
        );

        if (!isDuplicate) {
          // Initialize message state for new incoming message
          const { messageStates } = get();
          const newMessageStates = {
            ...messageStates,
            [event.id.toString()]: {
              messageId: event.id.toString(),
              status: 'delivered' as MessageStatus,
              timestamp: Date.now(),
            }
          };

          set({
            messages: {
              ...messages,
              [conversationId]: [...existingMessages, event]
            },
            messageStates: newMessageStates
          });

          // Update conversation last message and unread count
          const updatedConversations = conversations.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                last_message: event,
                unread_count: conv.id === get().currentConversationId ? 0 : conv.unread_count + 1
              };
            }
            return conv;
          });

          const totalUnreadCount = updatedConversations.reduce((sum, conv) => {
            return sum + (conv.unread_count || 0);
          }, 0);

          set({
            conversations: updatedConversations,
            totalUnreadCount
          });

          // 整合聊天通知處理
          try {
            chatNotificationIntegrator.handleNewMessage(event);
          } catch (error) {
            console.error('Error handling chat notification:', error);
          }
        }
        break;

      case 'chat.joined':
        console.log('Joined chat room:', event.conversation_id);
        break;

      default:
        console.log('Unhandled WebSocket event:', event.type);
    }
  },

  handleGameEvent: (eventType: string, event: any) => {
    // Forward game events to game store
    // Note: This creates a loose coupling between stores
    // In a real app, you might want to use a more structured approach
    const gameStore = require('@/stores/game').useGameStore.getState();

    switch (eventType) {
      case 'game.invite.received':
        gameStore.handleGameInviteReceived(event);
        break;
      case 'game.invite.accepted':
        gameStore.handleGameInviteAccepted(event);
        break;
      case 'game.invite.declined':
        gameStore.handleGameInviteDeclined(event);
        break;
      case 'game.started':
        gameStore.handleGameStarted(event);
        break;
      case 'game.move':
        gameStore.handleGameMove(event);
        break;
      case 'game.ended':
        gameStore.handleGameEnded(event);
        break;
      case 'game.timeout':
        gameStore.handleGameTimeout(event);
        break;
      default:
        console.log('Unhandled game event:', eventType, event);
    }
  },

  handleConnectionStateChange: (newState: WebSocketConnectionState) => {
    set({ connectionState: newState });

    // Rejoin current conversation on reconnection
    if (newState === WebSocketConnectionState.CONNECTED) {
      // Stop HTTP polling if WebSocket reconnected
      get().stopHttpPolling();
      set({ isUsingHttpFallback: false });

      const { currentConversationId } = get();
      if (currentConversationId) {
        get().setCurrentConversation(currentConversationId);
      }
    } else if (newState === WebSocketConnectionState.DISCONNECTED || newState === WebSocketConnectionState.ERROR) {
      // Start HTTP polling as fallback
      const { echoService } = get();
      const token = this.authToken; // TODO: Get from auth store
      if (token && !get().isUsingHttpFallback) {
        console.log('WebSocket disconnected, starting HTTP polling');
        set({ isUsingHttpFallback: true });
        get().startHttpPolling(token);
      }
    }
  },

  // Pending message management
  updatePendingMessageStatus: (clientNonce: string, status: PendingMessage['status'], error?: string) => {
    const { pendingMessages } = get();

    const updatedPendingMessages = { ...pendingMessages };

    Object.keys(updatedPendingMessages).forEach(conversationId => {
      const messages = updatedPendingMessages[parseInt(conversationId)] || [];
      const updatedMessages = messages.map(msg =>
        msg.client_nonce === clientNonce
          ? { ...msg, status, error }
          : msg
      );
      updatedPendingMessages[parseInt(conversationId)] = updatedMessages;
    });

    set({ pendingMessages: updatedPendingMessages });
  },

  addPendingMessage: (message: PendingMessage) => {
    const { pendingMessages } = get();
    const conversationId = message.conversation_id;
    const existing = pendingMessages[conversationId] || [];

    set({
      pendingMessages: {
        ...pendingMessages,
        [conversationId]: [...existing, message]
      }
    });
  },

  removePendingMessage: (clientNonce: string) => {
    const { pendingMessages } = get();

    const updatedPendingMessages = { ...pendingMessages };

    Object.keys(updatedPendingMessages).forEach(conversationId => {
      const messages = updatedPendingMessages[parseInt(conversationId)] || [];
      const filtered = messages.filter(msg => msg.client_nonce !== clientNonce);
      updatedPendingMessages[parseInt(conversationId)] = filtered;
    });

    set({ pendingMessages: updatedPendingMessages });
  },

  // Message state management
  updateMessageState: (messageId: string, status: MessageStatus, error?: string) => {
    const { messageStates } = get();

    set({
      messageStates: {
        ...messageStates,
        [messageId]: {
          status,
          timestamp: Date.now(),
          error,
        },
      },
    });
  },

  getMessageState: (messageId: string): MessageState | null => {
    const { messageStates } = get();
    return messageStates[messageId] || null;
  },

  handleMessageDelivered: (messageId: string, userId: number) => {
    const currentUserId = get().echoService.getUserId();

    // 只有當不是自己發送的訊息時才更新為已送達
    if (userId !== currentUserId) {
      get().updateMessageState(messageId, 'delivered');
    }
  },

  handleMessageRead: (messageId: string, userId: number) => {
    const currentUserId = get().echoService.getUserId();

    // 只有當不是自己發送的訊息時才更新為已讀
    if (userId !== currentUserId) {
      get().updateMessageState(messageId, 'read');
    }
  },

  // Search functionality
  searchMessages: async (query: string): Promise<SearchResult[]> => {
    const { messages, conversations } = get();

    set({ isSearching: true, searchQuery: query });

    try {
      const results: SearchResult[] = [];
      const normalizedQuery = query.toLowerCase().trim();

      // 搜索所有對話中的訊息
      Object.entries(messages).forEach(([conversationId, messageList]) => {
        const conversation = conversations.find(c => c.id === parseInt(conversationId));

        messageList.forEach(message => {
          const content = message.content.toLowerCase();
          const matchIndex = content.indexOf(normalizedQuery);

          if (matchIndex !== -1) {
            // 創建高亮內容
            const originalContent = message.content;
            const beforeMatch = originalContent.substring(0, matchIndex);
            const match = originalContent.substring(matchIndex, matchIndex + query.length);
            const afterMatch = originalContent.substring(matchIndex + query.length);
            const highlightedContent = `${beforeMatch}<mark>${match}</mark>${afterMatch}`;

            // 獲取發送者名稱
            const senderName = message.sender.profile?.display_name || message.sender.name;

            results.push({
              messageId: message.id.toString(),
              conversationId: message.conversation_id,
              content: message.content,
              highlightedContent,
              senderName,
              timestamp: message.sent_at || message.created_at,
              matchIndex,
              matchLength: query.length,
            });
          }
        });
      });

      // 按時間降序排序（最新的在前）
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      set({ searchResults: results, isSearching: false });
      return results;
    } catch (error) {
      console.error('Search error:', error);
      set({ searchResults: [], isSearching: false });
      return [];
    }
  },

  clearSearchResults: () => {
    set({
      searchResults: [],
      searchQuery: '',
      isSearching: false
    });
  },

  // Reply functionality
  setReplyToMessage: (message: Message | null) => {
    set({ replyToMessage: message });
  },

  sendReplyMessage: async (conversationId: number, content: string, replyToMessageId: string): Promise<void> => {
    const { echoService } = get();
    const token = echoService.getAuthToken();

    if (!token) {
      throw new Error('User not authenticated');
    }

    const clientNonce = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 創建待處理訊息 (包含回覆關係)
    const pendingMessage: PendingMessage = {
      client_nonce: clientNonce,
      conversation_id: conversationId,
      content,
      status: 'sending',
      sent_at: new Date().toISOString(),
      reply_to_message_id: replyToMessageId, // 新增回覆關係字段
    };

    // 添加到待處理訊息列表
    get().addPendingMessage(pendingMessage);

    try {
      // 發送到伺服器
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          content,
          client_nonce: clientNonce,
          reply_to_message_id: replyToMessageId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const messageData = await response.json();

      // 儲存回覆關係
      const { replyRelations } = get();
      set({
        replyRelations: {
          ...replyRelations,
          [messageData.id.toString()]: replyToMessageId,
        },
      });

      // 初始化訊息狀態
      get().updateMessageState(messageData.id.toString(), 'sent');

      // 更新待處理訊息狀態為成功
      get().updatePendingMessageStatus(clientNonce, 'sent');

      // 清除回覆狀態
      set({ replyToMessage: null });

    } catch (error) {
      console.error('Error sending reply message:', error);
      // 更新待處理訊息狀態為失敗
      get().updatePendingMessageStatus(clientNonce, 'failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },

  getOriginalMessage: (messageId: string): Message | null => {
    const { messages, replyRelations } = get();
    const originalMessageId = replyRelations[messageId];

    if (!originalMessageId) return null;

    // 在所有對話中尋找原始訊息
    for (const [conversationId, messageList] of Object.entries(messages)) {
      const originalMessage = messageList.find(msg => msg.id.toString() === originalMessageId);
      if (originalMessage) {
        return originalMessage;
      }
    }

    return null;
  },

  // Reaction functionality
  addReaction: async (messageId: string, emoji: string): Promise<void> => {
    const { echoService } = get();
    const token = echoService.getAuthToken();
    const currentUserId = echoService.getUserId();

    if (!token || !currentUserId) {
      throw new Error('User not authenticated');
    }

    try {
      // 樂觀更新 - 先在本地添加反應
      const { messageReactions } = get();
      const reactions = messageReactions[messageId] || [];
      const existingReaction = reactions.find(r => r.emoji === emoji);

      if (existingReaction) {
        // 如果反應已存在，檢查用戶是否已經反應過
        if (existingReaction.hasCurrentUserReacted) {
          // 用戶已經反應過這個表情，應該移除
          return get().removeReaction(messageId, emoji);
        } else {
          // 添加用戶到現有反應
          existingReaction.count++;
          existingReaction.hasCurrentUserReacted = true;
          existingReaction.users.push({
            id: currentUserId,
            name: 'You', // 簡化處理，實際應該獲取用戶名稱
          });
        }
      } else {
        // 創建新反應
        reactions.push({
          emoji,
          count: 1,
          hasCurrentUserReacted: true,
          users: [{
            id: currentUserId,
            name: 'You',
          }],
        });
      }

      set({
        messageReactions: {
          ...messageReactions,
          [messageId]: [...reactions],
        },
      });

      // 發送到伺服器
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('Error adding reaction:', error);
      // 恢復樂觀更新
      // TODO: 實現錯誤恢復邏輯
      throw error;
    }
  },

  removeReaction: async (messageId: string, emoji: string): Promise<void> => {
    const { echoService } = get();
    const token = echoService.getAuthToken();
    const currentUserId = echoService.getUserId();

    if (!token || !currentUserId) {
      throw new Error('User not authenticated');
    }

    try {
      // 樂觀更新 - 先在本地移除反應
      const { messageReactions } = get();
      const reactions = messageReactions[messageId] || [];
      const reactionIndex = reactions.findIndex(r => r.emoji === emoji);

      if (reactionIndex !== -1) {
        const reaction = reactions[reactionIndex];
        if (reaction.hasCurrentUserReacted) {
          reaction.count--;
          reaction.hasCurrentUserReacted = false;
          reaction.users = reaction.users.filter(u => u.id !== currentUserId);

          // 如果反應數量為 0，移除整個反應
          if (reaction.count === 0) {
            reactions.splice(reactionIndex, 1);
          }
        }
      }

      set({
        messageReactions: {
          ...messageReactions,
          [messageId]: [...reactions],
        },
      });

      // 發送到伺服器
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}/reactions/${emoji}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('Error removing reaction:', error);
      // 恢復樂觀更新
      // TODO: 實現錯誤恢復邏輯
      throw error;
    }
  },

  getMessageReactions: (messageId: string): ReactionData[] => {
    const { messageReactions } = get();
    return messageReactions[messageId] || [];
  },

  handleReactionAdded: (messageId: string, emoji: string, userId: number, userName: string) => {
    const { messageReactions, echoService } = get();
    const currentUserId = echoService.getUserId();
    const reactions = messageReactions[messageId] || [];
    const existingReaction = reactions.find(r => r.emoji === emoji);

    if (existingReaction) {
      // 添加用戶到現有反應
      existingReaction.count++;
      if (userId === currentUserId) {
        existingReaction.hasCurrentUserReacted = true;
      }
      existingReaction.users.push({
        id: userId,
        name: userName,
      });
    } else {
      // 創建新反應
      reactions.push({
        emoji,
        count: 1,
        hasCurrentUserReacted: userId === currentUserId,
        users: [{
          id: userId,
          name: userName,
        }],
      });
    }

    set({
      messageReactions: {
        ...messageReactions,
        [messageId]: [...reactions],
      },
    });
  },

  handleReactionRemoved: (messageId: string, emoji: string, userId: number) => {
    const { messageReactions, echoService } = get();
    const currentUserId = echoService.getUserId();
    const reactions = messageReactions[messageId] || [];
    const reactionIndex = reactions.findIndex(r => r.emoji === emoji);

    if (reactionIndex !== -1) {
      const reaction = reactions[reactionIndex];
      reaction.count--;
      if (userId === currentUserId) {
        reaction.hasCurrentUserReacted = false;
      }
      reaction.users = reaction.users.filter(u => u.id !== userId);

      // 如果反應數量為 0，移除整個反應
      if (reaction.count === 0) {
        reactions.splice(reactionIndex, 1);
      }
    }

    set({
      messageReactions: {
        ...messageReactions,
        [messageId]: [...reactions],
      },
    });
  },

  // HTTP fallback methods
  startHttpPolling: (authToken: string) => {
    const { httpPollingInterval } = get();

    // 如果已經在輪詢中，不重複啟動
    if (httpPollingInterval) {
      return;
    }

    const pollingIntervalMs = parseInt(
      process.env.EXPO_PUBLIC_HTTP_POLLING_INTERVAL || '10000'
    );

    console.log(`Starting HTTP polling every ${pollingIntervalMs}ms`);

    // 立即執行一次
    get().pollNewMessages(authToken);

    // 設定定時輪詢
    const intervalId = setInterval(() => {
      get().pollNewMessages(authToken);
    }, pollingIntervalMs) as unknown as number;

    set({ httpPollingInterval: intervalId });
  },

  stopHttpPolling: () => {
    const { httpPollingInterval } = get();

    if (httpPollingInterval) {
      console.log('Stopping HTTP polling');
      clearInterval(httpPollingInterval);
      set({ httpPollingInterval: null, isUsingHttpFallback: false });
    }
  },

  pollNewMessages: async (authToken: string) => {
    const { currentConversationId, messages } = get();

    if (!currentConversationId) {
      return;
    }

    try {
      // 獲取當前對話的最後一條訊息 ID
      const conversationMessages = messages[currentConversationId] || [];
      const lastMessageId = conversationMessages.length > 0
        ? conversationMessages[conversationMessages.length - 1].id
        : 0;

      // 輪詢新訊息
      const response = await fetch(
        `${API_BASE_URL}/chat/conversations/${currentConversationId}/messages?since=${lastMessageId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const newMessages = data.data || [];

      if (newMessages.length > 0) {
        console.log(`Polled ${newMessages.length} new messages`);

        // 添加新訊息
        const updatedMessages = [...conversationMessages, ...newMessages];

        set({
          messages: {
            ...messages,
            [currentConversationId]: updatedMessages,
          },
        });

        // 更新對話列表中的最後一條訊息
        const { conversations } = get();
        const updatedConversations = conversations.map(conv => {
          if (conv.id === currentConversationId && newMessages.length > 0) {
            return {
              ...conv,
              last_message: newMessages[newMessages.length - 1],
            };
          }
          return conv;
        });

        set({ conversations: updatedConversations });
      }
    } catch (error) {
      console.error('Error polling new messages:', error);
      // 不拋出錯誤，繼續輪詢
    }
  },
}));