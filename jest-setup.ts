/**
 * Jest Setup File for React Native Testing
 * 配置測試環境和全域設定
 */

// Mock global environment first
// @ts-ignore - __DEV__ 是 React Native 全域旗標
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

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}), { virtual: true });

jest.mock('expo', () => ({
  __esModule: true,
  default: {},
}), { virtual: true });

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


Object.defineProperty(global, '__ExpoImportMetaRegistry', {
  configurable: true,
  writable: true,
  value: new Map(),
});

if (typeof window !== 'undefined') {
  Object.defineProperty(window as typeof globalThis, '__ExpoImportMetaRegistry', {
    configurable: true,
    writable: true,
    value: new Map(),
  });
}

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
// Mock SwipeCard component
jest.mock('@/features/match/components/SwipeCard', () => {
  const React = require('react');
  return {
    SwipeCard: React.forwardRef((props: any, ref: any) => {
      const MockSwipeCard = require('react-native').View;
      return React.createElement(MockSwipeCard, {
        ...props,
        testID: props.testID || 'deck-swiper',
        ref,
      });
    }),
    SwipeCardRef: {},
  };
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