/**
 * Gift Store - 虛擬禮物狀態管理
 * 管理禮物目錄、發送歷史、冷卻時間等
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '@/services/api/client';

export interface Gift {
  id: number;
  name: string;
  icon_url: string;
  cooldown_seconds: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GiftSend {
  id: number;
  conversation_id: number;
  sender_id: number;
  receiver_id: number;
  gift_id: number;
  created_at: string;
  gift?: Gift; // 關聯的禮物信息
}

export interface GiftCooldown {
  gift_id: number;
  last_sent_at: string;
  cooldown_until: string;
  is_available: boolean;
}

interface GiftState {
  // 禮物目錄
  gifts: Gift[];
  isLoadingGifts: boolean;

  // 發送歷史
  sentGifts: GiftSend[];
  receivedGifts: GiftSend[];
  isLoadingHistory: boolean;

  // 冷卻狀態
  cooldowns: Record<number, GiftCooldown>;

  // 發送狀態
  isSending: boolean;
  sendingGiftId: number | null;

  // 錯誤狀態
  error: string | null;

  // Actions
  loadGifts: () => Promise<void>;
  loadGiftHistory: (conversationId?: number) => Promise<void>;
  sendGift: (conversationId: number, receiverId: number, giftId: number) => Promise<boolean>;
  checkCooldown: (giftId: number) => boolean;
  getCooldownTimeLeft: (giftId: number) => number;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  gifts: [],
  isLoadingGifts: false,
  sentGifts: [],
  receivedGifts: [],
  isLoadingHistory: false,
  cooldowns: {},
  isSending: false,
  sendingGiftId: null,
  error: null,
};

export const useGiftStore = create<GiftState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadGifts: async () => {
        set({ isLoadingGifts: true, error: null });

        try {
          const response = await apiClient.get('/gifts');
          set({
            gifts: response.data,
            isLoadingGifts: false
          });
        } catch (error: any) {
          console.error('Failed to load gifts:', error);
          set({
            error: error.response?.data?.message || '載入禮物目錄失敗',
            isLoadingGifts: false
          });
        }
      },

      loadGiftHistory: async (conversationId?: number) => {
        set({ isLoadingHistory: true, error: null });

        try {
          const params = conversationId ? `?conversation_id=${conversationId}` : '';
          const response = await apiClient.get(`/gifts/history${params}`);

          const { sent, received, cooldowns } = response.data;

          // 將冷卻信息轉換為更易用的格式
          const cooldownMap: Record<number, GiftCooldown> = {};
          cooldowns.forEach((cooldown: GiftCooldown) => {
            cooldownMap[cooldown.gift_id] = cooldown;
          });

          set({
            sentGifts: sent || [],
            receivedGifts: received || [],
            cooldowns: cooldownMap,
            isLoadingHistory: false
          });
        } catch (error: any) {
          console.error('Failed to load gift history:', error);
          set({
            error: error.response?.data?.message || '載入禮物歷史失敗',
            isLoadingHistory: false
          });
        }
      },

      sendGift: async (conversationId: number, receiverId: number, giftId: number) => {
        const state = get();

        // 檢查冷卻時間
        if (!state.checkCooldown(giftId)) {
          const timeLeft = state.getCooldownTimeLeft(giftId);
          set({ error: `禮物冷卻中，還需等待 ${timeLeft} 秒` });
          return false;
        }

        set({
          isSending: true,
          sendingGiftId: giftId,
          error: null
        });

        try {
          const response = await apiClient.post(`/gift/conversations/${conversationId}/gifts`, {
            receiver_id: receiverId,
            gift_id: giftId,
          });

          const newGiftSend: GiftSend = response.data;

          // 更新發送歷史
          set(state => ({
            sentGifts: [newGiftSend, ...state.sentGifts],
            isSending: false,
            sendingGiftId: null,
          }));

          // 更新冷卻狀態
          const gift = state.gifts.find(g => g.id === giftId);
          if (gift) {
            const now = new Date();
            const cooldownUntil = new Date(now.getTime() + gift.cooldown_seconds * 1000);

            set(state => ({
              cooldowns: {
                ...state.cooldowns,
                [giftId]: {
                  gift_id: giftId,
                  last_sent_at: now.toISOString(),
                  cooldown_until: cooldownUntil.toISOString(),
                  is_available: false,
                }
              }
            }));
          }

          return true;
        } catch (error: any) {
          console.error('Failed to send gift:', error);
          set({
            error: error.response?.data?.message || '發送禮物失敗',
            isSending: false,
            sendingGiftId: null
          });
          return false;
        }
      },

      checkCooldown: (giftId: number) => {
        const state = get();
        const cooldown = state.cooldowns[giftId];

        if (!cooldown) return true;

        const now = new Date().getTime();
        const cooldownUntil = new Date(cooldown.cooldown_until).getTime();

        return now >= cooldownUntil;
      },

      getCooldownTimeLeft: (giftId: number) => {
        const state = get();
        const cooldown = state.cooldowns[giftId];

        if (!cooldown) return 0;

        const now = new Date().getTime();
        const cooldownUntil = new Date(cooldown.cooldown_until).getTime();

        return Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      },
    }),
    { name: 'gift-store' }
  )
);

export default useGiftStore;