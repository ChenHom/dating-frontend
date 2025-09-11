/**
 * Authentication Store (Zustand)
 * 管理用戶認證狀態
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, AuthResponse } from '@/lib/types';
import { apiClient } from '@/services/api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          console.log('🔐 Starting login process...');
          const authResponse = await apiClient.login(email, password);
          console.log('✅ Login API successful:', authResponse);

          apiClient.setAuthToken(authResponse.token);

          const newState = {
            user: authResponse.user,
            token: authResponse.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          };

          console.log('💾 Setting auth state:', newState);
          set(newState);

          // Force immediate persistence
          if (typeof window !== 'undefined') {
            const storageKey = 'auth-storage';
            const storageValue = JSON.stringify({
              state: {
                user: authResponse.user,
                token: authResponse.token,
                isAuthenticated: true,
              },
              version: 0,
            });
            localStorage.setItem(storageKey, storageValue);
            console.log('💾 Auth state manually persisted to localStorage');
          }
        } catch (error) {
          console.error('❌ Login failed:', error);
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
        }
      },

      register: async (data: any) => {
        set({ isLoading: true, error: null });

        try {
          const authResponse = await apiClient.register(data);
          apiClient.setAuthToken(authResponse.token);

          set({
            user: authResponse.user,
            token: authResponse.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
        }
      },

      logout: () => {
        console.log('🚪 Logging out user...');

        // Clear API token
        apiClient.setAuthToken(null);

        // Clear all auth state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });

        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          console.log('💾 Auth storage cleared from localStorage');
        }
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setToken: (token: string | null) => {
        set({ token, isAuthenticated: !!token });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => ({
        getItem: (key: string) => {
          if (typeof window !== 'undefined') {
            return localStorage.getItem(key);
          }
          return null;
        },
        setItem: (key: string, value: string) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(key, value);
          }
        },
        removeItem: (key: string) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
          }
        },
      })),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // Ensure proper rehydration
      onRehydrateStorage: () => (state) => {
        console.log('Auth rehydration completed', state);
        // Ensure isAuthenticated is properly derived from token existence
        if (state && state.token && !state.isAuthenticated) {
          state.isAuthenticated = true;
        }

        // Set the API token if available
        if (state && state.token) {
          apiClient.setAuthToken(state.token);
          console.log('🔐 API token restored from storage');
        }
      },
    }
  )
);