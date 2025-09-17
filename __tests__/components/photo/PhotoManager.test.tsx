/**
 * PhotoManager Component Tests (Updated)
 * 測試新實作的照片管理組件
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { PhotoManager } from '@/components/photo/PhotoManager';
import { usePhotoStore } from '@/stores/photo';

// Mock dependencies
jest.mock('@/stores/photo');
jest.mock('@/components/photo/PhotoUploadButton', () => ({
  PhotoUploadButton: ({ onImageSelected, disabled, testID }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity
        testID={testID}
        disabled={disabled}
        onPress={() => {
          if (!disabled && onImageSelected) {
            onImageSelected({
              uri: 'file://test-image.jpg',
              base64: 'test-base64',
              width: 1080,
              height: 1350,
            });
          }
        }}
      >
        <Text>Upload Photo</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('@/components/photo/PhotoUploadProgress', () => ({
  PhotoUploadProgress: ({ uploadId, testID }: any) => {
    const { View, Text } = require('react-native');
    return (
      <View testID={testID}>
        <Text>Upload Progress: {uploadId}</Text>
      </View>
    );
  },
}));

jest.mock('expo-image', () => ({
  Image: ({ source, testID }: any) => {
    const { View, Text } = require('react-native');
    return (
      <View testID={testID}>
        <Text>Image: {source.uri}</Text>
      </View>
    );
  },
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockUsePhotoStore = usePhotoStore as jest.MockedFunction<typeof usePhotoStore>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

describe('PhotoManager', () => {
  const mockPhotos = [
    {
      id: 1,
      user_id: 1,
      url: 'https://example.com/photo1.jpg',
      order: 1,
      is_primary: true,
      moderation_status: 'approved' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      user_id: 1,
      url: 'https://example.com/photo2.jpg',
      order: 2,
      is_primary: false,
      moderation_status: 'approved' as const,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ];

  const mockStoreActions = {
    fetchPhotos: jest.fn(),
    deletePhoto: jest.fn(),
    setPrimaryPhotoAsync: jest.fn(),
    addToUploadQueue: jest.fn(),
    uploadPhoto: jest.fn(),
    setError: jest.fn(),
  };

  const defaultMockStore = {
    photos: [],
    primaryPhoto: null,
    uploadQueue: [],
    isLoading: false,
    isUploading: false,
    error: null,
    uploadLimit: 10,
    uploadsToday: 0,
    ...mockStoreActions,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePhotoStore.mockReturnValue(defaultMockStore as any);
  });

  describe('Rendering', () => {
    it('renders with initial state', () => {
      const { getByText, getByTestId } = render(<PhotoManager />);

      expect(getByText('我的照片')).toBeTruthy();
      expect(getByText('0/10 張照片')).toBeTruthy();
      expect(getByTestId('photo-upload-button')).toBeTruthy();
    });

    it('renders with existing photos', () => {
      mockUsePhotoStore.mockReturnValue({
        ...defaultMockStore,
        photos: mockPhotos,
      } as any);

      const { getByText } = render(<PhotoManager />);

      expect(getByText('2/10 張照片')).toBeTruthy();
      expect(getByText('Image: https://example.com/photo1.jpg')).toBeTruthy();
      expect(getByText('Image: https://example.com/photo2.jpg')).toBeTruthy();
    });

    it('renders custom testID', () => {
      const { getByTestId } = render(
        <PhotoManager testID="custom-manager" />
      );

      expect(getByTestId('custom-manager')).toBeTruthy();
    });
  });

  describe('Photo Loading', () => {
    it('calls fetchPhotos on mount', () => {
      render(<PhotoManager />);

      expect(mockStoreActions.fetchPhotos).toHaveBeenCalledTimes(1);
    });
  });

  describe('Photo Upload', () => {
    it('handles successful photo upload', async () => {
      mockStoreActions.addToUploadQueue.mockReturnValue('upload-123');
      mockStoreActions.uploadPhoto.mockResolvedValue(undefined);

      const { getByTestId } = render(<PhotoManager />);

      const uploadButton = getByTestId('photo-upload-button');
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(mockStoreActions.addToUploadQueue).toHaveBeenCalledWith({
          image: 'test-base64',
          localUri: 'file://test-image.jpg',
          order: 1,
        });
        expect(mockStoreActions.uploadPhoto).toHaveBeenCalledWith('upload-123');
      });
    });

    it('prevents upload when photo limit reached', async () => {
      const maxPhotos = Array.from({ length: 10 }, (_, i) => ({
        ...mockPhotos[0],
        id: i + 1,
      }));

      mockUsePhotoStore.mockReturnValue({
        ...defaultMockStore,
        photos: maxPhotos,
      } as any);

      const { getByTestId } = render(<PhotoManager />);

      const uploadButton = getByTestId('photo-upload-button');
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          '上傳限制',
          '最多只能上傳 10 張照片'
        );
        expect(mockStoreActions.addToUploadQueue).not.toHaveBeenCalled();
      });
    });

    it('handles upload errors', async () => {
      mockStoreActions.uploadPhoto.mockRejectedValue(
        new Error('Upload failed')
      );

      const { getByTestId } = render(<PhotoManager />);

      const uploadButton = getByTestId('photo-upload-button');
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('錯誤', 'Upload failed');
      });
    });

    it('shows upload limit message when limit reached', () => {
      const maxPhotos = Array.from({ length: 10 }, (_, i) => ({
        ...mockPhotos[0],
        id: i + 1,
      }));

      mockUsePhotoStore.mockReturnValue({
        ...defaultMockStore,
        photos: maxPhotos,
      } as any);

      const { getByText } = render(<PhotoManager />);

      expect(getByText('已達到照片上傳限制 (10 張)')).toBeTruthy();
    });
  });

  describe('Upload Queue Display', () => {
    it('displays upload progress for queued items', () => {
      const uploadQueue = [
        {
          id: 'upload-1',
          fileName: 'photo1.jpg',
          progress: 50,
          isUploading: true,
          success: false,
          imageData: {
            uri: 'file://photo1.jpg',
            base64: 'base64-1',
            width: 1080,
            height: 1350,
          },
        },
        {
          id: 'upload-2',
          fileName: 'photo2.jpg',
          progress: 100,
          isUploading: false,
          success: true,
          imageData: {
            uri: 'file://photo2.jpg',
            base64: 'base64-2',
            width: 1080,
            height: 1350,
          },
        },
      ];

      mockUsePhotoStore.mockReturnValue({
        ...defaultMockStore,
        uploadQueue,
      } as any);

      const { getByText } = render(<PhotoManager />);

      expect(getByText('Upload Progress: upload-1')).toBeTruthy();
      expect(getByText('Upload Progress: upload-2')).toBeTruthy();
    });
  });

  describe('Photo Management', () => {
    beforeEach(() => {
      mockUsePhotoStore.mockReturnValue({
        ...defaultMockStore,
        photos: mockPhotos,
      } as any);
    });

    it('handles photo deletion with confirmation', async () => {
      mockAlert.mockImplementation((title, message, buttons) => {
        // Simulate user confirming deletion
        const deleteButton = buttons?.find((btn: any) => btn.text === '刪除');
        if (deleteButton) {
          deleteButton.onPress();
        }
      });

      mockStoreActions.deletePhoto.mockResolvedValue(undefined);

      const { getByTestId } = render(<PhotoManager />);

      const deleteButton = getByTestId('delete-photo-1');
      fireEvent.press(deleteButton);

      expect(mockAlert).toHaveBeenCalledWith(
        '刪除照片',
        '確定要刪除這張照片嗎？',
        expect.arrayContaining([
          expect.objectContaining({ text: '取消' }),
          expect.objectContaining({ text: '刪除' }),
        ])
      );

      await waitFor(() => {
        expect(mockStoreActions.deletePhoto).toHaveBeenCalledWith(1);
      });
    });

    it('handles setting primary photo', async () => {
      mockStoreActions.setPrimaryPhotoAsync.mockResolvedValue(undefined);

      const { getByTestId } = render(<PhotoManager />);

      const setPrimaryButton = getByTestId('set-primary-2');
      fireEvent.press(setPrimaryButton);

      await waitFor(() => {
        expect(mockStoreActions.setPrimaryPhotoAsync).toHaveBeenCalledWith(2);
      });
    });

    it('shows primary badge on primary photo', () => {
      const { getByText } = render(<PhotoManager />);

      expect(getByText('主要')).toBeTruthy();
    });

    it('shows order numbers on photos', () => {
      const { getByText } = render(<PhotoManager />);

      expect(getByText('1')).toBeTruthy();
      expect(getByText('2')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when present', () => {
      mockUsePhotoStore.mockReturnValue({
        ...defaultMockStore,
        error: 'Failed to load photos',
      } as any);

      const { getByText } = render(<PhotoManager />);

      expect(getByText('Failed to load photos')).toBeTruthy();
    });

    it('allows dismissing error message', () => {
      mockUsePhotoStore.mockReturnValue({
        ...defaultMockStore,
        error: 'Failed to load photos',
      } as any);

      const { getByTestId } = render(<PhotoManager />);

      // Find and press the close button (Ionicons close)
      const closeButton = getByTestId('photo-manager')
        .findByType(require('@expo/vector-icons').Ionicons)
        .find((icon: any) => icon.props.name === 'close');

      if (closeButton) {
        fireEvent.press(closeButton.parent);
        expect(mockStoreActions.setError).toHaveBeenCalledWith(null);
      }
    });
  });

  describe('Loading States', () => {
    it('shows loading overlay when loading', () => {
      mockUsePhotoStore.mockReturnValue({
        ...defaultMockStore,
        isLoading: true,
      } as any);

      const { getByText } = render(<PhotoManager />);

      expect(getByText('載入中...')).toBeTruthy();
    });

    it('disables upload button when uploading', () => {
      mockUsePhotoStore.mockReturnValue({
        ...defaultMockStore,
        isUploading: true,
      } as any);

      const { getByTestId } = render(<PhotoManager />);

      const uploadButton = getByTestId('photo-upload-button');
      expect(uploadButton.props.disabled).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('provides proper testIDs for photo actions', () => {
      mockUsePhotoStore.mockReturnValue({
        ...defaultMockStore,
        photos: mockPhotos,
      } as any);

      const { getByTestId } = render(<PhotoManager />);

      expect(getByTestId('set-primary-2')).toBeTruthy();
      expect(getByTestId('delete-photo-1')).toBeTruthy();
      expect(getByTestId('delete-photo-2')).toBeTruthy();
    });

    it('applies custom styles', () => {
      const customStyle = { backgroundColor: 'red' };

      const { getByTestId } = render(
        <PhotoManager style={customStyle} />
      );

      const container = getByTestId('photo-manager');
      expect(container.props.style).toEqual(
        expect.arrayContaining([customStyle])
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles empty upload queue', () => {
      const { queryByText } = render(<PhotoManager />);

      expect(queryByText(/Upload Progress:/)).toBeNull();
    });

    it('handles photos without primary photo set', () => {
      const photosWithoutPrimary = mockPhotos.map(photo => ({
        ...photo,
        is_primary: false,
      }));

      mockUsePhotoStore.mockReturnValue({
        ...defaultMockStore,
        photos: photosWithoutPrimary,
      } as any);

      const { queryByText } = render(<PhotoManager />);

      expect(queryByText('主要')).toBeNull();
    });
  });
});