/**
 * GameCountdown Component
 * 3D 倒計時動畫組件 - 增強視覺效果的遊戲計時器
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface GameCountdownProps {
  timeLeft: number;
  totalTime: number;
  title: string;
  type: 'round' | 'game';
  isActive?: boolean;
  onTimeUp?: () => void;
  testID?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const GameCountdown: React.FC<GameCountdownProps> = ({
  timeLeft,
  totalTime,
  title,
  type,
  isActive = true,
  onTimeUp,
  testID = `game-countdown-${type}`,
}) => {
  // 動畫值
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const warningAnim = useRef(new Animated.Value(0)).current;
  const criticalAnim = useRef(new Animated.Value(0)).current;

  // 圓環尺寸
  const size = type === 'round' ? 80 : 60;
  const strokeWidth = type === 'round' ? 6 : 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // 計算進度百分比
  const progress = timeLeft / totalTime;
  const strokeDashoffset = circumference - (progress * circumference);

  // 顏色配置
  const getColorConfig = () => {
    if (type === 'round') {
      if (timeLeft <= 3) {
        return {
          primary: '#ef4444',
          secondary: '#fca5a5',
          background: '#fee2e2',
          gradient: ['#ef4444', '#dc2626'],
        };
      } else if (timeLeft <= 5) {
        return {
          primary: '#f59e0b',
          secondary: '#fcd34d',
          background: '#fef3c7',
          gradient: ['#f59e0b', '#d97706'],
        };
      } else {
        return {
          primary: '#10b981',
          secondary: '#6ee7b7',
          background: '#d1fae5',
          gradient: ['#10b981', '#059669'],
        };
      }
    } else {
      return {
        primary: '#6366f1',
        secondary: '#a5b4fc',
        background: '#e0e7ff',
        gradient: ['#6366f1', '#4f46e5'],
      };
    }
  };

  const colors = getColorConfig();

  // 脈衝動畫效果
  useEffect(() => {
    if (isActive) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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
      );

      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    }
  }, [isActive]);

  // 警告動畫效果 (時間 <= 5秒)
  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 3) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(warningAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(warningAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      warningAnim.setValue(0);
    }
  }, [timeLeft]);

  // 危險動畫效果 (時間 <= 3秒)
  useEffect(() => {
    if (timeLeft <= 3 && timeLeft > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(criticalAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(criticalAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 震動效果
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      criticalAnim.setValue(0);
      scaleAnim.setValue(1);
    }
  }, [timeLeft]);

  // 時間歸零處理
  useEffect(() => {
    if (timeLeft === 0) {
      onTimeUp?.();

      // 結束動畫
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 200,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [timeLeft]);

  // 進度動畫更新
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // 格式化時間顯示
  const formatTime = (time: number) => {
    if (type === 'round') {
      return time.toString();
    } else {
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  return (
    <View style={[styles.container, { width: size + 40, height: size + 60 }]} testID={testID}>
      {/* 背景圓環 */}
      <Animated.View
        style={[
          styles.timerContainer,
          {
            width: size + 20,
            height: size + 20,
            backgroundColor: colors.background,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
            ],
          },
        ]}
      >
        {/* SVG 進度圓環 */}
        <Svg width={size} height={size} style={styles.svg}>
          <Defs>
            <LinearGradient id={`gradient-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.gradient[0]} />
              <Stop offset="100%" stopColor={colors.gradient[1]} />
            </LinearGradient>
          </Defs>

          {/* 背景圓環 */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.secondary}
            strokeWidth={strokeWidth}
            fill="transparent"
            opacity={0.3}
          />

          {/* 進度圓環 */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#gradient-${type})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [circumference, 0],
            })}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* 時間顯示 */}
        <Animated.View
          style={[
            styles.timeDisplay,
            {
              opacity: warningAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.7],
              }),
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.timeText,
              {
                fontSize: type === 'round' ? 24 : 16,
                color: colors.primary,
                transform: [
                  {
                    scale: criticalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              },
            ]}
            testID={`${testID}-time`}
          >
            {formatTime(timeLeft)}
          </Animated.Text>
        </Animated.View>

        {/* 危險警告指示器 */}
        {timeLeft <= 3 && timeLeft > 0 && (
          <Animated.View
            style={[
              styles.warningIndicator,
              {
                backgroundColor: colors.primary,
                opacity: criticalAnim,
              },
            ]}
          />
        )}
      </Animated.View>

      {/* 標題 */}
      <Text
        style={[
          styles.title,
          { color: colors.primary },
        ]}
        testID={`${testID}-title`}
      >
        {title}
      </Text>

      {/* 進度條 */}
      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: colors.primary,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  timerContainer: {
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  svg: {
    position: 'absolute',
  },
  timeDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  timeText: {
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 1 },
    textShadowOpacity: 0.3,
    textShadowRadius: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '80%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  warningIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default GameCountdown;