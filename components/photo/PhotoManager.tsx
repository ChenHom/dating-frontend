/**
 * PhotoManager Component
 * 照片管理主組件 - 整合上傳、排序、刪除、主要照片設定
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { PhotoUploadButton } from './PhotoUploadButton';
import { PhotoUploadProgress } from './PhotoUploadProgress';
import { usePhotoStore } from '@/stores/photo';

interface PhotoManagerProps {
  style?: any;
  testID?: string;
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({
  style,
  testID = 'photo-manager',
}) => {
  const {
    photos,
    primaryPhoto,
    uploadQueue,
    isLoading,
    isUploading,
    error,
    uploadLimit,
    uploadsToday,
    fetchPhotos,
    deletePhoto,
    setPrimaryPhotoAsync,
    addToUploadQueue,
    uploadPhoto,
    setError,
  } = usePhotoStore();

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleImageSelected = async (imageData: {
    uri: string;
    base64: string;
    width: number;
    height: number;
  }) => {
    try {
      // Check upload limit
      if (photos.length >= uploadLimit) {
        Alert.alert('上傳限制', `最多只能上傳 ${uploadLimit} 張照片`);
        return;
      }

      // Add to upload queue
      const uploadId = addToUploadQueue({
        image: imageData.base64,
        localUri: imageData.uri,
        order: photos.length + 1,
      });

      // Start upload
      await uploadPhoto(uploadId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上傳失敗';
      Alert.alert('錯誤', errorMessage);
    }
  };

  const handleDeletePhoto = (photoId: number) => {
    Alert.alert(
      '刪除照片',
      '確定要刪除這張照片嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: () => deletePhoto(photoId),
        },
      ]
    );
  };

  const handleSetPrimary = (photoId: number) => {
    setPrimaryPhotoAsync(photoId);
  };

  const canUploadMore = photos.length < uploadLimit;

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>我的照片</Text>
        <Text style={styles.subtitle}>
          {photos.length}/{uploadLimit} 張照片
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Ionicons name="close" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Progress */}
      {uploadQueue.map((upload) => (
        <PhotoUploadProgress
          key={upload.id}
          isUploading={upload.status === 'uploading'}
          progress={upload.progress}
          fileName={upload.file?.name}
          error={upload.error}
          success={upload.status === 'success'}
          style={styles.uploadProgress}
          testID={`upload-progress-${upload.id}`}
        />
      ))}

      {/* Photos Grid */}
      <ScrollView style={styles.photosContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.photosGrid}>
          {/* Existing Photos */}
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.photoItem}>
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: photo.url }}
                  style={styles.photo}
                  contentFit="cover"
                />

                {/* Primary Badge */}
                {photo.is_primary && (
                  <View style={styles.primaryBadge}>
                    <Ionicons name="star" size={12} color="#ffffff" />
                    <Text style={styles.primaryText}>主要</Text>
                  </View>
                )}

                {/* Photo Actions */}
                <View style={styles.photoActions}>
                  {!photo.is_primary && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSetPrimary(photo.id)}
                      testID={`set-primary-${photo.id}`}
                    >
                      <Ionicons name="star-outline" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeletePhoto(photo.id)}
                    testID={`delete-photo-${photo.id}`}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                {/* Order Number */}
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>{index + 1}</Text>
                </View>
              </View>
            </View>
          ))}

          {/* Upload Button */}
          {canUploadMore && (
            <View style={styles.photoItem}>
              <PhotoUploadButton
                onImageSelected={handleImageSelected}
                disabled={isUploading}
                style={styles.uploadButton}
                testID="photo-upload-button"
              />
            </View>
          )}
        </View>

        {/* Upload Limit Message */}
        {!canUploadMore && (
          <View style={styles.limitMessage}>
            <Ionicons name="information-circle" size={16} color="#6b7280" />
            <Text style={styles.limitText}>
              已達到照片上傳限制 ({uploadLimit} 張)
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 8,
  },
  uploadProgress: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  photosContainer: {
    flex: 1,
    padding: 16,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoItem: {
    width: '48%',
    aspectRatio: 0.8,
    marginBottom: 16,
  },
  photoContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  photoActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'column',
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  orderBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  uploadButton: {
    flex: 1,
  },
  limitMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginTop: 8,
  },
  limitText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
});