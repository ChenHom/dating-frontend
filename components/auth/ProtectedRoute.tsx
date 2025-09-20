/**
 * Protected Route Component
 * 掛在根佈局上，根據認證狀態決定是否重導
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect, useSegments } from 'expo-router';
import { useAuthStore } from '@/stores/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

const PROTECTED_SEGMENTS = new Set(['(tabs)', 'chat', 'profile', 'settings']);
const AUTH_SEGMENTS = new Set(['login', 'register', '(auth)']);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const isNavigationReady = Array.isArray(segments);
  const currentSegment = Array.isArray(segments) ? segments[0] : undefined;

  const isInProtectedRoute = PROTECTED_SEGMENTS.has(currentSegment as string);
  const isInAuthRoute = AUTH_SEGMENTS.has(currentSegment as string);

  if (isLoading || !isNavigationReady) {
    return (
      fallback || (
        <View style={styles.loadingContainer} testID="auth-loading">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>
            {isLoading ? 'Checking authentication...' : 'Preparing navigation...'}
          </Text>
        </View>
      )
    );
  }

  if (!isAuthenticated) {
    if (isInProtectedRoute) {
      return <Redirect href={redirectTo} />;
    }

    return <>{children}</>;
  }

  if (isAuthenticated && isInAuthRoute) {
    return <Redirect href="/(tabs)/discover" />;
  }

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
