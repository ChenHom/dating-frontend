/**
 * Jest Setup File for React Native Testing
 * 配置測試環境和全域設定
 */

// Mock global environment first
global.__DEV__ = true;

// Mock Expo constants to avoid import issues
jest.mock('expo-constants', () => ({
  expoConfig: {},
  ExecutionEnvironment: {
    Standalone: 'STANDALONE',
    StoreClient: 'STORE_CLIENT',
  },
  default: {
    expoConfig: {},
    ExecutionEnvironment: {
      Standalone: 'STANDALONE', 
      StoreClient: 'STORE_CLIENT',
    },
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Expo modules
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  getDevicePushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-token' }),
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn().mockReturnValue({}),
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock Zustand stores
jest.mock('@/stores/auth', () => ({
  useAuthStore: jest.fn().mockReturnValue({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    setUser: jest.fn(),
    setToken: jest.fn(),
    clearError: jest.fn(),
  }),
}));

// Mock API client
jest.mock('./services/api/client', () => ({
  apiClient: {
    login: jest.fn(),
    getProfile: jest.fn(),
    getUserFeed: jest.fn(),
    likeUser: jest.fn(),
    getConversations: jest.fn(),
    sendMessage: jest.fn(),
  },
}));

// Mock react-native-deck-swiper
jest.mock('react-native-deck-swiper', () => {
  const React = require('react');
  return React.forwardRef((props: any, ref: any) => {
    const MockSwiper = require('react-native').View;
    return React.createElement(MockSwiper, { ...props, ref });
  });
});

// Silence specific warnings in tests
const originalConsoleWarn = console.warn;
console.warn = (message: string) => {
  if (
    message.includes('deprecated') || 
    message.includes('componentWillReceiveProps') ||
    message.includes('ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalConsoleWarn(message);
};

// Set up global test timeout
jest.setTimeout(10000);