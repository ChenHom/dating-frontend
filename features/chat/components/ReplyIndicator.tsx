/**
 * ReplyIndicator Component
 * 回覆指示器 - 在訊息氣泡中顯示回覆的原始訊息
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/stores/chat';

interface ReplyIndicatorProps {
  originalMessage: Message;
  isFromCurrentUser: boolean;
  onPress?: (message: Message) => void;
  testID?: string;
}

export const ReplyIndicator: React.FC<ReplyIndicatorProps> = ({
  originalMessage,
  isFromCurrentUser,
  onPress,
  testID = 'reply-indicator',
}) => {
  // 截斷文本
  const truncateText = (text: string, maxLength: number = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // 獲取發送者名稱
  const getSenderName = (message: Message) => {
    return message.sender.profile?.display_name || message.sender.name;
  };

  const handlePress = () => {
    if (onPress) {
      onPress(originalMessage);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isFromCurrentUser ? styles.myReplyContainer : styles.theirReplyContainer,
      ]}
      onPress={handlePress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      testID={testID}
    >
      {/* 回覆線 */}
      <View
        style={[
          styles.replyLine,
          isFromCurrentUser ? styles.myReplyLine : styles.theirReplyLine,
        ]}
      />

      {/* 回覆內容 */}
      <View style={styles.content}>
        {/* 回覆標題 */}
        <View style={styles.header}>
          <Ionicons
            name="arrow-undo-outline"
            size={12}
            color={isFromCurrentUser ? 'rgba(255, 255, 255, 0.7)' : '#6b7280'}
            style={styles.replyIcon}
          />
          <Text
            style={[
              styles.senderName,
              isFromCurrentUser ? styles.mySenderName : styles.theirSenderName,
            ]}
            numberOfLines={1}
          >
            {getSenderName(originalMessage)}
          </Text>
        </View>

        {/* 原始訊息預覽 */}
        <Text
          style={[
            styles.messagePreview,
            isFromCurrentUser ? styles.myMessagePreview : styles.theirMessagePreview,
          ]}
          numberOfLines={2}
        >
          {truncateText(originalMessage.content)}
        </Text>
      </View>

      {/* 跳轉箭頭 */}
      {onPress && (
        <View style={styles.jumpArrow}>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={isFromCurrentUser ? 'rgba(255, 255, 255, 0.6)' : '#9ca3af'}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    minHeight: 44,
  },
  myReplyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  theirReplyContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  replyLine: {
    width: 3,
    borderRadius: 1.5,
    marginRight: 8,
    minHeight: 32,
  },
  myReplyLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  theirReplyLine: {
    backgroundColor: '#3b82f6',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  replyIcon: {
    marginRight: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  mySenderName: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  theirSenderName: {
    color: '#3b82f6',
  },
  messagePreview: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  myMessagePreview: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirMessagePreview: {
    color: '#6b7280',
  },
  jumpArrow: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
});

export default ReplyIndicator;