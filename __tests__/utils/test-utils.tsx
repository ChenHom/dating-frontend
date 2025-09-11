/**
 * Test Utilities for React Native Testing
 * 提供測試所需的 Provider 包裝和工具函數
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render function that includes providers
interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  profile: {
    display_name: 'Test User',
    bio: 'Test bio',
    age: 25,
    primary_photo_url: 'https://example.com/photo.jpg',
  },
  ...overrides,
});

export const createMockMessage = (overrides = {}) => ({
  id: 1,
  conversation_id: 1,
  sender_id: 1,
  content: 'Test message',
  sequence_number: 1,
  client_nonce: 'test-nonce',
  created_at: new Date().toISOString(),
  sender: createMockUser(),
  ...overrides,
});

export const createMockConversation = (overrides = {}) => ({
  id: 1,
  user1_id: 1,
  user2_id: 2,
  last_message_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  user1: createMockUser({ id: 1 }),
  user2: createMockUser({ id: 2, name: 'Other User' }),
  ...overrides,
});

// Wait for API calls to resolve
export const waitForApiCalls = () => 
  new Promise(resolve => setTimeout(resolve, 0));

// Mock AsyncStorage
export const mockAsyncStorage = {
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
};

// Re-export everything from testing library
export * from '@testing-library/react-native';
export { customRender as render };