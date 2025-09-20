/**
 * Game Store
 * 遊戲狀態管理 - 管理剪刀石頭布遊戲狀態和邏輯
 */

import { create } from 'zustand';
import { echoService } from '@/services/websocket/EchoService';
import { notificationManager } from '@/services/notifications/NotificationManager';

export type GameChoice = 'rock' | 'paper' | 'scissors';

export type GameState = 'waiting' | 'in_progress' | 'completed' | 'cancelled';

export interface GameRound {
  round_number: number;
  player1_choice?: GameChoice;
  player2_choice?: GameChoice;
  winner_id?: number;
  completed_at?: string;
  time_limit: number; // seconds
}

export interface GameSession {
  id: number;
  conversation_id: number;
  initiator_id: number;
  participant_id: number;
  state: GameState;
  best_of: number; // 3 for best of 3
  current_round: number;
  rounds: GameRound[];
  winner_id?: number;
  final_scores: {
    [player_id: number]: number;
  };
  started_at: string;
  completed_at?: string;
  expires_at: string;
}

export interface GameInvitation {
  id: string;
  conversation_id: number;
  from_user_id: number;
  to_user_id: number;
  expires_at: string;
  created_at: string;
}

interface GameStoreState {
  // Current game session
  currentGame: GameSession | null;

  // Game invitations
  pendingInvitations: GameInvitation[];
  sentInvitations: GameInvitation[];

  // Game UI state
  isGameModalVisible: boolean;
  selectedChoice: GameChoice | null;
  isSubmittingChoice: boolean;
  roundTimeLeft: number;
  gameTimeLeft: number;

  // Game history
  gameHistory: GameSession[];

  // Loading states
  isLoadingGame: boolean;
  isCreatingGame: boolean;

  // Error states
  gameError: string | null;

  // Actions
  sendGameInvite: (conversationId: number, participantId: number) => Promise<GameInvitation>;
  startGame: (conversationId: number, participantId: number) => Promise<void>;
  acceptGameInvitation: (invitationId: string) => Promise<void>;
  declineGameInvitation: (invitationId: string) => Promise<void>;
  makeMove: (choice: GameChoice) => Promise<void>;
  forfeitGame: () => Promise<void>;

  // WebSocket management
  initializeWebSocketListeners: () => void;
  cleanupWebSocketListeners: () => void;

  // UI actions
  showGameModal: () => void;
  hideGameModal: () => void;
  setSelectedChoice: (choice: GameChoice | null) => void;

  // WebSocket event handlers
  handleGameInviteReceived: (event: any) => void;
  handleGameInviteAccepted: (event: any) => void;
  handleGameInviteDeclined: (event: any) => void;
  handleGameStarted: (event: any) => void;
  handleGameMove: (event: any) => void;
  handleGameEnded: (event: any) => void;
  handleGameTimeout: (event: any) => void;

  // Internal state management
  updateRoundTimer: () => void;
  updateGameTimer: () => void;
  clearTimers: () => void;
  setGameError: (error: string | null) => void;
  clearGameError: () => void;

