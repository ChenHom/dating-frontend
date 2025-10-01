/**
 * Simple Conversation Screen for E2E Testing
 * 簡化的對話頁面用於端對端測試
 */

import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import dayjs from 'dayjs';

interface MockMessage {
  id: number;
  content: string;
  sentAt: string;
  isFromMe: boolean;
  status?: 'sending' | 'sent' | 'failed';
}

const mockMessages: { [conversationId: string]: MockMessage[] } = {
  '1': [
    {
      id: 1,
      content: 'Hey! Nice to match with you 😊',
      sentAt: '2024-01-15T10:00:00Z',
      isFromMe: false,
    },
    {
      id: 2,
      content: 'Thanks! I loved your hiking photos',
      sentAt: '2024-01-15T10:05:00Z',
      isFromMe: true,
    },
    {
      id: 3,
      content: 'Thank you! Do you enjoy hiking too?',
      sentAt: '2024-01-15T10:10:00Z',
      isFromMe: false,
    },
    {
      id: 4,
      content: 'Yes! I go every weekend. There are some amazing trails near the city',
      sentAt: '2024-01-15T10:15:00Z',
      isFromMe: true,
    },
    {
      id: 5,
      content: 'How was your weekend?',
      sentAt: '2024-01-15T14:30:00Z',
      isFromMe: false,
    },
  ],
  '2': [
    {
      id: 1,
      content: 'Hi Alex! Great to connect',
      sentAt: '2024-01-15T09:00:00Z',
      isFromMe: true,
    },
    {
      id: 2,
      content: 'Hey there! Love your profile, especially the coffee shop photo',
      sentAt: '2024-01-15T09:15:00Z',
      isFromMe: false,
    },
    {
      id: 3,
      content: 'Thanks for the coffee recommendation!',
      sentAt: '2024-01-15T12:15:00Z',
      isFromMe: true,
    },
  ],
  '3': [
    {
      id: 1,
      content: 'Hello! 👋',
      sentAt: '2024-01-14T16:00:00Z',
      isFromMe: true,
    },
    {
      id: 2,
      content: 'Hi! Nice to meet you',
      sentAt: '2024-01-14T16:30:00Z',
      isFromMe: false,
    },
    {
      id: 3,
      content: 'Would love to go hiking sometime!',
      sentAt: '2024-01-14T18:45:00Z',
      isFromMe: false,
    },
  ],
  '4': [
    {
      id: 1,
      content: 'Hey Michael!',
      sentAt: '2024-01-13T19:00:00Z',
      isFromMe: false,
    },
    {
      id: 2,
      content: 'Nice meeting you! Looking forward to our date.',
      sentAt: '2024-01-13T20:30:00Z',
      isFromMe: true,
    },
  ],
};

const participantInfo: { [conversationId: string]: { name: string; photoUrl?: string } } = {
  '1': { name: 'Sarah Chen', photoUrl: 'https://via.placeholder.com/40x40/e91e63/ffffff?text=S' },
  '2': { name: 'Alex Johnson', photoUrl: 'https://via.placeholder.com/40x40/2196f3/ffffff?text=A' },
  '3': { name: 'Emma Wilson', photoUrl: 'https://via.placeholder.com/40x40/4caf50/ffffff?text=E' },
  '4': { name: 'Michael Brown' },
};

const GAME_ACTION = { key: 'start-game', label: '啟動剪刀石頭布' } as const;

const MORE_OPTIONS = [
  { key: 'mute', label: '靜音此對話' },
  { key: 'block', label: '封鎖此用戶' },
  { key: 'report', label: '檢舉內容' },
  { key: 'delete', label: '刪除對話', isDestructive: true },
];

