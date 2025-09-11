/**
 * App Entry Point
 * 根據認證狀態決定顯示登入頁面或主應用
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // 確保組件已完全掛載
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoading) {
      console.log('🏠 Index navigation decision:', {
        isAuthenticated,
        isLoading,
        user: user?.name || 'none'
      });

      // 使用更長的延遲確保 Root Layout 已完全渲染
      const timeoutId = setTimeout(() => {
        try {
          if (isAuthenticated) {
            console.log('✅ Redirecting authenticated user to feed');
            router.replace('/(tabs)/feed');
          } else {
            console.log('🔐 Redirecting unauthenticated user to login');
            router.replace('/login');
          }
        } catch (error) {
          console.error('Index navigation error:', error);
          // 如果路由導航失敗，嘗試使用 window.location（僅在 web 上）
          if (typeof window !== 'undefined') {
            if (isAuthenticated) {
              window.location.href = '/(tabs)/feed';
            } else {
              window.location.href = '/login';
            }
          }
        }
      }, 200); // 增加延遲時間

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isLoading, isMounted]);

  // Show loading screen while checking auth status
  return (
    <View style={styles.container} testID="app-loading">
      <ActivityIndicator size="large" color="#3b82f6" testID="loading-spinner" />
      <Text style={styles.loadingText} testID="loading-text">
        {isLoading ? 'Checking authentication...' : 'Redirecting...'}
      </Text>
      <Text style={styles.statusText} testID="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  statusText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
});