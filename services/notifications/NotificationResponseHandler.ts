/**
 * 智能通知響應處理器
 * 根據通知類型、應用狀態和用戶上下文提供個性化的響應處理
 */

import { Alert, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { NotificationData } from './NotificationManager';
import { useGameStore } from '@/stores/game';
import { useConversationStore } from '@/stores/conversation';
import { useMatchStore } from '@/stores/match';
import { useGiftStore } from '@/stores/gift';

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'destructive';
  handler: () => Promise<void> | void;
  requiresAuth?: boolean;
  destructive?: boolean;
}

export interface NotificationResponse {
  shouldShowAlert: boolean;
  shouldNavigate: boolean;
  alertConfig?: {
    title: string;
    message: string;
    actions: NotificationAction[];
  };
  navigationTarget?: string;
  navigationParams?: Record<string, any>;
}

class NotificationResponseHandler {
  private router: any = null;

  /**
   * 設置路由器實例
   */
  setRouter(router: any): void {
    this.router = router;
  }

  /**
   * 處理通知響應
   */
  async handleNotification(notification: NotificationData): Promise<NotificationResponse> {
    const isAppInForeground = AppState.currentState === 'active';

    console.log('Handling notification response:', {
      id: notification.id,
      type: notification.type,
      isAppInForeground,
    });

    switch (notification.type) {
      case 'game_invite':
        return this.handleGameInviteNotification(notification, isAppInForeground);

      case 'message':
        return this.handleMessageNotification(notification, isAppInForeground);

      case 'match':
        return this.handleMatchNotification(notification, isAppInForeground);

      case 'gift':
        return this.handleGiftNotification(notification, isAppInForeground);

      default:
        return this.handleGenericNotification(notification, isAppInForeground);
    }
  }

  /**
   * 處理遊戲邀請通知
   */
  private async handleGameInviteNotification(
    notification: NotificationData,
    isAppInForeground: boolean
  ): Promise<NotificationResponse> {
    const senderName = notification.data?.sender_name || '好友';
    const invitationId = notification.data?.invitation_id;

    if (isAppInForeground) {
      // 應用在前台，顯示互動式彈窗
      return {
        shouldShowAlert: true,
        shouldNavigate: false,
        alertConfig: {
          title: '🎮 遊戲邀請',
          message: `${senderName} 邀請您玩剪刀石頭布！現在就開始挑戰吧！`,
          actions: [
            {
              id: 'decline',
              label: '稍後再說',
              type: 'secondary',
              handler: () => this.declineGameInvite(invitationId),
            },
            {
              id: 'accept',
              label: '開始遊戲',
              type: 'primary',
              handler: () => this.acceptGameInvite(notification),
              requiresAuth: true,
            },
          ],
        },
      };
    } else {
      // 應用在背景，直接導航到遊戲界面
      return {
        shouldShowAlert: false,
        shouldNavigate: true,
        navigationTarget: `/conversation/${notification.conversationId}`,
        navigationParams: { openGame: true, invitationId },
      };
    }
  }

  /**
   * 處理訊息通知
   */
  private async handleMessageNotification(
    notification: NotificationData,
    isAppInForeground: boolean
  ): Promise<NotificationResponse> {
    const senderName = notification.data?.sender_name || '好友';
    const messagePreview = notification.body || '發送了一條訊息';

    if (isAppInForeground) {
      // 應用在前台，顯示簡潔的通知條
      return {
        shouldShowAlert: true,
        shouldNavigate: false,
        alertConfig: {
          title: `💬 ${senderName}`,
          message: messagePreview,
          actions: [
            {
              id: 'ignore',
              label: '忽略',
              type: 'secondary',
              handler: () => this.markNotificationAsRead(notification.id),
            },
            {
              id: 'reply',
              label: '回覆',
              type: 'primary',
              handler: () => this.openConversation(notification.conversationId!),
              requiresAuth: true,
            },
          ],
        },
      };
    } else {
      // 應用在背景，直接導航到對話
      return {
        shouldShowAlert: false,
        shouldNavigate: true,
        navigationTarget: `/conversation/${notification.conversationId}`,
      };
    }
  }

  /**
   * 處理配對通知
   */
  private async handleMatchNotification(
    notification: NotificationData,
    isAppInForeground: boolean
  ): Promise<NotificationResponse> {
    const matchedUserName = notification.data?.matched_user_name || '新朋友';

    return {
      shouldShowAlert: isAppInForeground,
      shouldNavigate: !isAppInForeground,
      alertConfig: isAppInForeground ? {
        title: '💕 新配對！',
        message: `您和 ${matchedUserName} 互相喜歡了！開始聊天吧！`,
        actions: [
          {
            id: 'later',
            label: '稍後查看',
            type: 'secondary',
            handler: () => this.markNotificationAsRead(notification.id),
          },
          {
            id: 'chat',
            label: '開始聊天',
            type: 'primary',
            handler: () => this.openNewMatch(notification.data?.match_id),
            requiresAuth: true,
          },
        ],
      } : undefined,
      navigationTarget: !isAppInForeground ? '/matches' : undefined,
    };
  }

