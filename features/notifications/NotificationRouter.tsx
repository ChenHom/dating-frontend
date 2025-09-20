/**
 * NotificationRouter Component
 * 智能通知路由器 - 處理通知點擊、深度鏈接和頁面跳轉
 */

import React, { useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { NotificationData } from '@/services/notifications/NotificationManager';
import { notificationServiceManager } from '@/services/notifications/NotificationServiceManager';
import { notificationResponseHandler } from '@/services/notifications/NotificationResponseHandler';
import { useNotificationStore } from '@/stores/notification';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { useGiftStore } from '@/stores/gift';

interface NotificationRouterProps {
  children?: React.ReactNode;
}

export const NotificationRouter: React.FC<NotificationRouterProps> = ({
  children,
}) => {
  const router = useRouter();
  const appState = useRef(AppState.currentState);

  // Stores
  const { addNotification } = useNotificationStore();
  const { user } = useAuthStore();
  const { showGameModal } = useGameStore();
  const { loadGiftHistory } = useGiftStore();

  // 設置通知監聽器
  useEffect(() => {
    // 初始化通知服務管理器
    const initializeNotificationServices = async () => {
      await notificationServiceManager.initialize();
      notificationServiceManager.setRouter(router);
      notificationResponseHandler.setRouter(router);
    };

    initializeNotificationServices();

    // 監聽收到的通知
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    // 監聽通知點擊
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // 監聽應用狀態變化
    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    // 處理啟動時的通知
    handleLaunchNotification();

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
      appStateSubscription?.remove();
    };
  }, []);

  // 處理應用狀態變化
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // 應用從後台回到前台，檢查待處理的通知
      checkPendingNotifications();
    }
    appState.current = nextAppState;
  };

  // 處理啟動時的通知
  const handleLaunchNotification = async () => {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) {
      handleNotificationResponse(response);
    }
  };

  // 檢查待處理的通知
  const checkPendingNotifications = async () => {
    // 這裡可以檢查是否有未處理的通知或更新
    console.log('Checking for pending notifications...');
  };

  // 處理收到的通知
  const handleNotificationReceived = (notification: Notifications.Notification) => {
    const { request } = notification;
    const { content, identifier } = request;

    // 將通知添加到本地 store
    const notificationData: NotificationData = {
      id: identifier,
      type: content.data?.type || 'message',
      title: content.title || '新通知',
      body: content.body || '',
      data: content.data,
      source: 'push',
      timestamp: Date.now(),
      conversationId: content.data?.conversation_id ? Number(content.data.conversation_id) : undefined,
      senderId: content.data?.sender_id ? Number(content.data.sender_id) : undefined,
    };

    addNotification(notificationData);

    // 處理特定類型的通知
    handleSpecificNotification(notificationData);
  };

  // 處理通知點擊
  const handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
    const { notification } = response;
    const { request } = notification;
    const { content } = request;

    if (!content.data) return;

    // 解析通知數據
    const notificationData: NotificationData = {
      id: request.identifier,
      type: content.data.type || 'message',
      title: content.title || '新通知',
      body: content.body || '',
      data: content.data,
      source: 'push',
      timestamp: Date.now(),
      conversationId: content.data.conversation_id ? Number(content.data.conversation_id) : undefined,
      senderId: content.data.sender_id ? Number(content.data.sender_id) : undefined,
    };

    try {
      // 使用智能響應處理器處理通知
      const responseConfig = await notificationResponseHandler.handleNotification(notificationData);
      await notificationResponseHandler.executeResponse(responseConfig);

      // 將通知添加到本地存儲
      addNotification(notificationData);
    } catch (error) {
      console.error('Error handling notification response:', error);
      // 回退到傳統路由方式
      routeToNotificationDestination(notificationData);
    }
  };

  // 處理特定類型的通知
  const handleSpecificNotification = async (notification: NotificationData) => {
    try {
      // 使用智能響應處理器處理前台通知
      const responseConfig = await notificationResponseHandler.handleNotification(notification);

      // 如果需要顯示彈窗且應用在前台，則執行響應
      if (responseConfig.shouldShowAlert && AppState.currentState === 'active') {
        await notificationResponseHandler.executeResponse(responseConfig);
      } else {
        // 否則使用傳統的處理方式
        handleLegacyNotification(notification);
      }
    } catch (error) {
      console.error('Error handling specific notification:', error);
      // 回退到傳統處理方式
      handleLegacyNotification(notification);
    }
  };

  // 傳統通知處理方式（保留作為回退）
  const handleLegacyNotification = (notification: NotificationData) => {
    switch (notification.type) {
      case 'game_invite':
        handleGameInviteNotification(notification);
        break;
      case 'message':
        handleMessageNotification(notification);
        break;
      case 'gift':
        handleGiftNotification(notification);
        break;
      case 'match':
        handleMatchNotification(notification);
        break;
      default:
        console.log('Unknown notification type:', notification.type);
    }
  };

  // 處理遊戲邀請通知
  const handleGameInviteNotification = (notification: NotificationData) => {
    if (AppState.currentState === 'active') {
      // 應用在前台，顯示遊戲邀請彈窗
      Alert.alert(
        '遊戲邀請',
        notification.body,
        [
          { text: '拒絕', style: 'cancel' },
          {
            text: '接受',
            onPress: () => {
              if (notification.conversationId) {
                showGameModal();
                router.push(`/conversation/${notification.conversationId}`);
              }
            },
          },
        ]
      );
    }
  };

  // 處理訊息通知
  const handleMessageNotification = (notification: NotificationData) => {
    // 可以在這裡更新未讀計數或其他邏輯
    console.log('New message notification:', notification);
  };

  // 處理禮物通知
  const handleGiftNotification = (notification: NotificationData) => {
    if (AppState.currentState === 'active') {
      // 刷新禮物歷史
      loadGiftHistory(notification.conversationId);

      // 顯示禮物接收動畫（如果應用在前台）
      // 這個邏輯可能需要通過其他方式實現，比如全局事件
      console.log('Gift received notification:', notification);
    }
  };

  // 處理配對通知
  const handleMatchNotification = (notification: NotificationData) => {
    if (AppState.currentState === 'active') {
      Alert.alert(
        '新配對',
        notification.body,
        [
          { text: '稍後查看', style: 'cancel' },
          {
            text: '立即查看',
            onPress: () => {
              router.push('/matches');
            },
          },
        ]
      );
    }
  };

  // 路由到通知目標頁面
  const routeToNotificationDestination = (notification: NotificationData) => {
    if (!user) {
      // 用戶未登錄，跳轉到登錄頁面
      router.push('/login');
      return;
    }

    switch (notification.type) {
      case 'game_invite':
        if (notification.conversationId) {
          showGameModal();
          router.push(`/conversation/${notification.conversationId}`);
        }
        break;

      case 'message':
        if (notification.conversationId) {
          router.push(`/conversation/${notification.conversationId}`);
        } else {
          router.push('/conversations');
        }
        break;

      case 'gift':
        if (notification.conversationId) {
          router.push(`/conversation/${notification.conversationId}`);
        } else {
          router.push('/gifts/history');
        }
        break;

      case 'match':
        router.push('/matches');
        break;

      default:
        // 默認跳轉到主頁
        router.push('/');
    }
  };

  // 公開方法供其他組件使用
  const navigateToNotification = (notification: NotificationData) => {
    routeToNotificationDestination(notification);
  };

  // 處理深度鏈接（如果需要）
  const handleDeepLink = (url: string) => {
    // 解析深度鏈接並跳轉到相應頁面
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const searchParams = parsedUrl.searchParams;

      // 根據路徑進行路由
      if (pathname.startsWith('/conversation/')) {
        const conversationId = pathname.split('/')[2];
        if (conversationId) {
          router.push(`/conversation/${conversationId}`);
        }
      } else if (pathname === '/game') {
        const conversationId = searchParams.get('conversation_id');
        if (conversationId) {
          showGameModal();
          router.push(`/conversation/${conversationId}`);
        }
      } else if (pathname === '/gift') {
        const conversationId = searchParams.get('conversation_id');
        if (conversationId) {
          router.push(`/conversation/${conversationId}`);
        } else {
          router.push('/gifts/history');
        }
      } else {
        router.push(pathname);
      }
    } catch (error) {
      console.error('Failed to handle deep link:', error);
    }
  };

  return (
    <>
      {children}
    </>
  );
};

// Hook 供其他組件使用通知路由功能
export const useNotificationRouter = () => {
  const router = useRouter();
  const { addNotification } = useNotificationStore();

  const navigateToNotification = (notification: NotificationData) => {
    // 實現與 NotificationRouter 相同的路由邏輯
    switch (notification.type) {
      case 'game_invite':
        if (notification.conversationId) {
          router.push(`/conversation/${notification.conversationId}`);
        }
        break;
      case 'message':
        if (notification.conversationId) {
          router.push(`/conversation/${notification.conversationId}`);
        } else {
          router.push('/conversations');
        }
        break;
      case 'gift':
        if (notification.conversationId) {
          router.push(`/conversation/${notification.conversationId}`);
        } else {
          router.push('/gifts/history');
        }
        break;
      case 'match':
        router.push('/matches');
        break;
      default:
        router.push('/');
    }
  };

  const createLocalNotification = (notification: Omit<NotificationData, 'timestamp' | 'source'>) => {
    const enhancedNotification: NotificationData = {
      ...notification,
      source: 'local',
      timestamp: Date.now(),
    };
    addNotification(enhancedNotification);
  };

  return {
    navigateToNotification,
    createLocalNotification,
  };
};

export default NotificationRouter;