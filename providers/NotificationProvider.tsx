/**
 * 通知提供者 - 管理全局通知服務初始化和顯示
 */

import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { pushNotificationService } from '@/services/notifications/PushNotificationService';
import { notificationManager } from '@/services/notifications/NotificationManager';
import { webSocketConnectionManager } from '@/services/websocket/WebSocketConnectionManager';
import NotificationDisplay from '@/components/notifications/NotificationDisplay';
import { useAuthStore } from '@/stores/auth';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      initializeNotificationServices();
    } else {
      cleanupNotificationServices();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    // 監聽 App 狀態變化
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAuthenticated) {
        // App 進入前台時，清除徽章並重新初始化
        pushNotificationService.clearBadge();
        if (!isInitialized) {
          initializeNotificationServices();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isAuthenticated, isInitialized]);

  /**
   * 初始化通知服務
   */
  const initializeNotificationServices = async () => {
    try {
      console.log('Initializing notification services...');

      // 1. 初始化 WebSocket 連接管理器
      const webSocketSuccess = await webSocketConnectionManager.initialize(token!, {
        autoReconnect: true,
        maxReconnectAttempts: 5,
        reconnectDelay: 3000,
      });

      if (webSocketSuccess) {
        console.log('WebSocket connection manager initialized successfully');
      } else {
        console.warn('WebSocket connection manager initialization failed');
      }

      // 2. 初始化推送通知服務
      const pushToken = await pushNotificationService.initialize();

      if (pushToken && token) {
        // 註冊設備令牌到後端
        const registrationSuccess = await pushNotificationService.registerDeviceToken(token);

        if (registrationSuccess) {
          console.log('Push notification service initialized and registered successfully');
        } else {
          console.warn('Push notification registration failed');
        }
      } else {
        console.warn('Push notification initialization failed or no auth token available');
      }

      setIsInitialized(true);
      console.log('All notification services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification services:', error);
      setIsInitialized(false);
    }
  };

  /**
   * 清理通知服務
   */
  const cleanupNotificationServices = async () => {
    try {
      console.log('Cleaning up notification services...');

      // 1. 清理 WebSocket 連接
      webSocketConnectionManager.disconnect();

      // 2. 清理推送通知服務
      if (token) {
        // 停用設備令牌
        await pushNotificationService.unregisterDeviceToken(token);
      }

      // 取消所有通知
      await pushNotificationService.cancelAllNotifications();

      // 3. 清除通知管理器的狀態
      notificationManager.getDisplayedNotifications().forEach(notification => {
        notificationManager.hideNotification(notification.id);
      });

      setIsInitialized(false);
      console.log('All notification services cleaned up successfully');
    } catch (error) {
      console.error('Failed to cleanup notification services:', error);
    }
  };

  return (
    <>
      {children}
      {/* 全局通知顯示組件 - 只在已認證且已初始化時顯示 */}
      {isAuthenticated && isInitialized && <NotificationDisplay />}
    </>
  );
};

export default NotificationProvider;