/**
 * LoginScreen Tests (TDD)
 * 測試登入頁面功能
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';

// Mock the auth store
const mockLogin = jest.fn();
const mockClearError = jest.fn();

jest.mock('../../../stores/auth', () => ({
  useAuthStore: jest.fn(() => ({
    login: mockLogin,
    isLoading: false,
    error: null,
    clearError: mockClearError,
    isAuthenticated: false,
  })),
}));

// Mock router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: mockPush,
  },
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UI Rendering', () => {
    test('should render login form elements', () => {
      render(<LoginScreen />);
      
      expect(screen.getByPlaceholderText('Email')).toBeTruthy();
      expect(screen.getByPlaceholderText('Password')).toBeTruthy();
      expect(screen.getByText('Login')).toBeTruthy();
      expect(screen.getByText("Don't have an account? Register")).toBeTruthy();
    });

    test('should show loading state when authenticating', () => {
      const mockUseAuthStore = require('../../../stores/auth').useAuthStore;
      mockUseAuthStore.mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
        clearError: mockClearError,
        isAuthenticated: false,
      });

      render(<LoginScreen />);
      
      expect(screen.getByText('Logging in...')).toBeTruthy();
    });

    test('should show error message when login fails', () => {
      const mockUseAuthStore = require('../../../stores/auth').useAuthStore;
      mockUseAuthStore.mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: 'Invalid credentials',
        clearError: mockClearError,
        isAuthenticated: false,
      });

      render(<LoginScreen />);
      
      expect(screen.getByText('Invalid credentials')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    test('should show validation errors for empty fields', async () => {
      render(<LoginScreen />);
      
      const loginButton = screen.getByText('Login');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeTruthy();
        expect(screen.getByText('Password is required')).toBeTruthy();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    test('should show validation error for invalid email', async () => {
      render(<LoginScreen />);
      
      const emailInput = screen.getByPlaceholderText('Email');
      const loginButton = screen.getByText('Login');

      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email')).toBeTruthy();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    test('should show validation error for short password', async () => {
      render(<LoginScreen />);
      
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const loginButton = screen.getByText('Login');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, '123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    test('should call login with valid credentials', async () => {
      render(<LoginScreen />);
      
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const loginButton = screen.getByText('Login');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    test('should navigate to main app when login succeeds', async () => {
      const mockUseAuthStore = require('../../../stores/auth').useAuthStore;
      mockUseAuthStore.mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: null,
        clearError: mockClearError,
        isAuthenticated: true,
      });

      render(<LoginScreen />);
      
      expect(mockPush).toHaveBeenCalledWith('/(tabs)/discover');
    });

    test('should clear errors when user starts typing', () => {
      const mockUseAuthStore = require('../../../stores/auth').useAuthStore;
      mockUseAuthStore.mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: 'Invalid credentials',
        clearError: mockClearError,
        isAuthenticated: false,
      });

      render(<LoginScreen />);
      
      const emailInput = screen.getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'new@example.com');

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    test('should navigate to register screen when register link is pressed', () => {
      render(<LoginScreen />);
      
      const registerLink = screen.getByText("Don't have an account? Register");
      fireEvent.press(registerLink);

      expect(mockPush).toHaveBeenCalledWith('/register');
    });
  });
});
