/**
 * 推送通知權限管理器
 * 處理推送通知權限請求、狀態管理和用戶引導
 */

import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PermissionState {
  status: PermissionStatus;
  canAskAgain: boolean;
  lastRequestTime: number | null;
  requestCount: number;
}

export interface PermissionRequestOptions {
  showRationale?: boolean;
  rationaleTitle?: string;
  rationaleMessage?: string;
  fallbackToSettings?: boolean;
}

class NotificationPermissionManager {
  private static readonly STORAGE_KEY = 'notification_permission_state';
  private static readonly MAX_REQUEST_COUNT = 3;
  private static readonly REQUEST_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * 獲取當前權限狀態
   */
  async getPermissionState(): Promise<PermissionState> {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      const storedState = await this.getStoredState();

      const permissionState: PermissionState = {
        status: status as PermissionStatus,
        canAskAgain,
        lastRequestTime: storedState.lastRequestTime,
        requestCount: storedState.requestCount,
      };

      return permissionState;
    } catch (error) {
      console.error('Error getting permission state:', error);
      return {
        status: 'undetermined',
        canAskAgain: true,
        lastRequestTime: null,
        requestCount: 0,
      };
    }
  }

  /**
   * 請求推送通知權限
   */
  async requestPermission(options: PermissionRequestOptions = {}): Promise<PermissionState> {
    const currentState = await this.getPermissionState();

    // 檢查是否已經授權
    if (currentState.status === 'granted') {
      return currentState;
    }

    // 檢查是否可以再次請求
    if (!this.canRequestPermission(currentState)) {
      console.log('Cannot request permission at this time');

      if (options.fallbackToSettings) {
        await this.showSettingsDialog();
      }

      return currentState;
    }

    // 顯示說明（如果需要）
    if (options.showRationale && currentState.requestCount > 0) {
      const shouldProceed = await this.showRationaleDialog(options);
      if (!shouldProceed) {
        return currentState;
      }
    }

    try {
      // 請求權限
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync();

      // 更新狀態
      const newState: PermissionState = {
        status: status as PermissionStatus,
        canAskAgain,
        lastRequestTime: Date.now(),
        requestCount: currentState.requestCount + 1,
      };

      await this.saveState(newState);

      // 處理權限結果
      await this.handlePermissionResult(newState, options);

      return newState;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return currentState;
    }
  }

  /**
   * 檢查是否可以請求權限
   */
  private canRequestPermission(state: PermissionState): boolean {
    // 如果從未請求過，可以請求
    if (state.requestCount === 0) {
      return true;
    }

    // 如果系統不允許再次請求，則不能請求
    if (!state.canAskAgain) {
      return false;
    }

    // 如果已達到最大請求次數，則不能請求
    if (state.requestCount >= NotificationPermissionManager.MAX_REQUEST_COUNT) {
      return false;
    }

    // 如果在冷卻期內，則不能請求
    if (state.lastRequestTime) {
      const timeSinceLastRequest = Date.now() - state.lastRequestTime;
      if (timeSinceLastRequest < NotificationPermissionManager.REQUEST_COOLDOWN) {
        return false;
      }
    }

    return true;
  }

  /**
   * 顯示權限說明對話框
   */
  private async showRationaleDialog(options: PermissionRequestOptions): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        options.rationaleTitle || '開啟推送通知',
        options.rationaleMessage ||
        '為了及時通知您新訊息、配對和遊戲邀請，我們需要您的推送通知權限。您可以隨時在設置中關閉特定類型的通知。',
        [
          {
            text: '稍後再說',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: '允許',
            onPress: () => resolve(true),
          },
        ]
      );
    });
  }

  /**
   * 處理權限請求結果
   */
  private async handlePermissionResult(
    state: PermissionState,
    options: PermissionRequestOptions
  ): Promise<void> {
    switch (state.status) {
      case 'granted':
        console.log('Push notification permission granted');
        break;

      case 'denied':
        if (options.fallbackToSettings && !state.canAskAgain) {
          // 如果被永久拒絕，引導用戶到設置
          setTimeout(() => {
            this.showSettingsDialog();
          }, 1000);
        } else {
          // 簡單的拒絕提示
          this.showDeniedMessage();
        }
        break;

      default:
        console.log('Push notification permission undetermined');
        break;
    }
  }

  /**
   * 顯示權限被拒絕的訊息
   */
  private showDeniedMessage(): void {
    Alert.alert(
      '推送通知已關閉',
      '您可能會錯過重要的訊息和通知。您可以隨時在設置中重新開啟。',
      [{ text: '我知道了' }]
    );
  }

  /**
   * 顯示設置對話框
   */
  private async showSettingsDialog(): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        '開啟推送通知',
        '要接收重要通知，請到設置中開啟推送通知權限。',
        [
          {
            text: '稍後再說',
            style: 'cancel',
            onPress: () => resolve(),
          },
          {
            text: '前往設置',
            onPress: async () => {
              await this.openAppSettings();
              resolve();
            },
          },
        ]
      );
    });
  }

  /**
   * 打開應用設置
   */
  private async openAppSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening app settings:', error);
      Alert.alert('錯誤', '無法打開設置，請手動前往設置 > 應用 > 通知來開啟推送通知');
    }
  }

  /**
   * 檢查權限狀態並提供適當的用戶體驗
   */
  async checkAndGuideUser(): Promise<PermissionState> {
    const state = await this.getPermissionState();

    if (state.status === 'granted') {
      return state;
    }

    // 如果是首次使用，顯示友好的介紹
    if (state.requestCount === 0) {
      return await this.requestPermission({
        showRationale: true,
        rationaleTitle: '保持聯繫',
        rationaleMessage: '開啟推送通知，第一時間收到新訊息、配對通知和遊戲邀請！',
        fallbackToSettings: false,
      });
    }

    // 如果之前被拒絕但可以再次請求
    if (state.status === 'denied' && state.canAskAgain && this.canRequestPermission(state)) {
      return await this.requestPermission({
        showRationale: true,
        rationaleTitle: '重新考慮推送通知？',
        rationaleMessage: '您可能會錯過重要的訊息和有趣的遊戲邀請。我們承諾只發送有意義的通知。',
        fallbackToSettings: true,
      });
    }

    // 如果被永久拒絕，引導到設置
    if (state.status === 'denied' && !state.canAskAgain) {
      await this.showSettingsDialog();
    }

    return state;
  }

  /**
   * 重置權限狀態（用於測試或特殊情況）
   */
  async resetPermissionState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(NotificationPermissionManager.STORAGE_KEY);
      console.log('Permission state reset');
    } catch (error) {
      console.error('Error resetting permission state:', error);
    }
  }

  /**
   * 獲取存儲的狀態
   */
  private async getStoredState(): Promise<Partial<PermissionState>> {
    try {
      const stored = await AsyncStorage.getItem(NotificationPermissionManager.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error getting stored permission state:', error);
    }

    return {
      lastRequestTime: null,
      requestCount: 0,
    };
  }

  /**
   * 保存狀態
   */
  private async saveState(state: PermissionState): Promise<void> {
    try {
      const toStore = {
        lastRequestTime: state.lastRequestTime,
        requestCount: state.requestCount,
      };

      await AsyncStorage.setItem(
        NotificationPermissionManager.STORAGE_KEY,
        JSON.stringify(toStore)
      );
    } catch (error) {
      console.error('Error saving permission state:', error);
    }
  }

  /**
   * 獲取權限管理統計信息
   */
  async getStats() {
    const state = await this.getPermissionState();
    const canRequest = this.canRequestPermission(state);

    return {
      currentStatus: state.status,
      canAskAgain: state.canAskAgain,
      requestCount: state.requestCount,
      canRequestNow: canRequest,
      timeSinceLastRequest: state.lastRequestTime ? Date.now() - state.lastRequestTime : null,
      maxRequestCount: NotificationPermissionManager.MAX_REQUEST_COUNT,
      cooldownPeriod: NotificationPermissionManager.REQUEST_COOLDOWN,
    };
  }
}

// 全局權限管理器實例
export const notificationPermissionManager = new NotificationPermissionManager();

export default NotificationPermissionManager;