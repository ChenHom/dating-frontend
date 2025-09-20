/**
 * MessageReplyPreview Component
 * 訊息回覆預覽 - 顯示被回覆訊息的預覽內容
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Message } from '@/stores/chat';

interface MessageReplyPreviewProps {
  replyToMessage: Message | null;
  onClose: () => void;
  onMessagePress?: (message: Message) => void;
  isVisible: boolean;
  testID?: string;
}

export const MessageReplyPreview: React.FC<MessageReplyPreviewProps> = ({
  replyToMessage,
  onClose,
  onMessagePress,
  isVisible,
  testID = 'message-reply-preview',
}) => {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  React.useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  if (!replyToMessage || !isVisible) return null;

  // 截斷長文本
  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // 獲取發送者名稱
  const getSenderName = (message: Message) => {
    return message.sender.profile?.display_name || message.sender.name;
  };

  // 處理訊息點擊
  const handleMessagePress = () => {
    if (onMessagePress) {
      onMessagePress(replyToMessage);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      testID={testID}
    >
      {/* 回覆標示線 */}
      <View style={styles.replyLine} />

      {/* 回覆內容 */}
      <TouchableOpacity
        style={styles.content}
        onPress={handleMessagePress}
        activeOpacity={0.7}
        testID={`${testID}-content`}
      >
        {/* 標題行 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons
              name="arrow-undo-outline"
              size={14}
              color="#6b7280"
              style={styles.replyIcon}
            />
            <Text style={styles.replyLabel}>回覆</Text>
            <Text style={styles.senderName}>
              {getSenderName(replyToMessage)}
            </Text>
          </View>

          <Text style={styles.timestamp}>
            {dayjs(replyToMessage.sent_at || replyToMessage.created_at).format('HH:mm')}
          </Text>
        </View>

        {/* 訊息內容預覽 */}
        <Text style={styles.messagePreview} numberOfLines={2}>
          {truncateText(replyToMessage.content)}
        </Text>
      </TouchableOpacity>

      {/* 關閉按鈕 */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        testID={`${testID}-close`}
      >
        <Ionicons name="close" size={18} color="#6b7280" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f3f4f6',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 60,
  },
  replyLine: {
    width: 3,
    backgroundColor: '#3b82f6',
    borderRadius: 1.5,
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  replyIcon: {
    marginRight: 4,
  },
  replyLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginRight: 6,
  },
  senderName: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
  },
  messagePreview: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  closeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 4,
  },
});

export default MessageReplyPreview;