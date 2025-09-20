/**
 * RoundReplay Component
 * 回合回顧組件 - 顯示每回合的詳細對戰動畫
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameChoice, GameSession, GameRound } from '@/stores/game';

interface RoundReplayProps {
  gameSession: GameSession;
  currentUserId: number;
  isVisible: boolean;
  onClose?: () => void;
  testID?: string;
}

const { width: screenWidth } = Dimensions.get('window');

interface RoundReplayState {
  currentRound: number;
  isPlaying: boolean;
  animationPhase: 'countdown' | 'reveal' | 'result';
}

export const RoundReplay: React.FC<RoundReplayProps> = ({
  gameSession,
  currentUserId,
  isVisible,
  onClose,
  testID = 'round-replay',
}) => {
  // 動畫值
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  const countdownAnim = useRef(new Animated.Value(0)).current;
  const playerChoiceAnim = useRef(new Animated.Value(0)).current;
  const opponentChoiceAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;
  const battleAnim = useRef(new Animated.Value(0)).current;

  // 狀態管理
  const [replayState, setReplayState] = useState<RoundReplayState>({
    currentRound: 0,
    isPlaying: false,
    animationPhase: 'countdown',
  });

  // 入場動畫
  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 自動開始第一回合
        playRound(0);
      });
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(screenWidth);
      resetAnimations();
    }
  }, [isVisible]);

  // 重置動畫
  const resetAnimations = () => {
    countdownAnim.setValue(0);
    playerChoiceAnim.setValue(0);
    opponentChoiceAnim.setValue(0);
    resultAnim.setValue(0);
    battleAnim.setValue(0);
  };

  // 播放回合動畫
  const playRound = (roundIndex: number) => {
    if (roundIndex >= gameSession.rounds.length) return;

    resetAnimations();
    setReplayState({
      currentRound: roundIndex,
      isPlaying: true,
      animationPhase: 'countdown',
    });

    // 動畫序列
    Animated.sequence([
      // 1. 倒計時階段
      Animated.timing(countdownAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      // 2. 選擇揭示階段
      Animated.parallel([
        Animated.spring(playerChoiceAnim, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(opponentChoiceAnim, {
          toValue: 1,
          tension: 100,
          friction: 6,
          delay: 200,
          useNativeDriver: true,
        }),
      ]),

      // 3. 對戰動畫
      Animated.timing(battleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),

      // 4. 結果顯示
      Animated.spring(resultAnim, {
        toValue: 1,
        tension: 80,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setReplayState(prev => ({
        ...prev,
        isPlaying: false,
        animationPhase: 'result',
      }));
    });
  };

  // 下一回合
  const nextRound = () => {
    const nextIndex = replayState.currentRound + 1;
    if (nextIndex < gameSession.rounds.length) {
      playRound(nextIndex);
    }
  };

  // 上一回合
  const prevRound = () => {
    const prevIndex = replayState.currentRound - 1;
    if (prevIndex >= 0) {
      playRound(prevIndex);
    }
  };

  if (!isVisible) return null;

  const currentRound = gameSession.rounds[replayState.currentRound];
  if (!currentRound) return null;

  const isInitiator = gameSession.initiator_id === currentUserId;
  const myChoice = isInitiator ? currentRound.player1_choice : currentRound.player2_choice;
  const opponentChoice = isInitiator ? currentRound.player2_choice : currentRound.player1_choice;

  const getChoiceConfig = (choice: GameChoice) => {
    switch (choice) {
      case 'rock':
        return { emoji: '✊', name: '石頭', color: '#8b5cf6' };
      case 'paper':
        return { emoji: '✋', name: '布', color: '#10b981' };
      case 'scissors':
        return { emoji: '✌️', name: '剪刀', color: '#f59e0b' };
    }
  };

  const getRoundResult = () => {
    if (!myChoice || !opponentChoice) return null;

    if (myChoice === opponentChoice) return 'draw';

    const winConditions = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper',
    };

    return winConditions[myChoice] === opponentChoice ? 'win' : 'lose';
  };

  const roundResult = getRoundResult();
  const myChoiceConfig = myChoice ? getChoiceConfig(myChoice) : null;
  const opponentChoiceConfig = opponentChoice ? getChoiceConfig(opponentChoice) : null;

  const getResultConfig = () => {
    switch (roundResult) {
      case 'win':
        return { text: '你贏了！', color: '#10b981', icon: 'checkmark-circle' };
      case 'lose':
        return { text: '對手贏了', color: '#ef4444', icon: 'close-circle' };
      case 'draw':
        return { text: '平局', color: '#6b7280', icon: 'remove-circle' };
      default:
        return { text: '', color: '#6b7280', icon: 'help-circle' };
    }
  };

  const resultConfig = getResultConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
      testID={testID}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>回合回顧</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          testID={`${testID}-close`}
        >
          <Ionicons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Round indicator */}
      <View style={styles.roundIndicator}>
        <Text style={styles.roundText}>
          第 {replayState.currentRound + 1} 回合 / 共 {gameSession.rounds.length} 回合
        </Text>
      </View>

      {/* Animation area */}
      <View style={styles.animationArea}>
        {/* Countdown display */}
        <Animated.View
          style={[
            styles.countdownContainer,
            {
              opacity: countdownAnim,
              transform: [{
                scale: countdownAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.5, 1.2, 1],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.countdownText}>準備對戰！</Text>
        </Animated.View>

        {/* Battle arena */}
        <View style={styles.battleArena}>
          {/* Player choice */}
          <Animated.View
            style={[
              styles.choiceContainer,
              styles.playerChoice,
              {
                opacity: playerChoiceAnim,
                transform: [
                  {
                    scale: playerChoiceAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1.3, 1],
                    }),
                  },
                  {
                    translateX: battleAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {myChoiceConfig && (
              <>
                <Text style={[styles.choiceEmoji, { color: myChoiceConfig.color }]}>
                  {myChoiceConfig.emoji}
                </Text>
                <Text style={styles.choiceLabel}>你</Text>
                <Text style={[styles.choiceName, { color: myChoiceConfig.color }]}>
                  {myChoiceConfig.name}
                </Text>
              </>
            )}
          </Animated.View>

          {/* VS indicator */}
          <Animated.View
            style={[
              styles.vsContainer,
              {
                opacity: battleAnim,
                transform: [{
                  scale: battleAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.5, 1.5, 1],
                  }),
                }],
              },
            ]}
          >
            <Text style={styles.vsText}>VS</Text>
            <Animated.View
              style={[
                styles.battleEffect,
                {
                  opacity: battleAnim.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                },
              ]}
            />
          </Animated.View>

          {/* Opponent choice */}
          <Animated.View
            style={[
              styles.choiceContainer,
              styles.opponentChoice,
              {
                opacity: opponentChoiceAnim,
                transform: [
                  {
                    scale: opponentChoiceAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1.3, 1],
                    }),
                  },
                  {
                    translateX: battleAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, -30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {opponentChoiceConfig && (
              <>
                <Text style={[styles.choiceEmoji, { color: opponentChoiceConfig.color }]}>
                  {opponentChoiceConfig.emoji}
                </Text>
                <Text style={styles.choiceLabel}>對手</Text>
                <Text style={[styles.choiceName, { color: opponentChoiceConfig.color }]}>
                  {opponentChoiceConfig.name}
                </Text>
              </>
            )}
          </Animated.View>
        </View>

        {/* Result display */}
        <Animated.View
          style={[
            styles.resultContainer,
            {
              opacity: resultAnim,
              transform: [{
                translateY: resultAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            },
          ]}
        >
          <Ionicons
            name={resultConfig.icon as any}
            size={32}
            color={resultConfig.color}
            style={styles.resultIcon}
          />
          <Text style={[styles.resultText, { color: resultConfig.color }]}>
            {resultConfig.text}
          </Text>
        </Animated.View>
      </View>

      {/* Navigation controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            replayState.currentRound === 0 && styles.controlButtonDisabled
          ]}
          onPress={prevRound}
          disabled={replayState.currentRound === 0 || replayState.isPlaying}
          testID={`${testID}-prev`}
        >
          <Ionicons name="chevron-back" size={24} color="#6b7280" />
          <Text style={styles.controlButtonText}>上一回合</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.replayButton}
          onPress={() => playRound(replayState.currentRound)}
          disabled={replayState.isPlaying}
          testID={`${testID}-replay`}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.replayButtonText}>重播</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            replayState.currentRound === gameSession.rounds.length - 1 && styles.controlButtonDisabled
          ]}
          onPress={nextRound}
          disabled={replayState.currentRound === gameSession.rounds.length - 1 || replayState.isPlaying}
          testID={`${testID}-next`}
        >
          <Text style={styles.controlButtonText}>下一回合</Text>
          <Ionicons name="chevron-forward" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  roundIndicator: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  roundText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  animationArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownContainer: {
    position: 'absolute',
    top: 40,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  battleArena: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  choiceContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 100,
  },
  playerChoice: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  opponentChoice: {
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  choiceEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  choiceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  choiceName: {
    fontSize: 14,
    fontWeight: '700',
  },
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  vsText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
  },
  battleEffect: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f59e0b',
    opacity: 0.3,
  },
  resultContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  resultIcon: {
    marginBottom: 8,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginHorizontal: 4,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  replayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
});

export default RoundReplay;