  // Game logic helpers
  determineRoundWinner: (choice1: GameChoice, choice2: GameChoice) => 'player1' | 'player2' | 'tie';
  getChoiceEmoji: (choice: GameChoice) => string;
  getChoiceDisplayName: (choice: GameChoice) => string;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

export const useGameStore = create<GameStoreState>((set, get) => ({
  // Initial state
  currentGame: null,
  pendingInvitations: [],
  sentInvitations: [],
  isGameModalVisible: false,
  selectedChoice: null,
  isSubmittingChoice: false,
  roundTimeLeft: 0,
  gameTimeLeft: 0,
  gameHistory: [],
  isLoadingGame: false,
  isCreatingGame: false,
  gameError: null,

  // Initialize WebSocket event listeners
  initializeWebSocketListeners: () => {
    // Listen for game invitation events from EchoService
    echoService.on('game.invitation.sent', get().handleGameInviteReceived);
    echoService.on('game.invitation.accepted', get().handleGameInviteAccepted);
    echoService.on('game.invitation.declined', get().handleGameInviteDeclined);
    echoService.on('game.started', get().handleGameStarted);
    echoService.on('game.move', get().handleGameMove);
    echoService.on('game.ended', get().handleGameEnded);
    echoService.on('game.timeout', get().handleGameTimeout);

    console.log('Game WebSocket listeners initialized');
  },

  // Clean up WebSocket event listeners
  cleanupWebSocketListeners: () => {
    echoService.off('game.invitation.sent', get().handleGameInviteReceived);
    echoService.off('game.invitation.accepted', get().handleGameInviteAccepted);
    echoService.off('game.invitation.declined', get().handleGameInviteDeclined);
    echoService.off('game.started', get().handleGameStarted);
    echoService.off('game.move', get().handleGameMove);
    echoService.off('game.ended', get().handleGameEnded);
    echoService.off('game.timeout', get().handleGameTimeout);

    console.log('Game WebSocket listeners cleaned up');
  },

  // Game invitation system
  sendGameInvite: async (conversationId: number, participantId: number) => {
    set({ isCreatingGame: true, gameError: null });

    try {
      // Use the new invitation API
      const response = await fetch(`${API_BASE_URL}/game-invitation/conversations/${conversationId}/games/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: '邀請你玩剪刀石頭布！',
          best_of: 3,
          round_time_limit_sec: 10,
          expires_in_minutes: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const invitation = data.data as GameInvitation;

      // Add to sent invitations
      set(state => ({
        sentInvitations: [invitation, ...state.sentInvitations],
        isCreatingGame: false,
      }));

      return invitation;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send game invitation';
      set({
        gameError: errorMessage,
        isCreatingGame: false,
      });
      throw error;
    }
  },

  // Game flow actions
  startGame: async (conversationId: number, participantId: number) => {
    set({ isCreatingGame: true, gameError: null });

    try {
      const response = await fetch(`${API_BASE_URL}/games/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          participant_id: participantId,
          best_of: 3, // Always best of 3
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const gameSession = data.data;

      set({
        currentGame: gameSession,
        isGameModalVisible: true,
        roundTimeLeft: 10, // 10 seconds per round
        gameTimeLeft: 60, // 60 seconds total game timeout
        isCreatingGame: false,
      });

      // Start timers
      get().updateRoundTimer();
      get().updateGameTimer();

    } catch (error) {
      set({
        gameError: error instanceof Error ? error.message : 'Failed to start game',
        isCreatingGame: false,
      });
      throw error;
    }
  },

  acceptGameInvitation: async (invitationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/game-invitation/game-invitations/${invitationId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const gameSession = data.data.game_session;

      // Remove from pending invitations and start game
      set(state => ({
        pendingInvitations: state.pendingInvitations.filter(inv => inv.id !== invitationId),
        currentGame: gameSession,
        isGameModalVisible: true,
        roundTimeLeft: 10,
        gameTimeLeft: 60,
      }));

      // Start timers
      get().updateRoundTimer();
      get().updateGameTimer();

    } catch (error) {
      console.error('Failed to accept game invitation:', error);
      set({
        gameError: error instanceof Error ? error.message : 'Failed to accept game invitation'
      });
      throw error;
    }
  },

  declineGameInvitation: async (invitationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/game-invitation/game-invitations/${invitationId}/decline`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Remove from pending invitations
      set(state => ({
        pendingInvitations: state.pendingInvitations.filter(inv => inv.id !== invitationId)
      }));

    } catch (error) {
      console.error('Failed to decline game invitation:', error);
      set({
        gameError: error instanceof Error ? error.message : 'Failed to decline game invitation'
      });
      throw error;
    }
  },

  makeMove: async (choice: GameChoice) => {
    const { currentGame } = get();
    if (!currentGame) return;

    set({ isSubmittingChoice: true, selectedChoice: choice });

    try {
      // Send move via WebSocket first
      const success = echoService.sendGameMove(
        currentGame.id,
        currentGame.current_round,
        choice,
        1 // TODO: Get current user ID from auth store
      );

      if (!success) {
        // Fallback to HTTP
        const response = await fetch(`${API_BASE_URL}/sessions/${currentGame.id}/moves`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_AUTH_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            round: currentGame.current_round,
            move: choice,
            client_nonce: `move-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

    } catch (error) {
      set({
        gameError: error instanceof Error ? error.message : 'Failed to make move',
        isSubmittingChoice: false,
        selectedChoice: null,
      });
      throw error;
    }
  },

  forfeitGame: async () => {
    const { currentGame } = get();
    if (!currentGame) return;

    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${currentGame.id}/abandon`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      set({
        currentGame: null,
        isGameModalVisible: false,
        selectedChoice: null,
        isSubmittingChoice: false,
      });

      get().clearTimers();

    } catch (error) {
      console.error('Failed to forfeit game:', error);
      throw error;
    }
  },

  // UI actions
  showGameModal: () => set({ isGameModalVisible: true }),
  hideGameModal: () => {
    set({
      isGameModalVisible: false,
      selectedChoice: null,
      isSubmittingChoice: false,
    });
    get().clearTimers();
  },

  setSelectedChoice: (choice: GameChoice | null) => set({ selectedChoice: choice }),

  // WebSocket event handlers
  handleGameInviteReceived: (event: any) => {
    // New GameInvitationSent event structure
    const invitation: GameInvitation = {
      id: event.invitation_id?.toString() || event.id?.toString(),
      conversation_id: event.conversation_id,
      from_user_id: event.from_user_id,
      to_user_id: event.to_user_id,
      expires_at: event.expires_at,
      created_at: event.created_at,
    };

    set(state => ({
      pendingInvitations: [invitation, ...state.pendingInvitations]
    }));

    // 通過通知管理器處理 WebSocket 通知顯示
    notificationManager.handleWebSocketNotification({
      id: invitation.id,
      type: 'game_invite',
      title: '🎮 遊戲邀請！',
      body: `${event.from_user_name || '有人'} 邀請你玩剪刀石頭布！`,
      data: {
        invitation,
        conversationId: invitation.conversation_id,
        senderId: invitation.from_user_id,
      },
      conversationId: invitation.conversation_id,
      senderId: invitation.from_user_id,
    });

    console.log('Game invitation received via WebSocket:', invitation);
  },

  handleGameInviteAccepted: (event: any) => {
    // New GameInvitationAccepted event - remove from sent invitations
    set(state => ({
      sentInvitations: state.sentInvitations.filter(inv =>
        inv.id !== event.invitation_id?.toString()
      )
    }));

    console.log('Game invitation accepted:', event);
  },

  handleGameInviteDeclined: (event: any) => {
    // New GameInvitationDeclined event - remove from sent invitations
    set(state => ({
      sentInvitations: state.sentInvitations.filter(inv =>
        inv.id !== event.invitation_id?.toString()
      )
    }));

    console.log('Game invitation declined:', event);
  },

  handleGameStarted: (event: any) => {
    // Backend GameStarted event when game is accepted
    const gameSession = event.gameSession || event;

    set(state => ({
      // Remove corresponding invitation from both pending and sent lists
      pendingInvitations: state.pendingInvitations.filter(inv =>
        inv.conversation_id !== gameSession.conversation_id
      ),
      sentInvitations: state.sentInvitations.filter(inv =>
        inv.conversation_id !== gameSession.conversation_id
      ),
      // Set current game
      currentGame: gameSession,
      isGameModalVisible: true,
      roundTimeLeft: gameSession.round_time_limit_sec || 10,
      gameTimeLeft: 60,
      selectedChoice: null,
      isSubmittingChoice: false,
    }));

    get().updateRoundTimer();
    get().updateGameTimer();

    console.log('Game started:', gameSession);
  },

  handleGameMove: (event: any) => {
    const { currentGame } = get();
    if (!currentGame || currentGame.id !== event.game_session_id) return;

    // Update current round with the move
    const updatedRounds = currentGame.rounds.map(round => {
      if (round.round_number === event.round_number) {
        return {
          ...round,
          [`player${event.player_id === currentGame.initiator_id ? '1' : '2'}_choice`]: event.choice,
        };
      }
      return round;
    });

    set({
      currentGame: {
        ...currentGame,
        rounds: updatedRounds,
      },
      isSubmittingChoice: false,
    });
  },

  handleGameEnded: (event: any) => {
    const { currentGame, gameHistory } = get();
    if (!currentGame || currentGame.id !== event.game_session_id) return;

    const completedGame = {
      ...currentGame,
      state: 'completed' as GameState,
      winner_id: event.winner_id,
      final_scores: event.final_scores,
      completed_at: event.completed_at,
    };

    set({
      currentGame: completedGame,
      gameHistory: [completedGame, ...gameHistory],
      roundTimeLeft: 0,
      gameTimeLeft: 0,
    });

    get().clearTimers();

    // Auto-hide modal after 5 seconds
    setTimeout(() => {
      get().hideGameModal();
    }, 5000);
  },

  handleGameTimeout: (event: any) => {
    const { currentGame } = get();
    if (!currentGame || currentGame.id !== event.game_session_id) return;

    set({
      currentGame: {
        ...currentGame,
        state: 'cancelled',
      },
      gameError: '遊戲超時',
    });

    get().clearTimers();
  },

  // Timer management
  updateRoundTimer: () => {
    const intervalId = setInterval(() => {
      const { roundTimeLeft } = get();
      if (roundTimeLeft <= 0) {
        clearInterval(intervalId);
        return;
      }
      set({ roundTimeLeft: roundTimeLeft - 1 });
    }, 1000);
  },

  updateGameTimer: () => {
    const intervalId = setInterval(() => {
      const { gameTimeLeft } = get();
      if (gameTimeLeft <= 0) {
        clearInterval(intervalId);
        get().setGameError('遊戲超時');
        return;
      }
      set({ gameTimeLeft: gameTimeLeft - 1 });
    }, 1000);
  },

  clearTimers: () => {
    // Note: In a real implementation, we'd need to track interval IDs
    // For now, this is a placeholder
  },

  // Error management
  setGameError: (error: string | null) => set({ gameError: error }),
  clearGameError: () => set({ gameError: null }),

  // Game logic helpers
  determineRoundWinner: (choice1: GameChoice, choice2: GameChoice): 'player1' | 'player2' | 'tie' => {
    if (choice1 === choice2) return 'tie';

    const winConditions: Record<GameChoice, GameChoice> = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper',
    };

    return winConditions[choice1] === choice2 ? 'player1' : 'player2';
  },

  getChoiceEmoji: (choice: GameChoice): string => {
    const emojis: Record<GameChoice, string> = {
      rock: '✊',
      paper: '✋',
      scissors: '✌️',
    };
    return emojis[choice];
  },

  getChoiceDisplayName: (choice: GameChoice): string => {
    const names: Record<GameChoice, string> = {
      rock: '石頭',
      paper: '布',
      scissors: '剪刀',
    };
    return names[choice];
  },
}));