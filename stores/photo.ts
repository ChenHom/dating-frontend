import { create } from 'zustand';
import { Photo, PhotoUploadRequest } from '@/lib/types';
import { apiClient } from '@/services/api/client';

export type PhotoUploadStatus = 'idle' | 'preparing' | 'uploading' | 'success' | 'error';

export interface PhotoUploadProgress {
  id: string;
  file?: {
    uri: string;
    name?: string;
    size?: number;
  };
  status: PhotoUploadStatus;
  progress: number; // 0-100
  error?: string;
  retryCount: number;
}

export interface PhotoState {
  // Photos data
  photos: Photo[];
  primaryPhoto: Photo | null;

  // Upload management
  uploadQueue: PhotoUploadProgress[];
  isUploading: boolean;
  uploadLimit: number; // daily upload limit
  uploadsToday: number;

  // UI states
  isLoading: boolean;
  error: string | null;

  // Actions
  setPhotos: (photos: Photo[]) => void;
  setPrimaryPhoto: (photo: Photo | null) => void;
  addPhoto: (photo: Photo) => void;
  updatePhoto: (id: number, updates: Partial<Photo>) => void;
  removePhoto: (id: number) => void;

  // Upload actions
  addToUploadQueue: (request: PhotoUploadRequest & { localUri: string }) => string; // returns upload id
  updateUploadProgress: (id: string, updates: Partial<PhotoUploadProgress>) => void;
  removeFromUploadQueue: (id: string) => void;
  clearUploadQueue: () => void;
  retryUpload: (id: string) => void;

  // Async actions
  fetchPhotos: () => Promise<void>;
  uploadPhoto: (id: string) => Promise<void>;
  deletePhoto: (photoId: number) => Promise<void>;
  setPrimaryPhotoAsync: (photoId: number) => Promise<void>;
  reorderPhotos: (fromIndex: number, toIndex: number) => Promise<void>;

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  photos: [],
  primaryPhoto: null,
  uploadQueue: [],
  isUploading: false,
  uploadLimit: 10, // from backend config
  uploadsToday: 0,
  isLoading: false,
  error: null,
};

export const usePhotoStore = create<PhotoState>((set, get) => ({
  ...initialState,

  // Basic setters
  setPhotos: (photos) => {
    const primaryPhoto = photos.find(p => p.is_primary) || null;
    set({ photos, primaryPhoto });
  },

  setPrimaryPhoto: (primaryPhoto) => set({ primaryPhoto }),

  addPhoto: (photo) => {
    set((state) => {
      const newPhotos = [...state.photos, photo];
      const primaryPhoto = photo.is_primary ? photo : state.primaryPhoto;
      return { photos: newPhotos, primaryPhoto };
    });
  },

  updatePhoto: (id, updates) => {
    set((state) => {
      const photos = state.photos.map(photo =>
        photo.id === id ? { ...photo, ...updates } : photo
      );
      const primaryPhoto = updates.is_primary
        ? photos.find(p => p.id === id) || state.primaryPhoto
        : state.primaryPhoto;
      return { photos, primaryPhoto };
    });
  },

  removePhoto: (id) => {
    set((state) => {
      const photos = state.photos.filter(photo => photo.id !== id);
      const primaryPhoto = state.primaryPhoto?.id === id ? null : state.primaryPhoto;
      return { photos, primaryPhoto };
    });
  },

  // Upload queue management
  addToUploadQueue: (request) => {
    const id = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uploadItem: PhotoUploadProgress = {
      id,
      file: {
        uri: request.localUri,
        size: request.image.length, // base64 string length approximation
      },
      status: 'idle',
      progress: 0,
      error: undefined,
      retryCount: 0,
    };

    set((state) => ({
      uploadQueue: [...state.uploadQueue, uploadItem]
    }));

    return id;
  },

  updateUploadProgress: (id, updates) => {
    set((state) => ({
      uploadQueue: state.uploadQueue.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  },

  removeFromUploadQueue: (id) => {
    set((state) => ({
      uploadQueue: state.uploadQueue.filter(item => item.id !== id)
    }));
  },

  clearUploadQueue: () => {
    set({ uploadQueue: [] });
  },

  retryUpload: (id) => {
    const item = get().uploadQueue.find(item => item.id === id);
    if (item && item.retryCount < 3) {
      get().updateUploadProgress(id, {
        status: 'idle',
        progress: 0,
        error: undefined,
        retryCount: item.retryCount + 1,
      });
      // Trigger upload
      get().uploadPhoto(id);
    }
  },

  // Async actions
  fetchPhotos: async () => {
    set({ isLoading: true, error: null });
    try {
      const photos = await apiClient.getPhotos();
      get().setPhotos(photos);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch photos' });
    } finally {
      set({ isLoading: false });
    }
  },

  uploadPhoto: async (id) => {
    const item = get().uploadQueue.find(item => item.id === id);
    if (!item) return;

    get().updateUploadProgress(id, { status: 'uploading', progress: 10 });
    set({ isUploading: true });

    try {
      // Find the upload request data (need to store this in queue)
      const uploadRequests = get().uploadQueue.filter(item => item.id === id);
      if (uploadRequests.length === 0) throw new Error('Upload data not found');

      get().updateUploadProgress(id, { progress: 50 });

      // Call API to upload photo
      const uploadData: PhotoUploadRequest = {
        image: (item as any).uploadData?.image || '',
        order: get().photos.length + 1,
      };

      const photo = await apiClient.uploadPhoto(uploadData);

      get().updateUploadProgress(id, { progress: 90 });

      // Add to photos and remove from queue
      get().addPhoto(photo);
      get().updateUploadProgress(id, { status: 'success', progress: 100 });

      // Remove from queue after delay
      setTimeout(() => {
        get().removeFromUploadQueue(id);
      }, 2000);

    } catch (error) {
      get().updateUploadProgress(id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      set({ isUploading: false });
    }
  },

  deletePhoto: async (photoId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.deletePhoto(photoId);
      get().removePhoto(photoId);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete photo' });
    } finally {
      set({ isLoading: false });
    }
  },

  setPrimaryPhotoAsync: async (photoId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.setPrimaryPhoto(photoId);
      const photo = get().photos.find(p => p.id === photoId);
      if (photo) {
        // Update all photos: set others to non-primary, set target to primary
        set((state) => ({
          photos: state.photos.map(p => ({
            ...p,
            is_primary: p.id === photoId
          })),
          primaryPhoto: photo
        }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to set primary photo' });
    } finally {
      set({ isLoading: false });
    }
  },

  reorderPhotos: async (fromIndex, toIndex) => {
    set({ isLoading: true, error: null });
    try {
      // Optimistically update order
      const photos = [...get().photos];
      const [movedPhoto] = photos.splice(fromIndex, 1);
      photos.splice(toIndex, 0, movedPhoto);

      // Update order numbers
      const reorderedPhotos = photos.map((photo, index) => ({
        ...photo,
        order: index + 1
      }));

      set({ photos: reorderedPhotos });

      // TODO: Implement API call to persist order
      // await apiClient.updatePhotoOrder(reorderedPhotos);
      console.log('reorderPhotos: To be implemented');
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to reorder photos' });
      // Revert on error - refetch photos
      get().fetchPhotos();
    } finally {
      set({ isLoading: false });
    }
  },

  // State management
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));