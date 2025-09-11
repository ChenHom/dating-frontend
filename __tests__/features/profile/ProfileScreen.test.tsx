/**
 * ProfileScreen Component Tests (TDD)
 * 測試個人檔案主畫面
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';
import { Profile, Photo } from '@/lib/types';

// Mock the profile store
const mockLoadProfile = jest.fn();
const mockClearError = jest.fn();

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

const mockPhotos: Photo[] = [
  {
    id: 1,
    user_id: 1,
    url: 'https://example.com/photo1.jpg',
    order: 1,
    is_primary: true,
    moderation_status: 'approved',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
];

jest.mock('../../../stores/profile', () => ({
  useProfileStore: () => ({
    profile: mockProfile,
    photos: mockPhotos,
    loadProfile: mockLoadProfile,
    clearError: mockClearError,
    isLoading: false,
    error: null,
  }),
}));

// Mock router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: mockPush,
    back: jest.fn(),
  },
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadProfile.mockClear();
    mockClearError.mockClear();
    mockPush.mockClear();
  });

  test('should render profile information', () => {
    const { getByText } = render(<ProfileScreen />);

    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('Test bio')).toBeTruthy();
    expect(getByText('34 歲')).toBeTruthy();
    expect(getByText('Test City')).toBeTruthy();
  });

  test('should load profile on mount', () => {
    render(<ProfileScreen />);
    expect(mockLoadProfile).toHaveBeenCalledTimes(1);
  });

  test('should show edit button and handle navigation', () => {
    const { getByText } = render(<ProfileScreen />);

    const editButton = getByText('編輯個人檔案');
    fireEvent.press(editButton);

    expect(mockPush).toHaveBeenCalledWith('/profile/edit');
  });

  test('should render photo carousel when photos exist', () => {
    const { getByTestId } = render(<ProfileScreen />);

    expect(getByTestId('photo-carousel')).toBeTruthy();
  });

  test('should show placeholder when no primary photo', () => {
    const useProfileStore = require('../../../stores/profile').useProfileStore;
    useProfileStore.mockImplementation(() => ({
      profile: { ...mockProfile, primary_photo_url: null },
      photos: [],
      loadProfile: mockLoadProfile,
      clearError: mockClearError,
      isLoading: false,
      error: null,
    }));

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('新增照片')).toBeTruthy();
  });

  test('should show loading state', () => {
    const useProfileStore = require('../../../stores/profile').useProfileStore;
    useProfileStore.mockImplementation(() => ({
      profile: null,
      photos: [],
      loadProfile: mockLoadProfile,
      clearError: mockClearError,
      isLoading: true,
      error: null,
    }));

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('載入中...')).toBeTruthy();
  });

  test('should show error state and retry', () => {
    const useProfileStore = require('../../../stores/profile').useProfileStore;
    useProfileStore.mockImplementation(() => ({
      profile: null,
      photos: [],
      loadProfile: mockLoadProfile,
      clearError: mockClearError,
      isLoading: false,
      error: 'Failed to load profile',
    }));

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('載入失敗')).toBeTruthy();
    expect(getByText('重試')).toBeTruthy();

    const retryButton = getByText('重試');
    fireEvent.press(retryButton);

    expect(mockLoadProfile).toHaveBeenCalledTimes(2); // Once on mount, once on retry
  });

  test('should handle incomplete profile', () => {
    const incompleteProfile: Profile = {
      ...mockProfile,
      bio: undefined,
      location: undefined,
    };

    const useProfileStore = require('../../../stores/profile').useProfileStore;
    useProfileStore.mockImplementation(() => ({
      profile: incompleteProfile,
      photos: [],
      loadProfile: mockLoadProfile,
      clearError: mockClearError,
      isLoading: false,
      error: null,
    }));

    const { getByText, queryByText } = render(<ProfileScreen />);

    expect(getByText('Test User')).toBeTruthy();
    expect(queryByText('Test bio')).toBeNull();
    expect(queryByText('Test City')).toBeNull();
  });

  test('should show profile completion prompt when profile is incomplete', () => {
    const incompleteProfile: Profile = {
      ...mockProfile,
      bio: undefined,
      birth_date: undefined,
    };

    const useProfileStore = require('../../../stores/profile').useProfileStore;
    useProfileStore.mockImplementation(() => ({
      profile: incompleteProfile,
      photos: [],
      loadProfile: mockLoadProfile,
      clearError: mockClearError,
      isLoading: false,
      error: null,
    }));

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('完善你的個人檔案')).toBeTruthy();
  });
});