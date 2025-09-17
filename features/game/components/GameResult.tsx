/**
 * GameResult Component
 * 遊戲結果顯示組件
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameChoice, GameSession } from '@/stores/game';

interface GameResultProps {
  gameSession: GameSession;
  currentUserId: number;
  isVisible: boolean;
  testID?: string;
}

export const GameResult: React.FC<GameResultProps> = ({
  gameSession,
  currentUserId,
  isVisible,
  testID = 'game-result',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const isWinner = gameSession.winner_id === currentUserId;
  const isTie = !gameSession.winner_id;
  const myScore = gameSession.final_scores[currentUserId] || 0;
  const opponentId = gameSession.initiator_id === currentUserId
    ? gameSession.participant_id
    : gameSession.initiator_id;
  const opponentScore = gameSession.final_scores[opponentId] || 0;

  const getResultConfig = () => {
    if (isTie) {
      return {
        title: '平局！',
        subtitle: '勢均力敵',
        icon: 'remove-circle' as const,
        color: '#6b7280',
        backgroundColor: '#f3f4f6',
      };
    }

    if (isWinner) {
      return {
        title: '你贏了！',
        subtitle: '恭喜獲勝',
        icon: 'trophy' as const,
        color: '#10b981',
        backgroundColor: '#dcfce7',
      };
    }

    return {
      title: '你輸了',
      subtitle: '下次加油',
      icon: 'sad' as const,
      color: '#ef4444',
      backgroundColor: '#fee2e2',
    };
  };

  const getChoiceEmoji = (choice: GameChoice) => {
    const emojis = {
      rock: '✊',
      paper: '✋',
      scissors: '✌️',
    };
    return emojis[choice];
  };

  const config = getResultConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: config.backgroundColor },
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      testID={testID}
    >
      {/* Result header */}
      <View style={styles.header}>
        <Ionicons
          name={config.icon}
          size={48}
          color={config.color}
          style={styles.resultIcon}
        />

        <Text
          style={[styles.title, { color: config.color }]}
          testID={`${testID}-title`}
        >
          {config.title}
        </Text>

        <Text
          style={styles.subtitle}
          testID={`${testID}-subtitle`}
        >
          {config.subtitle}
        </Text>
      </View>

      {/* Score display */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreTitle}>最終比分</Text>

        <View style={styles.scoreRow}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>你</Text>
            <Text
              style={[
                styles.scoreValue,
                isWinner && { color: config.color }
              ]}
              testID={`${testID}-my-score`}
            >
              {myScore}
            </Text>
          </View>

          <Text style={styles.scoreSeparator}>:</Text>

          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>對手</Text>
            <Text
              style={[
                styles.scoreValue,
                !isWinner && !isTie && { color: '#ef4444' }
              ]}
              testID={`${testID}-opponent-score`}
            >
              {opponentScore}
            </Text>
          </View>
        </View>
      </View>

      {/* Round details */}
      <View style={styles.roundsContainer}>
        <Text style={styles.roundsTitle}>各回合結果</Text>

        {gameSession.rounds.map((round, index) => (
          <View key={index} style={styles.roundRow} testID={`${testID}-round-${index + 1}`}>
            <Text style={styles.roundNumber}>第{index + 1}回合</Text>

            <View style={styles.roundChoices}>
              <View style={styles.choiceContainer}>
                <Text style={styles.choiceEmoji}>
                  {round.player1_choice && getChoiceEmoji(round.player1_choice)}
                </Text>
                <Text style={styles.choiceLabel}>
                  {currentUserId === gameSession.initiator_id ? '你' : '對手'}
                </Text>
              </View>

              <Text style={styles.vs}>VS</Text>

              <View style={styles.choiceContainer}>
                <Text style={styles.choiceEmoji}>
                  {round.player2_choice && getChoiceEmoji(round.player2_choice)}
                </Text>
                <Text style={styles.choiceLabel}>
                  {currentUserId === gameSession.participant_id ? '你' : '對手'}
                </Text>
              </View>
            </View>

            {round.winner_id && (
              <Text
                style={[
                  styles.roundWinner,
                  round.winner_id === currentUserId && { color: '#10b981' }
                ]}
              >
                {round.winner_id === currentUserId ? '你贏' : '對手贏'}
              </Text>
            )}
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 24,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultIcon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  scoreContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
  },
  scoreSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#9ca3af',
    marginHorizontal: 20,
  },
  roundsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  roundsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  roundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  roundNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 60,
  },
  roundChoices: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  choiceContainer: {
    alignItems: 'center',
  },
  choiceEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  choiceLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },
  vs: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginHorizontal: 12,
  },
  roundWinner: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    minWidth: 40,
    textAlign: 'right',
  },
});