/**
 * ChatScreen Component
 * 聊天畫面 - 完整的聊天功能，整合 WebSocket 和狀態管理
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
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
import { GameModal } from '../game/GameModal';
import { WebSocketConnectionState } from '@/services/websocket/types';

type MessageItem = Message | (PendingMessage & { isPending: true }) | GameInviteMessageData;

export const ChatScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = parseInt(id || '0');

  const flatListRef = useRef<FlatList>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    const timeA = 'sent_at' in a ? a.sent_at : a.created_at;
    const timeB = 'sent_at' in b ? b.sent_at : b.created_at;
    return new Date(timeA).getTime() - new Date(timeB).getTime();
  });

  // Initialize Echo service and load data
  useEffect(() => {
    const initialize = async () => {
      if (!token) {
        Alert.alert('錯誤', '請先登入');
        router.back();
        return;
      }

      try {
        // Initialize Echo service if not already initialized
        if (!echoService.isConnected()) {
          await initializeEcho(token);
        }

        // Load conversations if not loaded
        if (conversations.length === 0) {
          await loadConversations();
        }

        // Set current conversation
        setCurrentConversation(conversationId);

        // Load messages for current conversation
        await loadMessages(conversationId);

        // Mark conversation as read
        if (currentConversation && currentConversation.unread_count > 0) {
          await markAsRead(conversationId);
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        Alert.alert('錯誤', '無法連接聊天服務');
      }
    };

    initialize();

    // Cleanup function
    return () => {
      if (currentConversationId === conversationId) {
        setCurrentConversation(null);
      }
    };
  }, [conversationId, token]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (allMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [allMessages.length]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (content: string) => {
    try {
      await sendMessage(conversationId, content);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('發送失敗', '訊息發送失敗，請重試');
    }
  }, [conversationId, sendMessage]);

  // Handle message retry
  const handleRetryMessage = useCallback(async (clientNonce: string) => {
    try {
      await retryMessage(conversationId, clientNonce);
    } catch (error) {
      console.error('Failed to retry message:', error);
      Alert.alert('重試失敗', '無法重新發送訊息');
    }
  }, [conversationId, retryMessage]);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadMessages(conversationId, 1);
    } finally {
      setRefreshing(false);
    }
  }, [conversationId, loadMessages]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.back();
  }, []);

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
        {
          text: '離開對話',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '確認離開',
              '確定要離開這個對話嗎？',
              [
                { text: '取消', style: 'cancel' },
                { text: '離開', style: 'destructive', onPress: handleBack },
              ]
            );
          },
        },
      ]
    );
  }, [handleRefresh, handleBack, handleLaunchGame]);

  // Handle game invite actions
  const handleAcceptGameInvite = useCallback(async (gameSessionId: number) => {
    try {
      await acceptGameInvitation(gameSessionId.toString());
      Alert.alert('邀請已接受', '遊戲即將開始！');
    } catch (error) {
      Alert.alert('錯誤', '無法接受遊戲邀請，請稍後再試');
    }
  }, [acceptGameInvitation]);

  const handleDeclineGameInvite = useCallback(async (gameSessionId: number) => {
    try {
      await declineGameInvitation(gameSessionId.toString());
    } catch (error) {
      Alert.alert('錯誤', '無法拒絕遊戲邀請');
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
          currentUserId={user?.id}
          testID={`game-invite-${gameInviteItem.id}`}
        />
      );
    }

    // Handle regular messages and pending messages
    const isFromCurrentUser = 'sender_id' in item
      ? item.sender_id === user?.id
      : true; // Pending messages are always from current user

    const handlePress = () => {
      if ('isPending' in item && item.status === 'failed') {
        Alert.alert(
          '發送失敗',
          '訊息發送失敗，要重新發送嗎？',
          [
            { text: '取消', style: 'cancel' },
            {
              text: '重試',
              onPress: () => handleRetryMessage(item.client_nonce)
            },
          ]
        );
      }
    };

    return (
      <TouchableOpacity onPress={handlePress} disabled={!('isPending' in item && item.status === 'failed')}>
        <MessageBubble
          message={item as Message | (PendingMessage & { isPending: true })}
          isFromCurrentUser={isFromCurrentUser}
          testID={`message-${('id' in item ? item.id : item.client_nonce)}`}
        />
      </TouchableOpacity>
    );
  }, [user?.id, handleRetryMessage, handleAcceptGameInvite, handleDeclineGameInvite]);

  // Loading state
  if (isLoadingMessages[conversationId] && allMessages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>載入對話中...</Text>
      </View>
    );
  }

  // Error state
  if (messagesError[conversationId]) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{messagesError[conversationId]}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadMessages(conversationId)}
        >
          <Text style={styles.retryButtonText}>重試</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get participant info
  const participant = currentConversation?.participants.find(p => p.id !== user?.id);

  return (
    <View style={styles.container} testID="chat-screen">
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
      <ConnectionIndicator connectionState={connectionState} />

      {/* Messages list */}
      <FlatList
        ref={flatListRef}
        style={styles.messagesList}
        data={allMessages}
        keyExtractor={(item) => ('id' in item ? item.id?.toString() : item.client_nonce) || Math.random().toString()}
        renderItem={renderMessage}
        contentContainerStyle={[
          styles.messagesContent,
          allMessages.length === 0 && styles.emptyMessages
        ]}
        testID="messages-list"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            testID="messages-refresh"
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
            userName={participant?.profile?.display_name || participant?.name}
            userAvatarUrl={participant?.profile?.primary_photo_url}
          />
        }
      />

      {/* Message input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={connectionState !== WebSocketConnectionState.CONNECTED}
        testID="message-input"
      />

      {/* Game Modal */}
      <GameModal
        conversationId={conversationId}
        opponentName={participant?.profile?.display_name || participant?.name}
        opponentAvatarUrl={participant?.profile?.primary_photo_url}
        testID="chat-game-modal"
      />
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
});

export default ChatScreen;