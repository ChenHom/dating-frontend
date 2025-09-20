/**
 * 統一推送通知服務管理器
 * 整合 PushNotificationService、NotificationManager 和應用狀態管理
 * 提供完整的通知系統生命週期管理
 */

import { AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { pushNotificationService } from './PushNotificationService';
import { notificationManager, NotificationData, NotificationListener } from './NotificationManager';
import { useNotificationStore } from '@/stores/notification';
import { useAuthStore } from '@/stores/auth';

export interface NotificationServiceConfig {
  autoRegisterOnLogin?: boolean;
  autoUnregisterOnLogout?: boolean;
  handleDeepLinking?: boolean;
  logNotificationEvents?: boolean;
}

export interface NotificationContext {
  isAppInForeground: boolean;
  isUserLoggedIn: boolean;
  currentScreen?: string;
}

class NotificationServiceManager implements NotificationListener {
  private config: NotificationServiceConfig;
  private context: NotificationContext;
  private isInitialized = false;
  private appStateSubscription: any = null;
  private router: any = null;

  constructor(config: NotificationServiceConfig = {}) {
    this.config = {
      autoRegisterOnLogin: true,
      autoUnregisterOnLogout: true,
      handleDeepLinking: true,
      logNotificationEvents: true,
      ...config,
    };

    this.context = {
      isAppInForeground: AppState.currentState === 'active',
      isUserLoggedIn: false,
    };
  }

  /**
   * 初始化通知服務管理器
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      console.log('NotificationServiceManager already initialized');
      return true;
    }

    try {
      this.log('Initializing NotificationServiceManager...');

      // 設置應用狀態監聽
      this.setupAppStateListener();

      // 設置通知管理器監聽器
      notificationManager.addListener(this);

      // 初始化推送通知服務
      const pushToken = await pushNotificationService.initialize();

      if (pushToken) {
        this.log('Push notification service initialized with token:', pushToken);
      } else {
        this.log('Push notification service initialized without token (simulator or no permission)');
      }

      // 檢查用戶登錄狀態並自動註冊
      await this.checkAndRegisterUser();

      this.isInitialized = true;
      this.log('NotificationServiceManager initialized successfully');

      return true;
    } catch (error) {
      console.error('Failed to initialize NotificationServiceManager:', error);
      return false;
    }
  }

  /**
   * 設置應用狀態監聽器
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  /**
   * 處理應用狀態變化
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    const wasInBackground = !this.context.isAppInForeground;
    this.context.isAppInForeground = nextAppState === 'active';

    this.log('App state changed:', {
      from: wasInBackground ? 'background' : 'foreground',
      to: this.context.isAppInForeground ? 'foreground' : 'background',
    });

    // 從背景回到前台時清除徽章
    if (wasInBackground && this.context.isAppInForeground) {
      this.clearBadgeAndNotifications();

      // 檢查是否有待處理的通知需要處理
      this.handleAppForegroundReturn();
    }
  }

  /**
   * 應用回到前台時的處理邏輯
   */
  private async handleAppForegroundReturn(): Promise<void> {
    try {
      // 刷新通知狀態
      const notificationStore = useNotificationStore.getState();
      await notificationStore.refreshNotifications();

      // 清理過期通知
      notificationStore.clearExpiredNotifications();

      this.log('Handled app foreground return');
    } catch (error) {
      console.error('Error handling app foreground return:', error);
    }
  }

  /**
   * 用戶登錄時註冊推送服務
   */
  async registerUser(authToken: string): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('NotificationServiceManager not initialized');
      return false;
    }

    try {
      this.context.isUserLoggedIn = true;
      this.log('Registering user for push notifications...');

      // 註冊設備令牌到後端
      const success = await pushNotificationService.registerDeviceToken(authToken);

      if (success) {
        this.log('User registered for push notifications successfully');

        // 載入用戶的通知設置
        await this.loadUserNotificationSettings();

        return true;
      } else {
        console.error('Failed to register user for push notifications');
        return false;
      }
    } catch (error) {
      console.error('Error registering user for push notifications:', error);
      return false;
    }
  }

  /**
   * 用戶登出時取消註冊推送服務
   */
  async unregisterUser(authToken: string): Promise<boolean> {
    if (!this.isInitialized) {
      return true; // 如果未初始化就算成功
    }

    try {
      this.context.isUserLoggedIn = false;
      this.log('Unregistering user from push notifications...');

      // 取消設備令牌註冊
      const success = await pushNotificationService.unregisterDeviceToken(authToken);

      if (success) {
        this.log('User unregistered from push notifications successfully');
      }

      // 清除所有通知
      await this.clearAllNotifications();

      return success;
    } catch (error) {
      console.error('Error unregistering user from push notifications:', error);
      return false;
    }
  }

  /**
   * 檢查並自動註冊用戶
   */
  private async checkAndRegisterUser(): Promise<void> {
    if (!this.config.autoRegisterOnLogin) {
      return;
    }

    try {
      const authStore = useAuthStore.getState();

      if (authStore.isAuthenticated && authStore.token) {
        await this.registerUser(authStore.token);
      }
    } catch (error) {
      console.error('Error auto-registering user:', error);
    }
  }

  /**
   * 載入用戶通知設置
   */
  private async loadUserNotificationSettings(): Promise<void> {
    try {
      const notificationStore = useNotificationStore.getState();
      await notificationStore.loadNotifications();

      this.log('User notification settings loaded');
    } catch (error) {
      console.error('Error loading user notification settings:', error);
    }
  }

  /**
   * 設置路由器實例（用於深度鏈接）
   */
  setRouter(router: any): void {
    this.router = router;
    this.log('Router set for deep linking');
  }

  /**
   * 處理深度鏈接導航
   */
  private handleDeepLinkNavigation(notification: NotificationData): void {
    if (!this.config.handleDeepLinking || !this.router) {
      return;
    }

    try {
      switch (notification.type) {
        case 'game_invite':
          if (notification.conversationId) {
            this.router.push(`/conversation/${notification.conversationId}?game=true`);
          }
          break;

        case 'message':
          if (notification.conversationId) {
            this.router.push(`/conversation/${notification.conversationId}`);
          } else {
            this.router.push('/conversations');
          }
          break;

        case 'match':
          this.router.push('/matches');
          break;

        case 'gift':
          if (notification.conversationId) {
            this.router.push(`/conversation/${notification.conversationId}?tab=gifts`);
          } else {
            this.router.push('/gifts');
          }
          break;

        default:
          this.log('Unknown notification type for deep linking:', notification.type);
          break;
      }

      this.log('Deep link navigation handled:', notification.type);
    } catch (error) {
      console.error('Error handling deep link navigation:', error);
    }
  }

  /**
   * 清除徽章和系統通知
   */
  private async clearBadgeAndNotifications(): Promise<void> {
    try {
      await pushNotificationService.clearBadge();

      // 更新應用內未讀計數
      const notificationStore = useNotificationStore.getState();
      await notificationStore.markAllAsRead();

      this.log('Badge and notifications cleared');
    } catch (error) {
      console.error('Error clearing badge and notifications:', error);
    }
  }

  /**
   * 清除所有通知
   */
  private async clearAllNotifications(): Promise<void> {
    try {
      await pushNotificationService.cancelAllNotifications();
      await pushNotificationService.clearBadge();

      const notificationStore = useNotificationStore.getState();
      await notificationStore.clearAllNotifications();

      this.log('All notifications cleared');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }

  /**
   * 手動發送本地通知（用於測試或應用內事件）
   */
  sendLocalNotification(notification: Omit<NotificationData, 'source' | 'timestamp'>): void {
    const localNotification: NotificationData = {
      ...notification,
      source: 'local',
      timestamp: Date.now(),
    };

    notificationManager.handleLocalNotification(localNotification);
    this.log('Local notification sent:', notification.id);
  }

  /**
   * 獲取通知服務狀態
   */
  getServiceStatus() {
    return {
      isInitialized: this.isInitialized,
      pushTokenAvailable: pushNotificationService.getExpoPushTokenString() !== null,
      pushServiceInitialized: pushNotificationService.isServiceInitialized(),
      context: this.context,
      config: this.config,
      notificationStats: notificationManager.getStats(),
    };
  }

  // NotificationListener 實現
  onNotificationReceived(notification: NotificationData): void {
    this.log('Notification received via listener:', notification.id);

    // 添加到應用內通知存儲
    const notificationStore = useNotificationStore.getState();
    notificationStore.addNotification(notification);
  }

  onNotificationDisplayed(notification: NotificationData): void {
    this.log('Notification displayed:', notification.id);

    // 如果是遊戲邀請或其他需要即時響應的通知，執行深度鏈接
    if (this.context.isAppInForeground &&
        (notification.type === 'game_invite' || notification.source === 'push')) {
      setTimeout(() => {
        this.handleDeepLinkNavigation(notification);
      }, 500); // 延遲一點讓UI更新
    }
  }

  onNotificationHidden(notificationId: string): void {
    this.log('Notification hidden:', notificationId);
  }

  /**
   * 清理資源
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    notificationManager.removeListener(this);
    this.isInitialized = false;

    this.log('NotificationServiceManager cleaned up');
  }

  /**
   * 日誌輸出
   */
  private log(message: string, data?: any): void {
    if (!this.config.logNotificationEvents) {
      return;
    }

    if (data) {
      console.log(`[NotificationServiceManager] ${message}`, data);
    } else {
      console.log(`[NotificationServiceManager] ${message}`);
    }
  }
}

// 全局通知服務管理器實例
export const notificationServiceManager = new NotificationServiceManager({
  autoRegisterOnLogin: true,
  autoUnregisterOnLogout: true,
  handleDeepLinking: true,
  logNotificationEvents: __DEV__, // 只在開發模式下記錄日誌
});

export default NotificationServiceManager;