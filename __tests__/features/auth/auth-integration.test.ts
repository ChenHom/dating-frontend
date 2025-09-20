/**
 * Authentication Integration Tests
 * 測試登入註冊整體流程
 */

// Mock API client first
jest.mock('../../../services/api/client', () => ({
  apiClient: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    setAuthToken: jest.fn(),
  },
}));

import { useAuthStore } from '../../../stores/auth';
import { apiClient } from '../../../services/api/client';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Authentication Integration', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    
    jest.clearAllMocks();
  });

  describe('Registration Flow', () => {
    test('should handle successful registration', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockAuthResponse = {
        user: mockUser,
        token: 'jwt-token',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      mockApiClient.register.mockResolvedValue(mockAuthResponse);

      // Act
      await useAuthStore.getState().register({
        name: 'John Doe',
        display_name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      });

      // Assert
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('jwt-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('jwt-token');
    });

    test('should handle registration failure', async () => {
      // Arrange
      const errorMessage = 'Email already exists';
      mockApiClient.register.mockRejectedValue(new Error(errorMessage));

      // Act
      await useAuthStore.getState().register({
        name: 'John Doe',
        display_name: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      });

      // Assert
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(mockApiClient.setAuthToken).not.toHaveBeenCalled();
    });
  });

  describe('Login Flow', () => {
    test('should handle successful login', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockAuthResponse = {
        user: mockUser,
        token: 'jwt-token',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      mockApiClient.login.mockResolvedValue(mockAuthResponse);

      // Act
      await useAuthStore.getState().login('john@example.com', 'password123');

      // Assert
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('jwt-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('jwt-token');
    });
  });

  describe('Logout Flow', () => {
    test('should handle successful logout', async () => {
      // Arrange - set authenticated state
      useAuthStore.setState({
        user: { id: 1, name: 'John', email: 'john@example.com', created_at: '', updated_at: '' },
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
      expect(state.error).toBeNull();
      expect(mockApiClient.logout).toHaveBeenCalled();
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(null);
    });
  });

  describe('Form Validation Logic', () => {
    test('should validate email format', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.uk'];
      const invalidEmails = ['invalid', 'test@', '@domain.com', 'test@domain'];

      validEmails.forEach(email => {
        expect(/\S+@\S+\.\S+/.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(/\S+@\S+\.\S+/.test(email)).toBe(false);
      });
    });

    test('should validate password strength', () => {
      const getPasswordStrength = (pwd: string) => {
        if (pwd.length < 6) return 'weak';
        
        const hasLower = /[a-z]/.test(pwd);
        const hasUpper = /[A-Z]/.test(pwd);
        const hasNumber = /\d/.test(pwd);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
        
        const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
        
        if (score >= 3 && pwd.length >= 8) return 'strong';
        if (score >= 2 && pwd.length >= 6) return 'medium';
        return 'weak';
      };

      expect(getPasswordStrength('weak')).toBe('weak');
      expect(getPasswordStrength('Medium1')).toBe('medium');
      expect(getPasswordStrength('Strong123!')).toBe('strong');
      expect(getPasswordStrength('Aa1!')).toBe('weak'); // too short
      expect(getPasswordStrength('StrongPass1!')).toBe('strong');
    });
  });
});
