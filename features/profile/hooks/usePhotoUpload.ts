import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { usePhotoStore } from '@/stores/photo';
import { apiClient } from '@/services/api/client';
import { ProcessedImage } from '@/lib/imageUtils';
import { Photo } from '@/lib/types';

export interface UploadResult {
  success: boolean;
  photo?: Photo;
  error?: string;
}

export interface UsePhotoUploadReturn {
  // State
  isUploading: boolean;
  uploadProgress: Record<string, number>; // uploadId -> progress (0-100)
  uploadErrors: Record<string, string>; // uploadId -> error message

  // Actions
  uploadSingle: (processedImage: ProcessedImage, order?: number) => Promise<UploadResult>;
  uploadMultiple: (processedImages: ProcessedImage[]) => Promise<UploadResult[]>;
  cancelUpload: (uploadId: string) => void;
  retryUpload: (uploadId: string) => Promise<UploadResult>;
  clearErrors: () => void;

  // Utilities
  canUpload: (count?: number) => { canUpload: boolean; reason?: string };
  getRemainingSlots: () => number;
  getRemainingDailyUploads: () => number;
}

export const usePhotoUpload = (): UsePhotoUploadReturn => {
  const {
    photos,
    uploadQueue,
    uploadLimit,
    uploadsToday,
    addToUploadQueue,
    updateUploadProgress,
    removeFromUploadQueue,
    addPhoto,
    setError,
  } = usePhotoStore();

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  // Monitor upload queue for active uploads
  useEffect(() => {
    const activeUploads = uploadQueue.filter(item =>
      item.status === 'uploading' || item.status === 'preparing'
    );
    setIsUploading(activeUploads.length > 0);
  }, [uploadQueue]);

  // Sync upload progress from store
  useEffect(() => {
    const progressMap: Record<string, number> = {};
    const errorMap: Record<string, string> = {};

    uploadQueue.forEach(item => {
      progressMap[item.id] = item.progress;
      if (item.error) {
        errorMap[item.id] = item.error;
      }
    });

    setUploadProgress(progressMap);
    setUploadErrors(errorMap);
  }, [uploadQueue]);

  const canUpload = useCallback((count = 1) => {
    const maxPhotos = 6; // From backend config
    const remainingSlots = maxPhotos - photos.length;
    const remainingDailyUploads = uploadLimit - uploadsToday;

    if (remainingSlots < count) {
      return {
        canUpload: false,
        reason: `照片數量已滿，最多只能上傳 ${maxPhotos} 張照片`
      };
    }

    if (remainingDailyUploads < count) {
      return {
        canUpload: false,
        reason: `今日上傳次數已達上限 (${uploadLimit} 次)`
      };
    }

    return { canUpload: true };
  }, [photos.length, uploadLimit, uploadsToday]);

  const getRemainingSlots = useCallback(() => {
    const maxPhotos = 6;
    return maxPhotos - photos.length;
  }, [photos.length]);

  const getRemainingDailyUploads = useCallback(() => {
    return uploadLimit - uploadsToday;
  }, [uploadLimit, uploadsToday]);

  const performUpload = async (uploadId: string, processedImage: ProcessedImage, order: number): Promise<UploadResult> => {
    try {
      updateUploadProgress(uploadId, {
        status: 'preparing',
        progress: 0,
      });

      // Simulate progress updates during upload
      const progressInterval = setInterval(() => {
        const currentItem = uploadQueue.find(item => item.id === uploadId);
        if (currentItem && currentItem.status === 'uploading' && currentItem.progress < 90) {
          updateUploadProgress(uploadId, {
            progress: Math.min(currentItem.progress + 10, 90)
          });
        }
      }, 200);

      updateUploadProgress(uploadId, {
        status: 'uploading',
        progress: 10,
      });

      // Call API
      const photo = await apiClient.uploadPhoto({
        image: processedImage.base64,
        order,
      });

      clearInterval(progressInterval);

      updateUploadProgress(uploadId, {
        status: 'success',
        progress: 100,
      });

      // Add photo to store
      addPhoto(photo);

      // Clean up upload queue
      setTimeout(() => {
        removeFromUploadQueue(uploadId);
      }, 1000);

      return { success: true, photo };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上傳失敗';

      updateUploadProgress(uploadId, {
        status: 'error',
        error: errorMessage,
      });

      setError(errorMessage);

      return { success: false, error: errorMessage };
    }
  };

  const uploadSingle = useCallback(async (
    processedImage: ProcessedImage,
    order?: number
  ): Promise<UploadResult> => {
    const uploadCheck = canUpload(1);
    if (!uploadCheck.canUpload) {
      const error = uploadCheck.reason || '無法上傳';
      Alert.alert('上傳失敗', error);
      return { success: false, error };
    }

    const uploadId = addToUploadQueue({
      image: processedImage.base64,
      localUri: processedImage.uri,
      order: order || photos.length + 1,
    });

    return performUpload(uploadId, processedImage, order || photos.length + 1);
  }, [canUpload, addToUploadQueue, photos.length]);

  const uploadMultiple = useCallback(async (
    processedImages: ProcessedImage[]
  ): Promise<UploadResult[]> => {
    const uploadCheck = canUpload(processedImages.length);
    if (!uploadCheck.canUpload) {
      const error = uploadCheck.reason || '無法上傳';
      Alert.alert('上傳失敗', error);
      return processedImages.map(() => ({ success: false, error }));
    }

    // Add all to upload queue
    const uploadIds = processedImages.map((image, index) =>
      addToUploadQueue({
        image: image.base64,
        localUri: image.uri,
        order: photos.length + index + 1,
      })
    );

    // Upload sequentially to avoid overwhelming the server
    const results: UploadResult[] = [];
    for (let i = 0; i < processedImages.length; i++) {
      const result = await performUpload(
        uploadIds[i],
        processedImages[i],
        photos.length + i + 1
      );
      results.push(result);

      // If one fails, continue with others but log the error
      if (!result.success) {
        console.warn(`Upload ${i + 1}/${processedImages.length} failed:`, result.error);
      }
    }

    return results;
  }, [canUpload, addToUploadQueue, photos.length]);

  const cancelUpload = useCallback((uploadId: string) => {
    removeFromUploadQueue(uploadId);

    // Clear progress and error for this upload
    setUploadProgress(prev => {
      const { [uploadId]: _, ...rest } = prev;
      return rest;
    });

    setUploadErrors(prev => {
      const { [uploadId]: _, ...rest } = prev;
      return rest;
    });
  }, [removeFromUploadQueue]);

  const retryUpload = useCallback(async (uploadId: string): Promise<UploadResult> => {
    const uploadItem = uploadQueue.find(item => item.id === uploadId);
    if (!uploadItem || !uploadItem.file) {
      return { success: false, error: '找不到上傳項目' };
    }

    if (uploadItem.retryCount >= 3) {
      return { success: false, error: '重試次數已達上限' };
    }

    // Reset upload state
    updateUploadProgress(uploadId, {
      status: 'idle',
      progress: 0,
      error: undefined,
      retryCount: uploadItem.retryCount + 1,
    });

    // Clear error for this upload
    setUploadErrors(prev => {
      const { [uploadId]: _, ...rest } = prev;
      return rest;
    });

    // Reconstruct processed image from stored data
    const processedImage: ProcessedImage = {
      base64: '', // This would need to be stored in the upload queue
      uri: uploadItem.file.uri,
      width: 1080, // Default values - these should be stored too
      height: 1080,
      fileSize: uploadItem.file.size || 0,
    };

    return performUpload(uploadId, processedImage, 1);
  }, [uploadQueue, updateUploadProgress]);

  const clearErrors = useCallback(() => {
    setUploadErrors({});
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadErrors,
    uploadSingle,
    uploadMultiple,
    cancelUpload,
    retryUpload,
    clearErrors,
    canUpload,
    getRemainingSlots,
    getRemainingDailyUploads,
  };
};