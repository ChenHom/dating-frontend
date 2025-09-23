/**
 * SwipeCard Component
 * 滑動式配對組件 - 使用 React Native Gesture Handler 和 Reanimated
 */

import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  PanResponder,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeedUser } from '@/lib/types';
import { ProfileImage } from '@/components/ui/ImageWithFallback';
import { imageCacheService } from '@/services/ImageCacheService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25; // 25% of screen width

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
    const [currentIndex, setCurrentIndex] = useState(0);
    const [photoIndices, setPhotoIndices] = useState<{ [key: number]: number }>({});
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const rotateZ = useRef(new Animated.Value(0)).current;

    // Smart image preloading
    useEffect(() => {
      const preloadImages = async () => {
        if (users.length > 0) {
          await imageCacheService.preloadForSwipeCard(users, currentIndex, 3);
        }
      };
      preloadImages();
    }, [users, currentIndex]);

    const resetCard = () => {
      translateX.setValue(0);
      translateY.setValue(0);
      rotateZ.setValue(0);
    };

    const swipeCard = (direction: 'left' | 'right') => {
      const toValue = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
      const user = users[currentIndex];

      Animated.parallel([
        Animated.timing(translateX, {
          toValue,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rotateZ, {
          toValue: direction === 'right' ? 0.3 : -0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (user) {
          if (direction === 'right') {
            onLike(user.id);
          } else {
            onPass(user.id);
          }
        }

        setCurrentIndex(prev => {
          const nextIndex = prev + 1;
          if (nextIndex >= users.length) {
            onAllSwiped();
          }
          return nextIndex;
        });

        resetCard();
      });
    };

    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
        translateY.setValue(gestureState.dy);
        rotateZ.setValue(gestureState.dx / SCREEN_WIDTH * 0.3);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, dy } = gestureState;

        if (Math.abs(dx) > SWIPE_THRESHOLD) {
          swipeCard(dx > 0 ? 'right' : 'left');
        } else {
          // 回到原位
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.spring(rotateZ, {
              toValue: 0,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    });

    useImperativeHandle(ref, () => ({
      swipeLeft: () => swipeCard('left'),
      swipeRight: () => swipeCard('right'),
    }));

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

    const renderCard = (user: FeedUser, index: number) => {
      if (!user || !user.profile) {
        return null;
      }

      const currentPhotoIndex = getCurrentPhotoIndex(user.id);
      const currentPhoto = user.photos?.[currentPhotoIndex];
      const photoUrl = currentPhoto?.url || user.profile.primary_photo_url;
      const photoCount = user.photos?.length || (user.profile.primary_photo_url ? 1 : 0);
      const hasMultiplePhotos = photoCount > 1;

      const transform = index === currentIndex ? [
        { translateX },
        { translateY },
        { rotateZ: rotateZ.interpolate({
          inputRange: [-1, 1],
          outputRange: ['-30deg', '30deg']
        }) }
      ] : [];

      const opacity = index === currentIndex ? translateX.interpolate({
        inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        outputRange: [0.5, 1, 0.5],
        extrapolate: 'clamp',
      }) : 1;

      return (
        <Animated.View
          key={user.id}
          style={[
            styles.card,
            {
              transform,
              opacity,
              zIndex: users.length - index,
            }
          ]}
          {...(index === currentIndex ? panResponder.panHandlers : {})}
        >
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

            {/* Photo Navigation Areas */}
            {hasMultiplePhotos && (
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

            {/* Photo Indicators */}
            {hasMultiplePhotos && user.photos && (
              <View style={styles.indicatorContainer} testID="photo-indicators">
                <View style={styles.indicatorRow}>
                  {user.photos.map((_, photoIndex) => (
                    <TouchableOpacity
                      key={photoIndex}
                      style={[
                        styles.indicator,
                        photoIndex === currentPhotoIndex && styles.activeIndicator,
                      ]}
                      onPress={() => {
                        Animated.sequence([
                          Animated.timing(fadeAnim, {
                            toValue: 0.5,
                            duration: 50,
                            useNativeDriver: true,
                          }),
                          Animated.timing(fadeAnim, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: true,
                          }),
                        ]).start();

                        setPhotoIndices(prev => ({ ...prev, [user.id]: photoIndex }));
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                    />
                  ))}
                </View>

                <View style={styles.photoCounter}>
                  <Text style={styles.photoCounterText}>
                    {currentPhotoIndex + 1} / {user.photos.length}
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

          {/* Swipe Overlays */}
          <Animated.View
            style={[
              styles.overlayLabel,
              styles.likeOverlay,
              {
                opacity: translateX.interpolate({
                  inputRange: [0, SWIPE_THRESHOLD],
                  outputRange: [0, 1],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          >
            <Text style={styles.likeText}>LIKE</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.overlayLabel,
              styles.passOverlay,
              {
                opacity: translateX.interpolate({
                  inputRange: [-SWIPE_THRESHOLD, 0],
                  outputRange: [1, 0],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          >
            <Text style={styles.passText}>PASS</Text>
          </Animated.View>
        </Animated.View>
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

    if (!users.length || currentIndex >= users.length) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>沒有更多用戶了</Text>
          <Text style={styles.emptySubtitle}>請稍後再試</Text>
        </View>
      );
    }

    return (
      <View style={styles.container} testID="deck-swiper">
        {users.slice(currentIndex, currentIndex + 3).map((user, index) =>
          renderCard(user, currentIndex + index)
        )}
      </View>
    );
  }
);

SwipeCard.displayName = 'SwipeCard';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 5,
  },
  card: {
    position: 'absolute',
    height: Math.min(SCREEN_HEIGHT * 0.55, SCREEN_HEIGHT - 320),
    maxHeight: SCREEN_HEIGHT - 320,
    minHeight: 380,
    width: Math.min(SCREEN_WIDTH - 30, 400),
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
    minHeight: 250,
    maxHeight: '75%',
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
  indicatorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  indicator: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  photoCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    minWidth: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  photoCounterText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    minHeight: 80,
    maxHeight: 160,
    overflow: 'hidden',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: Math.min(24, SCREEN_WIDTH * 0.06),
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  distance: {
    fontSize: 14,
    color: '#666',
  },
  bio: {
    fontSize: Math.min(16, SCREEN_WIDTH * 0.04),
    color: '#666',
    lineHeight: 22,
    marginBottom: 4,
  },
  location: {
    fontSize: Math.min(14, SCREEN_WIDTH * 0.035),
    color: '#999',
  },
  overlayLabel: {
    position: 'absolute',
    top: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 3,
  },
  likeOverlay: {
    left: 30,
    backgroundColor: 'rgba(76, 204, 147, 0.1)',
    borderColor: '#4CCC93',
  },
  passOverlay: {
    right: 30,
    backgroundColor: 'rgba(255, 68, 88, 0.1)',
    borderColor: '#FF4458',
  },
  likeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CCC93',
  },
  passText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4458',
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

export default SwipeCard;
