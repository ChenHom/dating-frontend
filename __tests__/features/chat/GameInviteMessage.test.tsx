/**
 * GameInviteMessage Component Tests
 * 遊戲邀請訊息組件測試
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { GameInviteMessage, GameInviteMessageData } from '@/features/chat/components/GameInviteMessage';
import dayjs from 'dayjs';

// Mock data
const mockGameInviteMessage: GameInviteMessageData = {
  id: 1,
  type: 'game_invite',
  game_session_id: 123,
  conversation_id: 1,
  sender_id: 2,
  content: '邀請你玩剪刀石頭布',
  created_at: dayjs().subtract(1, 'minute').toISOString(),
  expires_at: dayjs().add(5, 'minutes').toISOString(),
  status: 'pending',
  sender: {
    id: 2,
    name: 'Test User',
    profile: {
      display_name: 'Test Display Name',
      primary_photo_url: 'https://example.com/avatar.jpg',
    },
  },
};

describe('GameInviteMessage', () => {
  const mockOnAccept = jest.fn();
  const mockOnDecline = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render game invite message correctly', () => {
      const { getByText, getByTestId } = render(
        <GameInviteMessage
          message={mockGameInviteMessage}
          isFromCurrentUser={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          currentUserId={1}
          testID="test-game-invite"
        />
      );

      expect(getByText('剪刀石頭布邀請')).toBeTruthy();
      expect(getByText('Test Display Name 邀請你')).toBeTruthy();
      expect(getByText('3局2勝制')).toBeTruthy();
      expect(getByText('每回合10秒限時')).toBeTruthy();
      expect(getByText('等待你的回應')).toBeTruthy();
      expect(getByTestId('test-game-invite')).toBeTruthy();
    });

    it('should render avatar when provided', () => {
      const { getByTestId } = render(
        <GameInviteMessage
          message={mockGameInviteMessage}
          isFromCurrentUser={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          testID="test-game-invite"
        />
      );

      expect(getByTestId('test-game-invite-avatar')).toBeTruthy();
    });

    it('should not render avatar for current user messages', () => {
      const { queryByTestId } = render(
        <GameInviteMessage
          message={mockGameInviteMessage}
          isFromCurrentUser={true}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          testID="test-game-invite"
        />
      );

      expect(queryByTestId('test-game-invite-avatar')).toBeNull();
    });
  });

  describe('User Interactions', () => {
    it('should call onAccept when accept button is pressed', async () => {
      const { getByTestId } = render(
        <GameInviteMessage
          message={mockGameInviteMessage}
          isFromCurrentUser={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          testID="test-game-invite"
        />
      );

      const acceptButton = getByTestId('test-game-invite-accept');
      fireEvent.press(acceptButton);

      await waitFor(() => {
        expect(mockOnAccept).toHaveBeenCalledWith(123);
      });
    });

    it('should call onDecline when decline button is pressed', async () => {
      const { getByTestId } = render(
        <GameInviteMessage
          message={mockGameInviteMessage}
          isFromCurrentUser={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          testID="test-game-invite"
        />
      );

      const declineButton = getByTestId('test-game-invite-decline');
      fireEvent.press(declineButton);

      await waitFor(() => {
        expect(mockOnDecline).toHaveBeenCalledWith(123);
      });
    });
  });

  describe('Message States', () => {
    it('should show action buttons for pending invites from others', () => {
      const { getByTestId } = render(
        <GameInviteMessage
          message={mockGameInviteMessage}
          isFromCurrentUser={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          testID="test-game-invite"
        />
      );

      expect(getByTestId('test-game-invite-accept')).toBeTruthy();
      expect(getByTestId('test-game-invite-decline')).toBeTruthy();
    });

    it('should not show action buttons for own messages', () => {
      const { queryByTestId } = render(
        <GameInviteMessage
          message={mockGameInviteMessage}
          isFromCurrentUser={true}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          testID="test-game-invite"
        />
      );

      expect(queryByTestId('test-game-invite-accept')).toBeNull();
      expect(queryByTestId('test-game-invite-decline')).toBeNull();
    });

    it('should not show action buttons for accepted invites', () => {
      const acceptedMessage = {
        ...mockGameInviteMessage,
        status: 'accepted' as const,
      };

      const { queryByTestId } = render(
        <GameInviteMessage
          message={acceptedMessage}
          isFromCurrentUser={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          testID="test-game-invite"
        />
      );

      expect(queryByTestId('test-game-invite-accept')).toBeNull();
      expect(queryByTestId('test-game-invite-decline')).toBeNull();
    });

    it('should show correct status for accepted invites', () => {
      const acceptedMessage = {
        ...mockGameInviteMessage,
        status: 'accepted' as const,
      };

      const { getByText } = render(
        <GameInviteMessage
          message={acceptedMessage}
          isFromCurrentUser={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          testID="test-game-invite"
        />
      );

      expect(getByText('已接受邀請')).toBeTruthy();
    });

    it('should show correct status for declined invites', () => {
      const declinedMessage = {
        ...mockGameInviteMessage,
        status: 'declined' as const,
      };

      const { getByText } = render(
        <GameInviteMessage
          message={declinedMessage}
          isFromCurrentUser={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          testID="test-game-invite"
        />
      );

      expect(getByText('已拒絕邀請')).toBeTruthy();
    });

    it('should show expired status for expired invites', () => {
      const expiredMessage = {
        ...mockGameInviteMessage,
        expires_at: dayjs().subtract(1, 'hour').toISOString(),
      };

      const { getByText, queryByTestId } = render(
        <GameInviteMessage
          message={expiredMessage}
          isFromCurrentUser={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          testID="test-game-invite"
        />
      );

      expect(getByText('邀請已過期')).toBeTruthy();
      expect(queryByTestId('test-game-invite-accept')).toBeNull();
      expect(queryByTestId('test-game-invite-decline')).toBeNull();
    });
  });

  describe('Timestamp Display', () => {
    it('should display message timestamp', () => {
      const { getByTestId } = render(
        <GameInviteMessage
          message={mockGameInviteMessage}
          isFromCurrentUser={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          testID="test-game-invite"
        />
      );

      const timeElement = getByTestId('test-game-invite-time');
      expect(timeElement).toBeTruthy();
    });

    it('should display expiry time for pending invites', () => {
      const { getByText } = render(
        <GameInviteMessage
          message={mockGameInviteMessage}
          isFromCurrentUser={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          testID="test-game-invite"
        />
      );

      expect(getByText(/到期/)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper testIDs for testing', () => {
      const { getByTestId } = render(
        <GameInviteMessage
          message={mockGameInviteMessage}
          isFromCurrentUser={false}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          testID="test-game-invite"
        />
      );

      expect(getByTestId('test-game-invite')).toBeTruthy();
      expect(getByTestId('test-game-invite-accept')).toBeTruthy();
      expect(getByTestId('test-game-invite-decline')).toBeTruthy();
      expect(getByTestId('test-game-invite-time')).toBeTruthy();
    });
  });
});