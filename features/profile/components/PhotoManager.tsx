/**
 * PhotoManager Component
 * 照片管理組件 - 整合新的 store 和組件
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { Photo } from '@/lib/types';
import { usePhotoStore } from '@/stores/photo';
import { PhotoUploadButton } from './PhotoUploadButton';
import { ProgressIndicator } from '@/components/ui/ProgressIndicator';
import { ProcessedImage } from '@/lib/imageUtils';

const { width: screenWidth } = Dimensions.get('window');
const photoSize = (screenWidth - 60) / 3; // 3 photos per row with margins

export const PhotoManager: React.FC = () => {
  const {
    photos,
    uploadQueue,
    isLoading,
    error,
    fetchPhotos,
    deletePhoto,
    setPrimaryPhotoAsync,
    reorderPhotos,
  } = usePhotoStore();

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const maxPhotos = 6;
  const canAddMore = photos.length < maxPhotos;

  // Fetch photos on component mount
  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleUploadSuccess = (images: ProcessedImage[]) => {
    console.log(`Successfully uploaded ${images.length} photos`);
  };

  const handleUploadError = (error: string) => {
    Alert.alert('上傳失敗', error);
  };

  const handleDeletePhoto = (photo: Photo) => {
    Alert.alert(
      '刪除照片',
      '確定要刪除這張照片嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePhoto(photo.id);
            } catch (error) {
              Alert.alert('刪除失敗', '請稍後再試');
            }
          },
        },
      ]
    );
  };

  const handleSetPrimary = async (photo: Photo) => {
    if (photo.is_primary) {
      return; // Already primary
    }

    try {
      await setPrimaryPhotoAsync(photo.id);
      Alert.alert('設定成功', '已設定為主要照片');
    } catch (error) {
      Alert.alert('設定失敗', '請稍後再試');
    }
  };

  const getModerationStatusText = (status: Photo['moderation_status']) => {
    switch (status) {
      case 'pending':
        return '審核中';
      case 'approved':
        return '';
      case 'rejected':
        return '已拒絕';
      default:
        return '';
    }
  };

  const getModerationStatusColor = (status: Photo['moderation_status']) => {
    switch (status) {
      case 'pending':
        return '#ff9500';
      case 'rejected':
        return '#ff3b30';
      default:
        return 'transparent';
    }
  };

  const renderPhoto = ({ item, index }: { item: Photo; index: number }) => {
    const statusText = getModerationStatusText(item.moderation_status);
    const statusColor = getModerationStatusColor(item.moderation_status);
    const uploadingItem = uploadQueue.find(upload =>
      upload.file?.uri && item.url.includes(upload.file.uri.split('/').pop() || '')
    );

    return (
      <View style={styles.photoContainer}>
        <TouchableOpacity
          style={styles.photoWrapper}
          onLongPress={() => {
            const options = [
              !item.is_primary && '設為主要',
              '刪除',
              '取消',
            ].filter(Boolean) as string[];

            const cancelButtonIndex = options.length - 1;
            const destructiveButtonIndex = options.indexOf('刪除');

            if (Platform.OS === 'ios') {
              ActionSheetIOS.showActionSheetWithOptions(
                {
                  options,
                  cancelButtonIndex,
                  destructiveButtonIndex,
                },
                (buttonIndex) => {
                  if (options[buttonIndex] === '設為主要') {
                    handleSetPrimary(item);
                  } else if (options[buttonIndex] === '刪除') {
                    handleDeletePhoto(item);
                  }
                }
              );
            } else {
              Alert.alert('照片選項', '', [
                ...(item.is_primary
                  ? []
                  : [{ text: '設為主要', onPress: () => handleSetPrimary(item) }]),
                {
                  text: '刪除',
                  style: 'destructive',
                  onPress: () => handleDeletePhoto(item),
                },
                { text: '取消', style: 'cancel' },
              ]);
            }
          }}
        >
          <ExpoImage
            source={{ uri: item.url }}
            style={styles.photo}
            placeholder="📷"
            contentFit="cover"
            transition={200}
          />

          {/* Upload Progress Overlay */}
          {uploadingItem && uploadingItem.status === 'uploading' && (
            <View style={styles.uploadOverlay}>
              <ProgressIndicator
                progress={uploadingItem.progress}
                size={40}
                showPercentage={false}
                color="#ffffff"
                backgroundColor="rgba(255,255,255,0.3)"
              />
            </View>
          )}

          {item.is_primary && (
            <View style={styles.primaryBadge}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.primaryText}>主要</Text>
            </View>
          )}

          {statusText && (
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          )}

          <View style={styles.photoOverlay}>
            <View style={styles.photoActions}>
              {!item.is_primary && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSetPrimary(item)}
                >
                  <Ionicons name="star-outline" size={14} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeletePhoto(item)}
              >
                <Ionicons name="trash-outline" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderAddButton = () => (
    <View style={styles.photoContainer}>
      <PhotoUploadButton
        maxPhotos={maxPhotos}
        size="medium"
        allowMultiple={true}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
        style={styles.uploadButton}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyContent}>
        <Ionicons name="camera" size={48} color="#ccc" />
        <Text style={styles.emptyTitle}>新增照片</Text>
        <Text style={styles.emptySubtitle}>點擊下方按鈕新增第一張照片</Text>
        <PhotoUploadButton
          maxPhotos={maxPhotos}
          size="large"
          allowMultiple={true}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          style={styles.emptyUploadButton}
        />
      </View>
    </View>
  );

  // Show upload queue items
  const renderUploadQueue = () => {
    if (uploadQueue.length === 0) return null;

    return (
      <View style={styles.uploadQueueContainer}>
        <Text style={styles.uploadQueueTitle}>上傳佇列</Text>
        {uploadQueue.map(item => (
          <View key={item.id} style={styles.uploadQueueItem}>
            <View style={styles.uploadInfo}>
              <Text style={styles.uploadName}>
                {item.file?.name || '照片'}
              </Text>
              <Text style={styles.uploadStatus}>
                {item.status === 'uploading' ? '上傳中...' :
                 item.status === 'error' ? '上傳失敗' :
                 item.status === 'success' ? '上傳完成' : '準備中'}
              </Text>
            </View>
            <ProgressIndicator
              progress={item.progress}
              size={32}
              showPercentage={false}
              status={item.status === 'error' ? 'error' :
                     item.status === 'success' ? 'success' : 'active'}
            />
          </View>
        ))}
      </View>
    );
  };

  if (photos.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>我的照片</Text>
          <Text style={styles.subtitle}>
            0/{maxPhotos} 張照片
          </Text>
        </View>
        {renderUploadQueue()}
        {renderEmptyState()}
      </View>
    );
  }

  const photosWithAddButton = canAddMore
    ? [...photos, { id: 'add-button', type: 'add-button' } as any]
    : photos;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的照片</Text>
        <Text style={styles.subtitle}>
          {photos.length}/{maxPhotos} 張照片
        </Text>
      </View>

      {renderUploadQueue()}

      <FlatList
        data={photosWithAddButton}
        renderItem={({ item, index }) => {
          if (item.id === 'add-button') {
            return renderAddButton();
          }
          return renderPhoto({ item, index });
        }}
        numColumns={3}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.photoGrid}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  uploadQueueContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  uploadQueueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  uploadQueueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  uploadInfo: {
    flex: 1,
  },
  uploadName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  uploadStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  photoGrid: {
    gap: 10,
  },
  photoContainer: {
    width: photoSize,
    height: photoSize,
    marginBottom: 10,
  },
  photoWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  uploadButton: {
    width: photoSize,
    height: photoSize,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  addPhotoButton: {
    width: photoSize,
    height: photoSize,
    backgroundColor: '#f8f8f8',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  addPhotoIcon: {
    fontSize: 32,
    color: '#999',
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  limitText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyUploadButton: {
    // Styles will be handled by PhotoUploadButton
  },
});