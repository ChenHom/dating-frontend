/**
 * Profile Integration Tests
 * 測試個人檔案完整用戶流程
 */

import { useProfileStore } from '@/stores/profile';
import { Profile, Photo, ProfileUpdateRequest } from '@/lib/types';

// Mock API client first
jest.mock('../../../services/api/client', () => ({
  apiClient: {
    getFullProfile: jest.fn(),
    updateProfileData: jest.fn(),
    uploadPhoto: jest.fn(),
    getPhotos: jest.fn(),
    updatePhoto: jest.fn(),
    deletePhoto: jest.fn(),
    setPrimaryPhoto: jest.fn(),
  },
}));

import { apiClient } from '@/services/api/client';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Profile Integration Flow', () => {
  beforeEach(() => {
    // Reset store state
    useProfileStore.setState({
      profile: null,
      photos: [],
      isLoading: false,
      error: null,
    });

    // Clear all mocks
    Object.values(mockApiClient).forEach((mockFn) => {
      mockFn.mockClear();
    });

    // Clear global mock responses
    (globalThis as any).clearMockApiResponses?.();
  });

  describe('Profile Creation and Update Flow', () => {
    test('should complete full profile creation flow', async () => {
      // Step 1: Load empty profile (new user)
      mockApiClient.getFullProfile.mockResolvedValue({
        id: 1,
        user_id: 1,
        display_name: '',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        photos: [],
      });

      await useProfileStore.getState().loadProfile();

      const initialState = useProfileStore.getState();
      expect(initialState.profile?.display_name).toBe('');
      expect(initialState.photos).toEqual([]);

      // Step 2: Update profile with basic information
      const profileUpdate: ProfileUpdateRequest = {
        display_name: 'John Doe',
        bio: 'Love hiking and photography',
        birth_date: '1990-05-15',
        gender: 'male',
        interested_in: 'female',
        location: 'San Francisco',
      };

      const updatedProfile: Profile = {
        id: 1,
        user_id: 1,
        display_name: 'John Doe',
        bio: 'Love hiking and photography',
        birth_date: '1990-05-15',
        age: 33,
        gender: 'male',
        interested_in: 'female',
        location: 'San Francisco',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T12:00:00Z',
      };

      mockApiClient.updateProfileData.mockResolvedValue(updatedProfile);

      await useProfileStore.getState().updateProfile(profileUpdate);

      const afterUpdateState = useProfileStore.getState();
      expect(afterUpdateState.profile).toEqual(updatedProfile);
      expect(afterUpdateState.error).toBeNull();

      // Verify API call
      expect(mockApiClient.updateProfileData).toHaveBeenCalledWith(profileUpdate);
    });

    test('should handle profile update validation errors', async () => {
      // Mock validation error from API
      const validationError = new Error('Display name is required');
      mockApiClient.updateProfileData.mockRejectedValue(validationError);

      const invalidUpdate: ProfileUpdateRequest = {
        display_name: '', // Invalid - empty
      };

      await useProfileStore.getState().updateProfile(invalidUpdate);

      const state = useProfileStore.getState();
      expect(state.error).toBe('Display name is required');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Photo Management Flow', () => {
    beforeEach(() => {
      // Set initial profile state
      useProfileStore.setState({
        profile: {
          id: 1,
          user_id: 1,
          display_name: 'John Doe',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        photos: [],
      });
    });

    test('should complete photo upload and management flow', async () => {
      // Step 1: Upload first photo
      const firstPhoto: Photo = {
        id: 1,
        user_id: 1,
        url: 'https://example.com/photo1.jpg',
        order: 1,
        is_primary: false,
        moderation_status: 'pending',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      mockApiClient.uploadPhoto.mockResolvedValue(firstPhoto);

      await useProfileStore.getState().uploadPhoto({
        image: 'base64-encoded-image-data',
        order: 1,
      });

      let state = useProfileStore.getState();
      expect(state.photos).toHaveLength(1);
      expect(state.photos[0]).toEqual(firstPhoto);

      // Step 2: Upload second photo
      const secondPhoto: Photo = {
        id: 2,
        user_id: 1,
        url: 'https://example.com/photo2.jpg',
        order: 2,
        is_primary: false,
        moderation_status: 'pending',
        created_at: '2023-01-01T01:00:00Z',
        updated_at: '2023-01-01T01:00:00Z',
      };

      mockApiClient.uploadPhoto.mockResolvedValue(secondPhoto);

      await useProfileStore.getState().uploadPhoto({
        image: 'base64-encoded-image-data-2',
        order: 2,
      });

      state = useProfileStore.getState();
      expect(state.photos).toHaveLength(2);

      // Step 3: Set first photo as primary
      const updatedProfile: Profile = {
        id: 1,
        user_id: 1,
        display_name: 'John Doe',
        primary_photo_url: 'https://example.com/photo1.jpg',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T02:00:00Z',
      };

      mockApiClient.setPrimaryPhoto.mockResolvedValue(updatedProfile);

      await useProfileStore.getState().setPrimaryPhoto(1);

      state = useProfileStore.getState();
      expect(state.profile).toEqual(updatedProfile);
      expect(state.photos.find(p => p.id === 1)?.is_primary).toBe(true);
      expect(state.photos.find(p => p.id === 2)?.is_primary).toBe(false);

      // Step 4: Delete second photo
      mockApiClient.deletePhoto.mockResolvedValue(undefined);

      await useProfileStore.getState().deletePhoto(2);

      state = useProfileStore.getState();
      expect(state.photos).toHaveLength(1);
      expect(state.photos.find(p => p.id === 2)).toBeUndefined();
    });

    test('should handle photo upload errors gracefully', async () => {
      const uploadError = new Error('File too large');
      mockApiClient.uploadPhoto.mockRejectedValue(uploadError);

      await useProfileStore.getState().uploadPhoto({
        image: 'very-large-base64-image',
      });

      const state = useProfileStore.getState();
      expect(state.photos).toHaveLength(0); // No photo should be added
      expect(state.error).toBe('File too large');
    });

    test('should handle network errors during photo operations', async () => {
      // Setup initial photos
      const initialPhotos: Photo[] = [
        {
          id: 1,
          user_id: 1,
          url: 'https://example.com/photo1.jpg',
          order: 1,
          is_primary: true,
          moderation_status: 'approved',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      useProfileStore.setState({ photos: initialPhotos });

      // Mock network error
      const networkError = new Error('Network request failed');
      mockApiClient.deletePhoto.mockRejectedValue(networkError);

      await useProfileStore.getState().deletePhoto(1);

      const state = useProfileStore.getState();
      expect(state.photos).toHaveLength(1); // Photo should still be there
      expect(state.error).toBe('Network request failed');
    });
  });

  describe('Profile Loading and Error Recovery', () => {
    test('should handle profile loading with retry', async () => {
      // First attempt fails
      const networkError = new Error('Connection timeout');
      mockApiClient.getFullProfile.mockRejectedValueOnce(networkError);

      await useProfileStore.getState().loadProfile();

      let state = useProfileStore.getState();
      expect(state.profile).toBeNull();
      expect(state.error).toBe('Connection timeout');

      // Retry succeeds
      const profileData = {
        id: 1,
        user_id: 1,
        display_name: 'John Doe',
        bio: 'Test bio',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        photos: [],
      };

      mockApiClient.getFullProfile.mockResolvedValue(profileData);

      await useProfileStore.getState().loadProfile();

      state = useProfileStore.getState();
      expect(state.profile?.display_name).toBe('John Doe');
      expect(state.error).toBeNull();
    });

    test('should handle concurrent operations correctly', async () => {
      // Setup profile
      useProfileStore.setState({
        profile: {
          id: 1,
          user_id: 1,
          display_name: 'John Doe',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      });

      // Mock delayed responses
      const updatePromise = new Promise((resolve) => {
        setTimeout(() => resolve({
          id: 1,
          user_id: 1,
          display_name: 'Updated Name',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T01:00:00Z',
        }), 100);
      });

      const uploadPromise = new Promise((resolve) => {
        setTimeout(() => resolve({
          id: 1,
          user_id: 1,
          url: 'https://example.com/photo.jpg',
          order: 1,
          is_primary: false,
          moderation_status: 'pending',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        }), 50);
      });

      mockApiClient.updateProfileData.mockReturnValue(updatePromise as any);
      mockApiClient.uploadPhoto.mockReturnValue(uploadPromise as any);

      // Start both operations concurrently
      const [updateResult, uploadResult] = await Promise.all([
        useProfileStore.getState().updateProfile({ display_name: 'Updated Name' }),
        useProfileStore.getState().uploadPhoto({ image: 'base64-data' }),
      ]);

      const finalState = useProfileStore.getState();
      expect(finalState.profile?.display_name).toBe('Updated Name');
      expect(finalState.photos).toHaveLength(1);
      expect(finalState.error).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle malformed API responses', async () => {
      // Mock API returning invalid data
      mockApiClient.getFullProfile.mockResolvedValue(null as any);

      await useProfileStore.getState().loadProfile();

      const state = useProfileStore.getState();
      expect(state.profile).toBeNull();
      expect(state.error).toBeTruthy();
    });

    test('should clear errors when performing successful operations', async () => {
      // Set initial error state
      useProfileStore.setState({ error: 'Previous error' });

      const profileData = {
        id: 1,
        user_id: 1,
        display_name: 'John Doe',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        photos: [],
      };

      mockApiClient.getFullProfile.mockResolvedValue(profileData);

      await useProfileStore.getState().loadProfile();

      const state = useProfileStore.getState();
      expect(state.error).toBeNull(); // Error should be cleared
      expect(state.profile).toEqual({
        id: 1,
        user_id: 1,
        display_name: 'John Doe',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      });
    });
  });
});