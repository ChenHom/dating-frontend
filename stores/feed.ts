/**
 * Feed Store (Zustand)
 * 管理探索頁面狀態
 */

import { create } from 'zustand';
import { FeedUser, LikeResponse } from '@/lib/types';
import { apiClient } from '@/services/api/client';
import { useAuthStore } from './auth';

interface FeedState {
  users: FeedUser[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  hasMoreUsers: boolean;
  
  // Actions
  loadFeed: () => Promise<void>;
  likeUser: (userId: number) => Promise<LikeResponse>;
  passUser: (userId: number) => Promise<void>;
  getCurrentUser: () => FeedUser | null;
  hasMoreCards: () => boolean;
  clearError: () => void;
}

export const useFeedStore = create<FeedState>()((set, get) => ({
  users: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  hasMoreUsers: true,

  loadFeed: async () => {
    const { isAuthenticated, token } = useAuthStore.getState();

    if (!isAuthenticated || !token) {
      set({
        users: [],
        currentIndex: 0,
        isLoading: false,
        hasMoreUsers: false,
        error: null,
      });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const users = await apiClient.getUserFeed();
      set({
        users,
        currentIndex: 0,
        isLoading: false,
        hasMoreUsers: users.length > 0,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load feed';
      set({
        users: [],
        isLoading: false,
        error: errorMessage,
        hasMoreUsers: false,
      });
    }
  },

  likeUser: async (userId: number) => {
    try {
      const result = await apiClient.likeUser(userId);
      
      // Move to next user
      const { currentIndex } = get();
      set({ currentIndex: currentIndex + 1 });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Like failed';
      throw new Error(errorMessage);
    }
  },

  passUser: async (userId: number) => {
    try {
      await apiClient.passUser(userId);
      
      // Move to next user
      const { currentIndex } = get();
      set({ currentIndex: currentIndex + 1 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Pass failed';
      throw new Error(errorMessage);
    }
  },

  getCurrentUser: () => {
    const { users, currentIndex } = get();
    return users[currentIndex] || null;
  },

  hasMoreCards: () => {
    const { users, currentIndex } = get();
    return currentIndex < users.length;
  },

  clearError: () => {
    set({ error: null });
  },
}));
