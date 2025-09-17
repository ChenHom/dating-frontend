/**
 * Photo Store Tests
 * 測試照片狀態管理 store
 */

import { renderHook, act } from '@testing-library/react-native';
import { usePhotoStore } from '@/stores/photo';
import { apiClient } from '@/services/api/client';

// Mock API client
jest.mock('@/services/api/client', () => ({
  apiClient: {
    getPhotos: jest.fn(),
    uploadPhoto: jest.fn(),
    deletePhoto: jest.fn(),
    setPrimaryPhoto: jest.fn(),
    updatePhoto: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('usePhotoStore', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    usePhotoStore.getState().resetState();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => usePhotoStore());

      expect(result.current.photos).toEqual([]);
      expect(result.current.uploadQueue).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('loadPhotos', () => {
    it('should load photos successfully', async () => {
      mockApiClient.getPhotos.mockResolvedValue(mockPhotos);

      const { result } = renderHook(() => usePhotoStore());

      await act(async () => {
        await result.current.loadPhotos();
      });

      expect(mockApiClient.getPhotos).toHaveBeenCalled();
      expect(result.current.photos).toEqual(mockPhotos);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle load photos error', async () => {
      const errorMessage = 'Failed to load photos';
      mockApiClient.getPhotos.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePhotoStore());

      await act(async () => {
        try {
          await result.current.loadPhotos();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.photos).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should set loading state during operation', async () => {
      mockApiClient.getPhotos.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockPhotos), 100))
      );

      const { result } = renderHook(() => usePhotoStore());

      act(() => {
        result.current.loadPhotos();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('uploadPhoto', () => {
    const mockImageData = {
      uri: 'file://test-image.jpg',
      base64: 'test-base64-data',
      width: 1080,
      height: 1350,
    };

    const mockNewPhoto = {
      id: 3,
      user_id: 1,
      url: 'https://example.com/photo3.jpg',
      order: 3,
      is_primary: false,
      moderation_status: 'approved' as const,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    };

    it('should upload photo successfully', async () => {
      mockApiClient.uploadPhoto.mockResolvedValue(mockNewPhoto);

      const { result } = renderHook(() => usePhotoStore());

      // Set initial photos
      act(() => {
        result.current.setPhotos(mockPhotos);
      });

      await act(async () => {
        await result.current.uploadPhoto(mockImageData);
      });

      expect(mockApiClient.uploadPhoto).toHaveBeenCalledWith({
        image: mockImageData.base64,
        order: 3, // Next order after existing photos
      });

      expect(result.current.photos).toHaveLength(3);
      expect(result.current.photos[2]).toEqual(mockNewPhoto);
      expect(result.current.isUploading).toBe(false);
    });

    it('should add upload to queue and track progress', async () => {
      mockApiClient.uploadPhoto.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockNewPhoto), 100))
      );

      const { result } = renderHook(() => usePhotoStore());

      act(() => {
        result.current.uploadPhoto(mockImageData);
      });

      // Check upload queue was created
      expect(result.current.uploadQueue).toHaveLength(1);
      expect(result.current.uploadQueue[0]).toEqual(
        expect.objectContaining({
          isUploading: true,
          success: false,
          imageData: mockImageData,
        })
      );

      expect(result.current.isUploading).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.isUploading).toBe(false);
    });

    it('should handle upload errors', async () => {
      const errorMessage = 'Upload failed';
      mockApiClient.uploadPhoto.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePhotoStore());

      await act(async () => {
        try {
          await result.current.uploadPhoto(mockImageData);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isUploading).toBe(false);
      expect(result.current.error).toBe(errorMessage);

      // Check error was set in upload queue
      expect(result.current.uploadQueue[0]).toEqual(
        expect.objectContaining({
          isUploading: false,
          error: errorMessage,
        })
      );
    });
  });

  describe('deletePhoto', () => {
    it('should delete photo successfully', async () => {
      mockApiClient.deletePhoto.mockResolvedValue();

      const { result } = renderHook(() => usePhotoStore());

      // Set initial photos
      act(() => {
        result.current.setPhotos(mockPhotos);
      });

      await act(async () => {
        await result.current.deletePhoto(1);
      });

      expect(mockApiClient.deletePhoto).toHaveBeenCalledWith(1);
      expect(result.current.photos).toHaveLength(1);
      expect(result.current.photos[0].id).toBe(2);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle delete photo error', async () => {
      const errorMessage = 'Failed to delete photo';
      mockApiClient.deletePhoto.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePhotoStore());

      act(() => {
        result.current.setPhotos(mockPhotos);
      });

      await act(async () => {
        try {
          await result.current.deletePhoto(1);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.photos).toHaveLength(2); // Should remain unchanged
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('setPrimaryPhoto', () => {
    it('should set primary photo successfully', async () => {
      mockApiClient.setPrimaryPhoto.mockResolvedValue();

      const { result } = renderHook(() => usePhotoStore());

      act(() => {
        result.current.setPhotos(mockPhotos);
      });

      await act(async () => {
        await result.current.setPrimaryPhoto(2);
      });

      expect(mockApiClient.setPrimaryPhoto).toHaveBeenCalledWith(2);

      // Check that photo 2 is now primary and photo 1 is not
      expect(result.current.photos[0].is_primary).toBe(false);
      expect(result.current.photos[1].is_primary).toBe(true);
    });

    it('should handle set primary photo error', async () => {
      const errorMessage = 'Failed to set primary photo';
      mockApiClient.setPrimaryPhoto.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePhotoStore());

      act(() => {
        result.current.setPhotos(mockPhotos);
      });

      await act(async () => {
        try {
          await result.current.setPrimaryPhoto(2);
        } catch (error) {
          // Expected to throw
        }
      });

      // Primary photo should remain unchanged
      expect(result.current.photos[0].is_primary).toBe(true);
      expect(result.current.photos[1].is_primary).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('updatePhotoOrder', () => {
    it('should update photo order successfully', async () => {
      mockApiClient.updatePhoto.mockResolvedValue(mockPhotos[0]);
      mockApiClient.getPhotos.mockResolvedValue([
        { ...mockPhotos[0], order: 2 },
        { ...mockPhotos[1], order: 1 },
      ]);

      const { result } = renderHook(() => usePhotoStore());

      act(() => {
        result.current.setPhotos(mockPhotos);
      });

      await act(async () => {
        await result.current.updatePhotoOrder(1, 2);
      });

      expect(mockApiClient.updatePhoto).toHaveBeenCalledWith(1, { order: 2 });
      expect(mockApiClient.getPhotos).toHaveBeenCalled(); // Should reload photos
    });
  });

  describe('Upload Queue Management', () => {
    it('should add to upload queue', () => {
      const { result } = renderHook(() => usePhotoStore());

      let uploadId: string;
      act(() => {
        uploadId = result.current.addToUploadQueue({
          uri: 'file://test.jpg',
          base64: 'base64',
          width: 1080,
          height: 1350,
        });
      });

      expect(result.current.uploadQueue).toHaveLength(1);
      expect(result.current.uploadQueue[0]).toEqual(
        expect.objectContaining({
          id: uploadId,
          progress: 0,
          isUploading: true,
          success: false,
        })
      );
    });

    it('should update upload progress', () => {
      const { result } = renderHook(() => usePhotoStore());

      let uploadId: string;
      act(() => {
        uploadId = result.current.addToUploadQueue({
          uri: 'file://test.jpg',
          base64: 'base64',
          width: 1080,
          height: 1350,
        });
      });

      act(() => {
        result.current.updateUploadProgress(uploadId, 50);
      });

      expect(result.current.uploadQueue[0].progress).toBe(50);
    });

    it('should set upload error', () => {
      const { result } = renderHook(() => usePhotoStore());

      let uploadId: string;
      act(() => {
        uploadId = result.current.addToUploadQueue({
          uri: 'file://test.jpg',
          base64: 'base64',
          width: 1080,
          height: 1350,
        });
      });

      act(() => {
        result.current.setUploadError(uploadId, 'Upload failed');
      });

      expect(result.current.uploadQueue[0]).toEqual(
        expect.objectContaining({
          isUploading: false,
          error: 'Upload failed',
          success: false,
        })
      );
    });

    it('should set upload success', () => {
      const { result } = renderHook(() => usePhotoStore());

      let uploadId: string;
      act(() => {
        uploadId = result.current.addToUploadQueue({
          uri: 'file://test.jpg',
          base64: 'base64',
          width: 1080,
          height: 1350,
        });
      });

      act(() => {
        result.current.setUploadSuccess(uploadId);
      });

      expect(result.current.uploadQueue[0]).toEqual(
        expect.objectContaining({
          isUploading: false,
          success: true,
          error: undefined,
        })
      );
    });

    it('should remove from upload queue', () => {
      const { result } = renderHook(() => usePhotoStore());

      let uploadId: string;
      act(() => {
        uploadId = result.current.addToUploadQueue({
          uri: 'file://test.jpg',
          base64: 'base64',
          width: 1080,
          height: 1350,
        });
      });

      expect(result.current.uploadQueue).toHaveLength(1);

      act(() => {
        result.current.removeFromUploadQueue(uploadId);
      });

      expect(result.current.uploadQueue).toHaveLength(0);
    });

    it('should clear upload queue', () => {
      const { result } = renderHook(() => usePhotoStore());

      act(() => {
        result.current.addToUploadQueue({
          uri: 'file://test1.jpg',
          base64: 'base64-1',
          width: 1080,
          height: 1350,
        });
        result.current.addToUploadQueue({
          uri: 'file://test2.jpg',
          base64: 'base64-2',
          width: 1080,
          height: 1350,
        });
      });

      expect(result.current.uploadQueue).toHaveLength(2);

      act(() => {
        result.current.clearUploadQueue();
      });

      expect(result.current.uploadQueue).toHaveLength(0);
    });
  });

  describe('Utility Methods', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => usePhotoStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should reset state', () => {
      const { result } = renderHook(() => usePhotoStore());

      act(() => {
        result.current.setPhotos(mockPhotos);
        result.current.addToUploadQueue({
          uri: 'file://test.jpg',
          base64: 'base64',
          width: 1080,
          height: 1350,
        });
        result.current.setError('Test error');
      });

      // Verify state has data
      expect(result.current.photos).toHaveLength(2);
      expect(result.current.uploadQueue).toHaveLength(1);
      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.resetState();
      });

      // Verify state is reset
      expect(result.current.photos).toEqual([]);
      expect(result.current.uploadQueue).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isUploading).toBe(false);
    });
  });
});