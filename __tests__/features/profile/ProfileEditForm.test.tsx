/**
 * ProfileEditForm Component Tests (TDD)
 * 測試個人檔案編輯表單組件
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileEditForm } from '../components/ProfileEditForm';
import { Profile } from '@/lib/types';

// Mock the profile store
const mockUpdateProfile = jest.fn();
const mockClearError = jest.fn();

jest.mock('../../../stores/profile', () => ({
  useProfileStore: () => ({
    updateProfile: mockUpdateProfile,
    clearError: mockClearError,
    isLoading: false,
    error: null,
  }),
}));

// Mock Alert
const mockAlert = jest.fn();
jest.doMock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: mockAlert,
  },
}));

global.mockAlert = mockAlert;

describe('ProfileEditForm', () => {
  const mockProfile: Profile = {
    id: 1,
    user_id: 1,
    display_name: 'Test User',
    bio: 'Test bio',
    birth_date: '1990-01-01',
    age: 34,
    gender: 'male',
    interested_in: 'female',
    location: 'Test City',
    primary_photo_url: 'https://example.com/photo.jpg',
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateProfile.mockClear();
    mockClearError.mockClear();
    mockOnSave.mockClear();
    mockOnCancel.mockClear();
    mockAlert.mockClear();
  });

  test('should render form with initial profile data', () => {
    const { getByDisplayValue, getByText } = render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(getByDisplayValue('Test User')).toBeTruthy();
    expect(getByDisplayValue('Test bio')).toBeTruthy();
    expect(getByDisplayValue('Test City')).toBeTruthy();
    expect(getByText('儲存')).toBeTruthy();
    expect(getByText('取消')).toBeTruthy();
  });

  test('should handle form submission with valid data', async () => {
    mockUpdateProfile.mockResolvedValue(undefined);

    const { getByDisplayValue, getByText } = render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Update display name
    const nameInput = getByDisplayValue('Test User');
    fireEvent.changeText(nameInput, 'Updated User');

    // Submit form
    const saveButton = getByText('儲存');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        display_name: 'Updated User',
        bio: 'Test bio',
        birth_date: '1990-01-01',
        gender: 'male',
        interested_in: 'female',
        location: 'Test City',
      });
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  test('should validate required fields', async () => {
    const { getByDisplayValue, getByText, findByText } = render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Clear display name
    const nameInput = getByDisplayValue('Test User');
    fireEvent.changeText(nameInput, '');

    // Submit form
    const saveButton = getByText('儲存');
    fireEvent.press(saveButton);

    // Should show validation error
    await waitFor(async () => {
      const errorMessage = await findByText('顯示名稱至少需要 2 個字元');
      expect(errorMessage).toBeTruthy();
    });

    expect(mockUpdateProfile).not.toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('should validate bio length', async () => {
    const longBio = 'a'.repeat(501); // 501 characters

    const { getByDisplayValue, getByText, findByText } = render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Set long bio
    const bioInput = getByDisplayValue('Test bio');
    fireEvent.changeText(bioInput, longBio);

    // Submit form
    const saveButton = getByText('儲存');
    fireEvent.press(saveButton);

    // Should show validation error
    await waitFor(async () => {
      const errorMessage = await findByText('個人簡介不能超過 500 個字元');
      expect(errorMessage).toBeTruthy();
    });
  });

  test('should handle cancel button', () => {
    const { getByText } = render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = getByText('取消');
    fireEvent.press(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  test('should handle form submission error', async () => {
    const errorMessage = 'Update failed';
    mockUpdateProfile.mockRejectedValue(new Error(errorMessage));

    const { getByText } = render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = getByText('儲存');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
      // Should not call onSave on error
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  test('should render without profile (create mode)', () => {
    const { getByPlaceholderText, getByText } = render(
      <ProfileEditForm
        profile={null}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(getByPlaceholderText('輸入顯示名稱')).toBeTruthy();
    expect(getByPlaceholderText('簡單介紹一下自己')).toBeTruthy();
    expect(getByText('儲存')).toBeTruthy();
  });

  test('should handle gender selection', () => {
    const { getByText } = render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Should show current gender selection
    expect(getByText('男性')).toBeTruthy(); // Assuming this is how gender is displayed
  });

  test('should handle interested_in selection', () => {
    const { getByText } = render(
      <ProfileEditForm
        profile={mockProfile}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Should show current interested_in selection
    expect(getByText('女性')).toBeTruthy(); // Assuming this is how interested_in is displayed
  });
});