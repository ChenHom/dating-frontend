/**
 * Profile Store Tests (TDD)
 * 測試個人檔案狀態管理
 */

import { 
  Profile, 
  ProfileWithPhotos, 
  ProfileUpdateRequest, 
  Photo, 
  PhotoUploadRequest, 
  PhotoUpdateRequest 
} from '@/lib/types';

// Mock API client
const mockApiClient = {
  getFullProfile: jest.fn(),
  updateProfileData: jest.fn(),
  uploadPhoto: jest.fn(),
  getPhotos: jest.fn(),
  updatePhoto: jest.fn(),
  deletePhoto: jest.fn(),
  setPrimaryPhoto: jest.fn(),
};

jest.mock('../../services/api/client', () => ({
  apiClient: mockApiClient,
}));

import { useProfileStore } from '../profile';

describe('Profile Store', () => {
  beforeEach(() => {
    // Reset store state
    useProfileStore.setState({
      profile: null,
      photos: [],
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

  describe('Profile Data Management', () => {
    test('should load full profile with photos', async () => {
      // Arrange
      const mockProfileWithPhotos: ProfileWithPhotos = {
        id: 1,
        user_id: 1,
        display_name: 'Test User',
        bio: 'Test bio',
        birth_date: '1990-01-01',
        age: 34,
        gender: 'male',
        interested_in: 'female',
        location: 'Test City',
        primary_photo_url: 'https://example.com/photo.jpg',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        photos: [
          {
            id: 1,
            user_id: 1,
            url: 'https://example.com/photo1.jpg',
            order: 1,
            is_primary: true,
            moderation_status: 'approved',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          }
        ]
      };
      
      mockApiClient.getFullProfile.mockResolvedValue(mockProfileWithPhotos);
      
      // Act
      await useProfileStore.getState().loadProfile();
      
      // Assert
      const state = useProfileStore.getState();
      expect(mockApiClient.getFullProfile).toHaveBeenCalledTimes(1);
      expect(state.profile).toEqual({
        id: mockProfileWithPhotos.id,
        user_id: mockProfileWithPhotos.user_id,
        display_name: mockProfileWithPhotos.display_name,
        bio: mockProfileWithPhotos.bio,
        birth_date: mockProfileWithPhotos.birth_date,
        age: mockProfileWithPhotos.age,
        gender: mockProfileWithPhotos.gender,
        interested_in: mockProfileWithPhotos.interested_in,
        location: mockProfileWithPhotos.location,
        primary_photo_url: mockProfileWithPhotos.primary_photo_url,
        is_active: mockProfileWithPhotos.is_active,
        created_at: mockProfileWithPhotos.created_at,
        updated_at: mockProfileWithPhotos.updated_at,
      });
      expect(state.photos).toEqual(mockProfileWithPhotos.photos);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    test('should handle profile loading error', async () => {
      // Arrange
      const errorMessage = 'Failed to load profile';
      mockApiClient.getFullProfile.mockRejectedValue(new Error(errorMessage));
      
      // Act
      await useProfileStore.getState().loadProfile();
      
      // Assert
      const state = useProfileStore.getState();
      expect(state.profile).toBeNull();
      expect(state.photos).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    test('should update profile data', async () => {
      // Arrange
      const updateData: ProfileUpdateRequest = {
        display_name: 'Updated Name',
        bio: 'Updated bio',
        location: 'New City'
      };
      
      const mockUpdatedProfile: Profile = {
        id: 1,
        user_id: 1,
        display_name: 'Updated Name',
        bio: 'Updated bio',
        location: 'New City',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      };
      
      mockApiClient.updateProfileData.mockResolvedValue(mockUpdatedProfile);
      
      // Act
      await useProfileStore.getState().updateProfile(updateData);
      
      // Assert
      const state = useProfileStore.getState();
      expect(mockApiClient.updateProfileData).toHaveBeenCalledWith(updateData);
      expect(state.profile).toEqual(mockUpdatedProfile);
      expect(state.error).toBeNull();
    });

    test('should handle profile update error', async () => {
      // Arrange
      const updateData: ProfileUpdateRequest = {
        display_name: 'Updated Name'
      };
      const errorMessage = 'Update failed';
      mockApiClient.updateProfileData.mockRejectedValue(new Error(errorMessage));
      
      // Act
      await useProfileStore.getState().updateProfile(updateData);
      
      // Assert
      const state = useProfileStore.getState();
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('Photo Management', () => {
    test('should upload a photo', async () => {
      // Arrange
      const photoData: PhotoUploadRequest = {
        image: 'base64-image-data',
        order: 1
      };
      
      const mockUploadedPhoto: Photo = {
        id: 2,
        user_id: 1,
        url: 'https://example.com/new-photo.jpg',
        order: 1,
        is_primary: false,
        moderation_status: 'pending',
        created_at: '2023-01-02T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      };
      
      // Set initial photos state
      useProfileStore.setState({
        photos: [
          {
            id: 1,
            user_id: 1,
            url: 'https://example.com/photo1.jpg',
            order: 1,
            is_primary: true,
            moderation_status: 'approved',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          }
        ]
      });
      
      mockApiClient.uploadPhoto.mockResolvedValue(mockUploadedPhoto);
      
      // Act
      await useProfileStore.getState().uploadPhoto(photoData);
      
      // Assert
      const state = useProfileStore.getState();
      expect(mockApiClient.uploadPhoto).toHaveBeenCalledWith(photoData);
      expect(state.photos).toHaveLength(2);
      expect(state.photos.find(p => p.id === 2)).toEqual(mockUploadedPhoto);
    });

    test('should delete a photo', async () => {
      // Arrange
      const photoId = 2;
      
      // Set initial photos state
      useProfileStore.setState({
        photos: [
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
          {
            id: 2,
            user_id: 1,
            url: 'https://example.com/photo2.jpg',
            order: 2,
            is_primary: false,
            moderation_status: 'approved',
            created_at: '2023-01-02T00:00:00Z',
            updated_at: '2023-01-02T00:00:00Z',
          }
        ]
      });
      
      mockApiClient.deletePhoto.mockResolvedValue(undefined);
      
      // Act
      await useProfileStore.getState().deletePhoto(photoId);
      
      // Assert
      const state = useProfileStore.getState();
      expect(mockApiClient.deletePhoto).toHaveBeenCalledWith(photoId);
      expect(state.photos).toHaveLength(1);
      expect(state.photos.find(p => p.id === photoId)).toBeUndefined();
    });

    test('should set primary photo and update profile', async () => {
      // Arrange
      const photoId = 2;
      const mockUpdatedProfile: Profile = {
        id: 1,
        user_id: 1,
        display_name: 'Test User',
        primary_photo_url: 'https://example.com/photo2.jpg',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      };
      
      // Set initial state
      useProfileStore.setState({
        profile: {
          id: 1,
          user_id: 1,
          display_name: 'Test User',
          primary_photo_url: 'https://example.com/photo1.jpg',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        photos: [
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
          {
            id: 2,
            user_id: 1,
            url: 'https://example.com/photo2.jpg',
            order: 2,
            is_primary: false,
            moderation_status: 'approved',
            created_at: '2023-01-02T00:00:00Z',
            updated_at: '2023-01-02T00:00:00Z',
          }
        ]
      });
      
      mockApiClient.setPrimaryPhoto.mockResolvedValue(mockUpdatedProfile);
      
      // Act
      await useProfileStore.getState().setPrimaryPhoto(photoId);
      
      // Assert
      const state = useProfileStore.getState();
      expect(mockApiClient.setPrimaryPhoto).toHaveBeenCalledWith(photoId);
      expect(state.profile).toEqual(mockUpdatedProfile);
      
      // Check that photos' is_primary status is updated
      const updatedPhotos = state.photos;
      expect(updatedPhotos.find(p => p.id === 1)?.is_primary).toBe(false);
      expect(updatedPhotos.find(p => p.id === 2)?.is_primary).toBe(true);
    });

    test('should handle photo upload error', async () => {
      // Arrange
      const photoData: PhotoUploadRequest = {
        image: 'base64-image-data'
      };
      const errorMessage = 'Upload failed';
      mockApiClient.uploadPhoto.mockRejectedValue(new Error(errorMessage));
      
      // Act
      await useProfileStore.getState().uploadPhoto(photoData);
      
      // Assert
      const state = useProfileStore.getState();
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('Loading States', () => {
    test('should set loading state during profile fetch', async () => {
      // Arrange
      let resolvePromise: (value: any) => void;
      const profilePromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.getFullProfile.mockReturnValue(profilePromise);
      
      // Act
      const loadPromise = useProfileStore.getState().loadProfile();
      
      // Assert - loading should be true
      expect(useProfileStore.getState().isLoading).toBe(true);
      
      // Complete the promise
      resolvePromise!({
        id: 1,
        user_id: 1,
        display_name: 'Test',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        photos: []
      });
      
      await loadPromise;
      
      // Assert - loading should be false
      expect(useProfileStore.getState().isLoading).toBe(false);
    });
  });
});