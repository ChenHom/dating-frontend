/**
 * App Entry Point
 * 根據認證狀態決定顯示登入頁面或主應用
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated || isLoading) {
    return (
      <View style={styles.container} testID="app-loading">
        <ActivityIndicator size="large" color="#3b82f6" testID="loading-spinner" />
        <Text style={styles.loadingText} testID="loading-text">
          Checking authentication...
        </Text>
        <Text style={styles.statusText} testID="auth-status">
          {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
        </Text>
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/discover" />;
  }

  return <Redirect href="/login" />;
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