export const SimpleConversationScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id || '1';

  const [messages, setMessages] = useState<MockMessage[]>(mockMessages[conversationId] || []);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const participant = participantInfo[conversationId] || { name: 'Unknown User' };

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const newMsg: MockMessage = {
      id: messages.length + 1,
      content: newMessage.trim(),
      sentAt: new Date().toISOString(),
      isFromMe: true,
      status: 'sending',
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');

    // Simulate message sending
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMsg.id
            ? { ...msg, status: 'sent' }
            : msg
        )
      );
    }, 1000);

    // Simulate typing indicator and response
    setTimeout(() => {
      setIsTyping(true);
    }, 2000);

    setTimeout(() => {
      setIsTyping(false);
      const responseMsg: MockMessage = {
        id: messages.length + 2,
        content: 'Thanks for your message! 😊',
        sentAt: new Date().toISOString(),
        isFromMe: false,
      };
      setMessages(prev => [...prev, responseMsg]);
    }, 4000);
  };

  const handleBack = () => {
    router.back();
  };

  const appendMockMessage = (content: string, isFromMe: boolean) => {
    setMessages(prev => {
      const lastId = prev[prev.length - 1]?.id ?? 0;
      const newMessage: MockMessage = {
        id: lastId + 1,
        content,
        sentAt: new Date().toISOString(),
        isFromMe,
      };
      return [...prev, newMessage];
    });
  };

  const handleStartGame = () => {
    setIsOptionsVisible(false);

    setTimeout(() => {
      Alert.alert(
        '啟動遊戲 (模擬)',
        '正式版本將在此開啟剪刀石頭布連線對戰。現在先以提示訊息取代。'
      );
    }, 200);

    setTimeout(() => {
      appendMockMessage('🎮 我想啟動剪刀石頭布小遊戲，準備好了嗎？', true);
    }, 400);

    setTimeout(() => {
      setIsTyping(true);
    }, 1000);

    setTimeout(() => {
      setIsTyping(false);
      appendMockMessage('好耶！等正式版本上線再一起玩 🙌', false);
    }, 2600);
  };

  const handleOptionSelect = (optionKey: string) => {
    if (optionKey === GAME_ACTION.key) {
      handleStartGame();
      return;
    }

    setIsOptionsVisible(false);
    const optionLabel = MORE_OPTIONS.find(option => option.key === optionKey)?.label || '此操作';
    Alert.alert(
      '功能尚未串接',
      `${optionLabel} 目前僅作為範例，實際串接 WebSocket 後端後才會生效。`,
      [{ text: '知道了' }],
      { cancelable: true }
    );
  };

  const handleMoreOptions = () => {
    if (Platform.OS === 'ios') {
      const optionEntries = [GAME_ACTION, ...MORE_OPTIONS];
      const options = [...optionEntries.map(option => option.label), '取消'];
      const destructiveButtonIndex = optionEntries.findIndex(
        option => 'isDestructive' in option && option.isDestructive
      );
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: destructiveButtonIndex >= 0 ? destructiveButtonIndex : undefined,
          title: '更多操作',
          message: '此頁面使用模擬資料，選單僅提供體驗流程。',
        },
        buttonIndex => {
          if (buttonIndex === options.length - 1) {
            return;
          }
          const selected = optionEntries[buttonIndex];
          if (selected) {
            handleOptionSelect(selected.key);
          }
        }
      );
      return;
    }
    setIsOptionsVisible(true);
  };

  const handleCloseOptions = () => {
    setIsOptionsVisible(false);
  };

  const renderMessage = ({ item }: { item: MockMessage }) => {
    return (
      <View
        style={[
          styles.messageContainer,
          item.isFromMe ? styles.myMessageContainer : styles.theirMessageContainer
        ]}
        testID={`message-${item.id}`}
      >
        {!item.isFromMe && participant.photoUrl && (
          <Image
            source={{ uri: participant.photoUrl }}
            style={styles.messageAvatar}
            testID={`message-avatar-${item.id}`}
          />
        )}

        <View
          style={[
            styles.messageBubble,
            item.isFromMe ? styles.myMessageBubble : styles.theirMessageBubble
          ]}
        >
          <Text
            style={[
              styles.messageText,
              item.isFromMe ? styles.myMessageText : styles.theirMessageText
            ]}
            testID={`message-text-${item.id}`}
          >
            {item.content}
          </Text>

          <Text
            style={[
              styles.messageTime,
              item.isFromMe ? styles.myMessageTime : styles.theirMessageTime
            ]}
            testID={`message-time-${item.id}`}
          >
            {dayjs(item.sentAt).format('HH:mm')}
            {item.isFromMe && item.status && (
              <Text style={styles.messageStatus}>
                {item.status === 'sending' ? ' ⏳' : item.status === 'sent' ? ' ✓' : ' ❌'}
              </Text>
            )}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={styles.typingContainer} testID="typing-indicator">
        <Image
          source={{ uri: participant.photoUrl || 'https://via.placeholder.com/30x30/ccc/666?text=?' }}
          style={styles.typingAvatar}
        />
        <View style={styles.typingBubble}>
          <Text style={styles.typingText}>typing...</Text>
        </View>
      </View>
    );
  };

  const renderMockNotice = () => (
    <View style={styles.mockNotice} testID="mock-notice">
      <Text style={styles.mockNoticeTitle}>目前為模擬對話</Text>
      <Text style={styles.mockNoticeBody}>
        此頁面用於體驗流程與自動化測試，訊息會在本機排程產生並未透過 WebSocket 與後端同步。
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      testID="conversation-container"
    >
      {/* Header */}
      <View style={styles.header} testID="conversation-header">
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          testID="back-button"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          {participant.photoUrl && (
            <Image
              source={{ uri: participant.photoUrl }}
              style={styles.headerAvatar}
              testID="header-avatar"
            />
          )}
          <Text style={styles.headerName} testID="participant-name">
            {participant.name}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={handleMoreOptions}
          testID="more-options-button"
        >
          <Text style={styles.moreButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        style={styles.messagesList}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContent}
        testID="messages-list"
        ListHeaderComponent={renderMockNotice}
        ListFooterComponent={renderTypingIndicator}
      />

      {/* Input */}
      <View style={styles.inputContainer} testID="message-input-container">
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
          maxLength={500}
          testID="message-input"
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            newMessage.trim() ? styles.sendButtonActive : styles.sendButtonInactive
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim()}
          testID="send-button"
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isOptionsVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseOptions}
      >
        <View style={styles.optionsModalOverlay}>
          <TouchableWithoutFeedback onPress={handleCloseOptions}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.optionsModalContainer} testID="more-options-modal">
            <View style={styles.optionsModalHandle} />
            <Text style={styles.optionsModalTitle}>更多操作</Text>
            <Text style={styles.optionsModalDescription}>
              此頁面使用模擬資料，以下操作僅示範流程。
            </Text>
            <View style={styles.gameActionCard} testID="game-action-card">
              <Text style={styles.gameActionTitle}>剪刀石頭布小遊戲</Text>
              <Text style={styles.gameActionDescription}>
                正式版本會在此開啟即時對戰。現在可以先觸發模擬流程，確認 UI 與測試腳本。
              </Text>
              <TouchableOpacity
                style={styles.startGameButton}
                onPress={handleStartGame}
                testID="start-game-button"
              >
                <Text style={styles.startGameButtonText}>啟動遊戲</Text>
              </TouchableOpacity>
            </View>
            {MORE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.key}
                style={[styles.optionsOption, option.isDestructive && styles.optionsOptionDestructive]}
                onPress={() => handleOptionSelect(option.key)}
                testID={`more-option-${option.key}`}
              >
                <Text
                  style={[styles.optionsOptionText, option.isDestructive && styles.optionsOptionTextDestructive]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.optionsCancel} onPress={handleCloseOptions} testID="more-options-cancel">
              <Text style={styles.optionsCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  moreButton: {
    padding: 8,
  },
  moreButtonText: {
    fontSize: 20,
    color: '#6b7280',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  mockNotice: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  mockNoticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d4ed8',
    marginBottom: 4,
  },
  mockNoticeBody: {
    fontSize: 13,
    color: '#1f2937',
    lineHeight: 18,
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
    width: 30,
    height: 30,
    borderRadius: 15,
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
  typingContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  typingAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  typingBubble: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  typingText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
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
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonActive: {
    backgroundColor: '#3b82f6',
  },
  sendButtonInactive: {
    backgroundColor: '#d1d5db',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  optionsModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  optionsModalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    marginBottom: 12,
  },
  optionsModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionsModalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  optionsOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  optionsOptionDestructive: {
    borderBottomColor: '#fecaca',
  },
  optionsOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  optionsOptionTextDestructive: {
    color: '#b91c1c',
  },
  optionsCancel: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  optionsCancelText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  gameActionCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#111827',
  },
  gameActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 6,
  },
  gameActionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(226, 232, 240, 0.85)',
    marginBottom: 14,
  },
  startGameButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  startGameButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SimpleConversationScreen;