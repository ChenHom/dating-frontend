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
import { HandGestureAnimation } from './components/HandGestureAnimation';
import { GameCountdown } from './components/GameCountdown';
import { GameProgressBar } from './components/GameProgressBar';
import { OpponentIndicator } from './components/OpponentIndicator';
import { GameSoundManager, useGameSounds } from './components/GameSoundManager';
import { GameTimer } from './components/GameTimer';
import { GameResult } from './components/GameResult';
import { EnhancedGameResult } from './components/EnhancedGameResult';
import { VictoryCelebration } from './components/VictoryCelebration';
import { RoundReplay } from './components/RoundReplay';
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
  const [showEnhancedUI, setShowEnhancedUI] = useState(true);
  const [showVictoryCelebration, setShowVictoryCelebration] = useState(false);
  const [showRoundReplay, setShowRoundReplay] = useState(false);

  // 使用遊戲音效 hook
  const {
    playSound,
    playCountdownSequence,
    playRoundResult,
    playGameResult,
    playTimeWarning,
  } = useGameSounds();

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

    // 播放選擇音效
    await playSound('choice_select');

    setLocalSelectedChoice(choice);
    setSelectedChoice(choice);

    try {
      await makeMove(choice);
      // 播放確認音效
      await playSound('choice_confirm');
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

  // 監聽時間警告
  useEffect(() => {
    if (roundTimeLeft <= 5 && roundTimeLeft > 0 && currentGame?.state === 'in_progress') {
      playTimeWarning(roundTimeLeft);
    }
  }, [roundTimeLeft]);

  // 監聽遊戲開始
  useEffect(() => {
    if (currentGame?.state === 'in_progress' && currentGame.current_round === 1) {
      playSound('opponent_join');
    }
  }, [currentGame?.state]);

  // 監聽遊戲結束 - 顯示慶祝動畫
  useEffect(() => {
    if (currentGame?.state === 'completed' && currentGame.winner_id === user?.id) {
      setShowVictoryCelebration(true);
    }
  }, [currentGame?.state, currentGame?.winner_id]);

  // 獲取回合結果數組
  const getRoundResults = () => {
    if (!currentGame || !user) return [];

    return currentGame.rounds.map(round => {
      if (!round.player1_choice || !round.player2_choice) return null;

      const isInitiator = currentGame.initiator_id === user.id;
      const myChoice = isInitiator ? round.player1_choice : round.player2_choice;
      const oppChoice = isInitiator ? round.player2_choice : round.player1_choice;

      if (myChoice === oppChoice) return 'draw';

      const winConditions = {
        rock: 'scissors',
        paper: 'rock',
        scissors: 'paper',
      };

      return winConditions[myChoice] === oppChoice ? 'win' : 'lose';
    });
  };

  const roundResults = getRoundResults();

  return (
    <Modal
      visible={isGameModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      testID={testID}
    >
      <GameSoundManager
        enabled={true}
        volume={0.8}
        hapticEnabled={true}
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
              {/* Enhanced Game Progress Bar */}
              <GameProgressBar
                currentRound={currentGame.current_round}
                totalRounds={currentGame.best_of}
                playerScore={currentGame.final_scores[user?.id || 0] || 0}
                opponentScore={currentGame.final_scores[participantId] || 0}
                playerName="你"
                opponentName={opponentName}
                roundResults={roundResults}
                testID={`${testID}-progress`}
              />

              {/* Enhanced Timers */}
              <View style={styles.timersContainer}>
                <GameCountdown
                  timeLeft={roundTimeLeft}
                  totalTime={10}
                  title="回合時間"
                  type="round"
                  isActive={currentGame.state === 'in_progress'}
                  testID={`${testID}-round-countdown`}
                />

                <GameCountdown
                  timeLeft={gameTimeLeft}
                  totalTime={60}
                  title="總時間"
                  type="game"
                  isActive={currentGame.state === 'in_progress'}
                  testID={`${testID}-game-countdown`}
                />
              </View>

              {/* Enhanced Opponent Indicator */}
              <OpponentIndicator
                opponentName={opponentName}
                opponentAvatarUrl={opponentAvatarUrl}
                isConnected={true}
                isThinking={!opponentChoice && !localSelectedChoice}
                hasChoiceMade={!!opponentChoice}
                choice={opponentChoice}
                timeLeft={roundTimeLeft}
                testID={`${testID}-opponent`}
              />

              {/* Enhanced Your choices */}
              <View style={styles.choicesContainer}>
                <Text style={styles.choicesTitle}>
                  {localSelectedChoice ? '你的選擇:' : '請選擇:'}
                </Text>

                <View style={styles.choicesRow}>
                  {(['rock', 'paper', 'scissors'] as GameChoiceType[]).map((choice) => (
                    showEnhancedUI ? (
                      <HandGestureAnimation
                        key={choice}
                        choice={choice}
                        isSelected={localSelectedChoice === choice}
                        onSelect={handleChoiceSelect}
                        disabled={isSubmittingChoice || !!localSelectedChoice}
                        size="xlarge"
                        showAnimation={!localSelectedChoice}
                        testID={`${testID}-gesture-${choice}`}
                      />
                    ) : (
                      <GameChoice
                        key={choice}
                        choice={choice}
                        isSelected={localSelectedChoice === choice}
                        onSelect={handleChoiceSelect}
                        disabled={isSubmittingChoice || !!localSelectedChoice}
                        size="large"
                        testID={`${testID}-choice-${choice}`}
                      />
                    )
                  ))}
                </View>

                {isSubmittingChoice && (
                  <Text style={styles.submittingText}>
                    提交選擇中...
                  </Text>
                )}

                {/* UI 切換按鈕 */}
                <TouchableOpacity
                  style={styles.uiToggle}
                  onPress={() => setShowEnhancedUI(!showEnhancedUI)}
                  testID={`${testID}-ui-toggle`}
                >
                  <Text style={styles.uiToggleText}>
                    {showEnhancedUI ? '簡單模式' : '增強模式'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {currentGame && isGameCompleted && showEnhancedUI && (
            <>
              <EnhancedGameResult
                gameSession={currentGame}
                currentUserId={user?.id || 0}
                isVisible={true}
                onAnimationComplete={() => {
                  // 動畫完成後的回調
                }}
                testID={`${testID}-enhanced-result`}
              />

              {/* 回合回顧按鈕 */}
              <View style={styles.replayControls}>
                <TouchableOpacity
                  style={styles.replayButton}
                  onPress={() => setShowRoundReplay(true)}
                  testID={`${testID}-show-replay`}
                >
                  <Ionicons name="play-circle" size={20} color="#fff" />
                  <Text style={styles.replayButtonText}>回合回顧</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {currentGame && isGameCompleted && !showEnhancedUI && (
            <GameResult
              gameSession={currentGame}
              currentUserId={user?.id || 0}
              isVisible={true}
              testID={`${testID}-result`}
            />
          )}
        </View>
        </View>

        {/* 勝利慶祝動畫 */}
        <VictoryCelebration
          isVisible={showVictoryCelebration}
          isWinner={currentGame?.winner_id === user?.id}
          onComplete={() => setShowVictoryCelebration(false)}
          testID={`${testID}-victory`}
        />
      </GameSoundManager>

      {/* 回合回顧模態 */}
      {showRoundReplay && currentGame && (
        <Modal
          visible={showRoundReplay}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowRoundReplay(false)}
          testID={`${testID}-replay-modal`}
        >
          <RoundReplay
            gameSession={currentGame}
            currentUserId={user?.id || 0}
            isVisible={showRoundReplay}
            onClose={() => setShowRoundReplay(false)}
            testID={`${testID}-replay`}
          />
        </Modal>
      )}
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
  uiToggle: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  uiToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  replayControls: {
    alignItems: 'center',
    marginTop: 16,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  replayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
});

export default GameModal;