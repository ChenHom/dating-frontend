/**
 * 通知管理器 - 處理 WebSocket 和 Push Notification 的去重顯示
 * 確保同一邀請只顯示一個通知給用戶
 */

export interface NotificationData {
  id: string; // 唯一標識符 (邀請ID、訊息ID等)
  type: 'game_invite' | 'message' | 'match' | 'gift';
  title: string;
  body: string;
  data?: any;
  source: 'websocket' | 'push' | 'local'; // 通知來源
  timestamp: number;
  conversationId?: number;
  senderId?: number;
}

export interface NotificationDisplayOptions {
  showInApp?: boolean;     // 是否顯示 App 內彈窗
  showSystemPush?: boolean; // 是否顯示系統推送
  autoHide?: boolean;      // 是否自動隱藏
  hideDelay?: number;      // 自動隱藏延遲 (毫秒)
  priority?: 'high' | 'normal' | 'low'; // 通知優先級
}

export interface NotificationListener {
  onNotificationReceived: (notification: NotificationData) => void;
  onNotificationDisplayed: (notification: NotificationData) => void;
  onNotificationHidden: (notificationId: string) => void;
}

class NotificationManager {
  private listeners: NotificationListener[] = [];
  private displayedNotifications: Map<string, NotificationData> = new Map();
  private pendingNotifications: Map<string, NodeJS.Timeout> = new Map();
  private notificationHistory: Map<string, number> = new Map(); // ID -> timestamp

  // 通知去重窗口 (毫秒) - 同一 ID 在此時間內只顯示一次
  private readonly DEDUP_WINDOW = 5000; // 5 秒

  // WebSocket 優先級延遲 (毫秒) - WebSocket 通知優先，Push 延遲顯示
  private readonly WEBSOCKET_PRIORITY_DELAY = 1000; // 1 秒

  /**
   * 接收 WebSocket 通知
   */
  handleWebSocketNotification(notification: NotificationData): void {
    const enhancedNotification = {
      ...notification,
      source: 'websocket' as const,
      timestamp: Date.now(),
    };

    console.log('WebSocket notification received:', enhancedNotification);

    // WebSocket 通知立即處理
    this.processNotification(enhancedNotification, {
      showInApp: true,
      showSystemPush: false, // WebSocket 時不顯示系統推送
      priority: 'high',
      autoHide: notification.type === 'game_invite' ? false : true,
      hideDelay: 5000,
    });
  }

  /**
   * 接收 Push Notification
   */
  handlePushNotification(notification: NotificationData): void {
    const enhancedNotification = {
      ...notification,
      source: 'push' as const,
      timestamp: Date.now(),
    };

    console.log('Push notification received:', enhancedNotification);

    // 檢查是否已經有 WebSocket 通知
    const recentWebSocketNotification = this.hasRecentNotification(notification.id, 'websocket');

    if (recentWebSocketNotification) {
      console.log(`Skipping push notification ${notification.id} - WebSocket already handled`);
      return;
    }

    // Push 通知延遲處理，給 WebSocket 優先機會
    const timeoutId = setTimeout(() => {
      this.pendingNotifications.delete(notification.id);

      // 再次檢查是否有 WebSocket 通知已處理
      if (!this.hasRecentNotification(notification.id, 'websocket')) {
        this.processNotification(enhancedNotification, {
          showInApp: true,
          showSystemPush: true, // 離線時才會收到 Push，顯示系統推送
          priority: 'normal',
          autoHide: notification.type === 'game_invite' ? false : true,
          hideDelay: 8000,
        });
      }
    }, this.WEBSOCKET_PRIORITY_DELAY);

    this.pendingNotifications.set(notification.id, timeoutId);
  }

  /**
   * 處理本地通知 (App 內生成)
   */
  handleLocalNotification(notification: NotificationData, options?: NotificationDisplayOptions): void {
    const enhancedNotification = {
      ...notification,
      source: 'local' as const,
      timestamp: Date.now(),
    };

    console.log('Local notification created:', enhancedNotification);

    this.processNotification(enhancedNotification, {
      showInApp: true,
      showSystemPush: false,
      priority: 'normal',
      autoHide: true,
      hideDelay: 3000,
      ...options,
    });
  }

