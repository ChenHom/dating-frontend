/**
 * Chat Store
 * 聊天狀態管理 - 使用 Zustand 管理對話、訊息與 WebSocket 連線
 */

import { create } from 'zustand';
import { WebSocketManager } from '../services/websocket/WebSocketManager';
import { EchoService, echoService } from '../services/websocket/EchoService';
import { WebSocketConnectionState, MessageNewEvent } from '../services/websocket/types';

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
}

export interface PendingMessage {
  client_nonce: string;
  conversation_id: number;
  content: string;
  sent_at: string;
  status: 'sending' | 'sent' | 'failed';
  error?: string | undefined;
}

interface ChatState {
  // Connection state
  connectionState: WebSocketConnectionState;
  wsManager: WebSocketManager | null;
  echoService: EchoService;
  
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
  
  // Unread counts
  totalUnreadCount: number;
  
  // Actions
  initializeEcho: (authToken: string) => Promise<void>;
  connect: (wsUrl: string, authToken: string) => void;
  disconnect: () => void;
  subscribeToConversation: (conversationId: number) => void;
  unsubscribeFromConversation: (conversationId: number) => void;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: number, page?: number) => Promise<void>;
  setCurrentConversation: (conversationId: number | null) => void;
  sendMessage: (conversationId: number, content: string) => Promise<void>;
  markAsRead: (conversationId: number) => Promise<void>;
  retryMessage: (conversationId: number, clientNonce: string) => Promise<void>;
  
  // Internal methods
  handleWebSocketMessage: (event: any) => void;
  handleGameEvent: (eventType: string, event: any) => void;
  handleConnectionStateChange: (newState: WebSocketConnectionState) => void;
  updatePendingMessageStatus: (clientNonce: string, status: PendingMessage['status'], error?: string) => void;
  addPendingMessage: (message: PendingMessage) => void;
  removePendingMessage: (clientNonce: string) => void;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  connectionState: WebSocketConnectionState.DISCONNECTED,
  wsManager: null,
  echoService: echoService,
  conversations: [],
  currentConversationId: null,
  isLoadingConversations: false,
  conversationsError: null,
  messages: {},
  isLoadingMessages: {},
  messagesError: {},
  pendingMessages: {},
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

      // Setup game event listeners
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

      await echoService.initialize(authToken);

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
  loadConversations: async () => {
    set({ isLoadingConversations: true, conversationsError: null });

    try {
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_AUTH_TOKEN}`,
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
  loadMessages: async (conversationId: number, page = 1) => {
    const { isLoadingMessages } = get();
    
    if (isLoadingMessages[conversationId]) {
      return;
    }

    set({
      isLoadingMessages: { ...isLoadingMessages, [conversationId]: true },
      messagesError: { ...get().messagesError, [conversationId]: null }
    });

    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_AUTH_TOKEN}`,
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
  sendMessage: async (conversationId: number, content: string) => {
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
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_AUTH_TOKEN}`,
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
      
      set({
        messages: {
          ...messages,
          [conversationId]: [...existingMessages, data.data]
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

  markAsRead: async (conversationId: number) => {
    try {
      await fetch(`${API_BASE_URL}/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_AUTH_TOKEN}`,
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
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  retryMessage: async (conversationId: number, clientNonce: string) => {
    const { pendingMessages } = get();
    const conversationPending = pendingMessages[conversationId] || [];
    const pendingMessage = conversationPending.find(msg => msg.client_nonce === clientNonce);
    
    if (!pendingMessage) {
      return;
    }

    // Retry the message
    await get().sendMessage(conversationId, pendingMessage.content);
    
    // Remove the original failed message
    get().removePendingMessage(clientNonce);
  },

  // WebSocket event handlers
  handleWebSocketMessage: (event: any) => {
    switch (event.type) {
      case 'message.ack':
        // Message was acknowledged by server
        get().updatePendingMessageStatus(event.client_nonce, 'sent');
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
          set({
            messages: {
              ...messages,
              [conversationId]: [...existingMessages, event]
            }
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
      const { currentConversationId } = get();
      if (currentConversationId) {
        get().setCurrentConversation(currentConversationId);
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
}));