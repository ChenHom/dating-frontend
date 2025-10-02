/**
 * API Client Implementation
 * 與後端 Laravel API 的通訊客戶端
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  FeedUser,
  ApiResponse,
  ApiError,
  Profile,
  ProfileWithPhotos,
  ProfileUpdateRequest,
  Photo,
  PhotoUploadRequest,
  PhotoUpdateRequest,
  LikeResponse,
  Match
} from '@/lib/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for auth token
    this.client.interceptors.request.use((config) => {
      // Token will be added by auth store through setAuthToken method
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        // Handle 401 Unauthenticated errors
        if (error.response?.status === 401) {
          console.warn('🔐 Unauthenticated error detected, clearing auth state');

          // Clear the auth token from the client
          this.setAuthToken(null);

          // Import auth store dynamically to avoid circular dependencies
          import('@/stores/auth').then(({ useAuthStore }) => {
            const authStore = useAuthStore.getState();
            authStore.logout();
          });

          // Create a custom error for unauthenticated state
          const authError = new Error('Unauthenticated');
          authError.name = 'AuthenticationError';
          throw authError;
        }

        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw error;
      }
    );
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post('/auth/login', {
      email,
      password,
    });
    // Backend returns: { message, user, token }
    // Transform to expected AuthResponse format
    return {
      user: response.data.user,
      token: response.data.token,
    };
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post('/auth/register', data);
    // Backend returns: { message, user, token } - same as login
    // Transform to expected AuthResponse format
    return {
      user: response.data.user,
      token: response.data.token,
    };
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
  }

  // User management
  async getProfile(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>('/me');
    return response.data.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.client.put<ApiResponse<User>>('/me', data);
    return response.data.data;
  }

  // Feed & Matching
  async getUserFeed(): Promise<FeedUser[]> {
    const response = await this.client.get('/profile/profiles/feed');

    // Handle backend response format: { profiles: [], pagination: {} }
    const profiles = response.data.profiles || [];

    // Transform backend profile format to FeedUser format
    return profiles.map((profile: any) => ({
      id: profile.user_id, // Use user_id as the main ID
      profile: {
        id: profile.id,
        user_id: profile.user_id,
        display_name: profile.display_name,
        bio: profile.bio,
        age: profile.age,
        location: profile.city, // Map city to location
        primary_photo_url: profile.primary_photo_url,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      photos: [], // Empty photos array for now, since backend doesn't include them
      distance: Math.random() * 10 + 0.5, // Mock distance for now
    }));
  }

  async likeUser(userId: number): Promise<LikeResponse> {
    const response = await this.client.post<ApiResponse<LikeResponse>>(`/likes/${userId}`);
    return response.data.data;
  }

  async passUser(userId: number): Promise<void> {
    await this.client.post(`/passes/${userId}`);
  }

  // Match management endpoints
  async getMatches(): Promise<Match[]> {
    const response = await this.client.get<ApiResponse<Match[]>>('/match/matches');
    return response.data.data;
  }

  async openMatch(matchId: number): Promise<Match> {
    const response = await this.client.put<ApiResponse<Match>>(`/matches/${matchId}/open`);
    return response.data.data;
  }

  // Chat endpoints
  async getConversations(): Promise<any[]> {
    const response = await this.client.get('/conversations');
    return response.data.data;
  }

  async getConversation(conversationId: number): Promise<any> {
    const response = await this.client.get(`/chat/conversations/${conversationId}`);
    return response.data.data;
  }

  async getMessages(conversationId: number, page = 1): Promise<any> {
    const response = await this.client.get(`/chat/conversations/${conversationId}/messages`, {
      params: { page }
    });
    return response.data;
  }

  async sendMessage(conversationId: number, content: string, clientNonce: string): Promise<any> {
    const response = await this.client.post(`/chat/conversations/${conversationId}/messages`, {
      content,
      client_nonce: clientNonce,
    });
    return response.data.data;
  }

  // Utility method for setting auth token
  setAuthToken(token: string | null): void {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  // Profile management endpoints
  async getFullProfile(): Promise<ProfileWithPhotos> {
    const response = await this.client.get<ApiResponse<ProfileWithPhotos>>('/profile');
    return response.data.data;
  }

  async updateProfileData(data: ProfileUpdateRequest): Promise<Profile> {
    const response = await this.client.put<ApiResponse<Profile>>('/profile', data);
    return response.data.data;
  }

  // Photo management endpoints
  async uploadPhoto(data: PhotoUploadRequest): Promise<Photo> {
    const response = await this.client.post<ApiResponse<Photo>>('/photos', data);
    return response.data.data;
  }

  async getPhotos(): Promise<Photo[]> {
    const response = await this.client.get<ApiResponse<Photo[]>>('/photos');
    return response.data.data;
  }

  async updatePhoto(photoId: number, data: PhotoUpdateRequest): Promise<Photo> {
    const response = await this.client.put<ApiResponse<Photo>>(`/photos/${photoId}`, data);
    return response.data.data;
  }

  async deletePhoto(photoId: number): Promise<void> {
    await this.client.delete(`/photos/${photoId}`);
  }

  async setPrimaryPhoto(photoId: number): Promise<Profile> {
    const response = await this.client.put<ApiResponse<Profile>>(`/profile/primary-photo`, {
      photo_id: photoId,
    });
    return response.data.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();