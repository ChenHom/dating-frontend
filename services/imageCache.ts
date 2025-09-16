/**
 * Image Cache Service
 * 照片快取機制服務
 */

import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache configuration
const CACHE_CONFIG = {
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_CACHE_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  PRELOAD_BATCH_SIZE: 5,
  STORAGE_KEY: 'image_cache_metadata',
};

interface CacheMetadata {
  [uri: string]: {
    cachedAt: number;
    size: number;
    lastAccessed: number;
    priority: number; // 0-3, higher is more important
  };
}

interface PreloadOptions {
  priority?: number;
  maxAge?: number;
}

class ImageCacheService {
  private metadata: CacheMetadata = {};
  private preloadQueue: Array<{ uri: string; options: PreloadOptions }> = [];
  private isPreloading = false;

  constructor() {
    this.initializeCache();
  }

  /**
   * Initialize cache system
   */
  private async initializeCache() {
    try {
      // Load metadata from storage
      const storedMetadata = await AsyncStorage.getItem(CACHE_CONFIG.STORAGE_KEY);
      if (storedMetadata) {
        this.metadata = JSON.parse(storedMetadata);
      }

      // Clean up expired entries
      await this.cleanupExpiredEntries();

      // Configure expo-image cache
      await Image.clearDiskCache();
    } catch (error) {
      console.warn('Failed to initialize image cache:', error);
    }
  }

  /**
   * Save metadata to storage
   */
  private async saveMetadata() {
    try {
      await AsyncStorage.setItem(
        CACHE_CONFIG.STORAGE_KEY,
        JSON.stringify(this.metadata)
      );
    } catch (error) {
      console.warn('Failed to save cache metadata:', error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  private async cleanupExpiredEntries() {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [uri, metadata] of Object.entries(this.metadata)) {
      const age = now - metadata.cachedAt;
      if (age > CACHE_CONFIG.MAX_CACHE_AGE) {
        toDelete.push(uri);
      }
    }

    // Remove expired entries
    for (const uri of toDelete) {
      delete this.metadata[uri];
    }

    if (toDelete.length > 0) {
      await this.saveMetadata();
    }

    return toDelete.length;
  }

  /**
   * Get current cache size estimate
   */
  getCurrentCacheSize(): number {
    return Object.values(this.metadata).reduce(
      (total, meta) => total + meta.size,
      0
    );
  }

  /**
   * Clean up cache to stay under size limit
   */
  private async enforceMaxCacheSize() {
    const currentSize = this.getCurrentCacheSize();

    if (currentSize <= CACHE_CONFIG.MAX_CACHE_SIZE) {
      return;
    }

    // Sort by priority (ascending) and last accessed (ascending)
    const sortedEntries = Object.entries(this.metadata).sort(([, a], [, b]) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Lower priority first
      }
      return a.lastAccessed - b.lastAccessed; // Older first
    });

    let sizeToRemove = currentSize - CACHE_CONFIG.MAX_CACHE_SIZE;
    const toDelete: string[] = [];

    for (const [uri, metadata] of sortedEntries) {
      if (sizeToRemove <= 0) break;

      toDelete.push(uri);
      sizeToRemove -= metadata.size;
    }

    // Remove entries
    for (const uri of toDelete) {
      delete this.metadata[uri];
    }

    if (toDelete.length > 0) {
      await this.saveMetadata();
    }
  }

  /**
   * Preload a single image
   */
  async preloadImage(uri: string, options: PreloadOptions = {}): Promise<void> {
    try {
      const now = Date.now();
      const priority = options.priority || 1;

      // Check if already cached and not expired
      if (this.metadata[uri]) {
        const age = now - this.metadata[uri].cachedAt;
        const maxAge = options.maxAge || CACHE_CONFIG.MAX_CACHE_AGE;

        if (age < maxAge) {
          // Update last accessed time
          this.metadata[uri].lastAccessed = now;
          this.metadata[uri].priority = Math.max(
            this.metadata[uri].priority,
            priority
          );
          await this.saveMetadata();
          return;
        }
      }

      // Preload the image
      await Image.prefetch(uri);

      // Estimate size (rough approximation)
      const estimatedSize = 500 * 1024; // 500KB average

      // Update metadata
      this.metadata[uri] = {
        cachedAt: now,
        lastAccessed: now,
        size: estimatedSize,
        priority,
      };

      await this.saveMetadata();
      await this.enforceMaxCacheSize();
    } catch (error) {
      console.warn(`Failed to preload image ${uri}:`, error);
    }
  }

  /**
   * Preload multiple images
   */
  async preloadImages(uris: string[], options: PreloadOptions = {}): Promise<void> {
    const promises = uris.map(uri => this.preloadImage(uri, options));
    await Promise.allSettled(promises);
  }

