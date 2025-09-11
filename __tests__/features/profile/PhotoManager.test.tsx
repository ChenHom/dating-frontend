/**
 * PhotoManager Component Tests (TDD)
 * 測試照片管理組件
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PhotoManager } from '../components/PhotoManager';
import { Photo } from '@/lib/types';

// Mock image picker utilities
jest.mock('../../../lib/imageUtils', () => ({
  pickImageFromCamera: jest.fn(),
  pickImageFromGallery: jest.fn(),
  processImage: jest.fn(),
}));

// Mock the profile store
const mockUploadPhoto = jest.fn();
const mockDeletePhoto = jest.fn();
const mockSetPrimaryPhoto = jest.fn();

jest.mock('../../../stores/profile', () => ({
  useProfileStore: () => ({
    photos: [],
    uploadPhoto: mockUploadPhoto,
    deletePhoto: mockDeletePhoto,
    setPrimaryPhoto: mockSetPrimaryPhoto,
    isLoading: false,
    error: null,
  }),
}));

// Mock React Native modules
const mockAlert = jest.fn();
const mockActionSheet = jest.fn();

jest.doMock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: mockAlert,
  },
  ActionSheetIOS: {
    showActionSheetWithOptions: mockActionSheet,
  },
}));

global.mockAlert = mockAlert;
global.mockActionSheet = mockActionSheet;

describe('PhotoManager', () => {
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
    {
      id: 2,
      user_id: 1,
      url: 'https://example.com/photo2.jpg',
      order: 2,
      is_primary: false,
      moderation_status: 'approved',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUploadPhoto.mockClear();
    mockDeletePhoto.mockClear();
    mockSetPrimaryPhoto.mockClear();
    mockAlert.mockClear();
    mockActionSheet.mockClear();
  });

  test('should render photo grid with photos', () => {
    // Mock store to return photos
    const useProfileStore = require('../../../stores/profile').useProfileStore;
    useProfileStore.mockImplementation(() => ({
      photos: mockPhotos,
      uploadPhoto: mockUploadPhoto,
      deletePhoto: mockDeletePhoto,
      setPrimaryPhoto: mockSetPrimaryPhoto,
      isLoading: false,
      error: null,
    }));

    const { getByText } = render(<PhotoManager />);

    expect(getByText('我的照片')).toBeTruthy();
    // Should show add photo button
    expect(getByText('+')).toBeTruthy();
  });

  test('should show add photo button when no photos', () => {
    const { getByText } = render(<PhotoManager />);

    expect(getByText('新增照片')).toBeTruthy();
    expect(getByText('點擊新增第一張照片')).toBeTruthy();
  });

  test('should handle photo upload from gallery', async () => {
    const { pickImageFromGallery } = require('../../../lib/imageUtils');
    
    pickImageFromGallery.mockResolvedValue({
      base64: 'mock-base64-data',
      uri: 'file://mock-uri.jpg',
      width: 1080,
      height: 1080,
      fileSize: 500000,
    });

    mockUploadPhoto.mockResolvedValue(undefined);

    const { getByText } = render(<PhotoManager />);

    const addButton = getByText('+');
    fireEvent.press(addButton);

    // Should trigger image picker
    await waitFor(() => {
      expect(pickImageFromGallery).toHaveBeenCalled();
    });
  });

  test('should handle delete photo', async () => {
    const useProfileStore = require('../../../stores/profile').useProfileStore;
    useProfileStore.mockImplementation(() => ({
      photos: mockPhotos,
      uploadPhoto: mockUploadPhoto,
      deletePhoto: mockDeletePhoto,
      setPrimaryPhoto: mockSetPrimaryPhoto,
      isLoading: false,
      error: null,
    }));

    mockAlert.mockImplementation((title, message, buttons) => {
      // Simulate user confirming deletion
      buttons[1].onPress();
    });

    mockDeletePhoto.mockResolvedValue(undefined);

    const { getAllByText } = render(<PhotoManager />);

    // Press delete button (assuming there's a delete button)
    const deleteButtons = getAllByText('刪除');
    fireEvent.press(deleteButtons[0]);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        '刪除照片',
        '確定要刪除這張照片嗎？',
        expect.any(Array)
      );
      expect(mockDeletePhoto).toHaveBeenCalledWith(1);
    });
  });

  test('should handle set primary photo', async () => {
    const useProfileStore = require('../../../stores/profile').useProfileStore;
    useProfileStore.mockImplementation(() => ({
      photos: mockPhotos,
      uploadPhoto: mockUploadPhoto,
      deletePhoto: mockDeletePhoto,
      setPrimaryPhoto: mockSetPrimaryPhoto,
      isLoading: false,
      error: null,
    }));

    mockSetPrimaryPhoto.mockResolvedValue(undefined);

    const { getAllByText } = render(<PhotoManager />);

    // Press set primary button
    const setPrimaryButtons = getAllByText('設為主要');
    fireEvent.press(setPrimaryButtons[0]); // Set second photo as primary

    await waitFor(() => {
      expect(mockSetPrimaryPhoto).toHaveBeenCalledWith(2);
    });
  });

  test('should show photo limit message when at max photos', () => {
    const maxPhotos = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      user_id: 1,
      url: `https://example.com/photo${i + 1}.jpg`,
      order: i + 1,
      is_primary: i === 0,
      moderation_status: 'approved' as const,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    }));

    const useProfileStore = require('../../../stores/profile').useProfileStore;
    useProfileStore.mockImplementation(() => ({
      photos: maxPhotos,
      uploadPhoto: mockUploadPhoto,
      deletePhoto: mockDeletePhoto,
      setPrimaryPhoto: mockSetPrimaryPhoto,
      isLoading: false,
      error: null,
    }));

    const { getByText } = render(<PhotoManager />);

    expect(getByText('已達照片數量上限 (6張)')).toBeTruthy();
  });

  test('should handle moderation status display', () => {
    const photosWithStatuses: Photo[] = [
      {
        ...mockPhotos[0],
        moderation_status: 'pending',
      },
      {
        ...mockPhotos[1],
        moderation_status: 'rejected',
      },
    ];

    const useProfileStore = require('../../../stores/profile').useProfileStore;
    useProfileStore.mockImplementation(() => ({
      photos: photosWithStatuses,
      uploadPhoto: mockUploadPhoto,
      deletePhoto: mockDeletePhoto,
      setPrimaryPhoto: mockSetPrimaryPhoto,
      isLoading: false,
      error: null,
    }));

    const { getByText } = render(<PhotoManager />);

    expect(getByText('審核中')).toBeTruthy();
    expect(getByText('已拒絕')).toBeTruthy();
  });
});