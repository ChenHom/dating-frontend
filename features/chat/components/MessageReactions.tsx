/**
 * MessageReactions Component
 * 訊息反應 - 顯示訊息的表情反應和統計
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Message } from '@/stores/chat';

export interface ReactionData {
  emoji: string;
  count: number;
  users: Array<{
    id: number;
    name: string;
  }>;
  hasCurrentUserReacted: boolean;
}

interface MessageReactionsProps {
  message: Message;
  reactions: ReactionData[];
  onReactionPress: (message: Message, emoji: string) => void;
  onReactionLongPress?: (message: Message, emoji: string, users: ReactionData['users']) => void;
  currentUserId: number;
  testID?: string;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  message,
  reactions,
  onReactionPress,
  onReactionLongPress,
  currentUserId,
  testID = 'message-reactions',
}) => {
  const animationValues = React.useRef<{ [emoji: string]: Animated.Value }>({});

  // 初始化動畫值
  React.useEffect(() => {
    reactions.forEach(reaction => {
      if (!animationValues.current[reaction.emoji]) {
        animationValues.current[reaction.emoji] = new Animated.Value(1);
      }
    });
  }, [reactions]);

  // 處理反應點擊
  const handleReactionPress = (emoji: string) => {
    // 點擊動畫
    const animValue = animationValues.current[emoji];
    if (animValue) {
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }

    onReactionPress(message, emoji);
  };

  // 處理長按
  const handleReactionLongPress = (reaction: ReactionData) => {
    if (onReactionLongPress) {
      onReactionLongPress(message, reaction.emoji, reaction.users);
    }
  };

  if (reactions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.reactionsContainer}>
        {reactions.map((reaction) => (
          <Animated.View
            key={reaction.emoji}
            style={{
              transform: [{
                scale: animationValues.current[reaction.emoji] || 1
              }]
            }}
          >
            <TouchableOpacity
              style={[
                styles.reactionBubble,
                reaction.hasCurrentUserReacted && styles.userReactedBubble,
              ]}
              onPress={() => handleReactionPress(reaction.emoji)}
              onLongPress={() => handleReactionLongPress(reaction)}
              activeOpacity={0.7}
              testID={`${testID}-${reaction.emoji}`}
            >
              <Text style={styles.reactionEmoji}>
                {reaction.emoji}
              </Text>
              {reaction.count > 1 && (
                <Text
                  style={[
                    styles.reactionCount,
                    reaction.hasCurrentUserReacted && styles.userReactedCount,
                  ]}
                >
                  {reaction.count}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 2,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
    minHeight: 24,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  userReactedBubble: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  reactionEmoji: {
    fontSize: 14,
    lineHeight: 16,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 4,
    lineHeight: 14,
  },
  userReactedCount: {
    color: '#3b82f6',
  },
});

export default MessageReactions;