/**
 * GameModal Component
 * 遊戲模態視窗 - 剪刀石頭布遊戲主界面
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore, GameChoice as GameChoiceType } from '@/stores/game';
import { useAuthStore } from '@/stores/auth';
import { GameChoice } from './components/GameChoice';
import { GameTimer } from './components/GameTimer';
import { GameResult } from './components/GameResult';
import { GameInvite } from './components/GameInvite';

interface GameModalProps {
  conversationId: number;
  opponentName?: string;
  opponentAvatarUrl?: string;
  testID?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const GameModal: React.FC<GameModalProps> = ({
  conversationId,
  opponentName = '對方',
  opponentAvatarUrl,
  testID = 'game-modal',
}) => {
  const [localSelectedChoice, setLocalSelectedChoice] = useState<GameChoiceType | null>(null);

  const {
    currentGame,
    isGameModalVisible,
    selectedChoice,
    isSubmittingChoice,
    roundTimeLeft,
    gameTimeLeft,
    gameError,
    isCreatingGame,
    startGame,
    makeMove,
    forfeitGame,
    hideGameModal,
    setSelectedChoice,
    clearGameError,
  } = useGameStore();

  const { user } = useAuthStore();

  // Participant ID (the other user in the conversation)
  const participantId = 2; // TODO: Get from conversation data

  useEffect(() => {
    // Clear local state when modal opens/closes
    if (!isGameModalVisible) {
      setLocalSelectedChoice(null);
      setSelectedChoice(null);
    }
  }, [isGameModalVisible]);

  // Handle starting a new game
  const handleStartGame = async () => {
    try {
      await startGame(conversationId, participantId);
    } catch (error) {
      Alert.alert('無法開始遊戲', '請稍後再試');
    }
  };

  // Handle choice selection
  const handleChoiceSelect = async (choice: GameChoiceType) => {
    if (isSubmittingChoice || !currentGame || currentGame.state !== 'in_progress') {
      return;
    }

    setLocalSelectedChoice(choice);
    setSelectedChoice(choice);

    try {
      await makeMove(choice);
    } catch (error) {
      Alert.alert('選擇失敗', '請重新選擇');
      setLocalSelectedChoice(null);
      setSelectedChoice(null);
    }
  };

  // Handle forfeit
  const handleForfeit = () => {
    Alert.alert(
      '確認投降',
      '確定要投降嗎？這將結束遊戲。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '投降',
          style: 'destructive',
          onPress: async () => {
            try {
              await forfeitGame();
            } catch (error) {
              Alert.alert('投降失敗', '請稍後再試');
            }
          },
        },
      ]
    );
  };

  // Handle modal close
  const handleClose = () => {
    if (currentGame && currentGame.state === 'in_progress') {
      Alert.alert(
        '確認離開',
        '遊戲正在進行中，確定要離開嗎？這將自動投降。',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '離開',
            style: 'destructive',
            onPress: () => {
              forfeitGame();
              hideGameModal();
            },
          },
        ]
      );
    } else {
      hideGameModal();
    }
  };

  // Error handling
  useEffect(() => {
    if (gameError) {
      Alert.alert('遊戲錯誤', gameError, [
        {
          text: '確定',
          onPress: () => clearGameError(),
        },
      ]);
    }
  }, [gameError]);

  // Get current round info
  const getCurrentRound = () => {
    if (!currentGame || !currentGame.rounds) return null;
    return currentGame.rounds.find(r => r.round_number === currentGame.current_round);
  };

  const currentRound = getCurrentRound();
  const isGameCompleted = currentGame?.state === 'completed';
  const isWaitingForGame = !currentGame;

  // Get opponent's choice for current round
  const getOpponentChoice = (): GameChoiceType | null => {
    if (!currentRound || !user) return null;

    const isInitiator = currentGame?.initiator_id === user.id;
    return isInitiator ? currentRound.player2_choice || null : currentRound.player1_choice || null;
  };

  const opponentChoice = getOpponentChoice();

  return (
    <Modal
      visible={isGameModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      testID={testID}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            testID={`${testID}-close`}
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>剪刀石頭布</Text>

          {currentGame && currentGame.state === 'in_progress' && (
            <TouchableOpacity
              style={styles.forfeitButton}
              onPress={handleForfeit}
              testID={`${testID}-forfeit`}
            >
              <Text style={styles.forfeitButtonText}>投降</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isWaitingForGame && (
            <GameInvite
              onStartGame={handleStartGame}
              opponentName={opponentName}
              opponentAvatarUrl={opponentAvatarUrl}
              disabled={isCreatingGame}
              testID={`${testID}-invite`}
            />
          )}

          {currentGame && !isGameCompleted && (
            <>
              {/* Game status */}
              <View style={styles.gameStatus}>
                <Text style={styles.gameTitle}>
                  第 {currentGame.current_round} 回合 / 共 {currentGame.best_of} 回合
                </Text>

                <View style={styles.scoreDisplay}>
                  <Text style={styles.scoreText}>
                    你: {currentGame.final_scores[user?.id || 0] || 0} |
                    對手: {currentGame.final_scores[participantId] || 0}
                  </Text>
                </View>
              </View>

              {/* Timers */}
              <View style={styles.timersContainer}>
                <GameTimer
                  timeLeft={roundTimeLeft}
                  totalTime={10}
                  title="回合時間"
                  type="round"
                  testID={`${testID}-round-timer`}
                />

                <GameTimer
                  timeLeft={gameTimeLeft}
                  totalTime={60}
                  title="總時間"
                  type="game"
                  testID={`${testID}-game-timer`}
                />
              </View>

              {/* Opponent choice display */}
              {opponentChoice && (
                <View style={styles.opponentChoiceContainer}>
                  <Text style={styles.opponentChoiceTitle}>對手選擇:</Text>
                  <GameChoice
                    choice={opponentChoice}
                    isSelected={true}
                    onSelect={() => {}}
                    disabled={true}
                    size="large"
                    testID={`${testID}-opponent-choice`}
                  />
                </View>
              )}

              {/* Your choices */}
              <View style={styles.choicesContainer}>
                <Text style={styles.choicesTitle}>
                  {localSelectedChoice ? '你的選擇:' : '請選擇:'}
                </Text>

                <View style={styles.choicesRow}>
                  {(['rock', 'paper', 'scissors'] as GameChoiceType[]).map((choice) => (
                    <GameChoice
                      key={choice}
                      choice={choice}
                      isSelected={localSelectedChoice === choice}
                      onSelect={handleChoiceSelect}
                      disabled={isSubmittingChoice || !!localSelectedChoice}
                      size="large"
                      testID={`${testID}-choice-${choice}`}
                    />
                  ))}
                </View>

                {isSubmittingChoice && (
                  <Text style={styles.submittingText}>
                    提交選擇中...
                  </Text>
                )}
              </View>
            </>
          )}

          {currentGame && isGameCompleted && (
            <GameResult
              gameSession={currentGame}
              currentUserId={user?.id || 0}
              isVisible={true}
              testID={`${testID}-result`}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  forfeitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    width: 40,
    alignItems: 'center',
  },
  forfeitButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  gameStatus: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  scoreDisplay: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  timersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  opponentChoiceContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  opponentChoiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  choicesContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  choicesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  choicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 16,
  },
  submittingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default GameModal;