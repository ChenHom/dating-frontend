/**
 * GiftHistory Component
 * 禮物歷史記錄 - 顯示發送和接收的禮物記錄
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGiftStore, GiftSend } from '@/stores/gift';
import { useAuthStore } from '@/stores/auth';

interface GiftHistoryProps {
  conversationId?: number;
  testID?: string;
}

type TabType = 'sent' | 'received';

export const GiftHistory: React.FC<GiftHistoryProps> = ({
  conversationId,
  testID = 'gift-history',
}) => {
  // 動畫值
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 狀態
  const [activeTab, setActiveTab] = useState<TabType>('sent');
  const [refreshing, setRefreshing] = useState(false);

  // Stores
  const {
    sentGifts,
    receivedGifts,
    isLoadingHistory,
    loadGiftHistory,
  } = useGiftStore();

  const { user } = useAuthStore();

  // 載入禮物歷史
  useEffect(() => {
    loadGiftHistory(conversationId);

    // 淡入動畫
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [conversationId]);

  // 切換標籤動畫
  const handleTabSwitch = (tab: TabType) => {
    setActiveTab(tab);

    Animated.timing(tabIndicatorAnim, {
      toValue: tab === 'sent' ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // 下拉刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGiftHistory(conversationId);
    setRefreshing(false);
  };

  // 格式化時間
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
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

  // 渲染禮物項目
  const renderGiftItem = (giftSend: GiftSend, isSent: boolean) => {
    const otherUserId = isSent ? giftSend.receiver_id : giftSend.sender_id;
    const actionText = isSent ? '發送給' : '收到來自';

    return (
      <Animated.View
        key={giftSend.id}
        style={[
          styles.giftItem,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.giftItemContent}>
          {/* 禮物圖片 */}
          <View style={styles.giftImageContainer}>
            <Image
              source={{ uri: giftSend.gift?.icon_url }}
              style={styles.giftItemImage}
              defaultSource={require('@/assets/images/default-gift.png')}
            />
          </View>

          {/* 禮物信息 */}
          <View style={styles.giftItemInfo}>
            <Text style={styles.giftItemName}>
              {giftSend.gift?.name || '未知禮物'}
            </Text>

            <Text style={styles.giftItemAction}>
              {actionText} 用戶 {otherUserId}
            </Text>

            <Text style={styles.giftItemTime}>
              {formatTime(giftSend.created_at)}
            </Text>
          </View>

          {/* 狀態圖標 */}
          <View style={styles.giftItemStatus}>
            <Ionicons
              name={isSent ? 'arrow-up-circle' : 'arrow-down-circle'}
              size={20}
              color={isSent ? '#ef4444' : '#10b981'}
            />
          </View>
        </View>
      </Animated.View>
    );
  };

  const currentGifts = activeTab === 'sent' ? sentGifts : receivedGifts;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>禮物記錄</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'sent' && styles.tabActive
            ]}
            onPress={() => handleTabSwitch('sent')}
            testID={`${testID}-tab-sent`}
          >
            <Ionicons
              name="arrow-up-circle"
              size={20}
              color={activeTab === 'sent' ? '#3b82f6' : '#6b7280'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'sent' && styles.tabTextActive
              ]}
            >
              已發送 ({sentGifts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'received' && styles.tabActive
            ]}
            onPress={() => handleTabSwitch('received')}
            testID={`${testID}-tab-received`}
          >
            <Ionicons
              name="arrow-down-circle"
              size={20}
              color={activeTab === 'received' ? '#3b82f6' : '#6b7280'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'received' && styles.tabTextActive
              ]}
            >
              已接收 ({receivedGifts.length})
            </Text>
          </TouchableOpacity>

          {/* Tab indicator */}
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [{
                  translateX: tabIndicatorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 150], // 假設每個 tab 寬度約 150
                  }),
                }],
              },
            ]}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
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
        {isLoadingHistory && !refreshing ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>載入中...</Text>
          </View>
        ) : currentGifts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="gift-outline"
              size={48}
              color="#d1d5db"
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'sent' ? '尚未發送任何禮物' : '尚未收到任何禮物'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'sent'
                ? '選擇一個禮物開始傳遞溫暖吧！'
                : '等待朋友們的禮物驚喜！'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.giftList}>
            {currentGifts.map((giftSend) =>
              renderGiftItem(giftSend, activeTab === 'sent')
            )}
          </View>
        )}
      </ScrollView>

      {/* Statistics */}
      {!isLoadingHistory && (sentGifts.length > 0 || receivedGifts.length > 0) && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{sentGifts.length}</Text>
            <Text style={styles.statLabel}>已發送</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{receivedGifts.length}</Text>
            <Text style={styles.statLabel}>已接收</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {sentGifts.length + receivedGifts.length}
            </Text>
            <Text style={styles.statLabel}>總計</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  tabContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tabWrapper: {
    flexDirection: 'row',
    position: 'relative',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    position: 'relative',
    zIndex: 2,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: '50%',
    bottom: 4,
    backgroundColor: '#fff',
    borderRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1,
  },
  content: {
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
  giftList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  giftItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  giftItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  giftImageContainer: {
    marginRight: 12,
  },
  giftItemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  giftItemInfo: {
    flex: 1,
  },
  giftItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  giftItemAction: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  giftItemTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  giftItemStatus: {
    marginLeft: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
});

export default GiftHistory;