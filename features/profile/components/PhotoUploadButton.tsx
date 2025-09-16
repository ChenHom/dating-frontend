import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePhotoStore } from '@/stores/photo';
import {
  getImageSourceOptions,
  ProcessedImage,
  ImageProcessingError,
  getImageProcessingErrorMessage,
} from '@/lib/imageUtils';

interface PhotoUploadButtonProps {
  disabled?: boolean;
  maxPhotos?: number;
  allowMultiple?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
  onUploadStart?: () => void;
  onUploadSuccess?: (images: ProcessedImage[]) => void;
  onUploadError?: (error: string) => void;
}

export const PhotoUploadButton: React.FC<PhotoUploadButtonProps> = ({
  disabled = false,
  maxPhotos = 6,
  allowMultiple = false,
  size = 'medium',
  style,
  onUploadStart,
  onUploadSuccess,
  onUploadError,
}) => {
  const { photos, addToUploadQueue, uploadPhoto, uploadsToday, uploadLimit } = usePhotoStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const canUpload = !disabled && photos.length < maxPhotos && uploadsToday < uploadLimit;
  const remainingUploads = uploadLimit - uploadsToday;
  const remainingSlots = maxPhotos - photos.length;

  const showImageSourceOptions = () => {
    const options = getImageSourceOptions(allowMultiple);
    const buttonTitles = options.map(option => option.title);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...buttonTitles, '取消'],
          cancelButtonIndex: buttonTitles.length,
        },
        async (buttonIndex) => {
          if (buttonIndex < buttonTitles.length) {
            await handleImageSelection(options[buttonIndex]);
          }
        }
      );
    } else {
      // For Android, we'll use Alert.alert with buttons
      const alertButtons = options.map((option, index) => ({
        text: option.title,
        onPress: () => handleImageSelection(option),
      }));

      alertButtons.push({
        text: '取消',
        style: 'cancel' as const,
      });

      Alert.alert('選擇圖片來源', undefined, alertButtons);
    }
  };

  const handleImageSelection = async (option: any) => {
    if (!canUpload) {
      return;
    }

    setIsProcessing(true);
    onUploadStart?.();

    try {
      const result = await option.action();

      if (!result) {
        // User cancelled
        return;
      }

      const images = Array.isArray(result) ? result : [result];

      if (images.length === 0) {
        return;
      }

      // Check if we exceed photo limits
      if (photos.length + images.length > maxPhotos) {
        Alert.alert(
          '照片數量超限',
          `您最多只能上傳 ${maxPhotos} 張照片，目前已有 ${photos.length} 張`
        );
        return;
      }

      // Add images to upload queue and start upload
      const uploadPromises = images.map(async (image) => {
        const uploadId = addToUploadQueue({
          image: image.base64,
          localUri: image.uri,
          order: photos.length + 1,
        });

        // Start upload
        await uploadPhoto(uploadId);
        return image;
      });

      await Promise.all(uploadPromises);

      onUploadSuccess?.(images);

    } catch (error) {
      let errorMessage = '上傳失敗';

      if (error instanceof Error) {
        // Check for specific image processing errors
        const errorValues = Object.values(ImageProcessingError);
        const matchingError = errorValues.find(errorType =>
          error.message.includes(errorType)
        );

        if (matchingError) {
          errorMessage = getImageProcessingErrorMessage(matchingError as ImageProcessingError);
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert('上傳失敗', errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePress = () => {
    if (!canUpload) {
      if (photos.length >= maxPhotos) {
        Alert.alert('照片數量已滿', `您已上傳 ${maxPhotos} 張照片，請先刪除一些照片再上傳新的`);
      } else if (uploadsToday >= uploadLimit) {
        Alert.alert('今日上傳次數已達上限', `每日最多可上傳 ${uploadLimit} 次`);
      }
      return;
    }

    showImageSourceOptions();
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { width: 60, height: 60 };
      case 'large':
        return { width: 120, height: 120 };
      default:
        return { width: 80, height: 80 };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 40;
      default:
        return 30;
    }
  };

  const buttonSize = getButtonSize();
  const iconSize = getIconSize();

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          buttonSize,
          !canUpload && styles.buttonDisabled,
          isProcessing && styles.buttonProcessing,
        ]}
        onPress={handlePress}
        disabled={!canUpload || isProcessing}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isProcessing ? 'refresh' : 'camera'}
          size={iconSize}
          color={canUpload ? '#007AFF' : '#999'}
        />
        {isProcessing && (
          <Text style={styles.processingText}>處理中...</Text>
        )}
      </TouchableOpacity>

      {/* Upload info */}
      {size !== 'small' && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            {photos.length}/{maxPhotos} 張照片
          </Text>
          {remainingUploads < uploadLimit && (
            <Text style={styles.limitText}>
              今日剩餘 {remainingUploads} 次上傳
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  buttonProcessing: {
    borderColor: '#ff9500',
    backgroundColor: '#fff3cd',
  },
  processingText: {
    fontSize: 10,
    color: '#ff9500',
    marginTop: 2,
    fontWeight: '500',
  },
  infoContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  limitText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
});