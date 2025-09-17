/**
 * GameButton Component
 * 遊戲按鈕組件 - 在聊天畫面中顯示的遊戲按鈕
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GameButtonProps {
  onPress: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  testID?: string;
}

export const GameButton: React.FC<GameButtonProps> = ({
  onPress,
  disabled = false,
  size = 'medium',
  testID = 'game-button',
}) => {
  const sizeStyles = getSizeStyles(size);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        sizeStyles.container,
        disabled && styles.disabledContainer,
      ]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      <View style={styles.iconContainer}>
        <Text style={[styles.gameIcon, sizeStyles.icon]}>🎮</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.title, sizeStyles.title]}>
          剪刀石頭布
        </Text>
        <Text style={[styles.subtitle, sizeStyles.subtitle]}>
          來場對戰吧！
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={sizeStyles.chevronSize}
        color={disabled ? '#9ca3af' : '#6b7280'}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
};

const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return {
        container: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 60 },
        icon: { fontSize: 20 },
        title: { fontSize: 14 },
        subtitle: { fontSize: 11 },
        chevronSize: 16,
      };
    case 'large':
      return {
        container: { paddingHorizontal: 20, paddingVertical: 16, minHeight: 80 },
        icon: { fontSize: 32 },
        title: { fontSize: 18 },
        subtitle: { fontSize: 14 },
        chevronSize: 24,
      };
    default: // medium
      return {
        container: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 70 },
        icon: { fontSize: 24 },
        title: { fontSize: 16 },
        subtitle: { fontSize: 12 },
        chevronSize: 20,
      };
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  disabledContainer: {
    opacity: 0.5,
    backgroundColor: '#f3f4f6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gameIcon: {
    textAlign: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  subtitle: {
    color: '#6b7280',
    fontWeight: '400',
  },
  chevron: {
    marginLeft: 8,
  },
});