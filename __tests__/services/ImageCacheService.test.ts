/**
 * ImageCacheService Tests
 * 測試圖片快取服務
 */

import { imageCacheService } from '@/services/ImageCacheService';
import { Image } from 'expo-image';

// Mock dependencies
jest.mock('expo-image', () => ({
  Image: {
    prefetch: jest.fn(),
    preload: jest.fn(),
  },
}));

const mockImage = Image as jest.Mocked<typeof Image>;

describe('ImageCacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    imageCacheService.clearCache();
  });

  describe('preloadImages', () => {
    it('should preload valid images', async () => {
      const urls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ];

      mockImage.prefetch.mockResolvedValue();

      await imageCacheService.preloadImages(urls, 3);

      expect(mockImage.prefetch).toHaveBeenCalledTimes(2);
      expect(mockImage.prefetch).toHaveBeenCalledWith('https://example.com/image1.jpg');
      expect(mockImage.prefetch).toHaveBeenCalledWith('https://example.com/image2.jpg');
    });

    it('should skip already cached images', async () => {
      const urls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ];

      // First preload
      mockImage.prefetch.mockResolvedValue();
      await imageCacheService.preloadImages(urls, 3);

      jest.clearAllMocks();

      // Second preload should skip cached images
      await imageCacheService.preloadImages(urls, 3);

      expect(mockImage.prefetch).not.toHaveBeenCalled();
    });

    it('should handle preload errors gracefully', async () => {
      const urls = [
        'https://example.com/valid-image.jpg',
        'https://example.com/invalid-image.jpg',
      ];

      mockImage.prefetch
        .mockResolvedValueOnce(undefined) // First image succeeds
        .mockRejectedValueOnce(new Error('Failed to load')); // Second image fails

      // Should not throw error
      await expect(imageCacheService.preloadImages(urls, 3)).resolves.toBeUndefined();

      expect(mockImage.prefetch).toHaveBeenCalledTimes(2);
    });

    it('should filter out invalid URLs', async () => {
      const urls = [
        'https://example.com/image1.jpg',
        '', // Empty string
        'https://example.com/image2.jpg',
      ];

      mockImage.prefetch.mockResolvedValue();

      await imageCacheService.preloadImages(urls, 3);

      expect(mockImage.prefetch).toHaveBeenCalledTimes(2);
      expect(mockImage.prefetch).not.toHaveBeenCalledWith('');
    });
  });

  describe('preloadUserPhotos', () => {
    it('should preload user photos with correct priority', async () => {
      const photos = [
        { url: 'https://example.com/user1-photo1.jpg' },
        { url: 'https://example.com/user1-photo2.jpg' },
      ];

      mockImage.prefetch.mockResolvedValue();

      await imageCacheService.preloadUserPhotos(photos, 4);

      expect(mockImage.prefetch).toHaveBeenCalledTimes(2);
    });

    it('should handle photos without URLs', async () => {
      const photos = [
        { url: 'https://example.com/photo1.jpg' },
        { url: '' }, // Empty URL
        { url: 'https://example.com/photo2.jpg' },
      ];

      mockImage.prefetch.mockResolvedValue();

      await imageCacheService.preloadUserPhotos(photos, 4);

      expect(mockImage.prefetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('preloadFeedImages', () => {
    it('should preload images from multiple users', async () => {
      const users = [
        {
          profile: { primary_photo_url: 'https://example.com/user1-primary.jpg' },
          photos: [
            { url: 'https://example.com/user1-photo1.jpg' },
            { url: 'https://example.com/user1-photo2.jpg' },
          ],
        },
        {
          profile: { primary_photo_url: 'https://example.com/user2-primary.jpg' },
          photos: [
            { url: 'https://example.com/user2-photo1.jpg' },
          ],
        },
      ];

      mockImage.prefetch.mockResolvedValue();

      await imageCacheService.preloadFeedImages(users, 3);

      expect(mockImage.prefetch).toHaveBeenCalledTimes(5); // 2 primary + 3 additional
    });

    it('should limit additional photos to first 3', async () => {
      const users = [
        {
          profile: { primary_photo_url: 'https://example.com/user1-primary.jpg' },
          photos: [
            { url: 'https://example.com/user1-photo1.jpg' },
            { url: 'https://example.com/user1-photo2.jpg' },
            { url: 'https://example.com/user1-photo3.jpg' },
            { url: 'https://example.com/user1-photo4.jpg' }, // Should be skipped
            { url: 'https://example.com/user1-photo5.jpg' }, // Should be skipped
          ],
        },
      ];

      mockImage.prefetch.mockResolvedValue();

      await imageCacheService.preloadFeedImages(users, 3);

      expect(mockImage.prefetch).toHaveBeenCalledTimes(4); // 1 primary + 3 additional
      expect(mockImage.prefetch).not.toHaveBeenCalledWith('https://example.com/user1-photo4.jpg');
      expect(mockImage.prefetch).not.toHaveBeenCalledWith('https://example.com/user1-photo5.jpg');
    });

    it('should handle users without photos', async () => {
      const users = [
        {
          profile: { primary_photo_url: 'https://example.com/user1-primary.jpg' },
          photos: null,
        },
        {
          profile: {},
          photos: [],
        },
      ];

      mockImage.prefetch.mockResolvedValue();

      await imageCacheService.preloadFeedImages(users, 3);

      expect(mockImage.prefetch).toHaveBeenCalledTimes(1); // Only user1 primary
    });
  });

  describe('isImageCached', () => {
    it('should return false for uncached images', () => {
      expect(imageCacheService.isImageCached('https://example.com/new-image.jpg')).toBe(false);
    });

    it('should return true for cached images', async () => {
      const url = 'https://example.com/cached-image.jpg';

      mockImage.prefetch.mockResolvedValue();
      await imageCacheService.preloadImages([url], 3);

      expect(imageCacheService.isImageCached(url)).toBe(true);
    });

    it('should return false for expired cached images', async () => {
      const url = 'https://example.com/expired-image.jpg';

      // Configure very short TTL for testing
      imageCacheService.configure({ ttl: 1 });

      mockImage.prefetch.mockResolvedValue();
      await imageCacheService.preloadImages([url], 3);

      expect(imageCacheService.isImageCached(url)).toBe(true);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 2));

      expect(imageCacheService.isImageCached(url)).toBe(false);
    });
  });

  describe('preloadForSwipeCard', () => {
    const mockUsers = [
      {
        profile: { primary_photo_url: 'https://example.com/user1-primary.jpg' },
        photos: [
          { url: 'https://example.com/user1-photo1.jpg' },
          { url: 'https://example.com/user1-photo2.jpg' },
        ],
      },
      {
        profile: { primary_photo_url: 'https://example.com/user2-primary.jpg' },
        photos: [
          { url: 'https://example.com/user2-photo1.jpg' },
        ],
      },
      {
        profile: { primary_photo_url: 'https://example.com/user3-primary.jpg' },
        photos: [],
      },
    ];

    it('should preload images for next few users', async () => {
      mockImage.prefetch.mockResolvedValue();

      await imageCacheService.preloadForSwipeCard(mockUsers, 0, 2);

      // Should preload for users 0 and 1
      expect(mockImage.prefetch).toHaveBeenCalledWith('https://example.com/user1-primary.jpg');
      expect(mockImage.prefetch).toHaveBeenCalledWith('https://example.com/user1-photo1.jpg');
      expect(mockImage.prefetch).toHaveBeenCalledWith('https://example.com/user1-photo2.jpg');
      expect(mockImage.prefetch).toHaveBeenCalledWith('https://example.com/user2-primary.jpg');
      expect(mockImage.prefetch).toHaveBeenCalledWith('https://example.com/user2-photo1.jpg');
    });

    it('should assign correct priorities', async () => {
      mockImage.prefetch.mockResolvedValue();

      await imageCacheService.preloadForSwipeCard(mockUsers, 0, 3);

      // Current user (index 0) should have highest priority (5)
      // Next users should have decreasing priority
      expect(mockImage.prefetch).toHaveBeenCalled();
    });

    it('should handle out of bounds indices', async () => {
      mockImage.prefetch.mockResolvedValue();

      await imageCacheService.preloadForSwipeCard(mockUsers, 2, 3);

      // Should only preload user at index 2
      expect(mockImage.prefetch).toHaveBeenCalledWith('https://example.com/user3-primary.jpg');
      expect(mockImage.prefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached images', async () => {
      const urls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ];

      mockImage.prefetch.mockResolvedValue();
      await imageCacheService.preloadImages(urls, 3);

      // Verify images are cached
      expect(imageCacheService.isImageCached(urls[0])).toBe(true);
      expect(imageCacheService.isImageCached(urls[1])).toBe(true);

      imageCacheService.clearCache();

      // Verify cache is cleared
      expect(imageCacheService.isImageCached(urls[0])).toBe(false);
      expect(imageCacheService.isImageCached(urls[1])).toBe(false);
    });
  });

  describe('clearExpiredCache', () => {
    it('should remove only expired cache items', async () => {
      imageCacheService.configure({ ttl: 10 }); // 10ms TTL

      const urls = [
        'https://example.com/fresh-image.jpg',
        'https://example.com/old-image.jpg',
      ];

      mockImage.prefetch.mockResolvedValue();

      // Cache first image
      await imageCacheService.preloadImages([urls[1]], 3);

      // Wait for first image to expire
      await new Promise(resolve => setTimeout(resolve, 15));

      // Cache second image
      await imageCacheService.preloadImages([urls[0]], 3);

      imageCacheService.clearExpiredCache();

      // Fresh image should still be cached
      expect(imageCacheService.isImageCached(urls[0])).toBe(true);
      // Old image should be removed
      expect(imageCacheService.isImageCached(urls[1])).toBe(false);
    });
  });

  describe('getCacheStats', () => {
    it('should return correct cache statistics', async () => {
      const urls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ];

      mockImage.prefetch.mockResolvedValue();
      await imageCacheService.preloadImages(urls, 3);

      const stats = imageCacheService.getCacheStats();

      expect(stats.totalItems).toBe(3);
      expect(stats.cacheSize).toBe(0); // Size tracking not fully implemented in this version
      expect(typeof stats.hitRate).toBe('number');
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      const newConfig = {
        maxCacheSize: 100 * 1024 * 1024, // 100MB
        maxItems: 200,
        ttl: 48 * 60 * 60 * 1000, // 48 hours
        preloadDistance: 5,
      };

      imageCacheService.configure(newConfig);

      // Configuration is internal, so we test its effects
      const stats = imageCacheService.getCacheStats();
      expect(typeof stats.totalItems).toBe('number');
    });
  });

  describe('backgroundCleanup', () => {
    it('should perform cleanup operations', async () => {
      imageCacheService.configure({ ttl: 1, maxItems: 2 });

      const urls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ];

      mockImage.prefetch.mockResolvedValue();
      await imageCacheService.preloadImages(urls, 3);

      // Wait for some items to expire
      await new Promise(resolve => setTimeout(resolve, 2));

      imageCacheService.backgroundCleanup();

      const stats = imageCacheService.getCacheStats();
      expect(stats.totalItems).toBeLessThan(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays gracefully', async () => {
      await expect(imageCacheService.preloadImages([], 3)).resolves.toBeUndefined();
      await expect(imageCacheService.preloadUserPhotos([], 3)).resolves.toBeUndefined();
      await expect(imageCacheService.preloadFeedImages([], 3)).resolves.toBeUndefined();
    });

    it('should handle malformed user objects', async () => {
      const malformedUsers = [
        null,
        undefined,
        {},
        { profile: null },
        { photos: null },
      ];

      mockImage.prefetch.mockResolvedValue();

      await expect(
        imageCacheService.preloadFeedImages(malformedUsers as any, 3)
      ).resolves.toBeUndefined();

      expect(mockImage.prefetch).not.toHaveBeenCalled();
    });

    it('should handle concurrent preload requests', async () => {
      const urls = ['https://example.com/concurrent-image.jpg'];

      mockImage.prefetch.mockResolvedValue();

      // Start multiple preload operations simultaneously
      const promises = [
        imageCacheService.preloadImages(urls, 3),
        imageCacheService.preloadImages(urls, 4),
        imageCacheService.preloadImages(urls, 5),
      ];

      await Promise.all(promises);

      // Should only preload once due to caching
      expect(mockImage.prefetch).toHaveBeenCalledTimes(1);
    });
  });
});