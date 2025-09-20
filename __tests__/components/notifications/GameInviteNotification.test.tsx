/**
 * GameInviteNotification Component Tests
 * 遊戲邀請通知組件測試
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { GameInviteNotification } from '@/components/notifications/GameInviteNotification';
import { NotificationData } from '@/services/notifications/NotificationManager';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const mockNotification: NotificationData = {
  id: 'test-invite-123',
  type: 'game_invite',
  title: '🎮 遊戲邀請！',
  body: '測試用戶邀請你玩剪刀石頭布！',
  data: {
    invitation: {
      id: 'invite-123',
      conversation_id: 1,
      from_user_id: 2,
      to_user_id: 1,
      expires_at: '2024-01-01T12:00:00Z',
      created_at: '2024-01-01T11:55:00Z',
    },
    senderName: '測試用戶',
    avatarUrl: 'https://example.com/avatar.jpg',
    conversationId: 1,
    senderId: 2,
  },
  conversationId: 1,
  senderId: 2,
  source: 'websocket',
  timestamp: Date.now(),
};

describe('GameInviteNotification', () => {
  it('renders game invite notification correctly', () => {
    const { getByTestId, getByText } = render(
      <GameInviteNotification notification={mockNotification} />
    );

    expect(getByTestId('game-invite-notification')).toBeTruthy();
    expect(getByText('🎮 遊戲邀請！')).toBeTruthy();
    expect(getByText('測試用戶邀請你玩剪刀石頭布！')).toBeTruthy();
  });

  it('displays game details correctly', () => {
    const { getByText } = render(
      <GameInviteNotification notification={mockNotification} />
    );

    expect(getByText('3局2勝制')).toBeTruthy();
    expect(getByText('每回合10秒限時')).toBeTruthy();
    expect(getByText('5分鐘內有效')).toBeTruthy();
  });

  it('shows action buttons', () => {
    const { getByTestId } = render(
      <GameInviteNotification notification={mockNotification} />
    );

    expect(getByTestId('game-invite-notification-accept-action')).toBeTruthy();
    expect(getByTestId('game-invite-notification-decline-action')).toBeTruthy();
  });

  it('calls onAccept when accept button is pressed', async () => {
    const mockOnAccept = jest.fn();
    const { getByTestId } = render(
      <GameInviteNotification
        notification={mockNotification}
        onAccept={mockOnAccept}
      />
    );

    fireEvent.press(getByTestId('game-invite-notification-accept-action'));

    await waitFor(() => {
      expect(mockOnAccept).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onDecline when decline button is pressed', async () => {
    const mockOnDecline = jest.fn();
    const { getByTestId } = render(
      <GameInviteNotification
        notification={mockNotification}
        onDecline={mockOnDecline}
      />
    );

    fireEvent.press(getByTestId('game-invite-notification-decline-action'));

    await waitFor(() => {
      expect(mockOnDecline).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onDismiss when close button is pressed', async () => {
    const mockOnDismiss = jest.fn();
    const { getByTestId } = render(
      <GameInviteNotification
        notification={mockNotification}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.press(getByTestId('game-invite-notification-close'));

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  it('displays source indicator correctly for WebSocket notifications', () => {
    const { getByText } = render(
      <GameInviteNotification
        notification={{ ...mockNotification, source: 'websocket' }}
      />
    );

    expect(getByText('即時')).toBeTruthy();
  });

  it('displays source indicator correctly for Push notifications', () => {
    const { getByText } = render(
      <GameInviteNotification
        notification={{ ...mockNotification, source: 'push' }}
      />
    );

    expect(getByText('推送')).toBeTruthy();
  });

  it('displays avatar when provided', () => {
    const { getByTestId } = render(
      <GameInviteNotification notification={mockNotification} />
    );

    expect(getByTestId('game-invite-notification-avatar')).toBeTruthy();
  });

  it('handles notification without avatar gracefully', () => {
    const notificationWithoutAvatar = {
      ...mockNotification,
      data: {
        ...mockNotification.data,
        avatarUrl: undefined,
      },
    };

    const { queryByTestId } = render(
      <GameInviteNotification notification={notificationWithoutAvatar} />
    );

    expect(queryByTestId('game-invite-notification-avatar')).toBeNull();
  });

  it('auto-dismisses after 10 seconds', async () => {
    jest.useFakeTimers();
    const mockOnDismiss = jest.fn();

    render(
      <GameInviteNotification
        notification={mockNotification}
        onDismiss={mockOnDismiss}
      />
    );

    // Fast-forward 10 seconds
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });

  it('applies custom testID when provided', () => {
    const customTestID = 'custom-game-invite';
    const { getByTestId } = render(
      <GameInviteNotification
        notification={mockNotification}
        testID={customTestID}
      />
    );

    expect(getByTestId(customTestID)).toBeTruthy();
  });
});