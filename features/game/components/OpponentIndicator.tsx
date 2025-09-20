/**
 * OpponentIndicator Component
 * 對手狀態指示器 - 顯示對手的連接狀態、選擇狀態等
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Easing,
} from 'react-native';
import { GameChoice as GameChoiceType } from '@/stores/game';

interface OpponentIndicatorProps {
  opponentName: string;
  opponentAvatarUrl?: string;
  isConnected: boolean;
  isThinking: boolean;
  hasChoiceMade: boolean;
  choice?: GameChoiceType | null;
  timeLeft?: number;
  testID?: string;
}

export const OpponentIndicator: React.FC<OpponentIndicatorProps> = ({
  opponentName,
  opponentAvatarUrl,
  isConnected,
  isThinking,
  hasChoiceMade,
  choice,
  timeLeft,
  testID = 'opponent-indicator',
}) => {
  // 動畫值
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const thinkingAnim = useRef(new Animated.Value(0)).current;
  const choiceRevealAnim = useRef(new Animated.Value(0)).current;
  const connectionAnim = useRef(new Animated.Value(isConnected ? 1 : 0)).current;

  // 連接狀態動畫
  useEffect(() => {
    Animated.timing(connectionAnim, {
      toValue: isConnected ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isConnected]);

  // 思考動畫
  useEffect(() => {
    if (isThinking && !hasChoiceMade) {
      // 脈衝動畫
      const pulseAnimation = Animated.loop(
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
      );

      // 思考指示動畫
      const thinkingAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(thinkingAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(thinkingAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      thinkingAnimation.start();

      return () => {
        pulseAnimation.stop();
        thinkingAnimation.stop();
      };
    } else {
      pulseAnim.setValue(1);
      thinkingAnim.setValue(0);
    }
  }, [isThinking, hasChoiceMade]);

  // 選擇揭示動畫
  useEffect(() => {
    if (hasChoiceMade && choice) {
      Animated.sequence([
        Animated.timing(choiceRevealAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      choiceRevealAnim.setValue(0);
    }
  }, [hasChoiceMade, choice]);

  // 獲取狀態配置
  const getStatusConfig = () => {
    if (!isConnected) {
      return {
        text: '離線',
        color: '#9ca3af',
        backgroundColor: '#f3f4f6',
        icon: '⚫',
      };
    } else if (hasChoiceMade) {
      return {
        text: '已選擇',
        color: '#10b981',
        backgroundColor: '#d1fae5',
        icon: '✓',
      };
    } else if (isThinking) {
      return {
        text: '思考中',
        color: '#f59e0b',
        backgroundColor: '#fef3c7',
        icon: '🤔',
      };
    } else {
      return {
        text: '等待中',
        color: '#6b7280',
        backgroundColor: '#f8fafc',
        icon: '⏳',
      };
    }
  };

  const statusConfig = getStatusConfig();

  // 獲取選擇配置
  const getChoiceConfig = (choice: GameChoiceType) => {
    switch (choice) {
      case 'rock':
        return { emoji: '✊', name: '石頭', color: '#8b5cf6' };
      case 'paper':
        return { emoji: '✋', name: '布', color: '#10b981' };
      case 'scissors':
        return { emoji: '✌️', name: '剪刀', color: '#f59e0b' };
    }
  };

  const choiceConfig = choice ? getChoiceConfig(choice) : null;

  return (
    <View style={styles.container} testID={testID}>
      {/* 對手信息 */}
      <View style={styles.opponentInfo}>
        {/* 頭像容器 */}
        <Animated.View
          style={[
            styles.avatarContainer,
            {
              transform: [{ scale: pulseAnim }],
              opacity: connectionAnim,
            },
          ]}
        >
          {opponentAvatarUrl ? (
            <Image
              source={{ uri: opponentAvatarUrl }}
              style={styles.avatar}
              testID={`${testID}-avatar`}
            />
          ) : (
            <View style={styles.defaultAvatar}>
              <Text style={styles.defaultAvatarText}>
                {opponentName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* 連接狀態指示器 */}
          <Animated.View
            style={[
              styles.connectionIndicator,
              {
                backgroundColor: connectionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#ef4444', '#10b981'],
                }),
              },
            ]}
          />

          {/* 思考動畫圓環 */}
          {isThinking && !hasChoiceMade && (
            <Animated.View
              style={[
                styles.thinkingRing,
                {
                  opacity: thinkingAnim,
                  transform: [
                    {
                      scale: thinkingAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </Animated.View>

        {/* 對手名稱 */}
        <Text style={styles.opponentName} testID={`${testID}-name`}>
          {opponentName}
        </Text>
      </View>

      {/* 狀態顯示 */}
      <View
        style={[
          styles.statusContainer,
          { backgroundColor: statusConfig.backgroundColor },
        ]}
      >
        <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
        <Text
          style={[
            styles.statusText,
            { color: statusConfig.color },
          ]}
          testID={`${testID}-status`}
        >
          {statusConfig.text}
        </Text>

        {/* 倒計時 */}
        {timeLeft !== undefined && timeLeft > 0 && isThinking && (
          <Text style={styles.timeLeft}>
            {timeLeft}s
          </Text>
        )}
      </View>

      {/* 選擇揭示 */}
      {hasChoiceMade && choiceConfig && (
        <Animated.View
          style={[
            styles.choiceReveal,
            {
              transform: [
                { scale: choiceRevealAnim },
                {
                  translateY: choiceRevealAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
              opacity: choiceRevealAnim,
            },
          ]}
        >
          <View
            style={[
              styles.choiceContainer,
              { borderColor: choiceConfig.color },
            ]}
          >
            <Text style={styles.choiceEmoji}>{choiceConfig.emoji}</Text>
            <Text
              style={[
                styles.choiceName,
                { color: choiceConfig.color },
              ]}
            >
              {choiceConfig.name}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* 等待選擇佔位符 */}
      {isThinking && !hasChoiceMade && (
        <View style={styles.waitingPlaceholder}>
          <Animated.View
            style={[
              styles.questionMark,
              {
                opacity: thinkingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
                transform: [
                  {
                    scale: thinkingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.2],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.questionMarkText}>?</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  opponentInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  defaultAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  connectionIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  thinkingRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#f59e0b',
    backgroundColor: 'transparent',
  },
  opponentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeLeft: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  choiceReveal: {
    alignItems: 'center',
  },
  choiceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#f8fafc',
  },
  choiceEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  choiceName: {
    fontSize: 14,
    fontWeight: '600',
  },
  waitingPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  questionMark: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  questionMarkText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9ca3af',
  },
});

export default OpponentIndicator;