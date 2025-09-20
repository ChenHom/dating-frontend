/**
 * RegisterScreen Tests (TDD)
 * 測試註冊頁面功能
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { RegisterScreen } from '../RegisterScreen';

// Mock the auth store
const mockRegister = jest.fn();
const mockClearError = jest.fn();

jest.mock('../../../stores/auth', () => ({
  useAuthStore: jest.fn(() => ({
    register: mockRegister,
    isLoading: false,
    error: null,
    clearError: mockClearError,
    isAuthenticated: false,
  })),
}));

// Mock router
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: mockPush,
    back: mockBack,
  },
}));

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UI Rendering', () => {
    test('should render registration form elements', () => {
      render(<RegisterScreen />);
      
      expect(screen.getByPlaceholderText('Full Name')).toBeTruthy();
      expect(screen.getByPlaceholderText('Email')).toBeTruthy();
      expect(screen.getByPlaceholderText('Password')).toBeTruthy();
      expect(screen.getByPlaceholderText('Confirm Password')).toBeTruthy();
      expect(screen.getByText('Create Account')).toBeTruthy();
      expect(screen.getByText('Already have an account? Login')).toBeTruthy();
    });

    test('should show loading state when registering', () => {
      const mockUseAuthStore = require('../../../stores/auth').useAuthStore;
      mockUseAuthStore.mockReturnValue({
        register: mockRegister,
        isLoading: true,
        error: null,
        clearError: mockClearError,
        isAuthenticated: false,
      });

      render(<RegisterScreen />);
      
      expect(screen.getByText('Creating Account...')).toBeTruthy();
    });

    test('should show error message when registration fails', () => {
      const mockUseAuthStore = require('../../../stores/auth').useAuthStore;
      mockUseAuthStore.mockReturnValue({
        register: mockRegister,
        isLoading: false,
        error: 'Email already exists',
        clearError: mockClearError,
        isAuthenticated: false,
      });

      render(<RegisterScreen />);
      
      expect(screen.getByText('Email already exists')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    test('should show validation errors for empty fields', async () => {
      render(<RegisterScreen />);
      
      const registerButton = screen.getByText('Create Account');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeTruthy();
        expect(screen.getByText('Email is required')).toBeTruthy();
        expect(screen.getByText('Password is required')).toBeTruthy();
        expect(screen.getByText('Please confirm your password')).toBeTruthy();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    test('should show validation error for invalid email', async () => {
      render(<RegisterScreen />);
      
      const nameInput = screen.getByPlaceholderText('Full Name');
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
      const registerButton = screen.getByText('Create Account');

      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email')).toBeTruthy();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    test('should show validation error for short password', async () => {
      render(<RegisterScreen />);
      
      const nameInput = screen.getByPlaceholderText('Full Name');
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
      const registerButton = screen.getByText('Create Account');

      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, '123');
      fireEvent.changeText(confirmPasswordInput, '123');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    test('should show validation error for password mismatch', async () => {
      render(<RegisterScreen />);
      
      const nameInput = screen.getByPlaceholderText('Full Name');
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
      const registerButton = screen.getByText('Create Account');

      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'different123');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeTruthy();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    test('should show validation error for short name', async () => {
      render(<RegisterScreen />);
      
      const nameInput = screen.getByPlaceholderText('Full Name');
      const registerButton = screen.getByText('Create Account');

      fireEvent.changeText(nameInput, 'J');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeTruthy();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    test('should call register with valid form data', async () => {
      render(<RegisterScreen />);
      
      const nameInput = screen.getByPlaceholderText('Full Name');
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
      const registerButton = screen.getByText('Create Account');

      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          password_confirmation: 'password123',
        });
      });
    });

    test('should navigate to main app when registration succeeds', async () => {
      const mockUseAuthStore = require('../../../stores/auth').useAuthStore;
      mockUseAuthStore.mockReturnValue({
        register: mockRegister,
        isLoading: false,
        error: null,
        clearError: mockClearError,
        isAuthenticated: true,
      });

      render(<RegisterScreen />);
      
      expect(mockPush).toHaveBeenCalledWith('/(tabs)/discover');
    });

    test('should clear errors when user starts typing', () => {
      const mockUseAuthStore = require('../../../stores/auth').useAuthStore;
      mockUseAuthStore.mockReturnValue({
        register: mockRegister,
        isLoading: false,
        error: 'Email already exists',
        clearError: mockClearError,
        isAuthenticated: false,
      });

      render(<RegisterScreen />);
      
      const nameInput = screen.getByPlaceholderText('Full Name');
      fireEvent.changeText(nameInput, 'New Name');

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    test('should navigate to login screen when login link is pressed', () => {
      render(<RegisterScreen />);
      
      const loginLink = screen.getByText('Already have an account? Login');
      fireEvent.press(loginLink);

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Password Strength Indicator', () => {
    test('should show weak password indicator', async () => {
      render(<RegisterScreen />);
      
      const passwordInput = screen.getByPlaceholderText('Password');
      fireEvent.changeText(passwordInput, 'weak');

      await waitFor(() => {
        expect(screen.getByText('Weak')).toBeTruthy();
      });
    });

    test('should show medium password indicator', async () => {
      render(<RegisterScreen />);
      
      const passwordInput = screen.getByPlaceholderText('Password');
      fireEvent.changeText(passwordInput, 'medium123');

      await waitFor(() => {
        expect(screen.getByText('Medium')).toBeTruthy();
      });
    });

    test('should show strong password indicator', async () => {
      render(<RegisterScreen />);
      
      const passwordInput = screen.getByPlaceholderText('Password');
      fireEvent.changeText(passwordInput, 'Strong123!');

      await waitFor(() => {
        expect(screen.getByText('Strong')).toBeTruthy();
      });
    });
  });
});
