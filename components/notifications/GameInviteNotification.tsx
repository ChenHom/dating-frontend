/**
 * GameInviteNotification Component
 * 遊戲邀請專用通知 UI 組件 - 用於顯示遊戲邀請的彈出通知
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationData } from '@/services/notifications/NotificationManager';

interface GameInviteNotificationProps {
  notification: NotificationData;
  onAccept?: () => void;
  onDecline?: () => void;
  onDismiss?: () => void;
  testID?: string;
}

export const GameInviteNotification: React.FC<GameInviteNotificationProps> = ({
  notification,
  onAccept,
  onDecline,
  onDismiss,
  testID = 'game-invite-notification',
}) => {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  React.useEffect(() => {
    // 滑入動畫
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // 10秒後自動消失
    const timeout = setTimeout(() => {
      handleDismiss();
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  };

  const handleAccept = () => {
    onAccept?.();
    handleDismiss();
  };

  const handleDecline = () => {
    onDecline?.();
    handleDismiss();
  };

  // 提取邀請數據
  const invitationData = notification.data?.invitation;
  const senderName = notification.data?.senderName || '未知用戶';
  const avatarUrl = notification.data?.avatarUrl;

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
      <View style={styles.notificationCard}>
        {/* 關閉按鈕 */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          testID={`${testID}-close`}
        >
          <Ionicons name="close" size={18} color="#6b7280" />
        </TouchableOpacity>

        {/* 主要內容 */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.gameIconContainer}>
              <Text style={styles.gameIcon}>🎮</Text>
            </View>

            {avatarUrl && (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                testID={`${testID}-avatar`}
              />
            )}

            <View style={styles.headerText}>
              <Text style={styles.title}>{notification.title}</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {notification.body}
              </Text>
            </View>
          </View>

          {/* 遊戲詳情 */}
          <View style={styles.gameDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="trophy-outline" size={14} color="#6b7280" />
              <Text style={styles.detailText}>3局2勝制</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text style={styles.detailText}>每回合10秒限時</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="hourglass-outline" size={14} color="#f59e0b" />
              <Text style={[styles.detailText, styles.expiryText]}>5分鐘內有效</Text>
            </View>
          </View>

          {/* 動作按鈕 */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={handleDecline}
              testID={`${testID}-decline-action`}
            >
              <Ionicons name="close" size={16} color="#ef4444" />
              <Text style={styles.declineText}>拒絕</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
              testID={`${testID}-accept-action`}
            >
              <Ionicons name="checkmark" size={16} color="#ffffff" />
              <Text style={styles.acceptText}>接受</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 通知來源指示器 */}
        <View style={styles.sourceIndicator}>
          <View
            style={[
              styles.sourceDot,
              notification.source === 'websocket'
                ? styles.websocketSource
                : styles.pushSource
            ]}
          />
          <Text style={styles.sourceText}>
            {notification.source === 'websocket' ? '即時' : '推送'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // 避開狀態欄
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 16,
    paddingRight: 40, // 為關閉按鈕留空間
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gameIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gameIcon: {
    fontSize: 18,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  gameDetails: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  expiryText: {
    color: '#f59e0b',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 4,
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  declineButton: {
    backgroundColor: '#fee2e2',
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  declineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  sourceIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  websocketSource: {
    backgroundColor: '#10b981',
  },
  pushSource: {
    backgroundColor: '#f59e0b',
  },
  sourceText: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
  },
});

export default GameInviteNotification;