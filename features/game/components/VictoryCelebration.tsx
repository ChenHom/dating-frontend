/**
 * VictoryCelebration Component
 * 勝利慶祝動畫組件 - 全屏慶祝效果
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
import { useGameSounds } from './GameSoundManager';

interface VictoryCelebrationProps {
  isVisible: boolean;
  isWinner: boolean;
  onComplete?: () => void;
  testID?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FireworkParticle {
  id: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  color: string;
  scale: Animated.Value;
  opacity: Animated.Value;
}

interface Firework {
  id: number;
  x: number;
  y: number;
  particles: FireworkParticle[];
}

export const VictoryCelebration: React.FC<VictoryCelebrationProps> = ({
  isVisible,
  isWinner,
  onComplete,
  testID = 'victory-celebration',
}) => {
  // 動畫值
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  // 煙花系統
  const [fireworks, setFireworks] = useState<Firework[]>([]);
  const [showFireworks, setShowFireworks] = useState(false);

  // 音效
  const { playSound, playGameResult } = useGameSounds();

  // 創建煙花粒子
  const createFireworkParticles = (x: number, y: number): FireworkParticle[] => {
    const particles: FireworkParticle[] = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'];

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const velocity = 2 + Math.random() * 3;

      particles.push({
        id: i,
        x,
        y,
        velocityX: Math.cos(angle) * velocity,
        velocityY: Math.sin(angle) * velocity,
        color: colors[Math.floor(Math.random() * colors.length)],
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
      });
    }

    return particles;
  };

  // 創建多個煙花
  const createFireworks = () => {
    const newFireworks: Firework[] = [];

    for (let i = 0; i < 5; i++) {
      const x = screenWidth * 0.2 + Math.random() * screenWidth * 0.6;
      const y = screenHeight * 0.2 + Math.random() * screenHeight * 0.3;

      newFireworks.push({
        id: i,
        x,
        y,
        particles: createFireworkParticles(x, y),
      });
    }

    setFireworks(newFireworks);
  };

  // 煙花爆炸動畫
  const animateFireworks = () => {
    const allAnimations = fireworks.flatMap(firework =>
      firework.particles.map(particle => {
        return Animated.parallel([
          Animated.timing(particle.scale, {
            toValue: 0,
            duration: 1500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]);
      })
    );

    Animated.parallel(allAnimations).start(() => {
      setShowFireworks(false);
    });
  };

  // 主要慶祝動畫
  useEffect(() => {
    if (isVisible && isWinner) {
      // 播放慶祝音效
      playGameResult('win');

      // 創建煙花效果
      createFireworks();
      setShowFireworks(true);

      // 主要動畫序列
      Animated.sequence([
        // 1. 快速淡入
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),

        // 2. 爆炸性縮放
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),

        // 3. 旋轉效果
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // 脈衝動畫
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 閃爍效果
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 煙花動畫
      setTimeout(() => {
        animateFireworks();
      }, 500);

      // 自動關閉
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          onComplete?.();
        });
      }, 3000);

    } else if (!isVisible) {
      // 重置所有動畫值
      fadeAnim.setValue(0);
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
      sparkleAnim.setValue(0);
      setShowFireworks(false);
    }
  }, [isVisible, isWinner]);

  if (!isVisible || !isWinner) return null;

  return (
    <View style={styles.container} testID={testID}>
      {/* 背景遮罩 */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.8],
            }),
          },
        ]}
      />

      {/* 煙花效果 */}
      {showFireworks && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {fireworks.map(firework =>
            firework.particles.map(particle => (
              <Animated.View
                key={`${firework.id}-${particle.id}`}
                style={[
                  styles.fireworkParticle,
                  {
                    left: particle.x + particle.velocityX * 30,
                    top: particle.y + particle.velocityY * 30,
                    backgroundColor: particle.color,
                    transform: [{ scale: particle.scale }],
                    opacity: particle.opacity,
                  },
                ]}
              />
            ))
          )}
        </View>
      )}

      {/* 主要慶祝內容 */}
      <Animated.View
        style={[
          styles.celebrationContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { scale: pulseAnim },
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        {/* 主要標題 */}
        <View style={styles.titleContainer}>
          <Animated.Text
            style={[
              styles.mainTitle,
              {
                opacity: sparkleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ]}
          >
            🎉 恭喜獲勝！ 🎉
          </Animated.Text>

          <Text style={styles.subTitle}>
            表現優秀！
          </Text>
        </View>

        {/* 裝飾元素 */}
        <View style={styles.decorations}>
          {['⭐', '✨', '🌟', '💫', '🎊'].map((emoji, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.decorationEmoji,
                {
                  transform: [
                    {
                      scale: sparkleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    },
                    {
                      rotate: sparkleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    },
                  ],
                  opacity: sparkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ]}
            >
              {emoji}
            </Animated.Text>
          ))}
        </View>

        {/* 獎杯圖標 */}
        <Animated.View
          style={[
            styles.trophyContainer,
            {
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.trophyEmoji}>🏆</Text>
        </Animated.View>
      </Animated.View>

      {/* 底部閃爍文字 */}
      <Animated.View
        style={[
          styles.bottomText,
          {
            opacity: sparkleAnim,
            transform: [
              {
                translateY: sparkleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.bottomMessage}>
          繼續保持這樣的表現！
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  celebrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f9ca24',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  decorations: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: screenWidth * 0.8,
    marginBottom: 40,
  },
  decorationEmoji: {
    fontSize: 24,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  trophyContainer: {
    marginBottom: 40,
    shadowColor: '#f9ca24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  trophyEmoji: {
    fontSize: 80,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  fireworkParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomText: {
    position: 'absolute',
    bottom: screenHeight * 0.2,
    alignItems: 'center',
  },
  bottomMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default VictoryCelebration;