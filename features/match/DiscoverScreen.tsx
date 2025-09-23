/**
 * Discover Screen
 * 探索頁面 - 主要的滑動配對功能頁面
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SwipeCard, SwipeCardRef } from './components/SwipeCard';
import { useFeedStore } from '@/stores/feed';
import { useMatchStore } from '@/stores/match';
import { useAuthStore } from '@/stores/auth';

export const DiscoverScreen: React.FC = () => {
  const swipeRef = useRef<SwipeCardRef>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isPassing, setIsPassing] = useState(false);

  // Store states
  const {
    users,
    isLoading,
    error,
    loadFeed,
    clearError,
    hasMoreCards,
  } = useFeedStore();

  const { isAuthenticated } = useAuthStore();

  const {
    dailyLikes,
    likeLimit,
    newMatch,
    clearNewMatch,
    checkAndResetDailyLikes,
  } = useMatchStore();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    loadFeed();
    checkAndResetDailyLikes();
  }, [isAuthenticated, loadFeed, checkAndResetDailyLikes]);

  // Handle new match navigation
  useEffect(() => {
    if (newMatch) {
      // Navigate to match success screen
      router.push({
        pathname: '/match/success',
        params: { matchedUserId: newMatch.id.toString() },
      });

      // Clear after navigation
      setTimeout(() => {
        clearNewMatch();
      }, 500);
    }
  }, [newMatch]);

  const handleLike = async (userId: number) => {
    if (!isAuthenticated || isLiking || isPassing) return;

    setIsLiking(true);
    try {
      await useMatchStore.getState().likeUser(userId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Like failed';
      Alert.alert('錯誤', errorMessage);
    } finally {
      setIsLiking(false);
    }
  };

  const handlePass = async (userId: number) => {
    if (!isAuthenticated || isLiking || isPassing) return;

    setIsPassing(true);
    try {
      await useMatchStore.getState().passUser(userId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Pass failed';
      Alert.alert('錯誤', errorMessage);
    } finally {
      setIsPassing(false);
    }
  };

  const handleAllSwiped = () => {
    // Load more users or show empty state
    loadFeed();
  };

  const handleManualLike = () => {
    if (dailyLikes >= likeLimit) {
      Alert.alert('每日限制', '已達到每日點讚限制，請明天再試！');
      return;
    }
    if (!isAuthenticated) {
      Alert.alert('需要登入', '請先登入後再進行點讚');
      return;
    }
    swipeRef.current?.swipeRight();
  };

  const handleManualPass = () => {
    if (!isAuthenticated) {
      Alert.alert('需要登入', '請先登入後再繼續探索');
      return;
    }
    swipeRef.current?.swipeLeft();
  };

  const handleSettings = () => {
    router.push('/profile');
  };

  const handleMatches = () => {
    router.push('/matches');
  };

  const handleRefresh = () => {
    clearError();
    loadFeed();
  };

  const remainingLikes = Math.max(0, likeLimit - dailyLikes);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSettings} style={styles.headerButton}>
          <Ionicons name="person-circle-outline" size={28} color="#666" />
        </TouchableOpacity>

        <Text style={styles.title}>探索</Text>

        <TouchableOpacity onPress={handleMatches} style={styles.headerButton}>
          <Ionicons name="chatbubbles-outline" size={28} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Like Counter */}
      <View style={styles.likeCounter}>
        <Text style={styles.likeCounterText}>
          今日剩餘點讚: {remainingLikes}/{likeLimit}
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>載入失敗</Text>
            <Text style={styles.errorSubtext}>{error}</Text>
            <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>重試</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SwipeCard
            ref={swipeRef}
            users={users}
            onLike={handleLike}
            onPass={handlePass}
            onAllSwiped={handleAllSwiped}
            loading={isLoading}
          />
        )}
      </View>

      {/* Action Buttons */}
      {!isLoading && !error && hasMoreCards() && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.passButton]}
            onPress={handleManualPass}
            disabled={isLiking || isPassing}
          >
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={handleManualLike}
            disabled={isLiking || isPassing || dailyLikes >= likeLimit}
          >
            <Ionicons name="heart" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  headerButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  likeCounter: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  likeCounterText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 15, // 增加上方間距避免覆蓋
    paddingHorizontal: 10,
    marginBottom: 120, // 為底部按鈕留出空間
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 60,
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  passButton: {
    backgroundColor: '#FF4458',
  },
  likeButton: {
    backgroundColor: '#4CCC93',
  },
});
