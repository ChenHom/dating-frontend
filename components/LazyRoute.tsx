/**
 * Lazy Route Wrapper
 * 懶加載路由包裝器 - 提供路由級別的代碼分割
 */

import React, { Suspense, lazy, ComponentType } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LazyRouteOptions {
  fallback?: React.ComponentType;
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>;
  preload?: boolean;
}

const DefaultFallback = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text style={styles.text}>載入中...</Text>
  </View>
);

const DefaultErrorBoundary: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>載入失敗</Text>
    <Text style={styles.errorMessage}>{error.message}</Text>
  </View>
);

/**
 * 創建懶加載路由組件
 */
export function createLazyRoute<T extends Record<string, any> = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: LazyRouteOptions = {}
) {
  const LazyComponent = lazy(importFn);
  const { fallback: Fallback = DefaultFallback, preload = false } = options;

  const LazyRoute: React.FC<T> = (props) => {
    return (
      <Suspense fallback={<Fallback />}>
        <LazyComponent {...(props as T)} />
      </Suspense>
    );
  };

  // 預加載功能
  if (preload) {
    // 在路由創建後立即預加載
    setTimeout(() => {
      importFn();
    }, 100);
  }

  LazyRoute.displayName = `LazyRoute(Component)`;

  // 添加預加載方法
  (LazyRoute as any).preload = importFn;

  return LazyRoute;
}

/**
 * 預加載多個路由
 */
export function preloadRoutes(routes: Array<{ preload: () => void }>) {
  routes.forEach(route => {
    if (route.preload) {
      route.preload();
    }
  });
}

/**
 * 路由優先級預加載
 */
export function preloadByPriority(routeMap: Record<string, { preload: () => void; priority: number }>) {
  const sortedRoutes = Object.values(routeMap)
    .sort((a, b) => a.priority - b.priority);

  sortedRoutes.forEach((route, index) => {
    setTimeout(() => {
      route.preload();
    }, index * 500); // 錯開加載時間
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#7f1d1d',
    textAlign: 'center',
  },
});

export default createLazyRoute;