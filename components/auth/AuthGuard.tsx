/**
 * Auth Guard Component
 * 路由守衛組件 - 保護需要登入才能存取的頁面
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, token, user } = useAuthStore();

  useEffect(() => {
    // Check authentication state
    if (!isAuthenticated || !token) {
      console.log('🚫 User not authenticated, redirecting to login');
      router.replace(redirectTo);
      return;
    }

    // Optional: Additional checks like user verification
    if (!user) {
      console.log('🚫 User data not available, redirecting to login');
      router.replace(redirectTo);
      return;
    }

    console.log('✅ User authenticated, allowing access');
  }, [isAuthenticated, token, user, redirectTo]);

  // Show loading while checking auth state
  if (!isAuthenticated || !token || !user) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
      }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // Render protected content
  return <>{children}</>;
};