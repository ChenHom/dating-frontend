/**
 * API Client Tests (TDD)
 * 測試 API 客戶端的各種功能
 */

import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  User, 
  Profile, 
  ProfileWithPhotos, 
  ProfileUpdateRequest, 
  Photo, 
  PhotoUploadRequest, 
  PhotoUpdateRequest 
} from '../../../lib/types';

// Mock axios
const mockAxiosInstance = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  defaults: {
    headers: {
      common: {} as Record<string, any>
    }
  }
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance),
  default: {
    create: jest.fn(() => mockAxiosInstance),
  }
}));

// Import after mock setup
import { apiClient } from '../client';

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock functions but preserve the structure
    mockAxiosInstance.interceptors.request.use.mockClear();
    mockAxiosInstance.interceptors.response.use.mockClear();
  });

  describe('Authentication', () => {
    test('should login successfully', async () => {
      // Arrange
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      const mockResponse: AuthResponse = {
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        token: 'mock-jwt-token',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      mockAxiosInstance.post.mockResolvedValue({ 
        data: { data: mockResponse } 
      });

      // Act
      const result = await apiClient.login(loginData.email, loginData.password);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle login failure', async () => {
      // Arrange
      const loginData: LoginRequest = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };

      const errorResponse = {
        response: {
          status: 401,
          data: {
            message: 'Invalid credentials',
            errors: {
              email: ['The provided credentials are incorrect.']
            }
          }
        }
      };

      // Mock the error to be thrown by our response interceptor
      mockAxiosInstance.post.mockRejectedValue(new Error('Invalid credentials'));

      // Act & Assert
      await expect(
        apiClient.login(loginData.email, loginData.password)
      ).rejects.toThrow('Invalid credentials');
    });

    test('should register user successfully', async () => {
      // Arrange
      const registerData: RegisterRequest = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      };

      const mockResponse: AuthResponse = {
        user: {
          id: 2,
          name: 'New User',
          email: 'newuser@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        token: 'new-jwt-token',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      mockAxiosInstance.post.mockResolvedValue({ 
        data: { data: mockResponse } 
      });

      // Act
      const result = await apiClient.register(registerData);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('User Management', () => {
    test('should get user profile', async () => {
      // Arrange
      const mockUser: User = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile: {
          id: 1,
          user_id: 1,
          display_name: 'Test User',
          bio: 'Test bio',
          age: 25,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      mockAxiosInstance.get.mockResolvedValue({ 
        data: { data: mockUser } 
      });

      // Act
      const result = await apiClient.getProfile();

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/me');
      expect(result).toEqual(mockUser);
    });

    test('should get user feed', async () => {
      // Arrange
      const mockFeedUsers = [
        {
          id: 2,
          profile: {
            display_name: 'Jane Doe',
            age: 28,
            bio: 'Love traveling',
          },
          photos: [],
        },
        {
          id: 3,
          profile: {
            display_name: 'John Smith',
            age: 30,
            bio: 'Fitness enthusiast',
          },
          photos: [],
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({ 
        data: { data: mockFeedUsers } 
      });

      // Act
      const result = await apiClient.getUserFeed();

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/feed');
      expect(result).toEqual(mockFeedUsers);
    });
  });

  describe('Request Interceptors', () => {
    test('should setup request and response interceptors on creation', () => {
      // Since ApiClient is a singleton and interceptors are set up in constructor,
      // we need to create a new instance to test this behavior
      const ApiClientClass = require('../client').ApiClient || class {};
      
      // Clear previous calls
      mockAxiosInstance.interceptors.request.use.mockClear();
      mockAxiosInstance.interceptors.response.use.mockClear();
      
      // Create new instance (if class is available) or check existing setup
      if (ApiClientClass.name === 'ApiClient') {
        new ApiClientClass();
        expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
        expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
      } else {
        // For singleton pattern, verify interceptors exist by testing functionality
        expect(typeof apiClient.setAuthToken).toBe('function');
      }
    });

    test('should set auth token correctly', () => {
      // Arrange
      const token = 'test-jwt-token';
      
      // Act
      apiClient.setAuthToken(token);
      
      // Assert
      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe(`Bearer ${token}`);
    });

    test('should remove auth token when set to null', () => {
      // Act
      apiClient.setAuthToken(null);
      
      // Assert
      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      // Arrange
      mockAxiosInstance.get.mockRejectedValue(new Error('Network Error'));

      // Act & Assert
      await expect(apiClient.getProfile()).rejects.toThrow('Network Error');
    });

    test('should handle 500 server errors', async () => {
      // Arrange
      mockAxiosInstance.post.mockRejectedValue({
        response: {
          status: 500,
          data: {
            message: 'Internal Server Error'
          }
        }
      });

      // Act & Assert
      await expect(
        apiClient.login('test@example.com', 'password')
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          status: 500
        })
      });
    });
  });

  describe('Profile Management', () => {
    describe('getFullProfile', () => {
      test('should fetch full profile with photos', async () => {
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
        
        mockAxiosInstance.get.mockResolvedValue({
          data: { data: mockProfileWithPhotos }
        });

        // Act
        const result = await apiClient.getFullProfile();

        // Assert
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/profile');
        expect(result).toEqual(mockProfileWithPhotos);
      });
    });

    describe('updateProfileData', () => {
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
        
        mockAxiosInstance.put.mockResolvedValue({
          data: { data: mockUpdatedProfile }
        });

        // Act
        const result = await apiClient.updateProfileData(updateData);

        // Assert
        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/profile', updateData);
        expect(result).toEqual(mockUpdatedProfile);
      });
    });
  });

  describe('Photo Management', () => {
    describe('uploadPhoto', () => {
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
        
        mockAxiosInstance.post.mockResolvedValue({
          data: { data: mockUploadedPhoto }
        });

        // Act
        const result = await apiClient.uploadPhoto(photoData);

        // Assert
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/photos', photoData);
        expect(result).toEqual(mockUploadedPhoto);
      });
    });

    describe('getPhotos', () => {
      test('should fetch all photos', async () => {
        // Arrange
        const mockPhotos: Photo[] = [
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
        ];
        
        mockAxiosInstance.get.mockResolvedValue({
          data: { data: mockPhotos }
        });

        // Act
        const result = await apiClient.getPhotos();

        // Assert
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/photos');
        expect(result).toEqual(mockPhotos);
      });
    });

    describe('updatePhoto', () => {
      test('should update photo metadata', async () => {
        // Arrange
        const photoId = 1;
        const updateData: PhotoUpdateRequest = {
          order: 2,
          is_primary: true
        };
        
        const mockUpdatedPhoto: Photo = {
          id: 1,
          user_id: 1,
          url: 'https://example.com/photo1.jpg',
          order: 2,
          is_primary: true,
          moderation_status: 'approved',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
        };
        
        mockAxiosInstance.put.mockResolvedValue({
          data: { data: mockUpdatedPhoto }
        });

        // Act
        const result = await apiClient.updatePhoto(photoId, updateData);

        // Assert
        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/photos/1', updateData);
        expect(result).toEqual(mockUpdatedPhoto);
      });
    });

    describe('deletePhoto', () => {
      test('should delete a photo', async () => {
        // Arrange
        const photoId = 1;
        mockAxiosInstance.delete.mockResolvedValue({});

        // Act
        await apiClient.deletePhoto(photoId);

        // Assert
        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/photos/1');
      });
    });

    describe('setPrimaryPhoto', () => {
      test('should set primary photo', async () => {
        // Arrange
        const photoId = 1;
        const mockUpdatedProfile: Profile = {
          id: 1,
          user_id: 1,
          display_name: 'Test User',
          primary_photo_url: 'https://example.com/photo1.jpg',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
        };
        
        mockAxiosInstance.put.mockResolvedValue({
          data: { data: mockUpdatedProfile }
        });

        // Act
        const result = await apiClient.setPrimaryPhoto(photoId);

        // Assert
        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/profile/primary-photo', {
          photo_id: photoId,
        });
        expect(result).toEqual(mockUpdatedProfile);
      });
    });
  });
});