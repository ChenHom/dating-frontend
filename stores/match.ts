/**
 * Match Store
 * 配對系統狀態管理 (Zustand)
 */

import { create } from 'zustand';
import { 
  Match, 
  LikeResponse, 
  User 
} from '@/lib/types';
import { apiClient } from '@/services/api/client';
import { useAuthStore } from './auth';

interface MatchState {
  // Data
  matches: Match[];
  newMatch: User | null; // Store new match for success screen
  dailyLikes: number;
  likeLimit: number;
  lastLikeReset: string; // Date string for daily reset
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  likeUser: (userId: number) => Promise<LikeResponse>;
  passUser: (userId: number) => Promise<void>;
  loadMatches: () => Promise<void>;
  openMatch: (matchId: number) => Promise<void>;
  clearNewMatch: () => void;
  checkAndResetDailyLikes: () => void;
  clearError: () => void;
}

const DAILY_LIKE_LIMIT = 30;

export const useMatchStore = create<MatchState>((set, get) => ({
  // Initial state
  matches: [],
  newMatch: null,
  dailyLikes: 0,
  likeLimit: DAILY_LIKE_LIMIT,
  lastLikeReset: new Date().toDateString(),
  isLoading: false,
  error: null,

  // Like a user
  likeUser: async (userId: number) => {
    const { isAuthenticated, token } = useAuthStore.getState();

    if (!isAuthenticated || !token) {
      throw new Error('尚未登入，無法進行點讚');
    }

    const state = get();
    
    // Check daily limit
    state.checkAndResetDailyLikes();
    const currentState = get();
    
    if (currentState.dailyLikes >= currentState.likeLimit) {
      throw new Error('已達到每日點讚限制');
    }

    set({ isLoading: true, error: null });
    
    try {
      const response = await apiClient.likeUser(userId);
      
      set((state) => ({
        dailyLikes: state.dailyLikes + 1,
        newMatch: response.is_match ? (response.matched_user ?? null) : null,
        isLoading: false,
      }));
      
      return response;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Like failed',
      });
      throw error;
    }
  },

  // Pass on a user
  passUser: async (userId: number) => {
    const { isAuthenticated, token } = useAuthStore.getState();

    if (!isAuthenticated || !token) {
      throw new Error('尚未登入，無法進行操作');
    }

    set({ isLoading: true, error: null });
    
    try {
      await apiClient.passUser(userId);
      
      set({
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Pass failed',
      });
      throw error;
    }
  },

  // Load all matches
  loadMatches: async () => {
    const { isAuthenticated, token } = useAuthStore.getState();

    if (!isAuthenticated || !token) {
      set({
        matches: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      const matches = await apiClient.getMatches();
      
      set({
        matches,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load matches',
      });
    }
  },

  // Open/mark a match as viewed
  openMatch: async (matchId: number) => {
    const { isAuthenticated, token } = useAuthStore.getState();

    if (!isAuthenticated || !token) {
      throw new Error('尚未登入，無法開啟配對');
    }

    set({ isLoading: true, error: null });
    
    try {
      const updatedMatch = await apiClient.openMatch(matchId);
      
      set((state) => ({
        matches: state.matches.map(match =>
          match.id === matchId ? updatedMatch : match
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to open match',
      });
    }
  },

  // Clear new match (after showing success screen)
  clearNewMatch: () => {
    set({ newMatch: null });
  },

  // Check and reset daily likes if new day
  checkAndResetDailyLikes: () => {
    const today = new Date().toDateString();
    const state = get();
    
    if (state.lastLikeReset !== today) {
      set({
        dailyLikes: 0,
        lastLikeReset: today,
      });
    }
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },
}));
