/**
 * ReactionPicker Component
 * 表情反應選擇器 - 快速選擇常用表情反應
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Message } from '@/stores/chat';

interface ReactionPickerProps {
  isVisible: boolean;
  message: Message | null;
  position: { x: number; y: number };
  onClose: () => void;
  onReactionSelect: (message: Message, emoji: string) => void;
  testID?: string;
}

// 常用表情反應列表
const COMMON_REACTIONS = [
  { emoji: '👍', label: '讚' },
  { emoji: '❤️', label: '愛心' },
  { emoji: '😂', label: '大笑' },
  { emoji: '😮', label: '驚訝' },
  { emoji: '😢', label: '難過' },
  { emoji: '😡', label: '生氣' },
];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  isVisible,
  message,
  position,
  onClose,
  onReactionSelect,
  testID = 'reaction-picker',
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.3)).current;
  const slideAnims = React.useRef(
    COMMON_REACTIONS.map(() => new Animated.Value(0))
  ).current;

  React.useEffect(() => {
    if (isVisible) {
      // 淡入和縮放動畫
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      // 表情項目的序列動畫
      Animated.stagger(
        30,
        slideAnims.map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          })
        )
      ).start();
    } else {
      // 重置動畫
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      slideAnims.forEach(anim => anim.setValue(0));
    }
  }, [isVisible]);

  if (!message) return null;

  // 計算選擇器位置
  const calculatePickerPosition = () => {
    const pickerWidth = COMMON_REACTIONS.length * 50 + 16; // 每個按鈕 50px + padding
    const pickerHeight = 60;

    let left = position.x - pickerWidth / 2;
    let top = position.y - pickerHeight - 20; // 在訊息上方顯示

    // 確保選擇器不會超出螢幕邊界
    if (left < 16) left = 16;
    if (left + pickerWidth > screenWidth - 16) left = screenWidth - pickerWidth - 16;

    // 如果上方空間不足，則在下方顯示
    if (top < 50) {
      top = position.y + 20;
    }

    return { left, top };
  };

  const pickerPosition = calculatePickerPosition();

  // 處理表情選擇
  const handleReactionSelect = (emoji: string) => {
    onReactionSelect(message, emoji);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      testID={testID}
    >
      {/* 背景遮罩 */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* 選擇器容器 */}
        <Animated.View
          style={[
            styles.pickerContainer,
            {
              left: pickerPosition.left,
              top: pickerPosition.top,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* 表情按鈕 */}
          <View style={styles.reactionsContainer}>
            {COMMON_REACTIONS.map((reaction, index) => (
              <Animated.View
                key={reaction.emoji}
                style={[
                  styles.reactionButtonContainer,
                  {
                    transform: [
                      {
                        scale: slideAnims[index],
                      },
                      {
                        translateY: slideAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.reactionButton}
                  onPress={() => handleReactionSelect(reaction.emoji)}
                  activeOpacity={0.7}
                  testID={`${testID}-${reaction.emoji}`}
                >
                  <Text style={styles.reactionEmoji}>
                    {reaction.emoji}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* 三角箭頭 */}
          <View style={styles.arrow} />
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  pickerContainer: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  reactionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionButtonContainer: {
    marginHorizontal: 2,
  },
  reactionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  reactionEmoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  arrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ffffff',
  },
});

export default ReactionPicker;