  /**
   * 處理禮物通知
   */
  private async handleGiftNotification(
    notification: NotificationData,
    isAppInForeground: boolean
  ): Promise<NotificationResponse> {
    const senderName = notification.data?.sender_name || '好友';
    const giftName = notification.data?.gift_name || '禮物';

    if (isAppInForeground) {
      return {
        shouldShowAlert: true,
        shouldNavigate: false,
        alertConfig: {
          title: '🎁 收到禮物！',
          message: `${senderName} 送給您一個 ${giftName}！`,
          actions: [
            {
              id: 'thank',
              label: '查看禮物',
              type: 'primary',
              handler: () => this.viewGift(notification),
              requiresAuth: true,
            },
          ],
        },
      };
    } else {
      return {
        shouldShowAlert: false,
        shouldNavigate: true,
        navigationTarget: `/conversation/${notification.conversationId}`,
        navigationParams: { tab: 'gifts' },
      };
    }
  }

  /**
   * 處理通用通知
   */
  private async handleGenericNotification(
    notification: NotificationData,
    isAppInForeground: boolean
  ): Promise<NotificationResponse> {
    return {
      shouldShowAlert: isAppInForeground,
      shouldNavigate: !isAppInForeground,
      alertConfig: isAppInForeground ? {
        title: notification.title,
        message: notification.body,
        actions: [
          {
            id: 'ok',
            label: '確定',
            type: 'primary',
            handler: () => this.markNotificationAsRead(notification.id),
          },
        ],
      } : undefined,
      navigationTarget: !isAppInForeground ? '/' : undefined,
    };
  }

  /**
   * 執行通知響應
   */
  async executeResponse(response: NotificationResponse): Promise<void> {
    if (response.shouldShowAlert && response.alertConfig) {
      this.showAlert(response.alertConfig);
    }

    if (response.shouldNavigate && response.navigationTarget && this.router) {
      await this.navigate(response.navigationTarget, response.navigationParams);
    }
  }

  /**
   * 顯示彈窗
   */
  private showAlert(config: NotificationResponse['alertConfig']): void {
    if (!config) return;

    const buttons = config.actions.map(action => ({
      text: action.label,
      style: action.type === 'destructive' ? 'destructive' :
             action.type === 'secondary' ? 'cancel' : 'default',
      onPress: () => {
        try {
          action.handler();
        } catch (error) {
          console.error('Error executing notification action:', error);
        }
      },
    }));

    Alert.alert(config.title, config.message, buttons);
  }

  /**
   * 導航到目標頁面
   */
  private async navigate(target: string, params?: Record<string, any>): Promise<void> {
    if (!this.router) {
      console.error('Router not available for navigation');
      return;
    }

    try {
      if (params) {
        this.router.push({ pathname: target, params });
      } else {
        this.router.push(target);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  // 動作處理器方法

  private async acceptGameInvite(notification: NotificationData): Promise<void> {
    try {
      const gameStore = useGameStore.getState();
      await gameStore.acceptInvitation(notification.data?.invitation_id);

      if (this.router && notification.conversationId) {
        this.router.push(`/conversation/${notification.conversationId}?game=true`);
      }
    } catch (error) {
      console.error('Error accepting game invite:', error);
      Alert.alert('錯誤', '無法接受遊戲邀請，請稍後再試');
    }
  }

  private async declineGameInvite(invitationId: string): Promise<void> {
    try {
      const gameStore = useGameStore.getState();
      await gameStore.declineInvitation(invitationId);
    } catch (error) {
      console.error('Error declining game invite:', error);
    }
  }

  private async openConversation(conversationId: number): Promise<void> {
    if (this.router) {
      this.router.push(`/conversation/${conversationId}`);
    }
  }

  private async openNewMatch(matchId: string): Promise<void> {
    try {
      const matchStore = useMatchStore.getState();
      const match = await matchStore.getMatchById(matchId);

      if (match && this.router) {
        this.router.push(`/conversation/${match.conversation_id}`);
      } else if (this.router) {
        this.router.push('/matches');
      }
    } catch (error) {
      console.error('Error opening new match:', error);
      if (this.router) {
        this.router.push('/matches');
      }
    }
  }

  private async viewGift(notification: NotificationData): Promise<void> {
    try {
      if (notification.conversationId) {
        const giftStore = useGiftStore.getState();
        await giftStore.loadGiftHistory(notification.conversationId);

        if (this.router) {
          this.router.push(`/conversation/${notification.conversationId}?tab=gifts`);
        }
      }
    } catch (error) {
      console.error('Error viewing gift:', error);
    }
  }

  private async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      // 這裡可以調用 API 或更新本地狀態
      console.log('Marking notification as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
}

// 全局通知響應處理器實例
export const notificationResponseHandler = new NotificationResponseHandler();

export default NotificationResponseHandler;