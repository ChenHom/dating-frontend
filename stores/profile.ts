/**
 * Profile Store
 * 個人檔案狀態管理 (Zustand)
 */

import { create } from 'zustand';
import { 
  Profile, 
  ProfileUpdateRequest, 
  Photo, 
  PhotoUploadRequest 
} from '@/lib/types';
import { apiClient } from '@/services/api/client';

interface ProfileState {
  // Data
  profile: Profile | null;
  photos: Photo[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadProfile: () => Promise<void>;
  updateProfile: (data: ProfileUpdateRequest) => Promise<void>;
  uploadPhoto: (data: PhotoUploadRequest) => Promise<void>;
  deletePhoto: (photoId: number) => Promise<void>;
  setPrimaryPhoto: (photoId: number) => Promise<void>;
  clearError: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  // Initial state
  profile: null,
  photos: [],
  isLoading: false,
  error: null,

  // Load full profile with photos
  loadProfile: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const profileWithPhotos = await apiClient.getFullProfile();
      
      // Separate profile data from photos
      const { photos, ...profileData } = profileWithPhotos;
      
      set({
        profile: profileData,
        photos: photos || [],
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load profile',
      });
    }
  },

  // Update profile data
  updateProfile: async (data: ProfileUpdateRequest) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedProfile = await apiClient.updateProfileData(data);
      
      set({
        profile: updatedProfile,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      });
    }
  },

  // Upload a new photo
  uploadPhoto: async (data: PhotoUploadRequest) => {
    set({ isLoading: true, error: null });
    
    try {
      const newPhoto = await apiClient.uploadPhoto(data);
      
      set((state) => ({
        photos: [...state.photos, newPhoto],
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to upload photo',
      });
    }
  },

  // Delete a photo
  deletePhoto: async (photoId: number) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiClient.deletePhoto(photoId);
      
      set((state) => ({
        photos: state.photos.filter(photo => photo.id !== photoId),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete photo',
      });
    }
  },

  // Set primary photo
  setPrimaryPhoto: async (photoId: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedProfile = await apiClient.setPrimaryPhoto(photoId);
      
      set((state) => ({
        profile: updatedProfile,
        // Update photo is_primary flags locally
        photos: state.photos.map(photo => ({
          ...photo,
          is_primary: photo.id === photoId,
        })),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to set primary photo',
      });
    }
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },
}));