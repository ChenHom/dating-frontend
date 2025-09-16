/**
 * SwipeCard Component
 * 滑動式配對組件 - 支援多張照片與基本資訊顯示，優化版本
 */

import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-deck-swiper';
import { FeedUser } from '@/lib/types';
import { ProfileImage } from '@/components/ui/ImageWithFallback';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SwipeCardProps {
  users: FeedUser[];
  onLike: (userId: number) => void;
  onPass: (userId: number) => void;
  onAllSwiped: () => void;
  loading?: boolean;
}

export interface SwipeCardRef {
  swipeLeft: () => void;
  swipeRight: () => void;
}

export const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(
  ({ users, onLike, onPass, onAllSwiped, loading = false }, ref) => {
    const swiperRef = useRef<Swiper<FeedUser>>(null);
    const [photoIndices, setPhotoIndices] = useState<{ [key: number]: number }>({});
    const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useImperativeHandle(ref, () => ({
      swipeLeft: () => swiperRef.current?.swipeLeft(),
      swipeRight: () => swiperRef.current?.swipeRight(),
    }));

    // Preload images for next few users
    useEffect(() => {
      const preloadNextImages = async () => {
        const imagesToPreload: string[] = [];

        // Preload images for first 3 users
        users.slice(0, 3).forEach(user => {
          if (user.photos) {
            user.photos.forEach(photo => {
              if (photo.url && !preloadedImages.has(photo.url)) {
                imagesToPreload.push(photo.url);
              }
            });
          } else if (user.profile.primary_photo_url && !preloadedImages.has(user.profile.primary_photo_url)) {
            imagesToPreload.push(user.profile.primary_photo_url);
          }
        });

        // Preload images (using expo-image's built-in preloading)
        imagesToPreload.forEach(uri => {
          // This will cache the image for later use
          ProfileImage.preload([{ uri }]);
        });

        setPreloadedImages(new Set([...preloadedImages, ...imagesToPreload]));
      };

      if (users.length > 0) {
        preloadNextImages();
      }
    }, [users]);

    const handleSwipedLeft = (cardIndex: number) => {
      const user = users[cardIndex];
      if (user) {
        onPass(user.id);
      }
    };

    const handleSwipedRight = (cardIndex: number) => {
      const user = users[cardIndex];
      if (user) {
        onLike(user.id);
      }
    };

    const getCurrentPhotoIndex = (userId: number): number => {
      return photoIndices[userId] || 0;
    };

    const handlePhotoTap = (user: FeedUser, side: 'left' | 'right') => {
      if (!user.photos || user.photos.length <= 1) return;

      const currentIndex = getCurrentPhotoIndex(user.id);
      let newIndex: number;

      if (side === 'left') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : user.photos.length - 1;
      } else {
        newIndex = currentIndex < user.photos.length - 1 ? currentIndex + 1 : 0;
      }

      // Animate photo change
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setPhotoIndices(prev => ({ ...prev, [user.id]: newIndex }));
    };

    const getPhotoCount = (user: FeedUser): number => {
      return user.photos?.length || (user.profile.primary_photo_url ? 1 : 0);
    };

    const hasMultiplePhotos = (user: FeedUser): boolean => {
      return getPhotoCount(user) > 1;
    };

    const renderCard = (user: FeedUser, index: number) => {
      if (!user || !user.profile) {
        return null;
      }

      const currentPhotoIndex = getCurrentPhotoIndex(user.id);
      const currentPhoto = user.photos?.[currentPhotoIndex];
      const photoUrl = currentPhoto?.url || user.profile.primary_photo_url;
      const photoCount = getPhotoCount(user);

      return (
        <View style={styles.card}>
          {/* Photo Section */}
          <View style={styles.photoContainer}>
            <Animated.View style={[styles.photoWrapper, { opacity: fadeAnim }]}>
              {photoUrl ? (
                <ProfileImage
                  testID="user-photo"
                  source={{ uri: photoUrl }}
                  style={styles.photo}
                  retryable={true}
                  maxRetries={2}
                  placeholder="👤"
                />
              ) : (
                <View style={styles.defaultPhoto} testID="default-photo">
                  <Ionicons name="person" size={48} color="#ccc" />
                  <Text style={styles.defaultPhotoText}>無照片</Text>
                </View>
              )}
            </Animated.View>

            {/* Photo Navigation Areas - Only show if multiple photos */}
            {hasMultiplePhotos(user) && (
              <>
                <TouchableOpacity
                  style={styles.photoNavLeft}
                  onPress={() => handlePhotoTap(user, 'left')}
                  activeOpacity={1}
                >
                  <View style={styles.navIndicator}>
                    <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.8)" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.photoNavRight}
                  onPress={() => handlePhotoTap(user, 'right')}
                  activeOpacity={1}
                >
                  <View style={styles.navIndicator}>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* Enhanced Photo Indicators */}
            {hasMultiplePhotos(user) && user.photos && (
              <View style={styles.indicatorContainer} testID="photo-indicators">
                {user.photos.map((_, photoIndex) => (
                  <TouchableOpacity
                    key={photoIndex}
                    style={[
                      styles.indicator,
                      photoIndex === currentPhotoIndex && styles.activeIndicator,
                    ]}
                    onPress={() => {
                      setPhotoIndices(prev => ({ ...prev, [user.id]: photoIndex }));
                    }}
                  />
                ))}
                {/* Photo counter */}
                <View style={styles.photoCounter}>
                  <Text style={styles.photoCounterText}>
                    {currentPhotoIndex + 1}/{user.photos.length}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* User Info Section */}
          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {user.profile.display_name}
                {user.profile.age && `, ${user.profile.age}`}
              </Text>
              {user.distance && (
                <Text style={styles.distance}>{user.distance.toFixed(1)} 公里</Text>
              )}
            </View>

            {user.profile.bio && (
              <Text style={styles.bio} numberOfLines={2}>
                {user.profile.bio}
              </Text>
            )}

            {user.profile.location && (
              <Text style={styles.location}>{user.profile.location}</Text>
            )}
          </View>
        </View>
      );
    };

    if (loading) {
      return (
        <View style={styles.loadingContainer} testID="swipe-loading">
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      );
    }

    if (!users.length) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>沒有更多用戶了</Text>
          <Text style={styles.emptySubtitle}>請稍後再試</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Swiper
          testID="deck-swiper"
          ref={swiperRef}
          cards={users}
          renderCard={renderCard}
          onSwipedLeft={handleSwipedLeft}
          onSwipedRight={handleSwipedRight}
          onSwipedAll={onAllSwiped}
          cardIndex={0}
          backgroundColor="transparent"
          stackSize={2}
          stackSeparation={15}
          overlayLabels={{
            left: {
              title: 'PASS',
              style: {
                label: {
                  backgroundColor: '#FF4458',
                  borderColor: '#FF4458',
                  color: 'white',
                  borderWidth: 1,
                  fontSize: 24,
                  fontWeight: 'bold',
                  padding: 10,
                  borderRadius: 10,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: -30,
                },
              },
            },
            right: {
              title: 'LIKE',
              style: {
                label: {
                  backgroundColor: '#4CCC93',
                  borderColor: '#4CCC93',
                  color: 'white',
                  borderWidth: 1,
                  fontSize: 24,
                  fontWeight: 'bold',
                  padding: 10,
                  borderRadius: 10,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: 30,
                },
              },
            },
          }}
          animateOverlayLabelsOpacity
          animateCardOpacity
          swipeBackCard
          verticalSwipe={false}
          cardVerticalMargin={0}
          cardHorizontalMargin={5} // 減少水平邊距，因為 container 已經有 padding
        />
      </View>
    );
  }
);

