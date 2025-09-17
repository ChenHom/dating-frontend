/**
 * PhotoUploadButton Component
 * 照片上傳按鈕組件 - 支援相機和相簿選擇
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

interface PhotoUploadButtonProps {
  onImageSelected: (imageData: {
    uri: string;
    base64: string;
    width: number;
    height: number;
  }) => void;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  style?: any;
  testID?: string;
}

export const PhotoUploadButton: React.FC<PhotoUploadButtonProps> = ({
  onImageSelected,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  disabled = false,
  style,
  testID = 'photo-upload-button',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Request permissions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        '權限需求',
        '需要相機和相簿權限來上傳照片',
        [{ text: '確定' }]
      );
      return false;
    }
    return true;
  };

  // Image compression and processing
  const processImage = async (uri: string) => {
    try {
      // Compress and resize image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          // Resize to max 1080px while maintaining aspect ratio
          { resize: { width: 1080 } },
        ],
        {
          compress: 0.8, // 80% quality to keep under 1MB
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!manipulatedImage.base64) {
        throw new Error('Failed to generate base64 data');
      }

      return {
        uri: manipulatedImage.uri,
        base64: manipulatedImage.base64,
        width: manipulatedImage.width,
        height: manipulatedImage.height,
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error('照片處理失敗');
    }
  };

  // Handle image selection from camera
  const handleCameraSelect = async () => {
    if (!await requestPermissions()) return;

    try {
      setIsProcessing(true);
      onUploadStart?.();

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5], // Portrait aspect ratio for dating app
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const processedImage = await processImage(result.assets[0].uri);
        onImageSelected(processedImage);
        onUploadComplete?.();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '相機拍照失敗';
      onUploadError?.(errorMessage);
      Alert.alert('錯誤', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle image selection from gallery
  const handleGallerySelect = async () => {
    if (!await requestPermissions()) return;

    try {
      setIsProcessing(true);
      onUploadStart?.();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5], // Portrait aspect ratio for dating app
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const processedImage = await processImage(result.assets[0].uri);
        onImageSelected(processedImage);
        onUploadComplete?.();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '相簿選擇失敗';
      onUploadError?.(errorMessage);
      Alert.alert('錯誤', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Show action sheet for photo selection
  const showPhotoOptions = () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        '選擇照片',
        '請選擇照片來源',
        [
          { text: '相機', onPress: handleCameraSelect },
          { text: '相簿', onPress: handleGallerySelect },
          { text: '取消', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert(
        '選擇照片',
        '',
        [
          { text: '相機', onPress: handleCameraSelect },
          { text: '相簿', onPress: handleGallerySelect },
          { text: '取消', style: 'cancel' },
        ]
      );
    }
  };

  const isDisabled = disabled || isProcessing;

  return (
    <TouchableOpacity
      style={[styles.uploadButton, isDisabled && styles.disabled, style]}
      onPress={showPhotoOptions}
      disabled={isDisabled}
      testID={testID}
    >
      <View style={styles.content}>
        {isProcessing ? (
          <>
            <Ionicons name="hourglass-outline" size={24} color="#9ca3af" />
            <Text style={styles.processingText}>處理中...</Text>
          </>
        ) : (
          <>
            <Ionicons name="camera-outline" size={24} color="#3b82f6" />
            <Text style={styles.buttonText}>上傳照片</Text>
            <Text style={styles.hintText}>最大 1080px, 1MB</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  uploadButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginTop: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  processingText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
});