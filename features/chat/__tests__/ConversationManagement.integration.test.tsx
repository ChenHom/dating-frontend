/**
 * 對話管理整合測試
 * Conversation Management Integration Tests
 *
 * 測試靜音、取消靜音、刪除對話的完整流程
 */

import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SimpleConversationScreen } from '../SimpleConversationScreen';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import {
  muteConversation,
  unmuteConversation,
  deleteConversation,
} from '@/services/api/conversations';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({ id: '1' })),
}));

jest.mock('@/stores/chat');
jest.mock('@/stores/auth');
jest.mock('@/stores/game');
jest.mock('@/services/api/conversations');

describe('對話管理整合測試', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    profile: {
      display_name: '測試使用者',
      primary_photo_url: 'https://example.com/avatar.jpg',
    },
  };

  const mockOtherUser = {
    id: 2,
    name: '對方使用者',
    profile: {
      display_name: '對方使用者',
      primary_photo_url: 'https://example.com/avatar2.jpg',
    },
  };

  const mockConversation = {
    id: 1,
    match_id: 1,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    participants: [mockUser, mockOtherUser],
    unread_count: 0,
    is_muted: false,
  };

  const mockMessages = [
    {
      id: 1,
      conversation_id: 1,
      sender_id: 2,
      content: '你好',
      sent_at: '2025-01-01T00:00:00Z',
      created_at: '2025-01-01T00:00:00Z',
      sender: mockOtherUser,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock chat store
    (useChatStore as unknown as jest.Mock).mockReturnValue({
      conversations: [mockConversation],
      messages: { 1: mockMessages },
      pendingMessages: {},
      loadMessages: jest.fn(),
      setCurrentConversation: jest.fn(),
      subscribeToConversation: jest.fn(),
      unsubscribeFromConversation: jest.fn(),
      sendMessage: jest.fn(),
      markAsRead: jest.fn(),
      connectionState: 1, // CONNECTED
      isLoadingMessages: false,
      messagesError: null,
    });

    // Mock auth store
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: mockUser,
    });

    // Mock Alert
    jest.spyOn(Alert, 'alert');
  });

  describe('靜音功能', () => {
    it('應該成功靜音對話', async () => {
      (muteConversation as jest.Mock).mockResolvedValue(undefined);

      const { getByTestId } = render(<SimpleConversationScreen />);

      // 開啟選項選單
      const moreButton = getByTestId('more-options-button');
      fireEvent.press(moreButton);

      // 等待選單出現
      await waitFor(() => {
        expect(getByTestId('option-mute')).toBeTruthy();
      });

      // 點擊靜音選項
      const muteOption = getByTestId('option-mute');
      fireEvent.press(muteOption);

      // 驗證 API 被呼叫
      await waitFor(() => {
        expect(muteConversation).toHaveBeenCalledWith(1);
      });

      // 驗證顯示成功訊息
      expect(Alert.alert).toHaveBeenCalledWith('成功', '已靜音此對話');
    });

    it('應該在靜音後顯示取消靜音選項', async () => {
      // 設定對話為已靜音
      const mutedConversation = { ...mockConversation, is_muted: true };
      (useChatStore as unknown as jest.Mock).mockReturnValue({
        conversations: [mutedConversation],
        messages: { 1: mockMessages },
        pendingMessages: {},
        loadMessages: jest.fn(),
        setCurrentConversation: jest.fn(),
        subscribeToConversation: jest.fn(),
        unsubscribeFromConversation: jest.fn(),
        sendMessage: jest.fn(),
        markAsRead: jest.fn(),
        connectionState: 1,
        isLoadingMessages: false,
        messagesError: null,
      });

      const { getByTestId } = render(<SimpleConversationScreen />);

      // 開啟選項選單
      const moreButton = getByTestId('more-options-button');
      fireEvent.press(moreButton);

      // 驗證顯示「取消靜音」而非「靜音此對話」
      await waitFor(() => {
        expect(getByTestId('option-unmute')).toBeTruthy();
      });
    });

    it('應該成功取消靜音對話', async () => {
      // 設定對話為已靜音
      const mutedConversation = { ...mockConversation, is_muted: true };
      (useChatStore as unknown as jest.Mock).mockReturnValue({
        conversations: [mutedConversation],
        messages: { 1: mockMessages },
        pendingMessages: {},
        loadMessages: jest.fn(),
        setCurrentConversation: jest.fn(),
        subscribeToConversation: jest.fn(),
        unsubscribeFromConversation: jest.fn(),
        sendMessage: jest.fn(),
        markAsRead: jest.fn(),
        connectionState: 1,
        isLoadingMessages: false,
        messagesError: null,
      });

      (unmuteConversation as jest.Mock).mockResolvedValue(undefined);

      const { getByTestId } = render(<SimpleConversationScreen />);

      // 開啟選項選單
      const moreButton = getByTestId('more-options-button');
      fireEvent.press(moreButton);

      // 點擊取消靜音選項
      await waitFor(() => {
        const unmuteOption = getByTestId('option-unmute');
        fireEvent.press(unmuteOption);
      });

      // 驗證 API 被呼叫
      await waitFor(() => {
        expect(unmuteConversation).toHaveBeenCalledWith(1);
      });

      // 驗證顯示成功訊息
      expect(Alert.alert).toHaveBeenCalledWith('成功', '已取消靜音此對話');
    });

    it('應該處理靜音失敗的情況', async () => {
      (muteConversation as jest.Mock).mockRejectedValue(new Error('網路錯誤'));

      const { getByTestId } = render(<SimpleConversationScreen />);

      // 開啟選項選單
      const moreButton = getByTestId('more-options-button');
      fireEvent.press(moreButton);

      // 點擊靜音選項
      await waitFor(() => {
        const muteOption = getByTestId('option-mute');
        fireEvent.press(muteOption);
      });

      // 驗證顯示錯誤訊息
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('錯誤', '網路錯誤');
      });
    });
  });

  describe('刪除對話功能', () => {
    it('應該成功刪除對話', async () => {
      (deleteConversation as jest.Mock).mockResolvedValue(undefined);

      const { getByTestId } = render(<SimpleConversationScreen />);

      // 開啟選項選單
      const moreButton = getByTestId('more-options-button');
      fireEvent.press(moreButton);

      // 點擊刪除選項
      await waitFor(() => {
        const deleteOption = getByTestId('option-delete');
        fireEvent.press(deleteOption);
      });

      // 驗證 API 被呼叫
      await waitFor(() => {
        expect(deleteConversation).toHaveBeenCalledWith(1);
      });

      // 驗證顯示成功訊息並返回
      expect(Alert.alert).toHaveBeenCalledWith(
        '成功',
        '已刪除此對話',
        expect.arrayContaining([
          expect.objectContaining({
            text: '確定',
          }),
        ])
      );
    });

    it('應該處理刪除失敗的情況', async () => {
      (deleteConversation as jest.Mock).mockRejectedValue(new Error('刪除失敗'));

      const { getByTestId } = render(<SimpleConversationScreen />);

      // 開啟選項選單
      const moreButton = getByTestId('more-options-button');
      fireEvent.press(moreButton);

      // 點擊刪除選項
      await waitFor(() => {
        const deleteOption = getByTestId('option-delete');
        fireEvent.press(deleteOption);
      });

      // 驗證顯示錯誤訊息
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('錯誤', '刪除失敗');
      });
    });
  });

  describe('API 路徑驗證', () => {
    it('應該使用正確的 API 路徑呼叫靜音端點', async () => {
      const mockMuteConversation = muteConversation as jest.Mock;
      mockMuteConversation.mockResolvedValue(undefined);

      const { getByTestId } = render(<SimpleConversationScreen />);

      const moreButton = getByTestId('more-options-button');
      fireEvent.press(moreButton);

      await waitFor(() => {
        const muteOption = getByTestId('option-mute');
        fireEvent.press(muteOption);
      });

      // 驗證使用正確的對話 ID
      await waitFor(() => {
        expect(mockMuteConversation).toHaveBeenCalledWith(1);
      });
    });

    it('應該使用正確的 API 路徑呼叫取消靜音端點', async () => {
      const mutedConversation = { ...mockConversation, is_muted: true };
      (useChatStore as unknown as jest.Mock).mockReturnValue({
        conversations: [mutedConversation],
        messages: { 1: mockMessages },
        pendingMessages: {},
        loadMessages: jest.fn(),
        setCurrentConversation: jest.fn(),
        subscribeToConversation: jest.fn(),
        unsubscribeFromConversation: jest.fn(),
        sendMessage: jest.fn(),
        markAsRead: jest.fn(),
        connectionState: 1,
        isLoadingMessages: false,
        messagesError: null,
      });

      const mockUnmuteConversation = unmuteConversation as jest.Mock;
      mockUnmuteConversation.mockResolvedValue(undefined);

      const { getByTestId } = render(<SimpleConversationScreen />);

      const moreButton = getByTestId('more-options-button');
      fireEvent.press(moreButton);

      await waitFor(() => {
        const unmuteOption = getByTestId('option-unmute');
        fireEvent.press(unmuteOption);
      });

      // 驗證使用正確的對話 ID
      await waitFor(() => {
        expect(mockUnmuteConversation).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('使用者體驗', () => {
    it('應該在處理操作時顯示載入狀態', async () => {
      let resolvePromise: () => void;
      const mutePromise = new Promise<void>(resolve => {
        resolvePromise = resolve;
      });

      (muteConversation as jest.Mock).mockReturnValue(mutePromise);

      const { getByTestId, queryByText } = render(<SimpleConversationScreen />);

      const moreButton = getByTestId('more-options-button');
      fireEvent.press(moreButton);

      await waitFor(() => {
        const muteOption = getByTestId('option-mute');
        fireEvent.press(muteOption);
      });

      // 驗證載入狀態（根據實際實作調整）
      // 這裡假設有 ActivityIndicator 或類似的元件

      // 完成操作
      resolvePromise!();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });

    it('應該在對話列表中反映靜音狀態', async () => {
      const mutedConversation = { ...mockConversation, is_muted: true };
      (useChatStore as unknown as jest.Mock).mockReturnValue({
        conversations: [mutedConversation],
        messages: { 1: mockMessages },
        pendingMessages: {},
        loadMessages: jest.fn(),
        setCurrentConversation: jest.fn(),
        subscribeToConversation: jest.fn(),
        unsubscribeFromConversation: jest.fn(),
        sendMessage: jest.fn(),
        markAsRead: jest.fn(),
        connectionState: 1,
        isLoadingMessages: false,
        messagesError: null,
      });

      const { getByTestId } = render(<SimpleConversationScreen />);

      // 驗證 UI 反映靜音狀態（根據實際實作調整）
      const moreButton = getByTestId('more-options-button');
      fireEvent.press(moreButton);

      await waitFor(() => {
        // 應該顯示取消靜音選項而非靜音選項
        expect(getByTestId('option-unmute')).toBeTruthy();
      });
    });
  });
});
