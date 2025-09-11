/**
 * Protected Route Component
 * 保護路由組件 - 檢查用戶認證狀態並重定向到登入頁面
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAuthStore } from '../../stores/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  redirectTo = '/login'
}) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const segments = useSegments();
  const [isNavigationReady, setIsNavigationReady] = React.useState(false);

  // 等待導航系統準備就緒
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100); // 給 Root Layout 時間掛載

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 只有在導航系統準備就緒且認證檢查完成後才執行導航
    if (!isLoading && isNavigationReady) {
      const isInProtectedRoute = segments[0] === '(tabs)' || segments[0] === 'chat';
      const isInAuthRoute = segments[0] === 'login' || segments[0] === 'register';
      
      console.log('🛡️ ProtectedRoute check:', {
        isAuthenticated,
        isLoading,
        segments,
        isInProtectedRoute,
        isInAuthRoute,
        isNavigationReady,
        user: user?.name || 'none'
      });

      // 只有在受保護路由且未認證時才重定向
      if (!isAuthenticated && isInProtectedRoute) {
        console.log('🚨 Redirecting unauthenticated user to login');
        // 使用 requestAnimationFrame 確保在下一個渲染週期執行
        requestAnimationFrame(() => {
          try {
            router.replace(redirectTo);
          } catch (error) {
            console.error('Navigation error:', error);
            // 如果導航失敗，嘗試使用 window.location（僅在 web 上）
            if (typeof window !== 'undefined') {
              window.location.href = redirectTo;
            }
          }
        });
      }
    }
  }, [isAuthenticated, isLoading, segments, isNavigationReady, redirectTo]);

  // Show loading state while authentication is being checked or navigation is not ready
  if (isLoading || !isNavigationReady) {
    return fallback || (
      <View style={styles.loadingContainer} testID="auth-loading">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>
          {isLoading ? 'Checking authentication...' : 'Preparing navigation...'}
        </Text>
      </View>
    );
  }

  // If not authenticated, only show redirect for protected routes
  if (!isAuthenticated) {
    const isInProtectedRoute = segments[0] === '(tabs)' || segments[0] === 'chat';
    const isInAuthRoute = segments[0] === 'login' || segments[0] === 'register';
    
    // 如果在認證頁面（登入/註冊），直接渲染子組件
    if (isInAuthRoute) {
      return <>{children}</>;
    }
    
    // 如果在受保護路由，顯示重定向載入畫面
    if (isInProtectedRoute) {
      return fallback || (
        <View style={styles.loadingContainer} testID="auth-redirect">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Redirecting to login...</Text>
        </View>
      );
    }
    
    // 其他路由直接渲染
    return <>{children}</>;
  }

  // If authenticated, render the protected content
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default ProtectedRoute;