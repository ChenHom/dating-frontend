/**
 * GiftButton Component
 * 禮物按鈕 - 用於在聊天界面或其他地方觸發禮物選擇器
 */

import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GiftButtonProps {
  onPress: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
  showText?: boolean;
  animated?: boolean;
  testID?: string;
}

export const GiftButton: React.FC<GiftButtonProps> = ({
  onPress,
  disabled = false,
  size = 'medium',
  variant = 'primary',
  showText = true,
  animated = true,
  testID = 'gift-button',
}) => {
  // 動畫值
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // 脈衝動畫
  useEffect(() => {
    if (animated && !disabled) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );

      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      glowAnimation.start();

      return () => {
        pulseAnimation.stop();
        glowAnimation.stop();
      };
    }
  }, [animated, disabled]);

  // 按壓動畫
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // 獲取尺寸樣式
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          icon: 16,
          text: styles.textSmall,
        };
      case 'large':
        return {
          container: styles.containerLarge,
          icon: 28,
          text: styles.textLarge,
        };
      default:
        return {
          container: styles.containerMedium,
          icon: 20,
          text: styles.textMedium,
        };
    }
  };

  // 獲取變體樣式
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: styles.secondaryContainer,
          text: styles.secondaryText,
          iconColor: '#6b7280',
        };
      case 'outline':
        return {
          container: styles.outlineContainer,
          text: styles.outlineText,
          iconColor: '#f59e0b',
        };
      default:
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
          iconColor: '#fff',
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  return (
    <Animated.View
      style={[
        {
          transform: [
            { scale: scaleAnim },
            { scale: animated ? pulseAnim : 1 },
          ],
        },
        animated && {
          shadowOpacity: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 0.6],
          }),
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.container,
          sizeStyles.container,
          variantStyles.container,
          disabled && styles.disabledContainer,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
        testID={testID}
      >
        <View style={styles.content}>
          <Ionicons
            name="gift"
            size={sizeStyles.icon}
            color={disabled ? '#9ca3af' : variantStyles.iconColor}
          />

          {showText && (
            <Text
              style={[
                styles.text,
                sizeStyles.text,
                variantStyles.text,
                disabled && styles.disabledText,
              ]}
            >
              禮物
            </Text>
          )}
        </View>

        {/* 動畫光暈 */}
        {animated && !disabled && variant === 'primary' && (
          <Animated.View
            style={[
              styles.glow,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.4],
                }),
              },
            ]}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  containerMedium: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  containerLarge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryContainer: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
  },
  secondaryContainer: {
    backgroundColor: '#f3f4f6',
    shadowColor: '#000',
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
  },
  disabledContainer: {
    backgroundColor: '#e5e7eb',
    shadowOpacity: 0,
    elevation: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    marginLeft: 6,
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 16,
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#6b7280',
  },
  outlineText: {
    color: '#f59e0b',
  },
  disabledText: {
    color: '#9ca3af',
  },
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    zIndex: -1,
  },
});

export default GiftButton;