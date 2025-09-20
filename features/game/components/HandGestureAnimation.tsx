/**
 * HandGestureAnimation Component
 * 3D 手勢動畫組件 - 增強遊戲選擇的視覺效果
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
  Dimensions,
} from 'react-native';
import { GameChoice as GameChoiceType } from '@/stores/game';

interface HandGestureAnimationProps {
  choice: GameChoiceType;
  isSelected: boolean;
  onSelect: (choice: GameChoiceType) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showAnimation?: boolean;
  testID?: string;
}

export const HandGestureAnimation: React.FC<HandGestureAnimationProps> = ({
  choice,
  isSelected,
  onSelect,
  disabled = false,
  size = 'large',
  showAnimation = true,
  testID = `hand-gesture-${choice}`,
}) => {
  // 動畫值
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 動畫循環
  useEffect(() => {
    if (showAnimation && !disabled) {
      // 脈衝動畫
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    }
  }, [showAnimation, disabled]);

  // 選中動畫
  useEffect(() => {
    if (isSelected) {
      // 縮放動畫
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // 旋轉動畫
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();

      // 彈跳動畫
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.bounce),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // 發光動畫
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    } else {
      // 重置動畫
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isSelected]);

  const getChoiceConfig = (choice: GameChoiceType) => {
    switch (choice) {
      case 'rock':
        return {
          emoji: '✊',
          name: '石頭',
          color: '#8b5cf6',
          shadowColor: '#8b5cf6',
          gradient: ['#8b5cf6', '#7c3aed'],
        };
      case 'paper':
        return {
          emoji: '✋',
          name: '布',
          color: '#10b981',
          shadowColor: '#10b981',
          gradient: ['#10b981', '#059669'],
        };
      case 'scissors':
        return {
          emoji: '✌️',
          name: '剪刀',
          color: '#f59e0b',
          shadowColor: '#f59e0b',
          gradient: ['#f59e0b', '#d97706'],
        };
    }
  };

  const config = getChoiceConfig(choice);
  const sizeStyles = getSizeStyles(size);

  const handlePress = () => {
    if (!disabled) {
      // 點擊動畫
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();

      onSelect(choice);
    }
  };

  // 計算動畫值
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const bounceTranslateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  return (
    <View style={styles.container} testID={testID}>
      {/* 發光效果背景 */}
      {isSelected && (
        <Animated.View
          style={[
            styles.glowBackground,
            sizeStyles.container,
            {
              backgroundColor: config.color,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />
      )}

      {/* 主要按鈕 */}
      <TouchableOpacity
        style={[styles.touchable]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
        testID={`${testID}-button`}
      >
        <Animated.View
          style={[
            styles.gestureContainer,
            sizeStyles.container,
            isSelected && styles.selectedContainer,
            isSelected && {
              borderColor: config.color,
              shadowColor: config.shadowColor,
            },
            disabled && styles.disabledContainer,
            {
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) },
                { rotate: rotateInterpolate },
                { translateY: bounceTranslateY },
              ],
            },
          ]}
        >
          {/* 手勢表情符號 */}
          <Animated.Text
            style={[
              styles.emoji,
              sizeStyles.emoji,
              {
                transform: [
                  { scale: isSelected ? 1.1 : 1 },
                ],
              },
            ]}
            testID={`${testID}-emoji`}
          >
            {config.emoji}
          </Animated.Text>

          {/* 選擇名稱 */}
          <Text
            style={[
              styles.name,
              sizeStyles.name,
              isSelected && styles.selectedName,
              isSelected && { color: config.color },
              disabled && styles.disabledName,
            ]}
            testID={`${testID}-name`}
          >
            {config.name}
          </Text>

          {/* 選中指示器 */}
          {isSelected && (
            <Animated.View
              style={[
                styles.selectedIndicator,
                { backgroundColor: config.color },
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
              testID={`${testID}-selected`}
            >
              <Text style={styles.checkMark}>✓</Text>
            </Animated.View>
          )}

          {/* 脈衝圓環 */}
          {showAnimation && !disabled && !isSelected && (
            <Animated.View
              style={[
                styles.pulseRing,
                sizeStyles.container,
                {
                  borderColor: config.color,
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.05],
                    outputRange: [0.3, 0],
                  }),
                },
              ]}
            />
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const getSizeStyles = (size: 'small' | 'medium' | 'large' | 'xlarge') => {
  switch (size) {
    case 'small':
      return {
        container: { width: 60, height: 60, borderRadius: 30 },
        emoji: { fontSize: 20 },
        name: { fontSize: 10 },
      };
    case 'medium':
      return {
        container: { width: 80, height: 80, borderRadius: 40 },
        emoji: { fontSize: 30 },
        name: { fontSize: 12 },
      };
    case 'xlarge':
      return {
        container: { width: 120, height: 120, borderRadius: 60 },
        emoji: { fontSize: 50 },
        name: { fontSize: 18 },
      };
    default: // large
      return {
        container: { width: 100, height: 100, borderRadius: 50 },
        emoji: { fontSize: 40 },
        name: { fontSize: 16 },
      };
  }
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  touchable: {
    position: 'relative',
  },
  gestureContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  selectedContainer: {
    borderWidth: 4,
    backgroundColor: '#f8fafc',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  disabledContainer: {
    opacity: 0.4,
    backgroundColor: '#f3f4f6',
  },
  emoji: {
    marginBottom: 8,
    textAlign: 'center',
  },
  name: {
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  selectedName: {
    fontWeight: '700',
  },
  disabledName: {
    color: '#9ca3af',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  glowBackground: {
    position: 'absolute',
    borderRadius: 60,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
});

export default HandGestureAnimation;