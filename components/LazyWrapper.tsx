/**
 * LazyWrapper Component
 * 懒加載包裝組件 - 提供加載狀態和錯誤處理
 */

import React, { Suspense } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text style={styles.loadingText}>載入中...</Text>
  </View>
);

const DefaultErrorFallback = () => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>載入失敗</Text>
  </View>
);

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback = <DefaultFallback />,
  errorFallback = <DefaultErrorFallback />,
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
  },
});

export default LazyWrapper;