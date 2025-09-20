/**
 * ProfileStats Component
 * 個人資料統計面板 - 顯示配對、聊天、活動統計等信息
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

export interface ProfileStatsData {
  matches_count: number;
  likes_given: number;
  likes_received: number;
  messages_sent: number;
  conversations_count: number;
  profile_views: number;
  account_created: string;
  last_active: string;
  completion_percentage: number;
}

interface ProfileStatsProps {
  stats: ProfileStatsData;
  onStatsPress?: (statType: string) => void;
  testID?: string;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  stats,
  onStatsPress,
  testID = 'profile-stats',
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return '今天';
    if (diffInDays === 1) return '昨天';
    if (diffInDays < 7) return `${diffInDays} 天前`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} 週前`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} 個月前`;
    return `${Math.floor(diffInDays / 365)} 年前`;
  };

  const getActivityLevel = (): { level: string; color: string; description: string } => {
    const { matches_count, messages_sent, likes_given } = stats;
    const totalActivity = matches_count + Math.floor(messages_sent / 10) + Math.floor(likes_given / 5);

    if (totalActivity >= 50) {
      return { level: '超級活躍', color: '#4CAF50', description: '您是一位非常活躍的用戶！' };
    } else if (totalActivity >= 20) {
      return { level: '活躍', color: '#FF9800', description: '保持良好的活躍度！' };
    } else if (totalActivity >= 5) {
      return { level: '普通', color: '#2196F3', description: '試著更積極參與互動吧！' };
    } else {
      return { level: '新手', color: '#9E9E9E', description: '開始您的交友之旅！' };
    }
  };

  const activityInfo = getActivityLevel();

  const renderStatCard = (
    title: string,
    value: number | string,
    icon: keyof typeof Ionicons.glyphMap,
    color: string,
    statType: string,
    subtitle?: string
  ) => (
    <TouchableOpacity
      style={styles.statCard}
      onPress={() => onStatsPress?.(statType)}
      testID={`${testID}-${statType}`}
    >
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#ffffff" />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );

  const renderProfileCompletion = () => (
    <View style={styles.completionCard}>
      <View style={styles.completionHeader}>
        <Text style={styles.completionTitle}>個人資料完成度</Text>
        <Text style={styles.completionPercentage}>{stats.completion_percentage}%</Text>
      </View>

      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${stats.completion_percentage}%` }
          ]}
        />
      </View>

      <Text style={styles.completionTip}>
        {stats.completion_percentage < 100
          ? '完善您的個人資料可以增加配對機會！'
          : '您的個人資料已完善！'
        }
      </Text>
    </View>
  );

  const renderActivityBadge = () => (
    <LinearGradient
      colors={[activityInfo.color, activityInfo.color + '80']}
      style={styles.activityBadge}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.activityBadgeContent}>
        <Ionicons name="star" size={20} color="#ffffff" />
        <Text style={styles.activityLevel}>{activityInfo.level}</Text>
      </View>
      <Text style={styles.activityDescription}>{activityInfo.description}</Text>
    </LinearGradient>
  );

  const renderInfoCard = () => (
    <View style={styles.infoCard}>
      <View style={styles.infoRow}>
        <Ionicons name="calendar" size={16} color="#666666" />
        <Text style={styles.infoText}>
          加入時間：{formatDate(stats.account_created)}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="time" size={16} color="#666666" />
        <Text style={styles.infoText}>
          最後活動：{formatDate(stats.last_active)}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      testID={testID}
    >
      {renderActivityBadge()}
      {renderProfileCompletion()}

      <View style={styles.statsGrid}>
        {renderStatCard(
          '配對數',
          stats.matches_count,
          'heart',
          '#E91E63',
          'matches',
          '成功配對'
        )}
        {renderStatCard(
          '個人檔案瀏覽',
          stats.profile_views,
          'eye',
          '#2196F3',
          'views',
          '他人查看'
        )}
        {renderStatCard(
          '收到讚',
          stats.likes_received,
          'thumbs-up',
          '#4CAF50',
          'likes_received',
          '被喜歡'
        )}
        {renderStatCard(
          '給出讚',
          stats.likes_given,
          'heart-outline',
          '#FF9800',
          'likes_given',
          '主動喜歡'
        )}
        {renderStatCard(
          '對話數',
          stats.conversations_count,
          'chatbubbles',
          '#9C27B0',
          'conversations',
          '聊天對話'
        )}
        {renderStatCard(
          '發送訊息',
          stats.messages_sent,
          'send',
          '#607D8B',
          'messages',
          '消息總數'
        )}
      </View>

      {renderInfoCard()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  activityBadge: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  activityBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityLevel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  activityDescription: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.9,
    textAlign: 'center',
  },
  completionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  completionPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E91E63',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E91E63',
    borderRadius: 4,
  },
  completionTip: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statCard: {
    width: (screenWidth - 48) / 2, // 2 columns with padding
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
});

export default ProfileStats;