/**
 * Match Store Tests (TDD) - Fixed
 * 測試配對系統狀態管理
 */

import { 
  Match, 
  LikeResponse, 
  User 
} from '@/lib/types';

// Mock API client
const mockApiClient = {
  likeUser: jest.fn(),
  passUser: jest.fn(),
  getMatches: jest.fn(),
  openMatch: jest.fn(),
};

jest.mock('../../services/api/client', () => ({
  apiClient: mockApiClient,
}));

import { useMatchStore } from '../match';

describe('Match Store (Fixed)', () => {
  beforeEach(() => {
    // Reset store state
    useMatchStore.setState({
      matches: [],
      newMatch: null,
      dailyLikes: 0,
      likeLimit: 30,
      lastLikeReset: new Date().toDateString(),
      isLoading: false,
      error: null,
    });
    
    // Reset mocks
    Object.values(mockApiClient).forEach((mockFn: any) => {
      if (typeof mockFn === 'function') {
        mockFn.mockClear();
      }
    });
  });

  describe('Like System', () => {
    test('should handle successful like without match', async () => {
      // Arrange
      const mockResponse: LikeResponse = {
        liked: true,
        is_match: false,
      };
      
      mockApiClient.likeUser.mockResolvedValue(mockResponse);
      
      // Act
      const result = await useMatchStore.getState().likeUser(123);
      
      // Assert
      expect(mockApiClient.likeUser).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockResponse);
      
      const state = useMatchStore.getState();
      expect(state.dailyLikes).toBe(1);
      expect(state.error).toBeNull();
    });

    test('should handle successful like with match', async () => {
      // Arrange
      const mockUser: User = {
        id: 123,
        name: 'Test User',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        profile: {
          id: 123,
          user_id: 123,
          display_name: 'Test User',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      };
      
      const mockResponse: LikeResponse = {
        liked: true,
        is_match: true,
        matched_user: mockUser,
      };
      
      mockApiClient.likeUser.mockResolvedValue(mockResponse);
      
      // Act
      const result = await useMatchStore.getState().likeUser(123);
      
      // Assert
      expect(result).toEqual(mockResponse);
      
      const state = useMatchStore.getState();
      expect(state.dailyLikes).toBe(1);
      expect(state.newMatch).toEqual(mockUser);
    });

    test('should enforce daily like limit', async () => {
      // Arrange - Set likes to limit
      useMatchStore.setState({ 
        dailyLikes: 30, 
        likeLimit: 30 
      });
      
      // Act & Assert
      await expect(useMatchStore.getState().likeUser(123)).rejects.toThrow('已達到每日點讚限制');
      expect(mockApiClient.likeUser).not.toHaveBeenCalled();
    });

    test('should reset daily likes on new day', () => {
      // Arrange - Set old date and max likes
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      useMatchStore.setState({
        dailyLikes: 30,
        lastLikeReset: yesterday.toDateString(),
      });
      
      // Act
      useMatchStore.getState().checkAndResetDailyLikes();
      
      // Assert
      const state = useMatchStore.getState();
      expect(state.dailyLikes).toBe(0);
      expect(state.lastLikeReset).toBe(new Date().toDateString());
    });

    test('should handle like error', async () => {
      // Arrange
      const errorMessage = 'User not found';
      mockApiClient.likeUser.mockRejectedValue(new Error(errorMessage));
      
      // Act
      await expect(useMatchStore.getState().likeUser(123)).rejects.toThrow(errorMessage);
      
      // Assert
      const state = useMatchStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.dailyLikes).toBe(0); // Should not increment on error
    });
  });

  describe('Pass System', () => {
    test('should handle successful pass', async () => {
      // Arrange
      mockApiClient.passUser.mockResolvedValue(undefined);
      
      // Act
      await useMatchStore.getState().passUser(123);
      
      // Assert
      expect(mockApiClient.passUser).toHaveBeenCalledWith(123);
      
      const state = useMatchStore.getState();
      expect(state.error).toBeNull();
    });

    test('should handle pass error', async () => {
      // Arrange
      const errorMessage = 'Pass failed';
      mockApiClient.passUser.mockRejectedValue(new Error(errorMessage));
      
      // Act & Assert
      await expect(useMatchStore.getState().passUser(123)).rejects.toThrow(errorMessage);
      
      const state = useMatchStore.getState();
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('Match Management', () => {
    test('should load matches successfully', async () => {
      // Arrange
      const mockMatches: Match[] = [
        {
          id: 1,
          user1_id: 1,
          user2_id: 2,
          matched_at: '2023-01-01T12:00:00Z',
          is_opened: false,
          user1: {
            id: 1,
            name: 'User 1',
            email: 'user1@example.com',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
            profile: {
              id: 1,
              user_id: 1,
              display_name: 'User 1',
              is_active: true,
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
            },
          },
          user2: {
            id: 2,
            name: 'User 2',
            email: 'user2@example.com',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
            profile: {
              id: 2,
              user_id: 2,
              display_name: 'User 2',
              is_active: true,
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
            },
          },
        },
      ];
      
      mockApiClient.getMatches.mockResolvedValue(mockMatches);
      
      // Act
      await useMatchStore.getState().loadMatches();
      
      // Assert
      expect(mockApiClient.getMatches).toHaveBeenCalled();
      
      const state = useMatchStore.getState();
      expect(state.matches).toEqual(mockMatches);
      expect(state.error).toBeNull();
    });

    test('should open a match', async () => {
      // Arrange
      const mockMatch: Match = {
        id: 1,
        user1_id: 1,
        user2_id: 2,
        matched_at: '2023-01-01T12:00:00Z',
        is_opened: true,
        opened_at: '2023-01-01T13:00:00Z',
        user1: {
          id: 1,
          name: 'User 1',
          email: 'user1@example.com',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          profile: {
            id: 1,
            user_id: 1,
            display_name: 'User 1',
            is_active: true,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          },
        },
        user2: {
          id: 2,
          name: 'User 2',
          email: 'user2@example.com',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          profile: {
            id: 2,
            user_id: 2,
            display_name: 'User 2',
            is_active: true,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          },
        },
      };
      
      // Set initial state with unopened match
      useMatchStore.setState({
        matches: [{
          ...mockMatch,
          is_opened: false,
        }],
      });
      
      mockApiClient.openMatch.mockResolvedValue(mockMatch);
      
      // Act
      await useMatchStore.getState().openMatch(1);
      
      // Assert
      expect(mockApiClient.openMatch).toHaveBeenCalledWith(1);
      
      const state = useMatchStore.getState();
      expect(state.matches[0]?.is_opened).toBe(true);
      expect(state.matches[0]?.opened_at).toBe('2023-01-01T13:00:00Z');
    });

    test('should clear new match after viewing', () => {
      // Arrange
      const mockUser: User = {
        id: 123,
        name: 'Test User',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        profile: {
          id: 123,
          user_id: 123,
          display_name: 'Test User',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      };
      
      useMatchStore.setState({ newMatch: mockUser });
      
      // Act
      useMatchStore.getState().clearNewMatch();
      
      // Assert
      const state = useMatchStore.getState();
      expect(state.newMatch).toBeNull();
    });
  });

  describe('Loading States', () => {
    test('should set loading state during like operation', async () => {
      // Arrange
      let resolvePromise: (value: any) => void;
      const likePromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.likeUser.mockReturnValue(likePromise);
      
      // Act
      const likeOperation = useMatchStore.getState().likeUser(123);
      
      // Assert - loading should be true
      expect(useMatchStore.getState().isLoading).toBe(true);
      
      // Complete the promise
      resolvePromise!({ liked: true, is_match: false });
      
      await likeOperation;
      
      // Assert - loading should be false
      expect(useMatchStore.getState().isLoading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should clear error when performing successful operation', async () => {
      // Arrange - Set initial error
      useMatchStore.setState({ error: 'Previous error' });
      
      mockApiClient.likeUser.mockResolvedValue({ 
        liked: true, 
        is_match: false 
      });
      
      // Act
      await useMatchStore.getState().likeUser(123);
      
      // Assert
      const state = useMatchStore.getState();
      expect(state.error).toBeNull();
    });

    test('should handle network errors gracefully', async () => {
      // Arrange
      const networkError = new Error('Network request failed');
      mockApiClient.getMatches.mockRejectedValue(networkError);
      
      // Act
      await useMatchStore.getState().loadMatches();
      
      // Assert
      const state = useMatchStore.getState();
      expect(state.error).toBe('Network request failed');
      expect(state.isLoading).toBe(false);
    });
  });
});