  /**
   * 處理通知的核心邏輯
   */
  private processNotification(notification: NotificationData, options: NotificationDisplayOptions): void {
    // 檢查去重
    if (this.isDuplicateNotification(notification)) {
      console.log(`Duplicate notification blocked: ${notification.id}`);
      return;
    }

    // 記錄通知歷史
    this.notificationHistory.set(notification.id, notification.timestamp);

    // 通知監聽器
    this.notifyListeners('onNotificationReceived', notification);

    // 顯示通知
    if (options.showInApp) {
      this.displayInAppNotification(notification, options);
    }

    // 系統推送通知 (通常由系統處理，這裡只是記錄)
    if (options.showSystemPush) {
      console.log('System push notification would be shown:', notification);
    }

    // 自動隱藏
    if (options.autoHide && options.hideDelay) {
      setTimeout(() => {
        this.hideNotification(notification.id);
      }, options.hideDelay);
    }
  }

  /**
   * 顯示 App 內通知
   */
  private displayInAppNotification(notification: NotificationData, options: NotificationDisplayOptions): void {
    // 存儲正在顯示的通知
    this.displayedNotifications.set(notification.id, notification);

    // 通知監聽器顯示通知
    this.notifyListeners('onNotificationDisplayed', notification);

    console.log(`Displaying in-app notification: ${notification.id}`, {
      title: notification.title,
      body: notification.body,
      priority: options.priority,
    });
  }

  /**
   * 隱藏通知
   */
  hideNotification(notificationId: string): void {
    if (this.displayedNotifications.has(notificationId)) {
      this.displayedNotifications.delete(notificationId);
      this.notifyListeners('onNotificationHidden', notificationId);
      console.log(`Notification hidden: ${notificationId}`);
    }

    // 取消待處理的通知
    const pendingTimeout = this.pendingNotifications.get(notificationId);
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      this.pendingNotifications.delete(notificationId);
    }
  }

  /**
   * 檢查是否為重複通知
   */
  private isDuplicateNotification(notification: NotificationData): boolean {
    const lastTimestamp = this.notificationHistory.get(notification.id);

    if (!lastTimestamp) {
      return false;
    }

    const timeDiff = notification.timestamp - lastTimestamp;
    return timeDiff < this.DEDUP_WINDOW;
  }

  /**
   * 檢查是否有最近的特定來源通知
   */
  private hasRecentNotification(notificationId: string, source: string): boolean {
    const lastTimestamp = this.notificationHistory.get(notificationId);

    if (!lastTimestamp) {
      return false;
    }

    const timeDiff = Date.now() - lastTimestamp;
    return timeDiff < this.WEBSOCKET_PRIORITY_DELAY;
  }

  /**
   * 添加監聽器
   */
  addListener(listener: NotificationListener): void {
    this.listeners.push(listener);
  }

  /**
   * 移除監聽器
   */
  removeListener(listener: NotificationListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知所有監聽器
   */
  private notifyListeners(method: keyof NotificationListener, ...args: any[]): void {
    this.listeners.forEach(listener => {
      try {
        (listener[method] as Function)(...args);
      } catch (error) {
        console.error(`Error in notification listener ${method}:`, error);
      }
    });
  }

  /**
   * 獲取當前顯示的通知
   */
  getDisplayedNotifications(): NotificationData[] {
    return Array.from(this.displayedNotifications.values());
  }

  /**
   * 清理過期的通知歷史
   */
  cleanup(): void {
    const now = Date.now();
    const expiredIds: string[] = [];

    this.notificationHistory.forEach((timestamp, id) => {
      if (now - timestamp > this.DEDUP_WINDOW * 2) { // 保留雙倍時間
        expiredIds.push(id);
      }
    });

    expiredIds.forEach(id => {
      this.notificationHistory.delete(id);
    });

    if (expiredIds.length > 0) {
      console.log(`Cleaned up ${expiredIds.length} expired notification records`);
    }
  }

  /**
   * 獲取統計信息
   */
  getStats() {
    return {
      displayedCount: this.displayedNotifications.size,
      pendingCount: this.pendingNotifications.size,
      historyCount: this.notificationHistory.size,
      dedupWindow: this.DEDUP_WINDOW,
      priorityDelay: this.WEBSOCKET_PRIORITY_DELAY,
    };
  }
}

// 全局通知管理器實例
export const notificationManager = new NotificationManager();

// 定期清理過期記錄
setInterval(() => {
  notificationManager.cleanup();
}, 30000); // 每 30 秒清理一次

export default NotificationManager;