/**
 * Notification Store - 通知狀態管理
 * 管理所有類型的通知、未讀計數、本地存儲等
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationData } from '@/services/notifications/NotificationManager';
import apiClient from '@/services/api/client';

export interface EnhancedNotificationData extends NotificationData {
  isRead: boolean;
  isPinned: boolean;
  category: 'personal' | 'system' | 'promotional';
  priority: 'high' | 'normal' | 'low';
  expiresAt?: number;
  actionButtons?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'destructive';
  action: () => void;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showInApp: boolean;
  categories: {
    game: boolean;
    message: boolean;
    gift: boolean;
    match: boolean;
    system: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
  };
}

interface NotificationState {
  // 通知數據
  notifications: EnhancedNotificationData[];
  unreadCount: number;
  isLoading: boolean;

  // 設置
  settings: NotificationSettings;

  // 錯誤狀態
  error: string | null;

  // Actions - 通知管理
  addNotification: (notification: NotificationData) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  pinNotification: (id: string) => void;
  unpinNotification: (id: string) => void;

  // Actions - 數據加載
  loadNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;

  // Actions - 設置管理
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  toggleCategory: (category: keyof NotificationSettings['categories']) => void;

  // Actions - 工具函數
  getUnreadCount: () => number;
  getNotificationsByType: (type: string) => EnhancedNotificationData[];
  clearExpiredNotifications: () => void;
  clearError: () => void;
  reset: () => void;
}

const defaultSettings: NotificationSettings = {
  pushEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  showInApp: true,
  categories: {
    game: true,
    message: true,
    gift: true,
    match: true,
    system: true,
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
};

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  settings: defaultSettings,
  error: null,
};

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        addNotification: (notification: NotificationData) => {
          const state = get();

          // 檢查是否已存在相同 ID 的通知
          const existingIndex = state.notifications.findIndex(n => n.id === notification.id);

          const enhancedNotification: EnhancedNotificationData = {
            ...notification,
            isRead: false,
            isPinned: false,
            category: determineCategory(notification.type),
            priority: determinePriority(notification.type),
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 天後過期
          };

          let newNotifications;
          if (existingIndex >= 0) {
            // 更新現有通知
            newNotifications = [...state.notifications];
            newNotifications[existingIndex] = enhancedNotification;
          } else {
            // 添加新通知
            newNotifications = [enhancedNotification, ...state.notifications];
          }

          // 限制通知數量（最多保留 100 個）
          if (newNotifications.length > 100) {
            newNotifications = newNotifications.slice(0, 100);
          }

          const unreadCount = newNotifications.filter(n => !n.isRead).length;

          set({
            notifications: newNotifications,
            unreadCount,
          });
        },

        removeNotification: (id: string) => {
          const state = get();
          const newNotifications = state.notifications.filter(n => n.id !== id);
          const unreadCount = newNotifications.filter(n => !n.isRead).length;

          set({
            notifications: newNotifications,
            unreadCount,
          });
        },

        markAsRead: async (id: string) => {
          const state = get();
          const newNotifications = state.notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          );
          const unreadCount = newNotifications.filter(n => !n.isRead).length;

          set({
            notifications: newNotifications,
            unreadCount,
          });

          try {
            // 可以選擇性地同步到後端
            await apiClient.post(`/notifications/${id}/read`);
          } catch (error) {
            console.warn('Failed to sync read status to backend:', error);
          }
        },

        markAllAsRead: async () => {
          const state = get();
          const newNotifications = state.notifications.map(n => ({ ...n, isRead: true }));

          set({
            notifications: newNotifications,
            unreadCount: 0,
          });

          try {
            await apiClient.post('/notifications/read-all');
          } catch (error) {
            console.warn('Failed to sync read-all status to backend:', error);
          }
        },

        deleteNotification: async (id: string) => {
          get().removeNotification(id);

          try {
            await apiClient.delete(`/notifications/${id}`);
          } catch (error) {
            console.warn('Failed to delete notification from backend:', error);
          }
        },

        clearAllNotifications: async () => {
          set({
            notifications: [],
            unreadCount: 0,
          });

          try {
            await apiClient.delete('/notifications');
          } catch (error) {
            console.warn('Failed to clear notifications from backend:', error);
          }
        },

        pinNotification: (id: string) => {
          const state = get();
          const newNotifications = state.notifications.map(n =>
            n.id === id ? { ...n, isPinned: true } : n
          );

          set({ notifications: newNotifications });
        },

        unpinNotification: (id: string) => {
          const state = get();
          const newNotifications = state.notifications.map(n =>
            n.id === id ? { ...n, isPinned: false } : n
          );

          set({ notifications: newNotifications });
        },

        loadNotifications: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiClient.get('/notifications');
            const notifications: EnhancedNotificationData[] = response.data.map((n: any) => ({
              ...n,
              isRead: n.read_at != null,
              isPinned: n.is_pinned || false,
              category: determineCategory(n.type),
              priority: determinePriority(n.type),
              timestamp: new Date(n.created_at).getTime(),
            }));

            const unreadCount = notifications.filter(n => !n.isRead).length;

            set({
              notifications,
              unreadCount,
              isLoading: false,
            });
          } catch (error: any) {
            console.error('Failed to load notifications:', error);
            set({
              error: error.response?.data?.message || '載入通知失敗',
              isLoading: false,
            });
          }
        },

        refreshNotifications: async () => {
          await get().loadNotifications();
        },

        updateSettings: async (newSettings: Partial<NotificationSettings>) => {
          const state = get();
          const updatedSettings = { ...state.settings, ...newSettings };

          set({ settings: updatedSettings });

          try {
            await apiClient.put('/user/notification-settings', updatedSettings);
          } catch (error) {
            console.warn('Failed to sync notification settings:', error);
          }
        },

        toggleCategory: (category: keyof NotificationSettings['categories']) => {
          const state = get();
          const newSettings = {
            ...state.settings,
            categories: {
              ...state.settings.categories,
              [category]: !state.settings.categories[category],
            },
          };

          get().updateSettings(newSettings);
        },

        getUnreadCount: () => {
          return get().notifications.filter(n => !n.isRead).length;
        },

        getNotificationsByType: (type: string) => {
          return get().notifications.filter(n => n.type === type);
        },

        clearExpiredNotifications: () => {
          const state = get();
          const now = Date.now();
          const validNotifications = state.notifications.filter(n =>
            !n.expiresAt || n.expiresAt > now
          );

          if (validNotifications.length !== state.notifications.length) {
            const unreadCount = validNotifications.filter(n => !n.isRead).length;
            set({
              notifications: validNotifications,
              unreadCount,
            });
          }
        },

        clearError: () => {
          set({ error: null });
        },

        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'notification-store',
        storage: {
          getItem: async (name) => {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: async (name, value) => {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: async (name) => {
            await AsyncStorage.removeItem(name);
          },
        },
        partialize: (state) => ({
          notifications: state.notifications,
          settings: state.settings,
        }),
      }
    ),
    { name: 'notification-store' }
  )
);

// 輔助函數：確定通知類別
function determineCategory(type: string): 'personal' | 'system' | 'promotional' {
  switch (type) {
    case 'game_invite':
    case 'message':
    case 'gift':
    case 'match':
      return 'personal';
    case 'system':
    case 'maintenance':
    case 'update':
      return 'system';
    case 'promotion':
    case 'feature':
      return 'promotional';
    default:
      return 'personal';
  }
}

// 輔助函數：確定通知優先級
function determinePriority(type: string): 'high' | 'normal' | 'low' {
  switch (type) {
    case 'game_invite':
    case 'message':
      return 'high';
    case 'gift':
    case 'match':
      return 'normal';
    default:
      return 'low';
  }
}

export default useNotificationStore;