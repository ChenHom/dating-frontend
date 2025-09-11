/**
 * PhotoManager Component
 * 照片管理組件
 */

import React, { useState } from 'react';
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
import { Photo } from '@/lib/types';
import { useProfileStore } from '@/stores/profile';
import {
  pickImageFromCamera,
  pickImageFromGallery,
  getImageInfo,
} from '@/lib/imageUtils';

const { width: screenWidth } = Dimensions.get('window');
const photoSize = (screenWidth - 60) / 3; // 3 photos per row with margins

export const PhotoManager: React.FC = () => {
  const {
    photos,
    uploadPhoto,
    deletePhoto,
    setPrimaryPhoto,
    isLoading,
    error,
  } = useProfileStore();

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const maxPhotos = 6;
  const canAddMore = photos.length < maxPhotos;

  const handleAddPhoto = () => {
    if (!canAddMore) {
      Alert.alert('照片數量限制', `最多只能上傳 ${maxPhotos} 張照片`);
      return;
    }

    const options = ['拍照', '從相簿選擇', '取消'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: '選擇照片來源',
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            await handleCameraUpload();
          } else if (buttonIndex === 1) {
            await handleGalleryUpload();
          }
        }
      );
    } else {
      Alert.alert('選擇照片來源', '', [
        { text: '拍照', onPress: handleCameraUpload },
        { text: '從相簿選擇', onPress: handleGalleryUpload },
        { text: '取消', style: 'cancel' },
      ]);
    }
  };

  const handleCameraUpload = async () => {
    try {
      setUploadingIndex(-1); // Use -1 for new upload
      const result = await pickImageFromCamera();
      
      if (result) {
        const imageInfo = getImageInfo(result.base64);
        await uploadPhoto({
          image: result.base64,
          order: photos.length + 1,
        });
        
        Alert.alert(
          '上傳成功',
          `照片已上傳 (${imageInfo.fileSizeText})\n審核通過後即可顯示`
        );
      }
    } catch (error) {
      Alert.alert(
        '上傳失敗',
        error instanceof Error ? error.message : '拍照時發生未知錯誤'
      );
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleGalleryUpload = async () => {
    try {
      setUploadingIndex(-1); // Use -1 for new upload
      const result = await pickImageFromGallery();
      
      if (result) {
        const imageInfo = getImageInfo(result.base64);
        await uploadPhoto({
          image: result.base64,
          order: photos.length + 1,
        });
        
        Alert.alert(
          '上傳成功',
          `照片已上傳 (${imageInfo.fileSizeText})\n審核通過後即可顯示`
        );
      }
    } catch (error) {
      Alert.alert(
        '上傳失敗',
        error instanceof Error ? error.message : '選擇照片時發生未知錯誤'
      );
    } finally {
      setUploadingIndex(null);
    }
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
      await setPrimaryPhoto(photo.id);
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
          <Image source={{ uri: item.url }} style={styles.photo} />
          
          {item.is_primary && (
            <View style={styles.primaryBadge}>
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
                  <Text style={styles.actionButtonText}>設為主要</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeletePhoto(item)}
              >
                <Text style={styles.actionButtonText}>刪除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderAddButton = () => (
    <TouchableOpacity
      style={styles.addPhotoButton}
      onPress={handleAddPhoto}
      disabled={!canAddMore || isLoading}
    >
      {uploadingIndex === -1 ? (
        <Text style={styles.addPhotoText}>上傳中...</Text>
      ) : canAddMore ? (
        <>
          <Text style={styles.addPhotoIcon}>+</Text>
          <Text style={styles.addPhotoText}>新增照片</Text>
        </>
      ) : (
        <Text style={styles.limitText}>已達照片數量上限 (6張)</Text>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <TouchableOpacity
        style={styles.emptyAddButton}
        onPress={handleAddPhoto}
        disabled={isLoading}
      >
        <Text style={styles.emptyIcon}>📷</Text>
        <Text style={styles.emptyTitle}>新增照片</Text>
        <Text style={styles.emptySubtitle}>點擊新增第一張照片</Text>
      </TouchableOpacity>
    </View>
  );

  if (photos.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>我的照片</Text>
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
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
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
  emptyAddButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f8f8f8',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 16,
    width: 200,
    height: 200,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});