/**
 * MessageActionsMenu Component
 * 訊息操作選單 - 長按訊息後顯示的操作選項
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
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/stores/chat';

interface MessageActionsMenuProps {
  isVisible: boolean;
  message: Message | null;
  position: { x: number; y: number };
  onClose: () => void;
  onReply: (message: Message) => void;
  onCopy: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  isFromCurrentUser: boolean;
  testID?: string;
}

interface ActionItem {
  id: string;
  title: string;
  icon: string;
  color?: string;
  onPress: () => void;
  disabled?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const MessageActionsMenu: React.FC<MessageActionsMenuProps> = ({
  isVisible,
  message,
  position,
  onClose,
  onReply,
  onCopy,
  onForward,
  onDelete,
  isFromCurrentUser,
  testID = 'message-actions-menu',
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  if (!message) return null;

  // 創建操作選項
  const createActions = (): ActionItem[] => {
    const actions: ActionItem[] = [];

    // 回覆
    actions.push({
      id: 'reply',
      title: '回覆',
      icon: 'arrow-undo-outline',
      onPress: () => {
        onReply(message);
        onClose();
      },
    });

    // 複製
    actions.push({
      id: 'copy',
      title: '複製',
      icon: 'copy-outline',
      onPress: () => {
        onCopy(message);
        onClose();
      },
    });

    // 轉發 (如果提供了處理函數)
    if (onForward) {
      actions.push({
        id: 'forward',
        title: '轉發',
        icon: 'arrow-forward-outline',
        onPress: () => {
          onForward(message);
          onClose();
        },
      });
    }

    // 刪除 (只有自己的訊息才能刪除)
    if (isFromCurrentUser && onDelete) {
      actions.push({
        id: 'delete',
        title: '刪除',
        icon: 'trash-outline',
        color: '#ef4444',
        onPress: () => {
          onDelete(message);
          onClose();
        },
      });
    }

    return actions;
  };

  const actions = createActions();

  // 計算選單位置
  const calculateMenuPosition = () => {
    const menuWidth = 200;
    const menuHeight = actions.length * 56 + 16; // 每個選項 56px + padding

    let left = position.x - menuWidth / 2;
    let top = position.y - menuHeight - 20; // 在訊息上方顯示

    // 確保選單不會超出螢幕邊界
    if (left < 16) left = 16;
    if (left + menuWidth > screenWidth - 16) left = screenWidth - menuWidth - 16;

    // 如果上方空間不足，則在下方顯示
    if (top < 50) {
      top = position.y + 20;
    }

    // 確保不會超出螢幕底部
    if (top + menuHeight > screenHeight - 50) {
      top = screenHeight - menuHeight - 50;
    }

    return { left, top };
  };

  const menuPosition = calculateMenuPosition();

  const renderActionItem = (action: ActionItem) => (
    <TouchableOpacity
      key={action.id}
      style={[
        styles.actionItem,
        action.disabled && styles.actionItemDisabled,
      ]}
      onPress={action.onPress}
      disabled={action.disabled}
      testID={`${testID}-${action.id}`}
    >
      <Ionicons
        name={action.icon as any}
        size={20}
        color={action.disabled ? '#9ca3af' : (action.color || '#374151')}
        style={styles.actionIcon}
      />
      <Text
        style={[
          styles.actionText,
          action.color && { color: action.color },
          action.disabled && styles.actionTextDisabled,
        ]}
      >
        {action.title}
      </Text>
    </TouchableOpacity>
  );

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
        {/* 選單容器 */}
        <Animated.View
          style={[
            styles.menuContainer,
            {
              left: menuPosition.left,
              top: menuPosition.top,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* 三角箭頭 */}
          <View style={styles.arrow} />

          {/* 操作選項 */}
          <View style={styles.actionsContainer}>
            {actions.map(renderActionItem)}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    maxWidth: 220,
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
  actionsContainer: {
    paddingHorizontal: 0,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  actionItemDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    marginRight: 12,
    width: 20,
  },
  actionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  actionTextDisabled: {
    color: '#9ca3af',
  },
});

export default MessageActionsMenu;