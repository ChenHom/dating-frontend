/**
 * Push Notification Service
 * 處理系統推送通知的接收和處理，並整合到通知管理器
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { notificationManager, NotificationData } from './NotificationManager';

// 配置通知處理行為
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: {
    type?: string;
    invitation_id?: string;
    conversation_id?: string;
    sender_id?: string;
    sender_name?: string;
    [key: string]: any;
  };
}

class PushNotificationService {
  private expoPushToken: string | null = null;
  private isInitialized = false;

  /**
   * 初始化推送通知服務
   */
  async initialize(): Promise<string | null> {
    if (this.isInitialized) {
      return this.expoPushToken;
    }

    try {
      // 檢查平台支持
      if (Platform.OS === 'web') {
        console.warn('Push notifications are not fully supported on web platform');
        this.isInitialized = true;
        return null;
      }

      // 檢查是否為實體設備
      if (!Device.isDevice) {
        console.warn('Push notifications are not supported on simulator/emulator');
        this.isInitialized = true;
        return null;
      }

      // 請求通知權限
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
      }

      // 獲取 Expo Push Token
      this.expoPushToken = await this.getExpoPushToken();

      // 設置通知監聽器
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('Push notification service initialized successfully');

      return this.expoPushToken;
    } catch (error) {
      console.error('Failed to initialize push notification service:', error);
      return null;
    }
  }

  /**
   * 獲取 Expo Push Token
   */
  private async getExpoPushToken(): Promise<string> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        throw new Error('Project ID not found');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('Expo Push Token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Failed to get Expo Push Token:', error);
      throw error;
    }
  }

  /**
   * 設置通知監聽器
   */
  private setupNotificationListeners(): void {
    // 監聽收到的通知 (App 在前台時)
    Notifications.addNotificationReceivedListener(this.handleNotificationReceived.bind(this));

    // 監聽通知點擊 (App 在背景或關閉時)
    Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse.bind(this));

    console.log('Push notification listeners set up');
  }

  /**
   * 處理收到的通知 (App 在前台)
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    console.log('Push notification received (foreground):', notification);

    const payload = notification.request.content;
    const notificationData = this.convertToNotificationData(payload);

    if (notificationData) {
      // 通過通知管理器處理 Push Notification
      notificationManager.handlePushNotification(notificationData);
    }
  }

  /**
   * 處理通知點擊響應 (App 在背景或關閉時)
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    console.log('Push notification response:', response);

    const payload = response.notification.request.content;
    const notificationData = this.convertToNotificationData(payload);

    if (notificationData) {
      // 通知被點擊時，直接處理業務邏輯
      this.handleNotificationAction(notificationData);
    }
  }

  /**
   * 將推送通知載荷轉換為通知數據格式
   */
  private convertToNotificationData(payload: Notifications.NotificationContent): NotificationData | null {
    try {
      const data = payload.data || {};
      const type = data.type || 'message';

      // 根據不同類型生成通知 ID
      let notificationId: string;
      switch (type) {
        case 'game_invite':
          notificationId = data.invitation_id || `game_invite_${Date.now()}`;
          break;
        case 'message':
          notificationId = data.message_id || `message_${Date.now()}`;
          break;
        case 'match':
          notificationId = data.match_id || `match_${Date.now()}`;
          break;
        case 'gift':
          notificationId = data.gift_id || `gift_${Date.now()}`;
          break;
        default:
          notificationId = `notification_${Date.now()}`;
          break;
      }

      return {
        id: notificationId,
        type: type as any,
        title: payload.title || 'Notification',
        body: payload.body || '',
        data: data,
        source: 'push',
        timestamp: Date.now(),
        conversationId: data.conversation_id ? parseInt(data.conversation_id) : undefined,
        senderId: data.sender_id ? parseInt(data.sender_id) : undefined,
      };
    } catch (error) {
      console.error('Failed to convert push notification payload:', error);
      return null;
    }
  }

  /**
   * 處理通知動作 (當 App 從背景喚醒或啟動時)
   */
  private handleNotificationAction(notification: NotificationData): void {
    console.log('Handling notification action:', notification);

    // 根據通知類型執行相應動作
    switch (notification.type) {
      case 'game_invite':
        this.handleGameInviteAction(notification);
        break;
      case 'message':
        this.handleMessageAction(notification);
        break;
      case 'match':
        this.handleMatchAction(notification);
        break;
      case 'gift':
        this.handleGiftAction(notification);
        break;
      default:
        console.log('Unknown notification type:', notification.type);
        break;
    }
  }

  /**
   * 處理遊戲邀請動作
   */
  private handleGameInviteAction(notification: NotificationData): void {
    // 導航到遊戲邀請處理界面
    console.log('Navigating to game invitation:', notification.id);

    // 這裡可以使用 navigation 服務導航到相應界面
    // 或者觸發應用內的遊戲邀請處理流程
  }

  /**
   * 處理訊息動作
   */
  private handleMessageAction(notification: NotificationData): void {
    // 導航到對話界面
    console.log('Navigating to conversation:', notification.conversationId);
  }

  /**
   * 處理配對動作
   */
  private handleMatchAction(notification: NotificationData): void {
    // 導航到配對界面
    console.log('Navigating to matches');
  }

  /**
   * 處理禮物動作
   */
  private handleGiftAction(notification: NotificationData): void {
    // 顯示禮物詳情
    console.log('Showing gift details:', notification.data);
  }

  /**
   * 註冊設備推送令牌到後端
   */
  async registerDeviceToken(authToken: string): Promise<boolean> {
    if (!this.expoPushToken) {
      console.warn('No push token available for registration');
      return false;
    }

    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

      const response = await fetch(`${API_BASE_URL}/push/devices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: Platform.OS,
          device_token: this.expoPushToken,
          app_version: Constants.expoConfig?.version || '1.0.0',
          device_model: Device.modelName || 'Unknown',
          os_version: Device.osVersion || 'Unknown',
        }),
      });

      if (response.ok) {
        console.log('Device token registered successfully');
        return true;
      } else {
        console.error('Failed to register device token:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error registering device token:', error);
      return false;
    }
  }

  /**
   * 停用設備推送令牌
   */
  async unregisterDeviceToken(authToken: string): Promise<boolean> {
    if (!this.expoPushToken) {
      return true; // 沒有令牌就算成功
    }

    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

      const response = await fetch(`${API_BASE_URL}/push/devices/${this.expoPushToken}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: false,
        }),
      });

      if (response.ok) {
        console.log('Device token unregistered successfully');
        return true;
      } else {
        console.error('Failed to unregister device token:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error unregistering device token:', error);
      return false;
    }
  }

  /**
   * 取得推送令牌
   */
  getExpoPushTokenString(): string | null {
    return this.expoPushToken;
  }

  /**
   * 檢查是否已初始化
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 清除通知徽章
   */
  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Failed to clear badge:', error);
    }
  }

  /**
   * 取消所有待處理的通知
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }
}

// 全局推送通知服務實例
export const pushNotificationService = new PushNotificationService();

export default PushNotificationService;