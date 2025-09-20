/**
 * 通知顯示組件 - 統一處理 WebSocket 和 Push Notification 的顯示
 * 確保同一通知只顯示一次，優先顯示 WebSocket 通知
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationManager, NotificationData, NotificationListener } from '@/services/notifications/NotificationManager';
import { useGameStore } from '@/stores/game';
import { GameInviteNotification } from './GameInviteNotification';

const { width: screenWidth } = Dimensions.get('window');

interface NotificationItemProps {
  notification: NotificationData;
  onPress?: () => void;
  onDismiss?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onDismiss,
}) => {
  const [slideAnim] = useState(new Animated.Value(-screenWidth));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // 滑入動畫
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDismiss = () => {
    // 滑出動畫
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -screenWidth,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'game_invite':
        return 'game-controller';
      case 'message':
        return 'chatbubble';
      case 'match':
        return 'heart';
      case 'gift':
        return 'gift';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'game_invite':
        return '#FF6B35'; // 橙色 - 遊戲邀請
      case 'message':
        return '#4A90E2'; // 藍色 - 訊息
      case 'match':
        return '#FF4458'; // 紅色 - 配對
      case 'gift':
        return '#7B68EE'; // 紫色 - 禮物
      default:
        return '#666';
    }
  };

  return (
    <Animated.View
      style={[
        styles.notificationContainer,
        {
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
          borderLeftColor: getNotificationColor(),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.notificationContent}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={getNotificationIcon() as any}
            size={24}
            color={getNotificationColor()}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.titleText} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.bodyText} numberOfLines={2}>
            {notification.body}
          </Text>

          {notification.source && (
            <Text style={styles.sourceText}>
              {notification.source === 'websocket' ? '🟢 即時' : '📱 推送'}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dismissButton}
        onPress={handleDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={20} color="#999" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const NotificationDisplay: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const { acceptGameInvitation, declineGameInvitation } = useGameStore();

  useEffect(() => {
    const listener: NotificationListener = {
      onNotificationReceived: (notification) => {
        console.log('Notification received for display:', notification);
      },

      onNotificationDisplayed: (notification) => {
        console.log('Displaying notification:', notification);
        setNotifications(prev => {
          // 檢查是否已存在相同 ID 的通知
          const exists = prev.some(n => n.id === notification.id);
          if (exists) {
            return prev;
          }
          return [notification, ...prev];
        });
      },

      onNotificationHidden: (notificationId) => {
        console.log('Hiding notification:', notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      },
    };

    notificationManager.addListener(listener);

    return () => {
      notificationManager.removeListener(listener);
    };
  }, []);

  const handleNotificationPress = (notification: NotificationData) => {
    switch (notification.type) {
      case 'game_invite':
        handleGameInvitePress(notification);
        break;
      case 'message':
        handleMessagePress(notification);
        break;
      case 'match':
        handleMatchPress(notification);
        break;
      case 'gift':
        handleGiftPress(notification);
        break;
      default:
        // 默認行為：直接隱藏通知
        notificationManager.hideNotification(notification.id);
        break;
    }
  };

  const handleGameInvitePress = (notification: NotificationData) => {
    const invitationId = notification.id;

    Alert.alert(
      '🎮 遊戲邀請',
      notification.body,
      [
        {
          text: '拒絕',
          style: 'cancel',
          onPress: async () => {
            try {
              await declineGameInvitation(invitationId);
              notificationManager.hideNotification(notification.id);
            } catch (error) {
              console.error('Failed to decline game invitation:', error);
            }
          },
        },
        {
          text: '接受',
          style: 'default',
          onPress: async () => {
            try {
              await acceptGameInvitation(invitationId);
              notificationManager.hideNotification(notification.id);
            } catch (error) {
              console.error('Failed to accept game invitation:', error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleMessagePress = (notification: NotificationData) => {
    // 導航到對話界面
    console.log('Navigate to conversation:', notification.conversationId);
    notificationManager.hideNotification(notification.id);
  };

  const handleMatchPress = (notification: NotificationData) => {
    // 導航到配對界面
    console.log('Navigate to matches');
    notificationManager.hideNotification(notification.id);
  };

  const handleGiftPress = (notification: NotificationData) => {
    // 顯示禮物詳情
    console.log('Show gift details:', notification.data);
    notificationManager.hideNotification(notification.id);
  };

  const handleDismiss = (notificationId: string) => {
    notificationManager.hideNotification(notificationId);
  };

  return (
    <View style={styles.container}>
      {notifications.map((notification) => {
        // 遊戲邀請使用專用組件
        if (notification.type === 'game_invite') {
          return (
            <GameInviteNotification
              key={notification.id}
              notification={notification}
              onAccept={async () => {
                try {
                  await acceptGameInvitation(notification.id);
                } catch (error) {
                  console.error('Failed to accept game invitation:', error);
                }
              }}
              onDecline={async () => {
                try {
                  await declineGameInvitation(notification.id);
                } catch (error) {
                  console.error('Failed to decline game invitation:', error);
                }
              }}
              onDismiss={() => handleDismiss(notification.id)}
              testID={`game-invite-notification-${notification.id}`}
            />
          );
        }

        // 其他通知類型使用通用組件
        return (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onPress={() => handleNotificationPress(notification)}
            onDismiss={() => handleDismiss(notification.id)}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // 避開狀態欄
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  notificationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  dismissButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationDisplay;