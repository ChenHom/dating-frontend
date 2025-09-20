/**
 * FloatingNotificationIndicator Component
 * 浮動通知指示器 - 顯示未讀通知數量的浮動按鈕
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanGestureHandler,
  State,
  PanGestureHandlerGestureEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '@/stores/notification';

interface FloatingNotificationIndicatorProps {
  onPress: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  draggable?: boolean;
  hideWhenEmpty?: boolean;
  testID?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const INDICATOR_SIZE = 56;
const MARGIN = 20;

export const FloatingNotificationIndicator: React.FC<FloatingNotificationIndicatorProps> = ({
  onPress,
  position = 'top-right',
  draggable = true,
  hideWhenEmpty = true,
  testID = 'floating-notification-indicator',
}) => {
  // 動畫值
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 狀態
  const [isDragging, setIsDragging] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(position);

  // 通知 store
  const { unreadCount } = useNotificationStore();

  // 獲取初始位置
  const getInitialPosition = (pos: string) => {
    switch (pos) {
      case 'top-left':
        return { x: MARGIN, y: 100 };
      case 'top-right':
        return { x: screenWidth - INDICATOR_SIZE - MARGIN, y: 100 };
      case 'bottom-left':
        return { x: MARGIN, y: screenHeight - INDICATOR_SIZE - MARGIN - 100 };
      case 'bottom-right':
        return { x: screenWidth - INDICATOR_SIZE - MARGIN, y: screenHeight - INDICATOR_SIZE - MARGIN - 100 };
      default:
        return { x: screenWidth - INDICATOR_SIZE - MARGIN, y: 100 };
    }
  };

  // 設置初始位置
  useEffect(() => {
    const initialPos = getInitialPosition(currentPosition);
    translateX.setValue(initialPos.x);
    translateY.setValue(initialPos.y);
  }, []);

  // 處理未讀數量變化
  useEffect(() => {
    if (unreadCount > 0) {
      // 顯示徽章動畫
      Animated.sequence([
        Animated.timing(badgeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // 脈衝動畫
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();

      // 顯示指示器
      if (hideWhenEmpty) {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } else {
      // 隱藏徽章
      Animated.timing(badgeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // 停止脈衝動畫
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);

      // 隱藏指示器
      if (hideWhenEmpty) {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [unreadCount]);

  // 處理拖拽手勢
  const handlePanGesture = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, translationY, state } = event.nativeEvent;

    if (state === State.ACTIVE) {
      if (!isDragging) {
        setIsDragging(true);
        // 開始拖拽時停止脈衝動畫
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
      }

      translateX.setValue(translationX);
      translateY.setValue(translationY);
    } else if (state === State.END) {
      setIsDragging(false);

      // 計算最終位置
      const currentX = translateX._value;
      const currentY = translateY._value;

      // 限制在屏幕邊界內
      const finalX = Math.max(
        MARGIN,
        Math.min(screenWidth - INDICATOR_SIZE - MARGIN, currentX)
      );
      const finalY = Math.max(
        100,
        Math.min(screenHeight - INDICATOR_SIZE - MARGIN - 100, currentY)
      );

      // 吸附到最近的邊緣
      let snapX = finalX;
      if (finalX < screenWidth / 2) {
        snapX = MARGIN; // 吸附到左邊
      } else {
        snapX = screenWidth - INDICATOR_SIZE - MARGIN; // 吸附到右邊
      }

      // 動畫到最終位置
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: snapX,
          useNativeDriver: false,
        }),
        Animated.spring(translateY, {
          toValue: finalY,
          useNativeDriver: false,
        }),
      ]).start();

      // 更新當前位置
      if (snapX <= MARGIN) {
        setCurrentPosition(finalY < screenHeight / 2 ? 'top-left' : 'bottom-left');
      } else {
        setCurrentPosition(finalY < screenHeight / 2 ? 'top-right' : 'bottom-right');
      }

      // 恢復脈衝動畫（如果有未讀通知）
      if (unreadCount > 0) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }
  };

  // 處理按壓動畫
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  if (hideWhenEmpty && unreadCount === 0) {
    return null;
  }

  const indicator = (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX },
            { translateY },
            { scale: scaleAnim },
            { scale: pulseAnim },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          isDragging && styles.buttonDragging,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        testID={testID}
      >
        <Ionicons
          name="notifications"
          size={24}
          color="#fff"
        />

        {/* 未讀數量徽章 */}
        {unreadCount > 0 && (
          <Animated.View
            style={[
              styles.badge,
              {
                opacity: badgeAnim,
                transform: [{
                  scale: badgeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                }],
              },
            ]}
          >
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </Animated.View>
        )}

        {/* 拖拽指示器 */}
        {draggable && (
          <View style={styles.dragIndicator}>
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  if (draggable) {
    return (
      <PanGestureHandler
        onGestureEvent={handlePanGesture}
        onHandlerStateChange={handlePanGesture}
      >
        {indicator}
      </PanGestureHandler>
    );
  }

  return indicator;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    zIndex: 1000,
  },
  button: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  buttonDragging: {
    backgroundColor: '#2563eb',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  dragIndicator: {
    position: 'absolute',
    bottom: 4,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  dragDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
});

export default FloatingNotificationIndicator;