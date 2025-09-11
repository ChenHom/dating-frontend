/**
 * Auth Store Tests (TDD)
 * 測試用戶認證狀態管理
 */

import { AuthResponse, User } from '../../lib/types';

// Mock API client before importing auth store
const mockApiClient = {
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  setAuthToken: jest.fn(),
};

jest.mock('../../services/api/client', () => ({
  apiClient: mockApiClient,
}));

// Import after mocking
import { useAuthStore } from '../auth';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should have correct initial state', () => {
      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Authentication Actions', () => {
    test('should login successfully', async () => {
      // Arrange
      const mockUser: User = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockAuthResponse: AuthResponse = {
        user: mockUser,
        token: 'mock-jwt-token',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      mockApiClient.login.mockResolvedValue(mockAuthResponse);

      // Act
      await useAuthStore.getState().login('test@example.com', 'password');

      // Assert
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('mock-jwt-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('mock-jwt-token');
    });

    test('should handle login failure', async () => {
      // Arrange
      const errorMessage = 'Invalid credentials';
      mockApiClient.login.mockRejectedValue(new Error(errorMessage));

      // Act
      await useAuthStore.getState().login('invalid@example.com', 'wrongpassword');

      // Assert
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(mockApiClient.setAuthToken).not.toHaveBeenCalled();
    });

    test('should register successfully', async () => {
      // Arrange
      const registerData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      };

      const mockUser: User = {
        id: 2,
        name: 'New User',
        email: 'newuser@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockAuthResponse: AuthResponse = {
        user: mockUser,
        token: 'new-jwt-token',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      mockApiClient.register.mockResolvedValue(mockAuthResponse);

      // Act
      await useAuthStore.getState().register(registerData);

      // Assert
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('new-jwt-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('new-jwt-token');
    });

    test('should handle register failure', async () => {
      // Arrange
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        password_confirmation: 'different',
      };
      
      const errorMessage = 'Password confirmation does not match';
      mockApiClient.register.mockRejectedValue(new Error(errorMessage));

      // Act
      await useAuthStore.getState().register(registerData);

      // Assert
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    test('should logout successfully', async () => {
      // Arrange - set up authenticated state first
      const mockUser: User = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      useAuthStore.setState({
        user: mockUser,
        token: 'jwt-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      mockApiClient.logout.mockResolvedValue(undefined);

      // Act
      await useAuthStore.getState().logout();

      // Assert
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockApiClient.logout).toHaveBeenCalled();
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(null);
    });
  });

  describe('State Management Actions', () => {
    test('should set user correctly', () => {
      // Arrange
      const mockUser: User = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Act
      useAuthStore.getState().setUser(mockUser);

      // Assert
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    test('should set token correctly', () => {
      // Act
      useAuthStore.getState().setToken('new-token');

      // Assert
      const state = useAuthStore.getState();
      expect(state.token).toBe('new-token');
      expect(state.isAuthenticated).toBe(true);
    });

    test('should clear token when set to null', () => {
      // Arrange - set authenticated state first
      useAuthStore.setState({
        token: 'existing-token',
        isAuthenticated: true,
      });

      // Act
      useAuthStore.getState().setToken(null);

      // Assert
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    test('should clear error', () => {
      // Arrange - set error state first
      useAuthStore.setState({
        error: 'Some error message',
      });

      // Act
      useAuthStore.getState().clearError();

      // Assert
      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('Loading States', () => {
    test('should set loading state during login', async () => {
      // Arrange
      mockApiClient.login.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      // Act
      const loginPromise = useAuthStore.getState().login('test@example.com', 'password');
      
      // Assert - check loading state immediately
      expect(useAuthStore.getState().isLoading).toBe(true);
      
      // Wait for completion
      await loginPromise;
      
      // Assert - check loading state after completion
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    test('should set loading state during register', async () => {
      // Arrange
      mockApiClient.register.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        password_confirmation: 'password',
      };

      // Act
      const registerPromise = useAuthStore.getState().register(registerData);
      
      // Assert - check loading state immediately
      expect(useAuthStore.getState().isLoading).toBe(true);
      
      // Wait for completion
      await registerPromise;
      
      // Assert - check loading state after completion
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
});