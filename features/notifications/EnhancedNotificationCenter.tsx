/**
 * EnhancedNotificationCenter Component
 * 增強的通知中心 - 統一管理和顯示所有類型的通知
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  Dimensions,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationData } from '@/services/notifications/NotificationManager';
import { useNotificationStore } from '@/stores/notification';

interface EnhancedNotificationCenterProps {
  isVisible: boolean;
  onClose: () => void;
  onNotificationPress?: (notification: NotificationData) => void;
  testID?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type NotificationFilterType = 'all' | 'unread' | 'game' | 'message' | 'gift' | 'match';

export const EnhancedNotificationCenter: React.FC<EnhancedNotificationCenterProps> = ({
  isVisible,
  onClose,
  onNotificationPress,
  testID = 'enhanced-notification-center',
}) => {
  // 動畫值
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 狀態
  const [activeFilter, setActiveFilter] = useState<NotificationFilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // 通知 store
  const {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotificationStore();

  // 入場動畫
  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // 載入通知
      loadNotifications();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  // 下拉刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  // 過濾通知
  const getFilteredNotifications = () => {
    let filtered = notifications;

    switch (activeFilter) {
      case 'unread':
        filtered = notifications.filter(n => !n.isRead);
        break;
      case 'game':
        filtered = notifications.filter(n => n.type === 'game_invite');
        break;
      case 'message':
        filtered = notifications.filter(n => n.type === 'message');
        break;
      case 'gift':
        filtered = notifications.filter(n => n.type === 'gift');
        break;
      case 'match':
        filtered = notifications.filter(n => n.type === 'match');
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  };

  // 處理通知點擊
  const handleNotificationPress = async (notification: NotificationData) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    onNotificationPress?.(notification);
  };

  // 處理刪除通知
  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      '刪除通知',
      '確定要刪除這個通知嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: () => deleteNotification(notificationId),
        },
      ]
    );
  };

  // 處理全部已讀
  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      Alert.alert(
        '標記全部已讀',
        `確定要將 ${unreadCount} 個未讀通知標記為已讀嗎？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '確定',
            onPress: () => markAllAsRead(),
          },
        ]
      );
    }
  };

  // 處理清空通知
  const handleClearAll = () => {
    if (notifications.length > 0) {
      Alert.alert(
        '清空通知',
        '確定要清空所有通知嗎？此操作無法撤銷。',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '清空',
            style: 'destructive',
            onPress: () => clearAllNotifications(),
          },
        ]
      );
    }
  };

  // 獲取通知圖標
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'game_invite':
        return { name: 'game-controller', color: '#3b82f6' };
      case 'message':
        return { name: 'chatbubble', color: '#10b981' };
      case 'gift':
        return { name: 'gift', color: '#f59e0b' };
      case 'match':
        return { name: 'heart', color: '#ef4444' };
      default:
        return { name: 'notifications', color: '#6b7280' };
    }
  };

  // 格式化時間
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '剛剛';
    if (diffInMinutes < 60) return `${diffInMinutes}分鐘前`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}小時前`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}天前`;

    return date.toLocaleDateString();
  };

  // 渲染過濾器按鈕
  const renderFilterButton = (filter: NotificationFilterType, label: string, count?: number) => {
    const isActive = activeFilter === filter;

    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterButton,
          isActive && styles.filterButtonActive,
        ]}
        onPress={() => setActiveFilter(filter)}
        testID={`${testID}-filter-${filter}`}
      >
        <Text
          style={[
            styles.filterButtonText,
            isActive && styles.filterButtonTextActive,
          ]}
        >
          {label}
          {count !== undefined && count > 0 && (
            <Text style={styles.filterCount}> ({count})</Text>
          )}
        </Text>
      </TouchableOpacity>
    );
  };

  // 渲染通知項目
  const renderNotificationItem = (notification: NotificationData) => {
    const iconConfig = getNotificationIcon(notification.type);

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationItem,
          !notification.isRead && styles.notificationItemUnread,
        ]}
        onPress={() => handleNotificationPress(notification)}
        testID={`${testID}-notification-${notification.id}`}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.notificationIconContainer}>
              <Ionicons
                name={iconConfig.name as any}
                size={20}
                color={iconConfig.color}
              />
              {!notification.isRead && (
                <View style={styles.unreadDot} />
              )}
            </View>

            <View style={styles.notificationInfo}>
              <Text
                style={[
                  styles.notificationTitle,
                  !notification.isRead && styles.notificationTitleUnread,
                ]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>

              <Text
                style={styles.notificationTime}
              >
                {formatTime(notification.timestamp)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteNotification(notification.id)}
              testID={`${testID}-delete-${notification.id}`}
            >
              <Ionicons name="close" size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <Text
            style={[
              styles.notificationBody,
              !notification.isRead && styles.notificationBodyUnread,
            ]}
            numberOfLines={2}
          >
            {notification.body}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadNotifications = notifications.filter(n => !n.isRead);

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Ionicons name="notifications" size={24} color="#1f2937" />
              <Text style={styles.title}>通知中心</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>

            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleMarkAllAsRead}
                  testID={`${testID}-mark-all-read`}
                >
                  <Ionicons name="checkmark-done" size={20} color="#3b82f6" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleClearAll}
                testID={`${testID}-clear-all`}
              >
                <Ionicons name="trash" size={20} color="#ef4444" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                testID={`${testID}-close`}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filters */}
          <ScrollView
            horizontal
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
            showsHorizontalScrollIndicator={false}
          >
            {renderFilterButton('all', '全部', notifications.length)}
            {renderFilterButton('unread', '未讀', unreadNotifications.length)}
            {renderFilterButton('game', '遊戲')}
            {renderFilterButton('message', '訊息')}
            {renderFilterButton('gift', '禮物')}
            {renderFilterButton('match', '配對')}
          </ScrollView>

          {/* Notifications List */}
          <ScrollView
            style={styles.notificationsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#3b82f6']}
                tintColor="#3b82f6"
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {isLoading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>載入中...</Text>
              </View>
            ) : filteredNotifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="notifications-off-outline"
                  size={48}
                  color="#d1d5db"
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>
                  {activeFilter === 'all' ? '沒有通知' : `沒有${activeFilter === 'unread' ? '未讀' : '相關'}通知`}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeFilter === 'all'
                    ? '所有通知都會在這裡顯示'
                    : '符合條件的通知會在這裡顯示'
                  }
                </Text>
              </View>
            ) : (
              <View style={styles.notificationsContent}>
                {filteredNotifications.map(renderNotificationItem)}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.9,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 4,
  },
  closeButton: {
    padding: 8,
  },
  filtersContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterCount: {
    fontSize: 12,
    opacity: 0.8,
  },
  notificationsList: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationsContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  notificationItemUnread: {
    borderColor: '#3b82f6',
    backgroundColor: '#f8fafc',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationIconContainer: {
    position: 'relative',
    marginRight: 12,
    marginTop: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  notificationTitleUnread: {
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  deleteButton: {
    padding: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  notificationBodyUnread: {
    color: '#374151',
  },
});

export default EnhancedNotificationCenter;