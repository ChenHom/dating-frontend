/**
 * Protected Route Hook
 * 保護路由鉤子 - 提供路由保護邏輯
 */

import { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useAuthStore } from '../stores/auth';

interface UseProtectedRouteOptions {
  redirectTo?: string;
  protectedSegments?: string[];
  publicSegments?: string[];
}

export const useProtectedRoute = (options: UseProtectedRouteOptions = {}) => {
  const {
    redirectTo = '/login',
    protectedSegments = ['(tabs)', 'chat', 'profile', 'matches'],
    publicSegments = ['login', 'register', '(auth)']
  } = options;

  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();

  const currentSegment = segments[0];
  const isInProtectedRoute = protectedSegments.includes(currentSegment);
  const isInPublicRoute = publicSegments.includes(currentSegment);

  useEffect(() => {
    if (!isLoading) {
      console.log('🛡️ useProtectedRoute:', {
        isAuthenticated,
        currentSegment,
        isInProtectedRoute,
        isInPublicRoute,
        segments
      });

      // Redirect unauthenticated users away from protected routes
      if (!isAuthenticated && isInProtectedRoute) {
        console.log('🚨 Redirecting to login:', redirectTo);
        router.replace(redirectTo);
        return;
      }

      // Redirect authenticated users away from auth routes
      if (isAuthenticated && isInPublicRoute) {
        console.log('✅ Redirecting authenticated user to discover tab');
        router.replace('/(tabs)/discover');
        return;
      }
    }
  }, [isAuthenticated, isLoading, currentSegment, isInProtectedRoute, isInPublicRoute]);

  return {
    isAuthenticated,
    isLoading,
    isInProtectedRoute,
    isInPublicRoute,
    canAccess: isAuthenticated || isInPublicRoute,
  };
};

export default useProtectedRoute;
