/**
 * ChatScreen Component
 * 聊天畫面 - 完整的聊天功能，整合 WebSocket 和狀態管理
 */

import React, { useEffect, useRef, useCallback, useState, lazy, Suspense } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ListRenderItem,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore, Message, PendingMessage } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { MessageBubble } from './components/MessageBubble';
import { MessageInput } from './components/MessageInput';
import { TypingIndicator } from './components/TypingIndicator';
import { ConnectionIndicator } from './components/ConnectionIndicator';
import { GameInviteMessage, GameInviteMessageData } from './components/GameInviteMessage';
import { GameButton } from '../game/components/GameButton';
import { WebSocketConnectionState } from '@/services/websocket/types';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// 細分的動態導入 - 只在需要時加載
const GameModal = lazy(() => import('../game/GameModal'));

const GiftManager = lazy(() => import('../gifts/GiftManager'));

// 遊戲相關組件的 fallback
const GameModalFallback = () => (
  <View style={styles.modalFallback}>
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text style={styles.fallbackText}>載入遊戲中...</Text>
  </View>
);

const GiftManagerFallback = () => (
  <View style={styles.inlineFallback}>
    <ActivityIndicator size="small" color="#f59e0b" />
  </View>
);

type MessageItem = Message | (PendingMessage & { isPending: true }) | GameInviteMessageData;

