/**
 * Feed Store Tests (TDD)
 * 測試探索頁面狀態管理
 */

import { FeedUser } from '../../lib/types';

// Mock API client
const mockApiClient = {
  getUserFeed: jest.fn(),
  likeUser: jest.fn(),
  passUser: jest.fn(),
};

jest.mock('../../services/api/client', () => ({
  apiClient: mockApiClient,
}));

// Import after mocking
import { useFeedStore } from '../feed';

describe('Feed Store', () => {
  beforeEach(() => {
    // Reset store state
    useFeedStore.setState({
      users: [],
      currentIndex: 0,
      isLoading: false,
      error: null,
      hasMoreUsers: true,
    });
    
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should have correct initial state', () => {
      const state = useFeedStore.getState();
      
      expect(state.users).toEqual([]);
      expect(state.currentIndex).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.hasMoreUsers).toBe(true);
    });
  });

  describe('Load Feed', () => {
    test('should load users successfully', async () => {
      // Arrange
      const mockUsers: FeedUser[] = [
        {
          id: 1,
          profile: {
            id: 1,
            user_id: 1,
            display_name: 'Alice',
            bio: 'Love traveling',
            age: 25,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          photos: [],
        },
        {
          id: 2,
          profile: {
            id: 2,
            user_id: 2,
            display_name: 'Bob',
            bio: 'Fitness enthusiast',
            age: 28,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          photos: [],
        },
      ];

      mockApiClient.getUserFeed.mockResolvedValue(mockUsers);

      // Act
      await useFeedStore.getState().loadFeed();

      // Assert
      const state = useFeedStore.getState();
      expect(state.users).toEqual(mockUsers);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockApiClient.getUserFeed).toHaveBeenCalled();
    });

    test('should handle load feed failure', async () => {
      // Arrange
      const errorMessage = 'Failed to load feed';
      mockApiClient.getUserFeed.mockRejectedValue(new Error(errorMessage));

      // Act
      await useFeedStore.getState().loadFeed();

      // Assert
      const state = useFeedStore.getState();
      expect(state.users).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    test('should set loading state during fetch', async () => {
      // Arrange
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.getUserFeed.mockReturnValue(promise);

      // Act
      const loadPromise = useFeedStore.getState().loadFeed();
      
      // Assert loading state
      expect(useFeedStore.getState().isLoading).toBe(true);
      
      // Resolve promise
      resolvePromise!([]);
      await loadPromise;
      
      // Assert final state
      expect(useFeedStore.getState().isLoading).toBe(false);
    });
  });

  describe('Like User', () => {
    test('should like user and move to next', async () => {
      // Arrange
      const mockUsers: FeedUser[] = [
        {
          id: 1,
          profile: {
            id: 1,
            user_id: 1,
            display_name: 'Alice',
            bio: 'Love traveling',
            age: 25,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          photos: [],
        },
        {
          id: 2,
          profile: {
            id: 2,
            user_id: 2,
            display_name: 'Bob',
            bio: 'Fitness enthusiast',
            age: 28,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          photos: [],
        },
      ];

      useFeedStore.setState({ users: mockUsers, currentIndex: 0 });
      
      const mockLikeResponse = { liked: true, is_match: false };
      mockApiClient.likeUser.mockResolvedValue(mockLikeResponse);

      // Act
      const result = await useFeedStore.getState().likeUser(1);

      // Assert
      expect(result).toEqual(mockLikeResponse);
      expect(useFeedStore.getState().currentIndex).toBe(1);
      expect(mockApiClient.likeUser).toHaveBeenCalledWith(1);
    });

    test('should handle like user failure', async () => {
      // Arrange
      const mockUsers: FeedUser[] = [
        {
          id: 1,
          profile: {
            id: 1,
            user_id: 1,
            display_name: 'Alice',
            bio: 'Love traveling',
            age: 25,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          photos: [],
        },
      ];

      useFeedStore.setState({ users: mockUsers, currentIndex: 0 });
      
      const errorMessage = 'Like failed';
      mockApiClient.likeUser.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(useFeedStore.getState().likeUser(1)).rejects.toThrow(errorMessage);
      expect(useFeedStore.getState().currentIndex).toBe(0); // Should not increment on error
    });
  });

  describe('Pass User', () => {
    test('should pass user and move to next', async () => {
      // Arrange
      const mockUsers: FeedUser[] = [
        {
          id: 1,
          profile: {
            id: 1,
            user_id: 1,
            display_name: 'Alice',
            bio: 'Love traveling',
            age: 25,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          photos: [],
        },
        {
          id: 2,
          profile: {
            id: 2,
            user_id: 2,
            display_name: 'Bob',
            bio: 'Fitness enthusiast',
            age: 28,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          photos: [],
        },
      ];

      useFeedStore.setState({ users: mockUsers, currentIndex: 0 });
      mockApiClient.passUser.mockResolvedValue(undefined);

      // Act
      await useFeedStore.getState().passUser(1);

      // Assert
      expect(useFeedStore.getState().currentIndex).toBe(1);
      expect(mockApiClient.passUser).toHaveBeenCalledWith(1);
    });

    test('should handle pass user failure', async () => {
      // Arrange
      const mockUsers: FeedUser[] = [
        {
          id: 1,
          profile: {
            id: 1,
            user_id: 1,
            display_name: 'Alice',
            bio: 'Love traveling',
            age: 25,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          photos: [],
        },
      ];

      useFeedStore.setState({ users: mockUsers, currentIndex: 0 });
      
      const errorMessage = 'Pass failed';
      mockApiClient.passUser.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(useFeedStore.getState().passUser(1)).rejects.toThrow(errorMessage);
      expect(useFeedStore.getState().currentIndex).toBe(0); // Should not increment on error
    });
  });

  describe('Navigation', () => {
    test('should get current user correctly', () => {
      // Arrange
      const mockUsers: FeedUser[] = [
        {
          id: 1,
          profile: {
            id: 1,
            user_id: 1,
            display_name: 'Alice',
            bio: 'Love traveling',
            age: 25,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          photos: [],
        },
        {
          id: 2,
          profile: {
            id: 2,
            user_id: 2,
            display_name: 'Bob',
            bio: 'Fitness enthusiast',
            age: 28,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          photos: [],
        },
      ];

      useFeedStore.setState({ users: mockUsers, currentIndex: 1 });

      // Act
      const currentUser = useFeedStore.getState().getCurrentUser();

      // Assert
      expect(currentUser).toEqual(mockUsers[1]);
    });

    test('should return null when no current user', () => {
      // Arrange
      useFeedStore.setState({ users: [], currentIndex: 0 });

      // Act
      const currentUser = useFeedStore.getState().getCurrentUser();

      // Assert
      expect(currentUser).toBeNull();
    });

    test('should check if more users are available', () => {
      // Arrange
      const mockUsers: FeedUser[] = [
        {
          id: 1,
          profile: {
            id: 1,
            user_id: 1,
            display_name: 'Alice',
            bio: 'Love traveling',
            age: 25,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          photos: [],
        },
      ];

      // Test with more users available
      useFeedStore.setState({ users: mockUsers, currentIndex: 0 });
      expect(useFeedStore.getState().hasMoreCards()).toBe(true);

      // Test with no more users
      useFeedStore.setState({ users: mockUsers, currentIndex: 1 });
      expect(useFeedStore.getState().hasMoreCards()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should clear error', () => {
      // Arrange
      useFeedStore.setState({ error: 'Some error' });

      // Act
      useFeedStore.getState().clearError();

      // Assert
      expect(useFeedStore.getState().error).toBeNull();
    });
  });
});