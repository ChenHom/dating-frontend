/**
 * MessageBubble Component
 * 訊息氣泡組件
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import dayjs from 'dayjs';
import { Message, PendingMessage, MessageStatus, useChatStore } from '@/stores/chat';
import { MessageStatusIcon } from './MessageStatusIndicator';

interface MessageBubbleProps {
  message: Message | (PendingMessage & { id?: number; sender?: any });
  isFromCurrentUser: boolean;
  showAvatar?: boolean;
  testID?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isFromCurrentUser,
  showAvatar = true,
  testID = 'message-bubble',
}) => {
  const { getMessageState } = useChatStore();

  const isMessage = 'id' in message && message.id;
  const isPending = 'status' in message && message.status;

  const content = 'content' in message ? message.content : '';
  const sentAt = 'sent_at' in message ? message.sent_at : message.created_at || '';
  const sender = 'sender' in message ? message.sender : undefined;

  // 獲取訊息狀態
  const getMessageStatus = (): MessageStatus => {
    if (isPending) {
      // 對於待處理訊息，使用 PendingMessage 的狀態
      const pendingMsg = message as PendingMessage;
      return pendingMsg.status as MessageStatus;
    } else if (isMessage) {
      // 對於已發送訊息，從 messageStates 獲取狀態
      const messageState = getMessageState(message.id.toString());
      return messageState?.status || 'sent';
    }
    return 'sent';
  };

  const getMessageError = (): string | undefined => {
    if (isPending) {
      return (message as PendingMessage).error;
    } else if (isMessage) {
      const messageState = getMessageState(message.id.toString());
      return messageState?.error;
    }
    return undefined;
  };

  return (
    <View
      style={[
        styles.messageContainer,
        isFromCurrentUser ? styles.myMessageContainer : styles.theirMessageContainer
      ]}
      testID={testID}
    >
      {!isFromCurrentUser && showAvatar && sender?.profile?.primary_photo_url && (
        <Image
          source={{ uri: sender.profile.primary_photo_url }}
          style={styles.messageAvatar}
          testID={`${testID}-avatar`}
        />
      )}

      <View
        style={[
          styles.messageBubble,
          isFromCurrentUser ? styles.myMessageBubble : styles.theirMessageBubble
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isFromCurrentUser ? styles.myMessageText : styles.theirMessageText
          ]}
          testID={`${testID}-text`}
        >
          {content}
        </Text>

        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.messageTime,
              isFromCurrentUser ? styles.myMessageTime : styles.theirMessageTime
            ]}
            testID={`${testID}-time`}
          >
            {dayjs(sentAt).format('HH:mm')}
          </Text>

          <MessageStatusIcon
            status={getMessageStatus()}
            isFromCurrentUser={isFromCurrentUser}
            error={getMessageError()}
            testID={`${testID}-status`}
          />
        </View>

        {getMessageError() && (
          <Text style={styles.errorText} testID={`${testID}-error`}>
            {getMessageError()}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  theirMessageTime: {
    color: '#6b7280',
  },
  messageStatus: {
    fontSize: 12,
    marginLeft: 4,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontStyle: 'italic',
    marginTop: 4,
  },
});