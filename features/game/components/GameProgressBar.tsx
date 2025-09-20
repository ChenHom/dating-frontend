/**
 * GameProgressBar Component
 * 遊戲進度條組件 - 顯示局數進度和得分狀況
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';

interface GameProgressBarProps {
  currentRound: number;
  totalRounds: number;
  playerScore: number;
  opponentScore: number;
  playerName?: string;
  opponentName?: string;
  roundResults?: Array<'win' | 'lose' | 'draw' | null>;
  testID?: string;
}

export const GameProgressBar: React.FC<GameProgressBarProps> = ({
  currentRound,
  totalRounds,
  playerScore,
  opponentScore,
  playerName = '你',
  opponentName = '對手',
  roundResults = [],
  testID = 'game-progress-bar',
}) => {
  // 動畫值
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scoreAnimPlayer = useRef(new Animated.Value(0)).current;
  const scoreAnimOpponent = useRef(new Animated.Value(0)).current;

  // 進度動畫
  useEffect(() => {
    const progress = (currentRound - 1) / totalRounds;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [currentRound, totalRounds]);

  // 分數動畫
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scoreAnimPlayer, {
        toValue: playerScore,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(scoreAnimOpponent, {
        toValue: opponentScore,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();
  }, [playerScore, opponentScore]);

  // 渲染局數指示器
  const renderRoundIndicators = () => {
    const indicators = [];
    for (let i = 1; i <= totalRounds; i++) {
      const isCompleted = i <= currentRound - 1;
      const isCurrent = i === currentRound;
      const result = roundResults[i - 1];

      let indicatorStyle = styles.roundIndicator;
      let indicatorColor = '#e5e7eb';
      let textColor = '#9ca3af';
      let resultIcon = null;

      if (isCompleted) {
        switch (result) {
          case 'win':
            indicatorColor = '#10b981';
            textColor = '#ffffff';
            resultIcon = '✓';
            break;
          case 'lose':
            indicatorColor = '#ef4444';
            textColor = '#ffffff';
            resultIcon = '✗';
            break;
          case 'draw':
            indicatorColor = '#f59e0b';
            textColor = '#ffffff';
            resultIcon = '−';
            break;
        }
      } else if (isCurrent) {
        indicatorColor = '#3b82f6';
        textColor = '#ffffff';
      }

      indicators.push(
        <View
          key={i}
          style={[
            indicatorStyle,
            {
              backgroundColor: indicatorColor,
              borderColor: isCurrent ? '#1d4ed8' : indicatorColor,
              borderWidth: isCurrent ? 2 : 1,
            },
          ]}
          testID={`${testID}-round-${i}`}
        >
          <Text
            style={[
              styles.roundIndicatorText,
              { color: textColor },
            ]}
          >
            {resultIcon || i}
          </Text>
        </View>
      );

      // 添加連接線 (除了最後一個)
      if (i < totalRounds) {
        indicators.push(
          <View
            key={`line-${i}`}
            style={[
              styles.connectionLine,
              {
                backgroundColor: isCompleted ? '#10b981' : '#e5e7eb',
              },
            ]}
          />
        );
      }
    }
    return indicators;
  };

  // 計算領先狀態
  const getLeadingStatus = () => {
    if (playerScore > opponentScore) {
      return {
        text: `${playerName} 領先`,
        color: '#10b981',
      };
    } else if (opponentScore > playerScore) {
      return {
        text: `${opponentName} 領先`,
        color: '#ef4444',
      };
    } else {
      return {
        text: '平局',
        color: '#f59e0b',
      };
    }
  };

  const leadingStatus = getLeadingStatus();

  return (
    <View style={styles.container} testID={testID}>
      {/* 標題和狀態 */}
      <View style={styles.header}>
        <Text style={styles.title}>
          第 {currentRound} 回合 / 共 {totalRounds} 回合
        </Text>
        <Text
          style={[
            styles.status,
            { color: leadingStatus.color },
          ]}
          testID={`${testID}-status`}
        >
          {leadingStatus.text}
        </Text>
      </View>

      {/* 分數顯示 */}
      <View style={styles.scoreContainer}>
        <View style={styles.playerScore}>
          <Text style={styles.playerName}>{playerName}</Text>
          <Animated.Text
            style={[
              styles.scoreNumber,
              { color: '#10b981' },
            ]}
            testID={`${testID}-player-score`}
          >
            {scoreAnimPlayer._value}
          </Animated.Text>
        </View>

        <View style={styles.scoreVs}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <View style={styles.opponentScore}>
          <Text style={styles.opponentName}>{opponentName}</Text>
          <Animated.Text
            style={[
              styles.scoreNumber,
              { color: '#ef4444' },
            ]}
            testID={`${testID}-opponent-score`}
          >
            {scoreAnimOpponent._value}
          </Animated.Text>
        </View>
      </View>

      {/* 進度條 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          遊戲進度: {Math.round(((currentRound - 1) / totalRounds) * 100)}%
        </Text>
      </View>

      {/* 局數指示器 */}
      <View style={styles.roundsContainer}>
        <Text style={styles.roundsTitle}>回合結果:</Text>
        <View style={styles.roundIndicators}>
          {renderRoundIndicators()}
        </View>
      </View>

      {/* 勝利條件提示 */}
      <View style={styles.winCondition}>
        <Text style={styles.winConditionText}>
          {Math.ceil(totalRounds / 2)} 勝制 - 先獲得 {Math.ceil(totalRounds / 2)} 勝的玩家獲勝
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  playerScore: {
    flex: 1,
    alignItems: 'center',
  },
  opponentScore: {
    flex: 1,
    alignItems: 'center',
  },
  scoreVs: {
    paddingHorizontal: 16,
  },
  playerName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  opponentName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  roundsContainer: {
    marginBottom: 12,
  },
  roundsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  roundIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  roundIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  connectionLine: {
    width: 20,
    height: 2,
    marginHorizontal: 2,
  },
  winCondition: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  winConditionText: {
    fontSize: 12,
    color: '#1e40af',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default GameProgressBar;