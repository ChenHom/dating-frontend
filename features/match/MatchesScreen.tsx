/**
 * MatchesScreen Component
 * 配對列表頁面 - 顯示所有配對的用戶
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMatchStore } from '@/stores/match';
import { Match } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export const MatchesScreen: React.FC = () => {
  const {
    matches,
    isLoading,
    error,
    loadMatches,
    openMatch,
    clearError,
  } = useMatchStore();

  useEffect(() => {
    loadMatches();
  }, []);

  const handleRefresh = () => {
    clearError();
    loadMatches();
  };

  const handleMatchPress = async (match: Match) => {
    try {
      if (!match.is_opened) {
        await openMatch(match.id);
      }

      // Navigate to chat
      const otherUser = match.user1.id === match.user1_id ? match.user2 : match.user1;
      router.push(`/chat/${otherUser.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '開啟對話失敗';
      Alert.alert('錯誤', errorMessage);
    }
  };

  const renderMatch = ({ item }: { item: Match }) => {
    const currentUserId = 1; // TODO: Get from auth store
    const otherUser = item.user1_id === currentUserId ? item.user2 : item.user1;
    const isNewMatch = !item.is_opened;
    const matchDate = new Date(item.matched_at);

    return (
      <TouchableOpacity
        style={[styles.matchCard, isNewMatch && styles.newMatchCard]}
        onPress={() => handleMatchPress(item)}
        activeOpacity={0.7}
      >
        {/* Photo */}
        <View style={styles.photoContainer}>
          {otherUser.profile?.primary_photo_url ? (
            <Image
              source={{ uri: otherUser.profile.primary_photo_url }}
              style={styles.photo}
            />
          ) : (
            <View style={styles.defaultPhoto}>
              <Ionicons name="person" size={32} color="#999" />
            </View>
          )}

          {/* New Match Badge */}
          {isNewMatch && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>新</Text>
            </View>
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {otherUser.profile?.display_name || otherUser.name}
          </Text>

          {otherUser.profile?.age && (
            <Text style={styles.userAge}>{otherUser.profile.age} 歲</Text>
          )}

          <Text style={styles.matchDate}>
            {formatDistanceToNow(matchDate, {
              addSuffix: true,
              locale: zhTW
            })}
          </Text>
        </View>

        {/* Arrow */}
        <View style={styles.arrow}>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color="#E1E1E1" />
      <Text style={styles.emptyTitle}>還沒有配對</Text>
      <Text style={styles.emptyText}>開始探索並喜歡其他用戶來建立配對！</Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push('/explore')}
      >
        <Text style={styles.exploreButtonText}>開始探索</Text>
      </TouchableOpacity>
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>配對列表</Text>
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorTitle}>載入失敗</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>重試</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>配對列表</Text>
        <Text style={styles.headerSubtitle}>
          {matches?.length || 0} 個配對
        </Text>
      </View>

      {/* Matches List */}
      <FlatList
        data={matches || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMatch}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#FF6B6B"
          />
        }
        contentContainerStyle={(matches?.length || 0) === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    paddingVertical: 10,
  },
  emptyList: {
    flex: 1,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newMatchCard: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  photoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
  },
  defaultPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  matchDate: {
    fontSize: 12,
    color: '#999',
  },
  arrow: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  exploreButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});