export const ChatScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = parseInt(id || '0');

  const flatListRef = useRef<FlatList>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showGiftManager, setShowGiftManager] = useState(false);

  // Store hooks
  const {
    conversations,
    messages,
    pendingMessages,
    connectionState,
    currentConversationId,
    isLoadingMessages,
    messagesError,
    echoService,
    initializeEcho,
    loadConversations,
    loadMessages,
    setCurrentConversation,
    sendMessage,
    markAsRead,
    retryMessage,
  } = useChatStore();

  const { user, token } = useAuthStore();

  const { showGameModal, sendGameInvite, acceptGameInvitation, declineGameInvitation } = useGameStore();

  // Get current conversation and messages
  const currentConversation = conversations.find(conv => conv.id === conversationId);
  const conversationMessages = messages[conversationId] || [];
  const conversationPendingMessages = pendingMessages[conversationId] || [];

  // Combine messages and pending messages
  const allMessages: MessageItem[] = [
    ...conversationMessages,
    ...conversationPendingMessages.map(pending => ({ ...pending, isPending: true as const }))
  ].sort((a, b) => {
    const getTime = (item: MessageItem) => {
      if ('sent_at' in item) return item.sent_at;
      if ('created_at' in item) return item.created_at;
      return new Date().toISOString();
    };
    return new Date(getTime(a)).getTime() - new Date(getTime(b)).getTime();
  });

  // Initialize Echo service and load data
  useEffect(() => {
    const initialize = async () => {
      if (!token) {
        console.log('No token available for Echo initialization');
        return;
      }

      try {
        await initializeEcho(token);
        await loadConversations(token);
        await loadMessages(conversationId, 1, token);
        setCurrentConversation(conversationId);

        // Mark messages as read when entering chat
        markAsRead(conversationId, token);

        // Scroll to bottom after initial load
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 300);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      }
    };

    initialize();
  }, [conversationId, token, initializeEcho, loadConversations, loadMessages, setCurrentConversation, markAsRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (allMessages.length > 0) {
      // 使用短延遲確保 FlatList 已渲染
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [allMessages]);

  // Handle message sending
  const handleSendMessage = useCallback(async (content: string) => {
    if (!user?.id || !content.trim() || !token) return;

    try {
      await sendMessage(conversationId, content, token);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('發送失敗', '訊息發送失敗，請檢查網路連線後重試');
    }
  }, [user?.id, conversationId, sendMessage, token]);

  // Handle message retry
  const handleRetryMessage = useCallback((message: PendingMessage) => {
    if (!token) return;
    retryMessage(conversationId, message.client_nonce, token);
  }, [conversationId, retryMessage, token]);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      await loadMessages(conversationId, 1, token);
    } finally {
      setRefreshing(false);
    }
  }, [conversationId, loadMessages, token]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.push('/(tabs)/chat');
  }, [])

  // Handle game launch (send invite)
  const handleLaunchGame = useCallback(async () => {
    try {
      // Get participant info
      const participant = currentConversation?.participants.find(p => p.id !== user?.id);
      if (!participant) {
        Alert.alert('錯誤', '找不到對話參與者');
        return;
      }

      // Send game invitation
      await sendGameInvite(conversationId, participant.id);
      Alert.alert('邀請已發送', `已向 ${participant.profile?.display_name || participant.name} 發送遊戲邀請`);

    } catch (error) {
      Alert.alert('錯誤', '無法發送遊戲邀請，請稍後再試');
    }
  }, [conversationId, currentConversation, user?.id, sendGameInvite]);

  // Handle conversation actions menu
  const handleShowMenu = useCallback(() => {
    Alert.alert(
      '對話選項',
      '選擇要執行的動作',
      [
        { text: '取消', style: 'cancel' },
        { text: '重新整理', onPress: handleRefresh },
        { text: '開始遊戲', onPress: handleLaunchGame },
        { text: '送禮物', onPress: () => setShowGiftManager(true) },
        {
          text: '離開對話',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '確認離開',
              '確定要離開這個對話嗎？',
              [
                { text: '取消', style: 'cancel' },
                { text: '確認離開', style: 'destructive', onPress: handleBack }
              ]
            );
          }
        }
      ]
    );
  }, [handleRefresh, handleLaunchGame, handleBack]);

  // Handle game invite acceptance
  const handleAcceptGameInvite = useCallback(async (gameSessionId: number) => {
    try {
      await acceptGameInvitation(gameSessionId);
    } catch (error) {
      Alert.alert('錯誤', '無法接受遊戲邀請，請稍後再試');
    }
  }, [acceptGameInvitation]);

  // Handle game invite decline
  const handleDeclineGameInvite = useCallback(async (gameSessionId: number) => {
    try {
      await declineGameInvitation(gameSessionId);
    } catch (error) {
      Alert.alert('錯誤', '無法拒絕遊戲邀請，請稍後再試');
    }
  }, [declineGameInvitation]);

  // Render message item
  const renderMessage: ListRenderItem<MessageItem> = useCallback(({ item }) => {
    // Check if this is a game invite message
    if ('type' in item && item.type === 'game_invite') {
      const gameInviteItem = item as GameInviteMessageData;
      const isFromCurrentUser = gameInviteItem.sender_id === user?.id;

      return (
        <GameInviteMessage
          message={gameInviteItem}
          isFromCurrentUser={isFromCurrentUser}
          onAccept={handleAcceptGameInvite}
          onDecline={handleDeclineGameInvite}
          currentUserId={user?.id || 0}
          testID={`game-invite-${gameInviteItem.id}`}
        />
      );
    }

    // Handle regular messages and pending messages
    // Check isPending first, as pending messages are always from current user
    const isFromCurrentUser = 'isPending' in item && item.isPending
      ? true
      : ('sender_id' in item ? item.sender_id === user?.id : false);    const handlePress = () => {
      if ('isPending' in item && item.status === 'failed') {
        handleRetryMessage(item);
      }
    };

    return (
      <MessageBubble
        message={item as Message}
        isFromCurrentUser={isFromCurrentUser}
        onPress={handlePress}
        isPending={'isPending' in item}
        isFailure={'isPending' in item && item.status === 'failed'}
        testID={`message-${item.id || 'pending'}`}
      />
    );
  }, [user?.id, handleAcceptGameInvite, handleDeclineGameInvite, handleRetryMessage]);

  // Get participant info for header
  const participant = currentConversation?.participants.find(p => p.id !== user?.id);

  // Loading state
  if (isLoadingMessages && allMessages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>載入對話中...</Text>
      </View>
    );
  }

  // Error state
  if (messagesError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{messagesError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>重試</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          {participant?.profile?.primary_photo_url && (
            <Image
              source={{ uri: participant.profile.primary_photo_url }}
              style={styles.headerAvatar}
              testID="participant-avatar"
            />
          )}
          <Text style={styles.headerName} testID="participant-name">
            {participant?.profile?.display_name || participant?.name || '未知用戶'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.gameButton}
            onPress={handleLaunchGame}
            testID="game-launch-button"
          >
            <Text style={styles.gameButtonText}>🎮</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleShowMenu}
            testID="menu-button"
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Connection indicator */}
      <ConnectionIndicator
        connectionState={connectionState}
        testID="connection-indicator"
      />

      {/* Messages list */}
      <FlatList
        ref={flatListRef}
        style={styles.messagesList}
        contentContainerStyle={allMessages.length === 0 ? styles.emptyMessages : styles.messagesContent}
        data={allMessages}
        keyExtractor={(item) => `${item.id || 'pending'}-${item.client_nonce || ''}`}
        renderItem={renderMessage}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>還沒有訊息</Text>
            <Text style={styles.emptySubtext}>發送第一條訊息開始聊天吧！</Text>
          </View>
        }
        ListFooterComponent={
          <TypingIndicator
            isVisible={isTyping}
            userName={participant?.profile?.display_name || participant?.name || '對方'}
            userAvatarUrl={participant?.profile?.primary_photo_url || ''}
          />
        }
      />

      {/* Message input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={connectionState !== WebSocketConnectionState.CONNECTED}
        testID="message-input"
      />

      {/* 禮物管理器 - 懶加載 */}
      {showGiftManager && (
        <ErrorBoundary fallback={<GiftManagerFallback />}>
          <Suspense fallback={<GiftManagerFallback />}>
            <GiftManager
              conversationId={conversationId}
              receiverId={participant?.id || 0}
              receiverName={participant?.profile?.display_name || participant?.name || '對方'}
              onGiftSent={() => setShowGiftManager(false)}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Game Modal - 懶加載 */}
      <ErrorBoundary fallback={<GameModalFallback />}>
        <Suspense fallback={<GameModalFallback />}>
          <GameModal
            conversationId={conversationId}
            opponentName={participant?.profile?.display_name || participant?.name || '對方'}
            opponentAvatarUrl={participant?.profile?.primary_photo_url || ''}
            testID="chat-game-modal"
          />
        </Suspense>
      </ErrorBoundary>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gameButton: {
    padding: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameButtonText: {
    fontSize: 16,
  },
  menuButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  emptyMessages: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#9ca3af',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Fallback styles for lazy loading
  modalFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fallbackText: {
    marginTop: 12,
    color: '#ffffff',
    fontSize: 16,
  },
  inlineFallback: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatScreen;