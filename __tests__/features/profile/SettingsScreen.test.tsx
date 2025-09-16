/**
 * SettingsScreen Component Tests
 * 設定頁面測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { SettingsScreen } from '../../../features/profile/SettingsScreen';
import { useAuthStore } from '../../../stores/auth';

// Mock router
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
  },
}));

// Mock Alert
const mockAlert = jest.fn();
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: mockAlert,
    },
  };
});

// Mock stores
jest.mock('../../../stores/auth');

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('SettingsScreen', () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
      setUser: jest.fn(),
      setToken: jest.fn(),
      clearError: jest.fn(),
    });
  });

  describe('Rendering', () => {
    test('renders settings screen with user information', () => {
      render(<SettingsScreen />);

      expect(screen.getByText('Settings')).toBeTruthy();
      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('john@example.com')).toBeTruthy();
      expect(screen.getByText('Account')).toBeTruthy();
      expect(screen.getByText('Preferences')).toBeTruthy();
    });

    test('renders all settings options', () => {
      render(<SettingsScreen />);

      expect(screen.getByText('Change Password')).toBeTruthy();
      expect(screen.getByText('Push Notifications')).toBeTruthy();
      expect(screen.getByText('Email Notifications')).toBeTruthy();
      expect(screen.getByText('Share Location')).toBeTruthy();
      expect(screen.getByTestId('logout-button')).toBeTruthy();
      expect(screen.getByTestId('delete-account-button')).toBeTruthy();
    });

    test('renders notification switches with default values', () => {
      render(<SettingsScreen />);

      const pushSwitch = screen.getByTestId('push-notifications-switch');
      const emailSwitch = screen.getByTestId('email-notifications-switch');
      const locationSwitch = screen.getByTestId('location-sharing-switch');

      expect(pushSwitch.props.value).toBe(true);
      expect(emailSwitch.props.value).toBe(false);
      expect(locationSwitch.props.value).toBe(true);
    });
  });

  describe('Password Change', () => {
    test('shows password change form when toggle is pressed', () => {
      render(<SettingsScreen />);

      const changePasswordButton = screen.getByTestId('change-password-button');
      fireEvent.press(changePasswordButton);

      expect(screen.getByText('Current Password')).toBeTruthy();
      expect(screen.getByText('New Password')).toBeTruthy();
      expect(screen.getByText('Confirm New Password')).toBeTruthy();
      expect(screen.getByTestId('save-password-button')).toBeTruthy();
    });

    test('hides password form when toggle is pressed again', () => {
      render(<SettingsScreen />);

      const changePasswordButton = screen.getByTestId('change-password-button');
      
      // Show form
      fireEvent.press(changePasswordButton);
      expect(screen.getByText('Current Password')).toBeTruthy();

      // Hide form
      fireEvent.press(changePasswordButton);
      expect(screen.queryByText('Current Password')).toBeNull();
    });

    test('validates password change form', async () => {
      render(<SettingsScreen />);

      const changePasswordButton = screen.getByTestId('change-password-button');
      fireEvent.press(changePasswordButton);

      const saveButton = screen.getByTestId('save-password-button');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Current password is required')).toBeTruthy();
        expect(screen.getByText('New password is required')).toBeTruthy();
        expect(screen.getByText('Please confirm your new password')).toBeTruthy();
      });
    });

    test('validates new password strength', async () => {
      render(<SettingsScreen />);

      const changePasswordButton = screen.getByTestId('change-password-button');
      fireEvent.press(changePasswordButton);

      const currentPasswordInput = screen.getByTestId('current-password-input');
      const newPasswordInput = screen.getByTestId('new-password-input');
      const saveButton = screen.getByTestId('save-password-button');

      fireEvent.changeText(currentPasswordInput, 'current123');
      fireEvent.changeText(newPasswordInput, 'weak');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeTruthy();
      });
    });

    test('validates password confirmation match', async () => {
      render(<SettingsScreen />);

      const changePasswordButton = screen.getByTestId('change-password-button');
      fireEvent.press(changePasswordButton);

      const currentPasswordInput = screen.getByTestId('current-password-input');
      const newPasswordInput = screen.getByTestId('new-password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const saveButton = screen.getByTestId('save-password-button');

      fireEvent.changeText(currentPasswordInput, 'current123');
      fireEvent.changeText(newPasswordInput, 'NewPassword123');
      fireEvent.changeText(confirmPasswordInput, 'DifferentPassword123');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeTruthy();
      });
    });

    test('simulates successful password change', async () => {
      render(<SettingsScreen />);

      const changePasswordButton = screen.getByTestId('change-password-button');
      fireEvent.press(changePasswordButton);

      const currentPasswordInput = screen.getByTestId('current-password-input');
      const newPasswordInput = screen.getByTestId('new-password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const saveButton = screen.getByTestId('save-password-button');

      fireEvent.changeText(currentPasswordInput, 'current123');
      fireEvent.changeText(newPasswordInput, 'NewPassword123');
      fireEvent.changeText(confirmPasswordInput, 'NewPassword123');

      // Mock successful password change
      mockAlert.mockImplementation((title, message, buttons) => {
        buttons[0].onPress();
      });

      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Success',
          'Password changed successfully!',
          expect.any(Array)
        );
      });
    });

    test('clears field errors when input changes', async () => {
      render(<SettingsScreen />);

      const changePasswordButton = screen.getByTestId('change-password-button');
      fireEvent.press(changePasswordButton);

      const currentPasswordInput = screen.getByTestId('current-password-input');
      const saveButton = screen.getByTestId('save-password-button');

      // Trigger validation error
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Current password is required')).toBeTruthy();
      });

      // Change input to clear error
      fireEvent.changeText(currentPasswordInput, 'password');

      await waitFor(() => {
        expect(screen.queryByText('Current password is required')).toBeNull();
      });
    });
  });

  describe('Settings Toggles', () => {
    test('toggles push notifications setting', () => {
      render(<SettingsScreen />);

      const pushSwitch = screen.getByTestId('push-notifications-switch');
      
      // Initial state should be true
      expect(pushSwitch.props.value).toBe(true);

      // Toggle off
      fireEvent(pushSwitch, 'onValueChange', false);
      expect(pushSwitch.props.value).toBe(false);

      // Toggle on
      fireEvent(pushSwitch, 'onValueChange', true);
      expect(pushSwitch.props.value).toBe(true);
    });

    test('toggles email notifications setting', () => {
      render(<SettingsScreen />);

      const emailSwitch = screen.getByTestId('email-notifications-switch');
      
      // Initial state should be false
      expect(emailSwitch.props.value).toBe(false);

      // Toggle on
      fireEvent(emailSwitch, 'onValueChange', true);
      expect(emailSwitch.props.value).toBe(true);
    });

    test('toggles location sharing setting', () => {
      render(<SettingsScreen />);

      const locationSwitch = screen.getByTestId('location-sharing-switch');
      
      // Initial state should be true
      expect(locationSwitch.props.value).toBe(true);

      // Toggle off
      fireEvent(locationSwitch, 'onValueChange', false);
      expect(locationSwitch.props.value).toBe(false);
    });
  });

  describe('Account Actions', () => {
    test('shows logout confirmation dialog', () => {
      render(<SettingsScreen />);

      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.press(logoutButton);

      expect(mockAlert).toHaveBeenCalledWith(
        'Logout',
        'Are you sure you want to logout?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'Logout', style: 'destructive' }),
        ])
      );
    });

    test('performs logout when confirmed', () => {
      render(<SettingsScreen />);

      // Mock confirmation dialog
      mockAlert.mockImplementation((title, message, buttons) => {
        // Simulate user pressing "Logout"
        buttons[1].onPress();
      });

      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.press(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    test('shows delete account confirmation dialogs', () => {
      render(<SettingsScreen />);

      const deleteButton = screen.getByTestId('delete-account-button');
      fireEvent.press(deleteButton);

      expect(mockAlert).toHaveBeenCalledWith(
        'Delete Account',
        'This action cannot be undone. All your data will be permanently deleted.',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'Delete', style: 'destructive' }),
        ])
      );
    });

    test('shows second confirmation for delete account', () => {
      render(<SettingsScreen />);

      // Mock first confirmation dialog
      mockAlert.mockImplementationOnce((title, message, buttons) => {
        // Simulate user pressing "Delete"
        buttons[1].onPress();
      });

      const deleteButton = screen.getByTestId('delete-account-button');
      fireEvent.press(deleteButton);

      expect(mockAlert).toHaveBeenCalledWith(
        'Are you absolutely sure?',
        'This will permanently delete your account and all associated data.',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'Delete Forever', style: 'destructive' }),
        ])
      );
    });
  });

  describe('Navigation', () => {
    test('navigates back when back button is pressed', () => {
      render(<SettingsScreen />);

      const backButton = screen.getByTestId('back-button');
      fireEvent.press(backButton);

      expect(mockBack).toHaveBeenCalled();
    });
  });
});