SwipeCard.displayName = 'SwipeCard';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 5, // 確保卡片不會碰到螢幕邊緣
  },
  card: {
    // 使用動態高度計算，確保不超出版面
    height: Math.min(SCREEN_HEIGHT * 0.6, SCREEN_HEIGHT - 280),
    maxHeight: SCREEN_HEIGHT - 280, // 為底部導航、按鈕和安全區域留出足夠空間
    minHeight: 400, // 設置最小高度，確保卡片內容可見
    width: Math.min(SCREEN_WIDTH - 30, 400), // 限制最大寬度，左右留邊距
    alignSelf: 'center', // 居中顯示
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  photoContainer: {
    flex: 1,
    position: 'relative',
    minHeight: 250, // 確保照片區域有最小高度
    maxHeight: '75%', // 限制照片區域最大高度，為資訊區域留空間
  },
  photoWrapper: {
    width: '100%',
    height: '100%',
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  navIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    opacity: 0,
  },
  photoNavLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '40%',
    height: '80%',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoNavRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '40%',
    height: '80%',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 5,
  },
  indicator: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 1,
  },
  activeIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  photoCounter: {
    position: 'absolute',
    right: 0,
    top: -2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  photoCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  defaultPhoto: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultPhotoText: {
    fontSize: 16,
    color: '#999',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // 半透明背景
    backdropFilter: 'blur(10px)', // 模糊效果
    minHeight: 80, // 最小高度
    maxHeight: 160, // 最大高度，防止資訊區域過大
    overflow: 'hidden',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: Math.min(24, SCREEN_WIDTH * 0.06), // 響應式字體大小
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  distance: {
    fontSize: 14,
    color: '#666',
  },
  bio: {
    fontSize: Math.min(16, SCREEN_WIDTH * 0.04), // 響應式字體大小
    color: '#666',
    lineHeight: 22,
    marginBottom: 4, // 減少底部邊距
  },
  location: {
    fontSize: Math.min(14, SCREEN_WIDTH * 0.035), // 響應式字體大小
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});