/**
 * GameInvite Component
 * 遊戲邀請組件
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GameInviteProps {
  onStartGame: () => void;
  opponentName?: string;
  opponentAvatarUrl?: string;
  disabled?: boolean;
  testID?: string;
}

export const GameInvite: React.FC<GameInviteProps> = ({
  onStartGame,
  opponentName = '對方',
  opponentAvatarUrl,
  disabled = false,
  testID = 'game-invite',
}) => {
  return (
    <View style={styles.container} testID={testID}>
      {/* Game icon and title */}
      <View style={styles.header}>
        <View style={styles.gameIconContainer}>
          <Text style={styles.gameIcon}>🎮</Text>
        </View>

        <Text style={styles.title}>剪刀石頭布</Text>
        <Text style={styles.subtitle}>和 {opponentName} 來場對戰！</Text>
      </View>

      {/* Opponent info */}
      {opponentAvatarUrl && (
        <View style={styles.opponentContainer}>
          <Image
            source={{ uri: opponentAvatarUrl }}
            style={styles.opponentAvatar}
            testID={`${testID}-opponent-avatar`}
          />
          <Text style={styles.opponentName} testID={`${testID}-opponent-name`}>
            {opponentName}
          </Text>
        </View>
      )}

      {/* Game info */}
      <View style={styles.gameInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="trophy" size={16} color="#f59e0b" />
          <Text style={styles.infoText}>3局2勝制</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="stopwatch" size={16} color="#f59e0b" />
          <Text style={styles.infoText}>每回合10秒</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="hourglass" size={16} color="#f59e0b" />
          <Text style={styles.infoText}>總時限60秒</Text>
        </View>
      </View>

      {/* Game choices preview */}
      <View style={styles.choicesPreview}>
        <Text style={styles.choicesTitle}>遊戲選項：</Text>
        <View style={styles.choicesRow}>
          <View style={styles.choicePreview}>
            <Text style={styles.choiceEmoji}>✊</Text>
            <Text style={styles.choiceName}>石頭</Text>
          </View>
          <View style={styles.choicePreview}>
            <Text style={styles.choiceEmoji}>✋</Text>
            <Text style={styles.choiceName}>布</Text>
          </View>
          <View style={styles.choicePreview}>
            <Text style={styles.choiceEmoji}>✌️</Text>
            <Text style={styles.choiceName}>剪刀</Text>
          </View>
        </View>
      </View>

      {/* Start game button */}
      <TouchableOpacity
        style={[
          styles.startButton,
          disabled && styles.startButtonDisabled
        ]}
        onPress={onStartGame}
        disabled={disabled}
        testID={`${testID}-start-button`}
      >
        <Ionicons
          name="play-circle"
          size={20}
          color="#ffffff"
          style={styles.startButtonIcon}
        />
        <Text style={styles.startButtonText}>
          {disabled ? '準備中...' : '開始遊戲'}
        </Text>
      </TouchableOpacity>

      {/* Rules note */}
      <Text style={styles.rulesNote} testID={`${testID}-rules`}>
        💡 石頭勝剪刀，剪刀勝布，布勝石頭
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gameIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gameIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  opponentContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  opponentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  opponentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  gameInfo: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
    fontWeight: '500',
  },
  choicesPreview: {
    width: '100%',
    marginBottom: 24,
  },
  choicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 12,
    textAlign: 'center',
  },
  choicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  choicePreview: {
    alignItems: 'center',
    padding: 8,
  },
  choiceEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  choiceName: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
    marginBottom: 16,
  },
  startButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  startButtonIcon: {
    marginRight: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  rulesNote: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});