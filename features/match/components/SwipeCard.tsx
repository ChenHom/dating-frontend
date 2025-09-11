/**
 * SwipeCard Component
 * 滑動式配對組件 - 支援多張照片與基本資訊顯示
 */

import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import Swiper from 'react-native-deck-swiper';
import { FeedUser } from '@/lib/types';

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

    useImperativeHandle(ref, () => ({
      swipeLeft: () => swiperRef.current?.swipeLeft(),
      swipeRight: () => swiperRef.current?.swipeRight(),
    }));

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

      setPhotoIndices(prev => ({ ...prev, [user.id]: newIndex }));
    };

    const renderCard = (user: FeedUser, index: number) => {
      if (!user || !user.profile) {
        return null;
      }

      const currentPhotoIndex = getCurrentPhotoIndex(user.id);
      const currentPhoto = user.photos?.[currentPhotoIndex];
      const photoUrl = currentPhoto?.url || user.profile.primary_photo_url;

      return (
        <View style={styles.card}>
          {/* Photo Section */}
          <View style={styles.photoContainer}>
            {photoUrl ? (
              <>
                <Image
                  testID="user-photo"
                  source={{ uri: photoUrl }}
                  style={styles.photo}
                  contentFit="cover"
                  transition={200}
                />

                {/* Photo Navigation Areas */}
                <TouchableOpacity
                  style={styles.photoNavLeft}
                  onPress={() => handlePhotoTap(user, 'left')}
                  activeOpacity={1}
                />
                <TouchableOpacity
                  style={styles.photoNavRight}
                  onPress={() => handlePhotoTap(user, 'right')}
                  activeOpacity={1}
                />

                {/* Photo Indicators */}
                {user.photos && user.photos.length > 1 && (
                  <View style={styles.indicatorContainer} testID="photo-indicators">
                    {user.photos.map((_, photoIndex) => (
                      <View
                        key={photoIndex}
                        style={[
                          styles.indicator,
                          photoIndex === currentPhotoIndex && styles.activeIndicator,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.defaultPhoto} testID="default-photo">
                <Text style={styles.defaultPhotoText}>無照片</Text>
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
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  photoNavLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '40%',
    height: '80%',
    zIndex: 10,
  },
  photoNavRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '40%',
    height: '80%',
    zIndex: 10,
  },
  indicatorContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  activeIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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