/**
 * Authentication Error Handler
 * 全域認證錯誤處理器，監聽並處理認證失效事件
 */

import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';

export const useAuthErrorHandler = () => {
  const { isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    // 監聽未捕獲的 Promise 拒絕（通常是 API 錯誤）
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;

      // 檢查是否是認證錯誤
      if (error?.name === 'AuthenticationError' ||
          error?.message === 'Unauthenticated' ||
          (error?.response?.status === 401)) {

        console.warn('🔐 Authentication error detected, logging out user');

        // 防止錯誤向上傳播
        event.preventDefault();

        // 如果用戶目前還在認證狀態，則登出
        if (isAuthenticated) {
          logout();

          // 跳轉到登入頁面
          try {
            router.replace('/login');
          } catch (navError) {
            console.error('Navigation error during auth error handling:', navError);
            // Web fallback
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }
      }
    };

    // 監聽全域錯誤
    const handleError = (event: ErrorEvent) => {
      const error = event.error;

      if (error?.name === 'AuthenticationError' ||
          error?.message === 'Unauthenticated') {

        console.warn('🔐 Global authentication error detected');

        if (isAuthenticated) {
          logout();

          try {
            router.replace('/login');
          } catch (navError) {
            console.error('Navigation error during global error handling:', navError);
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }
      }
    };

    // 註冊事件監聽器
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      window.addEventListener('error', handleError);
    }

    // 清理函數
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        window.removeEventListener('error', handleError);
      }
    };
  }, [isAuthenticated, logout]);
};
