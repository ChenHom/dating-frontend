/**
 * EditProfileScreen Component Tests
 * 個人檔案編輯頁面測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { EditProfileScreen } from '../../../features/profile/EditProfileScreen';
import { useAuthStore } from '../../../stores/auth';
import { useProfileStore } from '../../../stores/profile';

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

// Mock stores
jest.mock('../../../stores/auth');
jest.mock('../../../stores/profile');

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseProfileStore = useProfileStore as jest.MockedFunction<typeof useProfileStore>;

describe('EditProfileScreen', () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockProfile = {
    id: 1,
    user_id: 1,
    display_name: 'John Doe',
    bio: 'Test bio',
    age: 25,
    city: 'Test City',
    primary_photo_url: null,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockProfileActions = {
    loadProfile: jest.fn(),
    updateProfile: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth store
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      setUser: jest.fn(),
      setToken: jest.fn(),
      clearError: jest.fn(),
    });

    // Mock profile store
    mockUseProfileStore.mockReturnValue({
      profile: mockProfile,
      photos: [],
      isLoading: false,
      error: null,
      ...mockProfileActions,
      uploadPhoto: jest.fn(),
      deletePhoto: jest.fn(),
      setPrimaryPhoto: jest.fn(),
    });
  });

  describe('Rendering', () => {
    test('renders edit profile screen with form fields', async () => {
      render(<EditProfileScreen />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeTruthy();
        expect(screen.getByDisplayValue('John Doe')).toBeTruthy();
        expect(screen.getByDisplayValue('Test bio')).toBeTruthy();
        expect(screen.getByDisplayValue('25')).toBeTruthy();
        expect(screen.getByDisplayValue('Test City')).toBeTruthy();
      });
    });

    test('shows loading state when profile is loading', () => {
      mockUseProfileStore.mockReturnValue({
        profile: null,
        photos: [],
        isLoading: true,
        error: null,
        ...mockProfileActions,
        uploadPhoto: jest.fn(),
        deletePhoto: jest.fn(),
        setPrimaryPhoto: jest.fn(),
      });

      render(<EditProfileScreen />);

      expect(screen.getByText('Loading profile...')).toBeTruthy();
    });

    test('displays error message when there is an error', async () => {
      mockUseProfileStore.mockReturnValue({
        profile: mockProfile,
        photos: [],
        isLoading: false,
        error: 'Failed to load profile',
        ...mockProfileActions,
        uploadPhoto: jest.fn(),
        deletePhoto: jest.fn(),
        setPrimaryPhoto: jest.fn(),
      });

      render(<EditProfileScreen />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load profile')).toBeTruthy();
      });
    });
  });

  describe('Form Validation', () => {
    test('shows error for empty display name', async () => {
      render(<EditProfileScreen />);

      const displayNameInput = screen.getByTestId('display-name-input');
      const saveButton = screen.getByTestId('save-button');

      fireEvent.changeText(displayNameInput, '');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Display name is required')).toBeTruthy();
      });

      expect(mockProfileActions.updateProfile).not.toHaveBeenCalled();
    });

    test('shows error for display name that is too short', async () => {
      render(<EditProfileScreen />);

      const displayNameInput = screen.getByTestId('display-name-input');
      const saveButton = screen.getByTestId('save-button');

      fireEvent.changeText(displayNameInput, 'A');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Display name must be at least 2 characters')).toBeTruthy();
      });

      expect(mockProfileActions.updateProfile).not.toHaveBeenCalled();
    });

    test('shows error for display name that is too long', async () => {
      render(<EditProfileScreen />);

      const displayNameInput = screen.getByTestId('display-name-input');
      const saveButton = screen.getByTestId('save-button');

      const longName = 'A'.repeat(51);
      fireEvent.changeText(displayNameInput, longName);
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Display name must be less than 50 characters')).toBeTruthy();
      });

      expect(mockProfileActions.updateProfile).not.toHaveBeenCalled();
    });

    test('shows error for bio that is too long', async () => {
      render(<EditProfileScreen />);

      const bioInput = screen.getByTestId('bio-input');
      const saveButton = screen.getByTestId('save-button');

      const longBio = 'A'.repeat(501);
      fireEvent.changeText(bioInput, longBio);
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Bio must be less than 500 characters')).toBeTruthy();
      });

      expect(mockProfileActions.updateProfile).not.toHaveBeenCalled();
    });

    test('shows error for invalid age', async () => {
      render(<EditProfileScreen />);

      const ageInput = screen.getByTestId('age-input');
      const saveButton = screen.getByTestId('save-button');

      fireEvent.changeText(ageInput, '17');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Age must be between 18 and 100')).toBeTruthy();
      });

      expect(mockProfileActions.updateProfile).not.toHaveBeenCalled();
    });

    test('shows bio character counter', async () => {
      render(<EditProfileScreen />);

      const bioInput = screen.getByTestId('bio-input');

      await waitFor(() => {
        expect(screen.getByText('8/500')).toBeTruthy(); // "Test bio" = 8 characters
      });

      fireEvent.changeText(bioInput, 'New longer bio text');

      await waitFor(() => {
        expect(screen.getByText('21/500')).toBeTruthy();
      });
    });
  });

  describe('Form Actions', () => {
    test('calls updateProfile with correct data when form is valid', async () => {
      render(<EditProfileScreen />);

      const displayNameInput = screen.getByTestId('display-name-input');
      const bioInput = screen.getByTestId('bio-input');
      const ageInput = screen.getByTestId('age-input');
      const cityInput = screen.getByTestId('city-input');
      const saveButton = screen.getByTestId('save-button');

      fireEvent.changeText(displayNameInput, 'Updated Name');
      fireEvent.changeText(bioInput, 'Updated bio');
      fireEvent.changeText(ageInput, '30');
      fireEvent.changeText(cityInput, 'Updated City');

      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockProfileActions.updateProfile).toHaveBeenCalledWith({
          display_name: 'Updated Name',
          bio: 'Updated bio',
          age: 30,
          city: 'Updated City',
        });
      });
    });

    test('calls router.back when cancel is pressed without changes', () => {
      render(<EditProfileScreen />);

      const cancelButton = screen.getByTestId('back-button');
      fireEvent.press(cancelButton);

      expect(mockBack).toHaveBeenCalled();
    });

    test('shows confirmation dialog when back is pressed with changes', async () => {
      // Mock Alert
      const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');
      mockAlert.mockImplementation((title, message, buttons) => {
        // Simulate user pressing "Leave"
        buttons[1].onPress();
      });

      render(<EditProfileScreen />);

      const displayNameInput = screen.getByTestId('display-name-input');
      const cancelButton = screen.getByTestId('back-button');

      // Make a change
      fireEvent.changeText(displayNameInput, 'Changed Name');

      fireEvent.press(cancelButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Unsaved Changes',
          'You have unsaved changes. Are you sure you want to go back?',
          expect.any(Array)
        );
        expect(mockBack).toHaveBeenCalled();
      });

      mockAlert.mockRestore();
    });

    test('clears field errors when input changes', async () => {
      render(<EditProfileScreen />);

      const displayNameInput = screen.getByTestId('display-name-input');
      const saveButton = screen.getByTestId('save-button');

      // Trigger validation error
      fireEvent.changeText(displayNameInput, '');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Display name is required')).toBeTruthy();
      });

      // Change input to clear error
      fireEvent.changeText(displayNameInput, 'Valid Name');

      await waitFor(() => {
        expect(screen.queryByText('Display name is required')).toBeNull();
      });
    });
  });

  describe('Success Handling', () => {
    test('shows success alert and navigates back on successful update', async () => {
      // Mock Alert
      const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');
      mockAlert.mockImplementation((title, message, buttons) => {
        // Simulate user pressing "OK"
        buttons[0].onPress();
      });

      mockProfileActions.updateProfile.mockResolvedValue(mockProfile);

      render(<EditProfileScreen />);

      const displayNameInput = screen.getByTestId('display-name-input');
      const saveButton = screen.getByTestId('save-button');

      fireEvent.changeText(displayNameInput, 'Updated Name');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Success',
          'Profile updated successfully!',
          expect.any(Array)
        );
        expect(mockBack).toHaveBeenCalled();
      });

      mockAlert.mockRestore();
    });
  });
});