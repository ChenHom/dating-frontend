/**
 * EnhancedGameResult Component
 * 增強版遊戲結果展示組件 - 添加慶祝動畫、粒子效果和音效
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { GameChoice, GameSession } from '@/stores/game';
import { useGameSounds } from './GameSoundManager';

interface EnhancedGameResultProps {
  gameSession: GameSession;
  currentUserId: number;
  isVisible: boolean;
  onAnimationComplete?: () => void;
  testID?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
}

export const EnhancedGameResult: React.FC<EnhancedGameResultProps> = ({
  gameSession,
  currentUserId,
  isVisible,
  onAnimationComplete,
  testID = 'enhanced-game-result',
}) => {
  // 動畫值
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const scoreCountAnim = useRef(new Animated.Value(0)).current;
  const roundRevealAnim = useRef(new Animated.Value(0)).current;

  // 粒子系統
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // 音效管理
  const { playGameResult, playRoundResult, playSound } = useGameSounds();

  // 計算結果
  const isWinner = gameSession.winner_id === currentUserId;
  const isTie = !gameSession.winner_id;
  const myScore = gameSession.final_scores[currentUserId] || 0;
  const opponentId = gameSession.initiator_id === currentUserId
    ? gameSession.participant_id
    : gameSession.initiator_id;
  const opponentScore = gameSession.final_scores[opponentId] || 0;

  // 創建粒子效果
  const createParticles = () => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: i,
        x: new Animated.Value(Math.random() * screenWidth),
        y: new Animated.Value(screenHeight),
        scale: new Animated.Value(Math.random() * 0.5 + 0.5),
        opacity: new Animated.Value(1),
        rotation: new Animated.Value(0),
      });
    }
    setParticles(newParticles);
  };

  // 粒子動畫
  const animateParticles = () => {
    const animations = particles.map((particle) => {
      return Animated.parallel([
        Animated.timing(particle.y, {
          toValue: -100,
          duration: 3000 + Math.random() * 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(particle.rotation, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 2000 + Math.random() * 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      setShowConfetti(false);
    });
  };

  // 主要動畫序列
  useEffect(() => {
    if (isVisible) {
      // 播放結果音效
      if (isWinner) {
        playGameResult('win');
      } else if (!isTie) {
        playGameResult('lose');
      }

      // 如果獲勝，創建慶祝效果
      if (isWinner) {
        createParticles();
        setShowConfetti(true);
        setTimeout(() => {
          animateParticles();
        }, 1000);
      }

      // 主要入場動畫
      Animated.sequence([
        // 1. 淡入和縮放
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 80,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
        ]),

        // 2. 彈跳效果（獲勝時）
        ...(isWinner ? [
          Animated.spring(bounceAnim, {
            toValue: 1,
            tension: 100,
            friction: 4,
            useNativeDriver: true,
          }),
        ] : []),

        // 3. 光暈效果
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();

      // 分數計數動畫
      Animated.timing(scoreCountAnim, {
        toValue: 1,
        duration: 1000,
        delay: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();

      // 回合揭示動畫
      Animated.stagger(200,
        gameSession.rounds.map((_, index) =>
          Animated.timing(roundRevealAnim, {
            toValue: index + 1,
            duration: 300,
            delay: 1200 + index * 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          })
        )
      ).start(() => {
        onAnimationComplete?.();
      });

    } else {
      // 退場動畫
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

  const getResultConfig = () => {
    if (isTie) {
      return {
        title: '平局！',
        subtitle: '勢均力敵',
        icon: 'remove-circle' as const,
        color: '#6b7280',
        backgroundColor: '#f8fafc',
        gradientColors: ['#f1f5f9', '#e2e8f0'],
        emoji: '🤝',
      };
    }

    if (isWinner) {
      return {
        title: '恭喜獲勝！',
        subtitle: '表現出色',
        icon: 'trophy' as const,
        color: '#10b981',
        backgroundColor: '#ecfdf5',
        gradientColors: ['#d1fae5', '#a7f3d0'],
        emoji: '🎉',
      };
    }

    return {
      title: '再接再厲',
      subtitle: '下次一定贏',
      icon: 'heart' as const,
      color: '#f59e0b',
      backgroundColor: '#fffbeb',
      gradientColors: ['#fef3c7', '#fed7aa'],
      emoji: '💪',
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

  // 動畫計數器
  const animatedMyScore = scoreCountAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, myScore],
  });

  const animatedOpponentScore = scoreCountAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, opponentScore],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
            {
              scale: bounceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.05],
              })
            },
          ],
        },
      ]}
      testID={testID}
    >
      {/* 背景光暈效果 */}
      <Animated.View
        style={[
          styles.glowBackground,
          {
            backgroundColor: config.color,
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.3],
            }),
            transform: [{
              scale: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.1],
              }),
            }],
          },
        ]}
      />

      {/* SVG 背景漸變 */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="backgroundGradient" cx="50%" cy="30%">
            <Stop offset="0%" stopColor={config.gradientColors[0]} stopOpacity={0.8} />
            <Stop offset="100%" stopColor={config.gradientColors[1]} stopOpacity={0.3} />
          </RadialGradient>
        </Defs>
        <Circle
          cx="50%"
          cy="30%"
          r="70%"
          fill="url(#backgroundGradient)"
        />
      </Svg>

      {/* 慶祝粒子效果 */}
      {showConfetti && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {particles.map((particle) => (
            <Animated.View
              key={particle.id}
              style={[
                styles.particle,
                {
                  transform: [
                    { translateX: particle.x },
                    { translateY: particle.y },
                    { scale: particle.scale },
                    { rotate: particle.rotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    })},
                  ],
                  opacity: particle.opacity,
                },
              ]}
            >
              <Text style={styles.particleEmoji}>
                {['🎉', '✨', '🌟', '💫', '🎊'][particle.id % 5]}
              </Text>
            </Animated.View>
          ))}
        </View>
      )}

      {/* 主要內容 */}
      <View style={[styles.content, { backgroundColor: config.backgroundColor }]}>
        {/* Result header */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{
                  scale: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                }],
              },
            ]}
          >
            <Text style={styles.resultEmoji}>{config.emoji}</Text>
            <Ionicons
              name={config.icon}
              size={32}
              color={config.color}
              style={styles.resultIcon}
            />
          </Animated.View>

          <Animated.Text
            style={[
              styles.title,
              { color: config.color },
              {
                transform: [{
                  scale: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                  }),
                }],
              },
            ]}
            testID={`${testID}-title`}
          >
            {config.title}
          </Animated.Text>

          <Text
            style={styles.subtitle}
            testID={`${testID}-subtitle`}
          >
            {config.subtitle}
          </Text>
        </View>

        {/* Enhanced Score display */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreTitle}>最終比分</Text>

          <View style={styles.scoreRow}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>你</Text>
              <Animated.Text
                style={[
                  styles.scoreValue,
                  isWinner && { color: config.color }
                ]}
                testID={`${testID}-my-score`}
              >
                {animatedMyScore.interpolate({
                  inputRange: [0, myScore || 1],
                  outputRange: ['0', String(myScore)],
                  extrapolate: 'clamp',
                })}
              </Animated.Text>
            </View>

            <Text style={styles.scoreSeparator}>:</Text>

            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>對手</Text>
              <Animated.Text
                style={[
                  styles.scoreValue,
                  !isWinner && !isTie && { color: '#ef4444' }
                ]}
                testID={`${testID}-opponent-score`}
              >
                {animatedOpponentScore.interpolate({
                  inputRange: [0, opponentScore || 1],
                  outputRange: ['0', String(opponentScore)],
                  extrapolate: 'clamp',
                })}
              </Animated.Text>
            </View>
          </View>
        </View>

        {/* Enhanced Round details */}
        <View style={styles.roundsContainer}>
          <Text style={styles.roundsTitle}>各回合結果</Text>

          {gameSession.rounds.map((round, index) => (
            <Animated.View
              key={index}
              style={[
                styles.roundRow,
                {
                  opacity: roundRevealAnim.interpolate({
                    inputRange: [index, index + 1],
                    outputRange: [0, 1],
                    extrapolate: 'clamp',
                  }),
                  transform: [{
                    translateX: roundRevealAnim.interpolate({
                      inputRange: [index, index + 1],
                      outputRange: [50, 0],
                      extrapolate: 'clamp',
                    }),
                  }],
                },
              ]}
              testID={`${testID}-round-${index + 1}`}
            >
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
            </Animated.View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  glowBackground: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 44,
  },
  content: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  resultEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  resultIcon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '500',
  },
  scoreContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1f2937',
  },
  scoreSeparator: {
    fontSize: 28,
    fontWeight: '700',
    color: '#9ca3af',
    marginHorizontal: 20,
  },
  roundsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    paddingVertical: 10,
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
    fontSize: 24,
    marginBottom: 2,
  },
  choiceLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
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
  particle: {
    position: 'absolute',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleEmoji: {
    fontSize: 16,
  },
});

export default EnhancedGameResult;