  /**
   * Add images to preload queue
   */
  addToPreloadQueue(uris: string[], options: PreloadOptions = {}) {
    const newItems = uris.map(uri => ({ uri, options }));
    this.preloadQueue.push(...newItems);
    this.processPreloadQueue();
  }

  /**
   * Process preload queue in batches
   */
  private async processPreloadQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return;
    }

    this.isPreloading = true;

    try {
      while (this.preloadQueue.length > 0) {
        const batch = this.preloadQueue.splice(0, CACHE_CONFIG.PRELOAD_BATCH_SIZE);
        const promises = batch.map(({ uri, options }) =>
          this.preloadImage(uri, options)
        );

        await Promise.allSettled(promises);

        // Small delay between batches to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Clear all cache data
   */
  async clearCache(): Promise<void> {
    try {
      await Image.clearDiskCache();
      await Image.clearMemoryCache();
      this.metadata = {};
      await AsyncStorage.removeItem(CACHE_CONFIG.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear image cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const totalEntries = Object.keys(this.metadata).length;
    const totalSize = this.getCurrentCacheSize();
    const now = Date.now();

    const ageDistribution = {
      fresh: 0, // < 1 day
      recent: 0, // 1-3 days
      old: 0, // 3-7 days
    };

    const priorityDistribution = {
      low: 0,    // priority 0-1
      medium: 0, // priority 2
      high: 0,   // priority 3
    };

    Object.values(this.metadata).forEach(meta => {
      const age = now - meta.cachedAt;
      const days = age / (24 * 60 * 60 * 1000);

      if (days < 1) ageDistribution.fresh++;
      else if (days < 3) ageDistribution.recent++;
      else ageDistribution.old++;

      if (meta.priority <= 1) priorityDistribution.low++;
      else if (meta.priority === 2) priorityDistribution.medium++;
      else priorityDistribution.high++;
    });

    return {
      totalEntries,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      maxSizeMB: (CACHE_CONFIG.MAX_CACHE_SIZE / (1024 * 1024)).toFixed(2),
      usagePercentage: ((totalSize / CACHE_CONFIG.MAX_CACHE_SIZE) * 100).toFixed(1),
      ageDistribution,
      priorityDistribution,
      queueSize: this.preloadQueue.length,
      isPreloading: this.isPreloading,
    };
  }

  /**
   * Get cached image URIs by priority
   */
  getCachedImagesByPriority(minPriority: number = 0): string[] {
    return Object.entries(this.metadata)
      .filter(([, meta]) => meta.priority >= minPriority)
      .sort(([, a], [, b]) => b.priority - a.priority)
      .map(([uri]) => uri);
  }

  /**
   * Update image priority
   */
  async updateImagePriority(uri: string, priority: number) {
    if (this.metadata[uri]) {
      this.metadata[uri].priority = priority;
      this.metadata[uri].lastAccessed = Date.now();
      await this.saveMetadata();
    }
  }

  /**
   * Mark image as accessed
   */
  async markAsAccessed(uri: string) {
    if (this.metadata[uri]) {
      this.metadata[uri].lastAccessed = Date.now();
      await this.saveMetadata();
    }
  }
}

// Singleton instance
export const imageCacheService = new ImageCacheService();

// Utility functions for common use cases
export const preloadProfileImages = (photos: Array<{ url: string }>, priority = 2) => {
  const uris = photos.map(photo => photo.url).filter(Boolean);
  imageCacheService.addToPreloadQueue(uris, { priority });
};

export const preloadFeedImages = (users: Array<{ photos?: Array<{ url: string }>, profile: { primary_photo_url?: string } }>) => {
  const uris: string[] = [];

  users.forEach(user => {
    // Add primary photo first (higher priority)
    if (user.profile.primary_photo_url) {
      uris.push(user.profile.primary_photo_url);
    }

    // Add additional photos (lower priority)
    if (user.photos) {
      user.photos.forEach(photo => {
        if (photo.url && photo.url !== user.profile.primary_photo_url) {
          uris.push(photo.url);
        }
      });
    }
  });

  // Preload primary photos with high priority
  const primaryPhotos = users
    .map(u => u.profile.primary_photo_url)
    .filter(Boolean) as string[];

  imageCacheService.addToPreloadQueue(primaryPhotos, { priority: 3 });

  // Preload additional photos with medium priority
  const additionalPhotos = uris.filter(uri => !primaryPhotos.includes(uri));
  imageCacheService.addToPreloadQueue(additionalPhotos, { priority: 2 });
};

export const clearImageCache = () => imageCacheService.clearCache();
export const getImageCacheStats = () => imageCacheService.getCacheStats();