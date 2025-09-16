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

/**
 * Pick multiple images from gallery
 */
export const pickMultipleImagesFromGallery = async (
  maxSelection: number = 6
): Promise<ProcessedImage[]> => {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) {
    throw new Error('需要相片權限才能選擇圖片');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: maxSelection,
    allowsEditing: false,
    quality: 1,
    base64: false,
  });

  if (result.canceled) {
    return [];
  }

  // Process all selected images
  const processedImages = await Promise.all(
    result.assets.map(asset => processImage(asset))
  );

  return processedImages;
};

/**
 * Show image source selection action sheet
 */
export interface ImageSourceOption {
  title: string;
  action: () => Promise<ProcessedImage | ProcessedImage[] | null>;
}

export const getImageSourceOptions = (allowMultiple = false): ImageSourceOption[] => {
  const options: ImageSourceOption[] = [
    {
      title: '拍照',
      action: pickImageFromCamera,
    },
  ];

  if (allowMultiple) {
    options.push({
      title: '從相簿選擇多張',
      action: () => pickMultipleImagesFromGallery(6),
    });
  } else {
    options.push({
      title: '從相簿選擇',
      action: pickImageFromGallery,
    });
  }

  return options;
};

/**
 * Generate thumbnail from processed image
 */
export const generateThumbnail = async (
  imageUri: string,
  size: number = 200
): Promise<ProcessedImage> => {
  try {
    const manipulatedImage = await manipulateAsync(
      imageUri,
      [{ resize: { width: size, height: size } }],
      {
        compress: 0.7,
        format: SaveFormat.JPEG,
        base64: true,
      }
    );

    if (!manipulatedImage.base64) {
      throw new Error('縮圖生成失敗');
    }

    const fileSize = Math.round((manipulatedImage.base64.length * 3) / 4);

    return {
      base64: manipulatedImage.base64,
      uri: manipulatedImage.uri,
      width: manipulatedImage.width || size,
      height: manipulatedImage.height || size,
      fileSize,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : '縮圖生成時發生未知錯誤'
    );
  }
};

/**
 * Check if image needs compression
 */
export const needsCompression = (asset: ImagePicker.ImagePickerAsset): boolean => {
  return (
    asset.width > IMAGE_CONFIG.MAX_WIDTH ||
    asset.height > IMAGE_CONFIG.MAX_HEIGHT ||
    (asset.fileSize && asset.fileSize > IMAGE_CONFIG.MAX_FILE_SIZE)
  );
};

/**
 * Estimate processing time based on image size
 */
export const estimateProcessingTime = (asset: ImagePicker.ImagePickerAsset): number => {
  const pixelCount = asset.width * asset.height;
  const basetime = 1000; // 1 second for small images

  if (pixelCount > 4000000) { // > 4MP
    return basetime * 3;
  } else if (pixelCount > 2000000) { // > 2MP
    return basetime * 2;
  }

  return basetime;
};

/**
 * Image processing error types
 */
export enum ImageProcessingError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  CANCELLED = 'CANCELLED',
}

export const getImageProcessingErrorMessage = (error: ImageProcessingError): string => {
  switch (error) {
    case ImageProcessingError.PERMISSION_DENIED:
      return '需要相機或相片權限才能繼續';
    case ImageProcessingError.FILE_TOO_LARGE:
      return '圖片檔案太大，請選擇較小的圖片';
    case ImageProcessingError.INVALID_FORMAT:
      return '不支援的圖片格式，請選擇 JPEG、PNG 或 WEBP 格式';
    case ImageProcessingError.PROCESSING_FAILED:
      return '圖片處理失敗，請重試';
    case ImageProcessingError.CANCELLED:
      return '操作已取消';
    default:
      return '圖片處理時發生未知錯誤';
  }
};