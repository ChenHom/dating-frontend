/**
 * Image Processing Utilities
 * 圖片處理工具函數
 */

import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';

// Image processing configuration
const IMAGE_CONFIG = {
  MAX_WIDTH: 1080,
  MAX_HEIGHT: 1080,
  QUALITY: 0.8,
  MAX_FILE_SIZE: 1024 * 1024, // 1MB in bytes
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
};

export interface ProcessedImage {
  base64: string;
  uri: string;
  width: number;
  height: number;
  fileSize: number;
}

/**
 * Request camera permission
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
};

/**
 * Request media library permission
 */
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

/**
 * Pick image from camera
 */
export const pickImageFromCamera = async (): Promise<ProcessedImage | null> => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    throw new Error('需要相機權限才能拍照');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
    base64: false,
  });

  if (result.canceled) {
    return null;
  }

  return processImage(result.assets[0]);
};

/**
 * Pick image from gallery
 */
export const pickImageFromGallery = async (): Promise<ProcessedImage | null> => {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) {
    throw new Error('需要相片權限才能選擇圖片');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
    base64: false,
  });

  if (result.canceled) {
    return null;
  }

  return processImage(result.assets[0]);
};

/**
 * Process and optimize image
 */
export const processImage = async (
  asset: ImagePicker.ImagePickerAsset
): Promise<ProcessedImage> => {
  try {
    // Calculate resize dimensions while maintaining aspect ratio
    let { width, height } = asset;
    
    if (width > IMAGE_CONFIG.MAX_WIDTH || height > IMAGE_CONFIG.MAX_HEIGHT) {
      const ratio = Math.min(
        IMAGE_CONFIG.MAX_WIDTH / width,
        IMAGE_CONFIG.MAX_HEIGHT / height
      );
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Process image: resize, compress, and convert to base64
    const manipulatedImage = await manipulateAsync(
      asset.uri,
      [{ resize: { width, height } }],
      {
        compress: IMAGE_CONFIG.QUALITY,
        format: SaveFormat.JPEG,
        base64: true,
      }
    );

    if (!manipulatedImage.base64) {
      throw new Error('圖片處理失敗');
    }

    // Estimate file size from base64
    const base64Length = manipulatedImage.base64.length;
    const fileSize = Math.round((base64Length * 3) / 4);

    // Check file size limit
    if (fileSize > IMAGE_CONFIG.MAX_FILE_SIZE) {
      // Try with lower quality if too large
      const lowerQualityImage = await manipulateAsync(
        asset.uri,
        [{ resize: { width, height } }],
        {
          compress: 0.6,
          format: SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!lowerQualityImage.base64) {
        throw new Error('圖片處理失敗');
      }

      const newFileSize = Math.round((lowerQualityImage.base64.length * 3) / 4);
      
      if (newFileSize > IMAGE_CONFIG.MAX_FILE_SIZE) {
        throw new Error('圖片檔案太大，請選擇較小的圖片');
      }

      return {
        base64: lowerQualityImage.base64,
        uri: lowerQualityImage.uri,
        width: lowerQualityImage.width || width,
        height: lowerQualityImage.height || height,
        fileSize: newFileSize,
      };
    }

    return {
      base64: manipulatedImage.base64,
      uri: manipulatedImage.uri,
      width: manipulatedImage.width || width,
      height: manipulatedImage.height || height,
      fileSize,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : '圖片處理時發生未知錯誤'
    );
  }
};

/**
 * Validate image type
 */
export const validateImageType = (uri: string): boolean => {
  const extension = uri.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  return allowedExtensions.includes(extension || '');
};

/**
 * Get image info
 */
export const getImageInfo = (base64: string) => {
  const fileSize = Math.round((base64.length * 3) / 4);
  const fileSizeKB = Math.round(fileSize / 1024);
  const fileSizeMB = Math.round(fileSizeKB / 1024 * 100) / 100;
  
  return {
    fileSize,
    fileSizeKB,
    fileSizeMB,
    fileSizeText: fileSizeMB > 1 ? `${fileSizeMB}MB` : `${fileSizeKB}KB`,
  };
};