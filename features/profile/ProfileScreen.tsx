/**
 * ProfileScreen Component
 * 個人檔案主畫面
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useProfileStore } from '@/stores/profile';
import { PhotoManager } from './components/PhotoManager';

const { width: screenWidth } = Dimensions.get('window');

export const ProfileScreen: React.FC = () => {
  const {
    profile,
    photos,
    loadProfile,
    clearError,
    isLoading,
    error,
  } = useProfileStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfile();
    clearError();
  }, [loadProfile, clearError]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const isProfileComplete = (): boolean => {
    if (!profile) return false;
    return !!(
      profile.display_name &&
      profile.bio &&
      profile.birth_date &&
      profile.gender &&
      profile.interested_in &&
      photos.length > 0
    );
  };

  const renderPhotoCarousel = () => {
    if (photos.length === 0) {
      return (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderIcon}>📷</Text>
          <Text style={styles.photoPlaceholderText}>新增照片</Text>
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.photoCarousel}
        testID="photo-carousel"
      >
        {photos.map((photo) => (
          <View key={photo.id} style={styles.photoContainer}>
            <Image
              source={{ uri: photo.url }}
              style={styles.photo}
              resizeMode="cover"
            />
            {photo.is_primary && (
              <View style={styles.primaryPhotoBadge}>
                <Text style={styles.primaryPhotoText}>主要</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderProfileInfo = () => {
    if (!profile) return null;

    const age = profile.birth_date ? calculateAge(profile.birth_date) : profile.age;

    return (
      <View style={styles.profileInfo}>
        <View style={styles.profileHeader}>
          <Text style={styles.displayName}>{profile.display_name}</Text>
          {age && <Text style={styles.age}>{age} 歲</Text>}
        </View>

        {profile.location && (
          <Text style={styles.location}>📍 {profile.location}</Text>
        )}

        {profile.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}

        <View style={styles.profileDetails}>
          {profile.gender && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>性別:</Text>
              <Text style={styles.detailValue}>
                {profile.gender === 'male' ? '男性' : 
                 profile.gender === 'female' ? '女性' : '其他'}
              </Text>
            </View>
          )}

          {profile.interested_in && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>興趣對象:</Text>
              <Text style={styles.detailValue}>
                {profile.interested_in === 'male' ? '男性' : 
                 profile.interested_in === 'female' ? '女性' : '兩者皆可'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderCompletionPrompt = () => {
    if (isProfileComplete()) return null;

    return (
      <View style={styles.completionPrompt}>
        <Text style={styles.completionTitle}>完善你的個人檔案</Text>
        <Text style={styles.completionText}>
          添加更多資訊來提高配對成功率
        </Text>
        <TouchableOpacity
          style={styles.completionButton}
          onPress={handleEditProfile}
        >
          <Text style={styles.completionButtonText}>立即完善</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading && !profile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>載入失敗</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>重試</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Photo Section */}
      <View style={styles.photoSection}>
        {renderPhotoCarousel()}
      </View>

      {/* Profile Info */}
      {renderProfileInfo()}

      {/* Completion Prompt */}
      {renderCompletionPrompt()}

      {/* Edit Button */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={handleEditProfile}
      >
        <Text style={styles.editButtonText}>編輯個人檔案</Text>
      </TouchableOpacity>

      {/* Photo Manager */}
      <PhotoManager />

      {/* Footer Spacing */}
      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoSection: {
    height: 400,
    backgroundColor: '#f8f8f8',
  },
  photoCarousel: {
    flex: 1,
  },
  photoContainer: {
    width: screenWidth,
    height: 400,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  primaryPhotoBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  primaryPhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  photoPlaceholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  photoPlaceholderText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  profileInfo: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  displayName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginRight: 12,
  },
  age: {
    fontSize: 20,
    color: '#666',
    fontWeight: '500',
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  bio: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  profileDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    width: 80,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  completionPrompt: {
    backgroundColor: '#fff3cd',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  completionText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 12,
  },
  completionButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  completionButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  editButton: {
    margin: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    height: 40,
  },
});