/**
 * GameChoice Component
 * 遊戲選擇組件 - 顯示剪刀石頭布選項
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GameChoice as GameChoiceType } from '@/stores/game';

interface GameChoiceProps {
  choice: GameChoiceType;
  isSelected: boolean;
  onSelect: (choice: GameChoiceType) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  testID?: string;
}

export const GameChoice: React.FC<GameChoiceProps> = ({
  choice,
  isSelected,
  onSelect,
  disabled = false,
  size = 'medium',
  testID = `game-choice-${choice}`,
}) => {
  const getChoiceConfig = (choice: GameChoiceType) => {
    switch (choice) {
      case 'rock':
        return {
          emoji: '✊',
          name: '石頭',
          color: '#8b5cf6',
        };
      case 'paper':
        return {
          emoji: '✋',
          name: '布',
          color: '#10b981',
        };
      case 'scissors':
        return {
          emoji: '✌️',
          name: '剪刀',
          color: '#f59e0b',
        };
    }
  };

  const config = getChoiceConfig(choice);
  const sizeStyles = getSizeStyles(size);

  const handlePress = () => {
    if (!disabled) {
      onSelect(choice);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        sizeStyles.container,
        isSelected && styles.selectedContainer,
        isSelected && { borderColor: config.color },
        disabled && styles.disabledContainer,
      ]}
      onPress={handlePress}
      disabled={disabled}
      testID={testID}
    >
      <Text
        style={[styles.emoji, sizeStyles.emoji]}
        testID={`${testID}-emoji`}
      >
        {config.emoji}
      </Text>

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

      {isSelected && (
        <View
          style={[styles.selectedIndicator, { backgroundColor: config.color }]}
          testID={`${testID}-selected`}
        />
      )}
    </TouchableOpacity>
  );
};

const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return {
        container: { width: 60, height: 60, padding: 8 },
        emoji: { fontSize: 20 },
        name: { fontSize: 10 },
      };
    case 'large':
      return {
        container: { width: 100, height: 100, padding: 16 },
        emoji: { fontSize: 40 },
        name: { fontSize: 16 },
      };
    default: // medium
      return {
        container: { width: 80, height: 80, padding: 12 },
        emoji: { fontSize: 30 },
        name: { fontSize: 12 },
      };
  }
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  selectedContainer: {
    borderWidth: 3,
    backgroundColor: '#f8fafc',
  },
  disabledContainer: {
    opacity: 0.5,
    backgroundColor: '#f3f4f6',
  },
  emoji: {
    marginBottom: 4,
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
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});