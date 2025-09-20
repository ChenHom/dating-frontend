/**
 * 聊天通知整合器
 * 深度整合推送通知與聊天室功能，提供智能通知管理和實時同步
 */

import { AppState } from 'react-native';
import { useChatStore, Message, Conversation } from '@/stores/chat';
import { useNotificationStore } from '@/stores/notification';
import { notificationManager, NotificationData } from './NotificationManager';
import { notificationServiceManager } from './NotificationServiceManager';

export interface ChatNotificationConfig {
  enableSmartNotifications: boolean;
  enableTypingNotifications: boolean;
  enableReadReceipts: boolean;
  messagePreviewLength: number;
  groupSimilarNotifications: boolean;
  showSenderAvatar: boolean;
}

export interface ConversationNotificationState {
  conversationId: number;
  isActive: boolean;
  lastNotificationTime: number;
  pendingNotifications: NotificationData[];
  typingUsers: Set<number>;
  unreadCount: number;
}

class ChatNotificationIntegrator {
  private config: ChatNotificationConfig;
  private conversationStates: Map<number, ConversationNotificationState> = new Map();
  private isInitialized = false;
  private notificationTimeout: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<ChatNotificationConfig> = {}) {
    this.config = {
      enableSmartNotifications: true,
      enableTypingNotifications: false, // 通常不需要推送打字通知
      enableReadReceipts: true,
      messagePreviewLength: 50,
      groupSimilarNotifications: true,
      showSenderAvatar: true,
      ...config,
    };
  }

  /**
   * 初始化聊天通知整合器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 設置聊天 store 監聽器
      this.setupChatStoreListeners();

      // 設置應用狀態監聽器
      this.setupAppStateListener();

      // 初始化現有對話狀態
      await this.initializeConversationStates();

      this.isInitialized = true;
      console.log('ChatNotificationIntegrator initialized');
    } catch (error) {
      console.error('Failed to initialize ChatNotificationIntegrator:', error);
      throw error;
    }
  }

  /**
   * 設置聊天 store 監聽器
   */
  private setupChatStoreListeners(): void {
    // 監聽新訊息
    const chatStore = useChatStore.getState();

    // 這裡需要實現一個事件系統或使用 zustand 的 subscriptionsApi
    // 由於 zustand 的限制，我們將在聊天 store 中添加通知集成點
  }

  /**
   * 設置應用狀態監聽器
   */
  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // 應用回到前台時，清除待處理的聊天通知
        this.clearPendingChatNotifications();
        // 更新所有活躍對話的已讀狀態
        this.markActiveConversationsAsRead();
      } else if (nextAppState === 'background') {
        // 應用進入背景時，準備推送通知
        this.preparePushNotifications();
      }
    });
  }

  /**
   * 初始化對話狀態
   */
  private async initializeConversationStates(): Promise<void> {
    const chatStore = useChatStore.getState();
    const conversations = chatStore.conversations;

    conversations.forEach(conversation => {
      this.conversationStates.set(conversation.id, {
        conversationId: conversation.id,
        isActive: false,
        lastNotificationTime: 0,
        pendingNotifications: [],
        typingUsers: new Set(),
        unreadCount: conversation.unread_count || 0,
      });
    });
  }

  /**
   * 處理新訊息通知
   */
  async handleNewMessage(message: Message): Promise<void> {
    if (!this.isInitialized) {
      console.warn('ChatNotificationIntegrator not initialized');
      return;
    }

    const conversationId = message.conversation_id;
    const isAppInForeground = AppState.currentState === 'active';
    const isCurrentConversation = this.isCurrentActiveConversation(conversationId);

    // 獲取或創建對話狀態
    let conversationState = this.conversationStates.get(conversationId);
    if (!conversationState) {
      conversationState = {
        conversationId,
        isActive: false,
        lastNotificationTime: 0,
        pendingNotifications: [],
        typingUsers: new Set(),
        unreadCount: 0,
      };
      this.conversationStates.set(conversationId, conversationState);
    }

    // 更新未讀計數
    if (!isCurrentConversation || !isAppInForeground) {
      conversationState.unreadCount++;
    }

    // 決定是否發送通知
    const shouldNotify = this.shouldSendNotification(message, conversationState, isAppInForeground, isCurrentConversation);

    if (shouldNotify) {
      await this.createAndSendNotification(message, conversationState, isAppInForeground);
    }

    // 更新對話狀態
    conversationState.lastNotificationTime = Date.now();
    this.conversationStates.set(conversationId, conversationState);
  }

  /**
   * 判斷是否應該發送通知
   */
  private shouldSendNotification(
    message: Message,
    conversationState: ConversationNotificationState,
    isAppInForeground: boolean,
    isCurrentConversation: boolean
  ): boolean {
    // 如果是自己發送的訊息，不通知
    const currentUserId = useChatStore.getState().echoService.getUserId();
    if (message.sender_id === currentUserId) {
      return false;
    }

    // 如果應用在前台且是當前對話，不發送推送通知
    if (isAppInForeground && isCurrentConversation) {
      return false;
    }

    // 檢查通知設置
    const notificationSettings = useNotificationStore.getState().settings;
    if (!notificationSettings.categories.message) {
      return false;
    }

    // 檢查勿擾時間
    if (this.isInQuietHours(notificationSettings.quietHours)) {
      return false;
    }

    // 檢查是否在冷卻期內（避免過於頻繁的通知）
    const timeSinceLastNotification = Date.now() - conversationState.lastNotificationTime;
    const cooldownPeriod = 30000; // 30 秒冷卻期

    if (timeSinceLastNotification < cooldownPeriod && !this.config.groupSimilarNotifications) {
      return false;
    }

    return true;
  }

  /**
   * 創建並發送通知
   */
  private async createAndSendNotification(
    message: Message,
    conversationState: ConversationNotificationState,
    isAppInForeground: boolean
  ): Promise<void> {
    const senderName = message.sender.profile?.display_name || message.sender.name;
    const messagePreview = this.truncateMessage(message.content, this.config.messagePreviewLength);

    // 創建通知數據
    const notificationData: NotificationData = {
      id: `message_${message.id}`,
      type: 'message',
      title: senderName,
      body: messagePreview,
      data: {
        conversation_id: message.conversation_id.toString(),
        sender_id: message.sender_id.toString(),
        sender_name: senderName,
        message_id: message.id.toString(),
        sender_avatar: message.sender.profile?.primary_photo_url,
      },
      source: 'local',
      timestamp: Date.now(),
      conversationId: message.conversation_id,
      senderId: message.sender_id,
    };

    // 如果啟用分組，檢查是否有待處理的相似通知
    if (this.config.groupSimilarNotifications) {
      await this.handleGroupedNotification(notificationData, conversationState);
    } else {
      // 直接發送通知
      if (isAppInForeground) {
        notificationManager.handleLocalNotification(notificationData);
      } else {
        notificationServiceManager.sendLocalNotification(notificationData);
      }
    }

    // 添加到待處理通知列表
    conversationState.pendingNotifications.push(notificationData);
  }

  /**
   * 處理分組通知
   */
  private async handleGroupedNotification(
    notificationData: NotificationData,
    conversationState: ConversationNotificationState
  ): Promise<void> {
    const existingNotificationId = `conversation_${conversationState.conversationId}`;

    // 清除現有的通知超時
    const existingTimeout = this.notificationTimeout.get(existingNotificationId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // 延遲發送，以便合併相近時間的訊息
    const timeout = setTimeout(async () => {
      const pendingCount = conversationState.pendingNotifications.length;
      const senderName = notificationData.data?.sender_name || '好友';

      let groupedNotification: NotificationData;

      if (pendingCount === 1) {
        // 只有一條訊息，使用原始通知
        groupedNotification = notificationData;
      } else {
        // 多條訊息，創建摘要通知
        groupedNotification = {
          ...notificationData,
          id: existingNotificationId,
          title: senderName,
          body: `發送了 ${pendingCount} 條新訊息`,
          data: {
            ...notificationData.data,
            message_count: pendingCount.toString(),
            is_grouped: 'true',
          },
        };
      }

      // 發送分組通知
      if (AppState.currentState === 'active') {
        notificationManager.handleLocalNotification(groupedNotification);
      } else {
        notificationServiceManager.sendLocalNotification(groupedNotification);
      }

      // 清理待處理通知
      conversationState.pendingNotifications = [];
      this.notificationTimeout.delete(existingNotificationId);
    }, 2000); // 2 秒延遲

    this.notificationTimeout.set(existingNotificationId, timeout);
  }

  /**
   * 處理打字指示器
   */
  handleTypingIndicator(conversationId: number, userId: number, isTyping: boolean): void {
    if (!this.config.enableTypingNotifications) {
      return;
    }

    const conversationState = this.conversationStates.get(conversationId);
    if (!conversationState) {
      return;
    }

    if (isTyping) {
      conversationState.typingUsers.add(userId);
    } else {
      conversationState.typingUsers.delete(userId);
    }

    // 通常不發送打字通知到推送系統，只在應用內顯示
  }

  /**
   * 標記對話為已讀
   */
  markConversationAsRead(conversationId: number): void {
    const conversationState = this.conversationStates.get(conversationId);
    if (conversationState) {
      conversationState.unreadCount = 0;
      conversationState.pendingNotifications = [];

      // 清除相關的通知超時
      const notificationId = `conversation_${conversationId}`;
      const timeout = this.notificationTimeout.get(notificationId);
      if (timeout) {
        clearTimeout(timeout);
        this.notificationTimeout.delete(notificationId);
      }
    }

    // 從通知中心移除相關通知
    this.clearConversationNotifications(conversationId);
  }

  /**
   * 設置當前活躍對話
   */
  setActiveConversation(conversationId: number | null): void {
    // 重置所有對話的活躍狀態
    this.conversationStates.forEach((state) => {
      state.isActive = false;
    });

    // 設置新的活躍對話
    if (conversationId) {
      const conversationState = this.conversationStates.get(conversationId);
      if (conversationState) {
        conversationState.isActive = true;
        // 自動標記為已讀
        this.markConversationAsRead(conversationId);
      }
    }
  }

  /**
   * 清除待處理的聊天通知
   */
  private clearPendingChatNotifications(): void {
    this.conversationStates.forEach((state, conversationId) => {
      if (state.pendingNotifications.length > 0) {
        this.clearConversationNotifications(conversationId);
        state.pendingNotifications = [];
      }
    });
  }

  /**
   * 標記活躍對話為已讀
   */
  private markActiveConversationsAsRead(): void {
    const chatStore = useChatStore.getState();
    const currentConversationId = chatStore.currentConversationId;

    if (currentConversationId) {
      this.markConversationAsRead(currentConversationId);
      chatStore.markAsRead(currentConversationId);
    }
  }

  /**
   * 準備推送通知
   */
  private preparePushNotifications(): void {
    // 當應用進入背景時，確保推送通知服務已註冊
    // 這個邏輯通常在 NotificationServiceManager 中處理
  }

  /**
   * 輔助方法
   */

  private isCurrentActiveConversation(conversationId: number): boolean {
    const chatStore = useChatStore.getState();
    return chatStore.currentConversationId === conversationId;
  }

  private truncateMessage(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength - 3) + '...';
  }

  private isInQuietHours(quietHours: any): boolean {
    if (!quietHours?.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const startTime = quietHours.startTime;
    const endTime = quietHours.endTime;

    // 處理跨午夜的情況
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  private clearConversationNotifications(conversationId: number): void {
    // 這裡需要與通知管理器協作，清除特定對話的通知
    // 可以通過通知 ID 模式來識別相關通知
  }

  /**
   * 獲取統計信息
   */
  getStats() {
    const totalUnread = Array.from(this.conversationStates.values())
      .reduce((sum, state) => sum + state.unreadCount, 0);

    const activeConversations = Array.from(this.conversationStates.values())
      .filter(state => state.isActive).length;

    const pendingNotifications = Array.from(this.conversationStates.values())
      .reduce((sum, state) => sum + state.pendingNotifications.length, 0);

    return {
      isInitialized: this.isInitialized,
      totalUnreadMessages: totalUnread,
      activeConversations,
      pendingNotifications,
      conversationCount: this.conversationStates.size,
      config: this.config,
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ChatNotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// 全局聊天通知整合器實例
export const chatNotificationIntegrator = new ChatNotificationIntegrator();

export default ChatNotificationIntegrator;