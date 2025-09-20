/**
 * StatsScreen Component
 * 個人統計頁面 - 顯示用戶活動統計、配對數據等
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStats, ProfileStatsData } from './components/ProfileStats';
import { useAuthStore } from '@/stores/auth';

export const StatsScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<ProfileStatsData>({
    matches_count: 0,
    likes_given: 0,
    likes_received: 0,
    messages_sent: 0,
    conversations_count: 0,
    profile_views: 0,
    account_created: '2024-01-01T00:00:00Z',
    last_active: new Date().toISOString(),
    completion_percentage: 75,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      // TODO: 從 API 加載用戶統計數據
      // const response = await apiClient.getUserStats();
      // setStats(response);

      // 暫時使用模擬數據
      const mockStats: ProfileStatsData = {
        matches_count: 15,
        likes_given: 45,
        likes_received: 32,
        messages_sent: 156,
        conversations_count: 8,
        profile_views: 98,
        account_created: '2024-01-15T10:30:00Z',
        last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        completion_percentage: 85,
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
      Alert.alert('錯誤', '無法載入統計數據');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleStatsPress = (statType: string) => {
    switch (statType) {
      case 'matches':
        router.push('/matches');
        break;
      case 'conversations':
        router.push('/chat');
        break;
      case 'likes_received':
        router.push('/likes/received');
        break;
      case 'likes_given':
        router.push('/likes/given');
        break;
      case 'views':
        Alert.alert(
          '個人檔案瀏覽',
          `您的個人檔案已被瀏覽 ${stats.profile_views} 次`
        );
        break;
      case 'messages':
        Alert.alert(
          '訊息統計',
          `您已發送 ${stats.messages_sent} 條訊息`
        );
        break;
      default:
        console.log('Stat pressed:', statType);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        testID="stats-back-button"
      >
        <Ionicons name="arrow-back" size={24} color="#333333" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>我的統計</Text>

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={handleRefresh}
        disabled={refreshing}
        testID="stats-refresh-button"
      >
        {refreshing ? (
          <ActivityIndicator size="small" color="#666666" />
        ) : (
          <Ionicons name="refresh" size={24} color="#666666" />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderWelcomeMessage = () => {
    const getWelcomeMessage = (): string => {
      const hour = new Date().getHours();
      if (hour < 12) return '早安';
      if (hour < 18) return '午安';
      return '晚安';
    };

    return (
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>
          {getWelcomeMessage()}，{user?.name || '用戶'}！
        </Text>
        <Text style={styles.welcomeSubtext}>
          查看您在 Dating App 的活動統計
        </Text>
      </View>
    );
  };

  const renderInsights = () => {
    const getInsightMessage = (): string => {
      const { matches_count, likes_received, likes_given, messages_sent } = stats;

      if (matches_count === 0) {
        return '開始您的交友之旅！多主動喜歡其他用戶以增加配對機會。';
      }

      if (likes_received > likes_given) {
        return '您很受歡迎！考慮更積極地喜歡其他用戶來增加配對機會。';
      }

      if (messages_sent < matches_count * 5) {
        return '您有很多配對！嘗試多與配對的用戶聊天來建立更深的連結。';
      }

      return '您的活動表現很好！繼續保持積極的互動。';
    };

    return (
      <View style={styles.insightsContainer}>
        <View style={styles.insightsHeader}>
          <Ionicons name="bulb" size={20} color="#FF9800" />
          <Text style={styles.insightsTitle}>個人化建議</Text>
        </View>
        <Text style={styles.insightsText}>{getInsightMessage()}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E91E63" />
          <Text style={styles.loadingText}>載入統計數據中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#E91E63']}
            tintColor="#E91E63"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderWelcomeMessage()}
        {renderInsights()}

        <ProfileStats
          stats={stats}
          onStatsPress={handleStatsPress}
          testID="profile-stats"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  refreshButton: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  welcomeContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#666666',
  },
  insightsContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  insightsText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});

export default StatsScreen;