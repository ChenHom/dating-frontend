/**
 * Chat List Screen
 * 聊天列表頁面 - 顯示所有對話
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { WebSocketConnectionState } from '@/services/websocket/types';
import type { Conversation } from '@/stores/chat';

dayjs.extend(relativeTime);

// 開發測試用的環境變數
const USE_MOCK_DATA = process.env.EXPO_PUBLIC_USE_MOCK_CHAT === 'true';

interface MockConversation {
  id: number;
  participant: {
    name: string;
    photoUrl?: string;
  };
  lastMessage: {
    content: string;
    sentAt: string;
    isFromMe: boolean;
  };
  unreadCount: number;
}

const mockConversations: MockConversation[] = [
  {
    id: 1,
    participant: {
      name: 'Sarah Chen',
      photoUrl: 'https://via.placeholder.com/50x50/e91e63/ffffff?text=S'
    },
    lastMessage: {
      content: 'Hey! How was your weekend?',
      sentAt: '2024-01-15T14:30:00Z',
      isFromMe: false
    },
    unreadCount: 2
  },
  {
    id: 2,
    participant: {
      name: 'Alex Johnson',
      photoUrl: 'https://via.placeholder.com/50x50/2196f3/ffffff?text=A'
    },
    lastMessage: {
      content: 'Thanks for the coffee recommendation!',
      sentAt: '2024-01-15T12:15:00Z',
      isFromMe: true
    },
    unreadCount: 0
  },
  {
    id: 3,
    participant: {
      name: 'Emma Wilson',
      photoUrl: 'https://via.placeholder.com/50x50/4caf50/ffffff?text=E'
    },
    lastMessage: {
      content: 'Would love to go hiking sometime!',
      sentAt: '2024-01-14T18:45:00Z',
      isFromMe: false
    },
    unreadCount: 1
  },
  {
    id: 4,
    participant: {
      name: 'Michael Brown'
    },
    lastMessage: {
      content: 'Nice meeting you! Looking forward to our date.',
      sentAt: '2024-01-13T20:30:00Z',
      isFromMe: true
    },
    unreadCount: 0
  }
];

export const ChatListScreen: React.FC = () => {
  // Store hooks
  const {
    conversations: storeConversations,
    isLoadingConversations,
    conversationsError,
    loadConversations,
    connectionState,
    totalUnreadCount: storeTotalUnreadCount,
  } = useChatStore();
  const { token } = useAuthStore();

  // Local state for mock data (development/testing)
  const [mockConversationsState, setMockConversationsState] = useState(mockConversations);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 根據環境決定使用真實資料還是假資料
  const conversations = USE_MOCK_DATA ? mockConversationsState : storeConversations;
  const isLoading = USE_MOCK_DATA ? false : isLoadingConversations;
  const error = USE_MOCK_DATA ? null : conversationsError;

  // 計算未讀數量
  const totalUnreadCount = USE_MOCK_DATA
    ? mockConversationsState.reduce((sum, conv) => sum + conv.unreadCount, 0)
    : storeTotalUnreadCount;

  // 載入真實對話資料
  useEffect(() => {
    if (!USE_MOCK_DATA && token) {
      loadConversations(token);
    }
  }, [token, loadConversations]);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    if (USE_MOCK_DATA) {
      // 模擬延遲
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    } else if (token) {
      // 載入真實資料
      await loadConversations(token);
      setIsRefreshing(false);
    } else {
      setIsRefreshing(false);
    }
  };

  const handleConversationPress = (conversation: MockConversation | any) => {
    if (USE_MOCK_DATA) {
      // Mock data: 更新本地狀態
      setMockConversationsState(prev =>
        prev.map(conv =>
          conv.id === conversation.id
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    }

    // Navigate to conversation
    router.push(`/chat/${conversation.id}`);
  };

  const getConnectionStatusColor = () => {
    if (USE_MOCK_DATA) {
      return '#4CAF50'; // Mock data always shows connected
    }
    switch (connectionState) {
      case WebSocketConnectionState.CONNECTED:
        return '#4CAF50';
      case WebSocketConnectionState.CONNECTING:
      case WebSocketConnectionState.RECONNECTING:
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getConnectionStatusText = () => {
    if (USE_MOCK_DATA) {
      return 'Online (Mock)';
    }
    switch (connectionState) {
      case WebSocketConnectionState.CONNECTED:
        return '已連線';
      case WebSocketConnectionState.CONNECTING:
        return '連線中...';
      case WebSocketConnectionState.RECONNECTING:
        return '重新連線中...';
      default:
        return '離線';
    }
  };

  const renderConversationItem = ({ item }: { item: MockConversation | Conversation }) => {
    // 判斷是 Mock 資料還是真實資料
    const isMockData = 'participant' in item;

    // 統一資料格式
    const participantName = isMockData
      ? (item as MockConversation).participant.name
      : (item as Conversation).participants?.[0]?.profile?.display_name || (item as Conversation).participants?.[0]?.name || 'Unknown';

    const photoUrl = isMockData
      ? (item as MockConversation).participant.photoUrl
      : (item as Conversation).participants?.[0]?.profile?.primary_photo_url;

    const unreadCount = isMockData
      ? (item as MockConversation).unreadCount
      : (item as Conversation).unread_count || 0;

    const lastMessageContent = isMockData
      ? (item as MockConversation).lastMessage.content
      : (item as Conversation).last_message?.content || '';

    const lastMessageTime = isMockData
      ? (item as MockConversation).lastMessage.sentAt
      : (item as Conversation).last_message?.created_at || (item as Conversation).updated_at;

    const isFromMe = isMockData
      ? (item as MockConversation).lastMessage.isFromMe
      : false; // 後端資料不包含此資訊，需要根據 sender_id 判斷

    return (
      <TouchableOpacity
        testID={`conversation-item-${item.id}`}
        style={[
          styles.conversationItem,
          unreadCount > 0 && styles.unreadConversationItem
        ]}
        onPress={() => handleConversationPress(item)}
      >
        <View style={styles.avatarContainer}>
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.avatar}
              testID={`avatar-${item.id}`}
            />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]} testID={`avatar-${item.id}`}>
              <Text style={styles.defaultAvatarText}>
                {participantName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {unreadCount > 0 && (
            <View style={styles.unreadBadge} testID={`unread-badge-${item.id}`}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount.toString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.participantName,
                unreadCount > 0 && styles.unreadText
              ]}
              testID={`participant-name-${item.id}`}
            >
              {participantName}
            </Text>
            <Text style={styles.messageTime} testID={`message-time-${item.id}`}>
              {dayjs(lastMessageTime).fromNow()}
            </Text>
          </View>

          <Text
            style={[
              styles.lastMessage,
              unreadCount > 0 && styles.unreadText
            ]}
            numberOfLines={1}
            testID={`last-message-${item.id}`}
          >
            {isFromMe ? '你: ' : ''}{lastMessageContent}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState} testID="empty-chat-state">
      <Text style={styles.emptyStateIcon}>💬</Text>
      <Text style={styles.emptyStateTitle}>還沒有對話</Text>
      <Text style={styles.emptyStateSubtitle}>
        與你配對成功的人會出現在這裡
      </Text>
      <TouchableOpacity
        style={styles.emptyStateCTA}
        onPress={() => router.push('/(tabs)/discover')}
        testID="go-to-discover-button"
      >
        <Text style={styles.emptyStateCTAText}>開始配對 ✨</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.emptyState} testID="loading-chat-state">
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={styles.emptyStateSubtitle}>載入對話中...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyState} testID="error-chat-state">
      <Text style={styles.emptyStateIcon}>⚠️</Text>
      <Text style={styles.emptyStateTitle}>載入失敗</Text>
      <Text style={styles.emptyStateSubtitle}>
        {error || '無法載入對話列表'}
      </Text>
      <Text style={styles.errorHint}>
        請檢查網路連線或稍後再試
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => token && loadConversations(token)}
        testID="retry-button"
      >
        <Text style={styles.retryButtonText}>重新載入</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container} testID="chat-list-container">
      {/* Header */}
      <View style={styles.header} testID="chat-header">
        <Text style={styles.headerTitle} testID="chat-title">訊息</Text>

        {totalUnreadCount > 0 && (
          <View style={styles.totalUnreadBadge} testID="total-unread-badge">
            <Text style={styles.totalUnreadText}>
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount.toString()}
            </Text>
          </View>
        )}

        <View style={styles.connectionStatus} testID="connection-status">
          <View
            style={[
              styles.connectionIndicator,
              { backgroundColor: getConnectionStatusColor() }
            ]}
            testID="connection-indicator"
          />
          <Text style={styles.connectionText} testID="connection-text">
            {getConnectionStatusText()}
          </Text>
        </View>
      </View>

      {/* Content */}
      {isLoading && conversations.length === 0 ? (
        renderLoadingState()
      ) : error && conversations.length === 0 ? (
        renderErrorState()
      ) : (
        <FlatList
          testID="conversations-list"
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderConversationItem}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#2196F3']}
              tintColor="#2196F3"
              testID="refresh-control"
            />
          }
          contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : undefined}
        />
      )}

      {/* Settings/New Chat Button */}
      <TouchableOpacity
        style={styles.newChatButton}
        testID="new-chat-button"
        onPress={() => router.push('/(tabs)/discover')}
      >
        <Text style={styles.newChatButtonText}>💬</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  totalUnreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginRight: 12,
  },
  totalUnreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    color: '#6b7280',
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  unreadConversationItem: {
    backgroundColor: '#f0f9ff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  messageTime: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  unreadText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateCTA: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateCTAText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  newChatButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  newChatButtonText: {
    fontSize: 24,
    color: '#ffffff',
  },
});

export default ChatListScreen;
