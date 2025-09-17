/**
 * GameTimer Component
 * 遊戲計時器組件
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GameTimerProps {
  timeLeft: number; // seconds
  totalTime: number; // seconds
  title?: string;
  type?: 'round' | 'game';
  onTimeout?: () => void;
  testID?: string;
}

export const GameTimer: React.FC<GameTimerProps> = ({
  timeLeft,
  totalTime,
  title,
  type = 'round',
  onTimeout,
  testID = 'game-timer',
}) => {
  const progressAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Update progress animation
    const progress = Math.max(0, timeLeft / totalTime);

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Pulse animation when time is running low
    if (timeLeft <= 5 && timeLeft > 0) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Call timeout callback
    if (timeLeft === 0 && onTimeout) {
      onTimeout();
    }
  }, [timeLeft, totalTime, onTimeout]);

  const getTimerColor = () => {
    const ratio = timeLeft / totalTime;
    if (ratio > 0.5) return '#10b981'; // Green
    if (ratio > 0.2) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return secs.toString();
  };

  const getIcon = () => {
    switch (type) {
      case 'game':
        return 'hourglass';
      default:
        return 'stopwatch';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] }
      ]}
      testID={testID}
    >
      {title && (
        <Text style={styles.title} testID={`${testID}-title`}>
          {title}
        </Text>
      )}

      <View style={styles.timerContainer}>
        <Ionicons
          name={getIcon()}
          size={20}
          color={getTimerColor()}
          style={styles.icon}
        />

        <Text
          style={[styles.timeText, { color: getTimerColor() }]}
          testID={`${testID}-time`}
        >
          {formatTime(timeLeft)}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: getTimerColor(),
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
          testID={`${testID}-progress`}
        />
      </View>

      {timeLeft <= 3 && timeLeft > 0 && (
        <Text style={styles.urgentText} testID={`${testID}-urgent`}>
          快選擇！
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  timeText: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 4,
    textAlign: 'center',
  },
});