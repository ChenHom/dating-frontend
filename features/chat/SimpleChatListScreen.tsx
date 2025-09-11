/**
 * Simple Chat List Screen for E2E Testing
 * 簡化的聊天列表頁面用於端對端測試
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

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

export const SimpleChatListScreen: React.FC = () => {
  const [conversations, setConversations] = useState(mockConversations);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleConversationPress = (conversation: MockConversation) => {
    // Mark as read
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversation.id 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
    
    // Navigate to conversation
    router.push(`/chat/${conversation.id}`);
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#4CAF50';
      case 'connecting':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Online';
      case 'connecting':
        return 'Connecting...';
      default:
        return 'Offline';
    }
  };

  const renderConversationItem = ({ item }: { item: MockConversation }) => {
    return (
      <TouchableOpacity
        testID={`conversation-item-${item.id}`}
        style={[
          styles.conversationItem,
          item.unreadCount > 0 && styles.unreadConversationItem
        ]}
        onPress={() => handleConversationPress(item)}
      >
        <View style={styles.avatarContainer}>
          {item.participant.photoUrl ? (
            <Image 
              source={{ uri: item.participant.photoUrl }} 
              style={styles.avatar}
              testID={`avatar-${item.id}`}
            />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]} testID={`avatar-${item.id}`}>
              <Text style={styles.defaultAvatarText}>
                {item.participant.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge} testID={`unread-badge-${item.id}`}>
              <Text style={styles.unreadBadgeText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount.toString()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text 
              style={[
                styles.participantName,
                item.unreadCount > 0 && styles.unreadText
              ]}
              testID={`participant-name-${item.id}`}
            >
              {item.participant.name}
            </Text>
            <Text style={styles.messageTime} testID={`message-time-${item.id}`}>
              {dayjs(item.lastMessage.sentAt).fromNow()}
            </Text>
          </View>
          
          <Text 
            style={[
              styles.lastMessage,
              item.unreadCount > 0 && styles.unreadText
            ]}
            numberOfLines={1}
            testID={`last-message-${item.id}`}
          >
            {item.lastMessage.isFromMe ? 'You: ' : ''}{item.lastMessage.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState} testID="empty-chat-state">
      <Text style={styles.emptyStateTitle}>No conversations yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Start matching with people to begin chatting!
      </Text>
    </View>
  );

  return (
    <View style={styles.container} testID="chat-list-container">
      {/* Header */}
      <View style={styles.header} testID="chat-header">
        <Text style={styles.headerTitle} testID="chat-title">Chat</Text>
        
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

      {/* Settings/New Chat Button */}
      <TouchableOpacity 
        style={styles.newChatButton}
        testID="new-chat-button"
        onPress={() => router.push('/(tabs)/feed')}
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

export default SimpleChatListScreen;