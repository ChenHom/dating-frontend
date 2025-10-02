/**
 * Simple Conversation Screen for E2E Testing
 * 簡化的對話頁面用於端對端測試
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActionSheetIOS,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import dayjs from 'dayjs';

import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { WebSocketConnectionState } from '@/services/websocket/types';
import {
  blockConversationUser,
  reportConversationUser,
  muteConversation,
  deleteConversation,
} from '@/services/api/conversations';

// 型別定義
type RenderableMessage = {
  key: string;
  id: string;
  content: string;
  sentAt: string;
  isFromMe: boolean;
  status?: 'sending' | 'sent' | 'failed' | undefined;
  avatarUrl?: string | undefined;
  isPending: boolean;
};

type ConversationOption = {
  key: string;
  label: string;
  isDestructive?: boolean;
};

const CONNECTION_STATE_LABEL: Record<WebSocketConnectionState, string> = {
  [WebSocketConnectionState.CONNECTED]: '已連線',
  [WebSocketConnectionState.CONNECTING]: '連線中',
  [WebSocketConnectionState.DISCONNECTED]: '未連線',
  [WebSocketConnectionState.RECONNECTING]: '重新連線',
  [WebSocketConnectionState.ERROR]: '連線錯誤',
};

const MORE_OPTIONS: ConversationOption[] = [
  { key: 'game', label: '啟動遊戲' },
  { key: 'mute', label: '靜音此對話' },
  { key: 'block', label: '封鎖此用戶' },
  { key: 'report', label: '檢舉內容' },
  { key: 'delete', label: '刪除對話', isDestructive: true },
];

export const SimpleConversationScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const rawId = Array.isArray(id) ? id[0] : id;

  const chatStore = useChatStore();
  const {
    conversations,
    messages: messageMap,
    pendingMessages: pendingMessageMap,
    loadMessages,
    setCurrentConversation,
    subscribeToConversation,
    unsubscribeFromConversation,
    sendMessage,
    markAsRead,
    connectionState,
    isLoadingMessages,
    messagesError,
  } = chatStore;
  const { user } = useAuthStore();

  const resolvedConversationId = useMemo(() => {
    if (rawId) {
      const parsed = Number(rawId);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return conversations[0]?.id ?? null;
  }, [rawId, conversations]);

  const [draft, setDraft] = useState('');
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const flatListRef = useRef<FlatList<RenderableMessage>>(null);

  const { sendGameInvite, showGameModal, isCreatingGame } = useGameStore();

  // 初始化對話
  useEffect(() => {
    if (!resolvedConversationId) {
      return;
    }

    setCurrentConversation(resolvedConversationId);
    loadMessages(resolvedConversationId, 1);
    subscribeToConversation(resolvedConversationId);
    markAsRead(resolvedConversationId);

    return () => {
      unsubscribeFromConversation(resolvedConversationId);
    };
  }, [
    resolvedConversationId,
    setCurrentConversation,
    loadMessages,
    subscribeToConversation,
    unsubscribeFromConversation,
    markAsRead,
  ]);

  // 取得對話資訊
  const conversation = useMemo(() => {
    if (!resolvedConversationId) {
      return undefined;
    }
    return conversations.find(conv => conv.id === resolvedConversationId);
  }, [resolvedConversationId, conversations]);

  // 取得對方參與者
  const otherParticipant = useMemo(() => {
    if (!conversation) {
      return undefined;
    }

    const participants = conversation.participants ?? [];
    if (!participants.length) {
      return undefined;
    }

    if (!user) {
      return participants[0];
    }

    return participants.find(participant => participant.id !== user.id) ?? participants[0];
  }, [conversation, user]);

  // 合併真實訊息與待發送訊息
  const combinedMessages = useMemo<RenderableMessage[]>(() => {
    if (!resolvedConversationId) {
      return [];
    }

    const realMessages: RenderableMessage[] = (messageMap[resolvedConversationId] ?? []).map(
      message => ({
        key: `message-${message.id}`,
        id: String(message.id),
        content: message.content,
        sentAt: message.sent_at ?? message.created_at,
        isFromMe: user ? message.sender_id === user.id : false,
        status: undefined,
        avatarUrl: message.sender?.profile?.primary_photo_url,
        isPending: false,
      })
    );

    const pending: RenderableMessage[] = (pendingMessageMap[resolvedConversationId] ?? []).map(
      pendingMessage => ({
        key: `pending-${pendingMessage.client_nonce}`,
        id: pendingMessage.client_nonce,
        content: pendingMessage.content,
        sentAt: pendingMessage.sent_at,
        isFromMe: true,
        status: pendingMessage.status,
        avatarUrl: undefined,
        isPending: true,
      })
    );

    return [...realMessages, ...pending];
  }, [resolvedConversationId, messageMap, pendingMessageMap, user]);

  const messageCount = combinedMessages.length;

  // 自動捲動到底部
  useEffect(() => {
    if (messageCount === 0) {
      return;
    }

    const timeout = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 0);

    return () => clearTimeout(timeout);
  }, [messageCount]);

  const handleBack = () => {
    router.back();
  };

  const handleSend = () => {
    if (!resolvedConversationId) {
      return;
    }

    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    sendMessage(resolvedConversationId, trimmed);
    setDraft('');
  };

  const handleStartGame = async () => {
    if (!resolvedConversationId || !otherParticipant?.id) {
      Alert.alert('錯誤', '無效的對話或使用者');
      return;
    }

    try {
      await sendGameInvite(resolvedConversationId, otherParticipant.id);
      showGameModal();
    } catch (error) {
      Alert.alert(
        '遊戲邀請失敗',
        error instanceof Error ? error.message : '無法發送遊戲邀請，請稍後再試'
      );
    }
  };

  const handleOptionSelect = async (optionKey: string) => {
    setIsOptionsVisible(false);

    if (isProcessingAction) {
      return;
    }

    try {
      setIsProcessingAction(true);

      switch (optionKey) {
        case 'game':
          await handleStartGame();
          break;

        case 'mute':
          if (!resolvedConversationId) {
            throw new Error('無效的對話 ID');
          }
          await muteConversation(resolvedConversationId);
          Alert.alert('成功', '已靜音此對話');
          break;

        case 'block':
          if (!otherParticipant?.id) {
            throw new Error('無效的使用者 ID');
          }
          await blockConversationUser({ target_user_id: otherParticipant.id });
          Alert.alert('成功', '已封鎖此使用者', [
            {
              text: '確定',
              onPress: () => router.back(),
            },
          ]);
          break;

        case 'report':
          if (!otherParticipant?.id) {
            throw new Error('無效的使用者 ID');
          }
          Alert.alert(
            '檢舉內容',
            '請選擇檢舉類型',
            [
              {
                text: '不當內容',
                onPress: async () => {
                  try {
                    await reportConversationUser({
                      target_user_id: otherParticipant.id,
                      type: 'ABUSE',
                    });
                    Alert.alert('成功', '已提交檢舉');
                  } catch (error) {
                    Alert.alert('錯誤', error instanceof Error ? error.message : '檢舉失敗');
                  }
                },
              },
              {
                text: '裸露內容',
                onPress: async () => {
                  try {
                    await reportConversationUser({
                      target_user_id: otherParticipant.id,
                      type: 'NUDITY',
                    });
                    Alert.alert('成功', '已提交檢舉');
                  } catch (error) {
                    Alert.alert('錯誤', error instanceof Error ? error.message : '檢舉失敗');
                  }
                },
              },
              {
                text: '垃圾訊息',
                onPress: async () => {
                  try {
                    await reportConversationUser({
                      target_user_id: otherParticipant.id,
                      type: 'SPAM',
                    });
                    Alert.alert('成功', '已提交檢舉');
                  } catch (error) {
                    Alert.alert('錯誤', error instanceof Error ? error.message : '檢舉失敗');
                  }
                },
              },
              {
                text: '其他',
                onPress: async () => {
                  try {
                    await reportConversationUser({
                      target_user_id: otherParticipant.id,
                      type: 'OTHER',
                    });
                    Alert.alert('成功', '已提交檢舉');
                  } catch (error) {
                    Alert.alert('錯誤', error instanceof Error ? error.message : '檢舉失敗');
                  }
                },
              },
              { text: '取消', style: 'cancel' },
            ],
            { cancelable: true }
          );
          break;

        case 'delete':
          if (!resolvedConversationId) {
            throw new Error('無效的對話 ID');
          }
          Alert.alert(
            '確認刪除',
            '確定要刪除此對話嗎？此操作無法復原。',
            [
              {
                text: '取消',
                style: 'cancel',
              },
              {
                text: '刪除',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await deleteConversation(resolvedConversationId);
                    Alert.alert('成功', '已刪除對話', [
                      {
                        text: '確定',
                        onPress: () => router.back(),
                      },
                    ]);
                  } catch (error) {
                    Alert.alert('錯誤', error instanceof Error ? error.message : '刪除失敗');
                  }
                },
              },
            ],
            { cancelable: true }
          );
          break;

        default:
          Alert.alert('提示', '此功能尚未實作');
      }
    } catch (error) {
      Alert.alert('錯誤', error instanceof Error ? error.message : '操作失敗，請稍後再試');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleCloseOptions = () => {
    setIsOptionsVisible(false);
  };

  const handleMoreOptions = () => {
    const optionEntries = [...MORE_OPTIONS];
    const optionLabels = optionEntries.map(option => option.label);
    const destructiveIndex = optionEntries.findIndex(option => option.isDestructive);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...optionLabels, '取消'],
          cancelButtonIndex: optionLabels.length,
          destructiveButtonIndex: destructiveIndex >= 0 ? destructiveIndex : undefined,
          title: '更多操作',
        },
        selectedIndex => {
          if (selectedIndex === optionLabels.length) {
            return;
          }
          const selected = optionEntries[selectedIndex];
          if (selected) {
            handleOptionSelect(selected.key);
          }
        }
      );
      return;
    }

    setIsOptionsVisible(true);
  };

  const renderMessage = ({ item }: { item: RenderableMessage }) => {
    const isFromMe = item.isFromMe;
    const displayAvatar =
      !isFromMe && (item.avatarUrl || otherParticipant?.profile?.primary_photo_url);
    const formattedTime = item.sentAt ? dayjs(item.sentAt).format('HH:mm') : '--:--';

    return (
      <View
        style={[
          styles.messageContainer,
          isFromMe ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
        testID={`message-${item.key}`}
      >
        {!isFromMe && displayAvatar && (
          <Image
            source={{ uri: displayAvatar }}
            style={styles.messageAvatar}
            testID={`message-avatar-${item.id}`}
          />
        )}

        <View
          style={[
            styles.messageBubble,
            isFromMe ? styles.myMessageBubble : styles.theirMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isFromMe ? styles.myMessageText : styles.theirMessageText,
            ]}
            testID={`message-text-${item.id}`}
          >
            {item.content}
          </Text>

          <Text
            style={[
              styles.messageTime,
              isFromMe ? styles.myMessageTime : styles.theirMessageTime,
            ]}
            testID={`message-time-${item.id}`}
          >
            {formattedTime}
            {isFromMe && item.status && (
              <Text style={styles.messageStatus}>
                {item.status === 'sending' && ' ⏳'}
                {item.status === 'sent' && ' ✓'}
                {item.status === 'failed' && ' ❌'}
              </Text>
            )}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState} testID='empty-state'>
      <Text style={styles.emptyStateTitle}>還沒有任何訊息</Text>
      <Text style={styles.emptyStateBody}>發送第一則訊息開始聊天吧！</Text>
    </View>
  );

  const isLoading = resolvedConversationId
    ? Boolean(isLoadingMessages[resolvedConversationId])
    : false;
  const errorMessage = resolvedConversationId ? messagesError[resolvedConversationId] : null;

  const participantName =
    otherParticipant?.profile?.display_name ?? otherParticipant?.name ?? '未知使用者';
  const participantAvatar = otherParticipant?.profile?.primary_photo_url;

  const sendDisabled = !draft.trim() || !resolvedConversationId;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      testID='conversation-container'
    >
      <View style={styles.header} testID='conversation-header'>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} testID='back-button'>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          {participantAvatar ? (
            <Image
              source={{ uri: participantAvatar }}
              style={styles.headerAvatar}
              testID='header-avatar'
            />
          ) : (
            <View style={styles.headerAvatarPlaceholder} testID='header-avatar-placeholder'>
              <Text style={styles.headerAvatarPlaceholderText}>{participantName.charAt(0)}</Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName} testID='participant-name'>
              {participantName}
            </Text>
            <Text
              style={[
                styles.connectionBadge,
                connectionState === WebSocketConnectionState.CONNECTED &&
                  styles.connectionBadgeConnected,
                connectionState !== WebSocketConnectionState.CONNECTED &&
                  styles.connectionBadgeDisconnected,
              ]}
              testID='connection-state'
            >
              {CONNECTION_STATE_LABEL[connectionState]}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={handleMoreOptions}
          testID='more-options-button'
        >
          <Text style={styles.moreButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {errorMessage && (
        <View style={styles.errorBanner} testID='messages-error'>
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={combinedMessages}
        renderItem={renderMessage}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      />

      {isLoading && (
        <View style={styles.loadingOverlay} testID='messages-loading'>
          <ActivityIndicator size='small' color='#7c3aed' />
        </View>
      )}

      <View style={styles.inputContainer} testID='input-container'>
        <TextInput
          style={styles.messageInput}
          placeholder='輸入訊息...'
          value={draft}
          onChangeText={setDraft}
          multiline
          testID='message-input'
        />

        <TouchableOpacity
          style={[styles.sendButton, sendDisabled && styles.sendButtonDisabled]}
          disabled={sendDisabled}
          onPress={handleSend}
          testID='send-button'
        >
          <Text style={styles.sendButtonText}>傳送</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isOptionsVisible} transparent animationType='fade'>
        <TouchableWithoutFeedback onPress={handleCloseOptions}>
          <View style={styles.optionsBackdrop}>
            <View style={styles.optionsContainer}>
              {MORE_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={styles.optionItem}
                  onPress={() => handleOptionSelect(option.key)}
                  testID={`option-${option.key}`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      option.isDestructive && styles.optionTextDestructive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.optionCancel}
                onPress={handleCloseOptions}
                testID='option-cancel'
              >
                <Text style={styles.optionCancelText}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
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
  backButtonText: {
    fontSize: 24,
    color: '#3b82f6',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  connectionBadge: {
    fontSize: 12,
    marginTop: 2,
  },
  connectionBadgeConnected: {
    color: '#10b981',
  },
  connectionBadgeDisconnected: {
    color: '#6b7280',
  },
  moreButton: {
    padding: 8,
  },
  moreButtonText: {
    fontSize: 20,
    color: '#6b7280',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#dc2626',
  },
  listContent: {
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyStateBody: {
    fontSize: 14,
    color: '#9ca3af',
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#ffffff',
  },
  theirMessageText: {
    color: '#1f2937',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: '#6b7280',
  },
  messageStatus: {
    fontSize: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  optionItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  optionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  optionTextDestructive: {
    color: '#dc2626',
  },
  optionCancel: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  optionCancelText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
});

export default SimpleConversationScreen;
