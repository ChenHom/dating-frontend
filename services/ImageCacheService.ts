/**
 * Image Cache Service
 * 圖片快取服務 - 智能預載和記憶體管理
 */

import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';

interface CacheItem {
  uri: string;
  cachedAt: number;
  priority: number; // 1-5, 5 highest
  size?: number;
}

interface CacheConfig {
  maxCacheSize: number; // bytes
  maxItems: number;
  ttl: number; // time to live in ms
  preloadDistance: number; // how many items ahead to preload
}

class ImageCacheService {
  private cache: Map<string, CacheItem> = new Map();
  private config: CacheConfig = {
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    maxItems: 100,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    preloadDistance: 3,
  };

  private currentCacheSize = 0;

  /**
   * Preload images for better user experience
   */
  async preloadImages(urls: string[], priority: number = 3): Promise<void> {
    const validUrls = urls.filter(url => url && !this.isImageCached(url));

    if (validUrls.length === 0) return;

    try {
      // Preload images with expo-image
      const preloadPromises = validUrls.map(async (url) => {
        try {
          await Image.prefetch(url);
          this.addToCache(url, priority);
        } catch (error) {
          console.warn(`Failed to preload image: ${url}`, error);
        }
      });

      await Promise.allSettled(preloadPromises);
    } catch (error) {
      console.error('Batch preload failed:', error);
    }
  }

  /**
   * Preload images for a user's photos
   */
  async preloadUserPhotos(photos: { url: string }[], priority: number = 4): Promise<void> {
    const urls = photos.map(photo => photo.url).filter(Boolean);
    await this.preloadImages(urls, priority);
  }

  /**
   * Preload images for multiple users (for feed)
   */
  async preloadFeedImages(users: any[], priority: number = 3): Promise<void> {
    const urls: string[] = [];

    users.forEach(user => {
      // Add primary photo
      if (user.profile?.primary_photo_url) {
        urls.push(user.profile.primary_photo_url);
      }

      // Add additional photos (first 3 only for performance)
      if (user.photos && Array.isArray(user.photos)) {
        user.photos.slice(0, 3).forEach((photo: { url: string }) => {
          if (photo.url) {
            urls.push(photo.url);
          }
        });
      }
    });

    await this.preloadImages(urls, priority);
  }

  /**
   * Check if image is already cached
   */
  isImageCached(url: string): boolean {
    const item = this.cache.get(url);

    if (!item) return false;

    // Check if cache item is expired
    if (Date.now() - item.cachedAt > this.config.ttl) {
      this.cache.delete(url);
      return false;
    }

    return true;
  }

  /**
   * Add image to cache tracking
   */
  private addToCache(url: string, priority: number): void {
    const item: CacheItem = {
      uri: url,
      cachedAt: Date.now(),
      priority,
    };

    this.cache.set(url, item);

    // Clean cache if needed
    this.cleanupCacheIfNeeded();
  }

  /**
   * Get cache size estimation
   */
  async estimateImageSize(url: string): Promise<number> {
    try {
      // This is an estimation - actual size may vary
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : 500000; // 500KB default
    } catch {
      return 500000; // 500KB default
    }
  }

  /**
   * Cleanup cache when memory pressure is detected
   */
  private cleanupCacheIfNeeded(): void {
    if (this.cache.size <= this.config.maxItems) return;

    // Convert to array and sort by priority and age
    const items = Array.from(this.cache.entries()).sort((a, b) => {
      const [, itemA] = a;
      const [, itemB] = b;

      // Lower priority items first
      if (itemA.priority !== itemB.priority) {
        return itemA.priority - itemB.priority;
      }

      // Older items first
      return itemA.cachedAt - itemB.cachedAt;
    });

    // Remove 20% of items
    const itemsToRemove = Math.floor(items.length * 0.2);
    for (let i = 0; i < itemsToRemove; i++) {
      const [url] = items[i];
      this.cache.delete(url);
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
  }

  /**
   * Clear expired cache items
   */
  clearExpiredCache(): void {
    const now = Date.now();

    for (const [url, item] of this.cache.entries()) {
      if (now - item.cachedAt > this.config.ttl) {
        this.cache.delete(url);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalItems: number;
    cacheSize: number;
    hitRate: number;
  } {
    return {
      totalItems: this.cache.size,
      cacheSize: this.currentCacheSize,
      hitRate: 0, // TODO: Implement hit rate tracking
    };
  }

  /**
   * Configure cache settings
   */
  configure(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Smart preload for SwipeCard - preload next few users
   */
  async preloadForSwipeCard(
    users: any[],
    currentIndex: number,
    preloadCount: number = 3
  ): Promise<void> {
    const usersToPreload = users.slice(
      currentIndex,
      currentIndex + preloadCount
    );

    for (const [index, user] of usersToPreload.entries()) {
      const priority = index === 0 ? 5 : Math.max(3 - index, 1);

      // Preload user's photos
      const urls: string[] = [];

      if (user.profile?.primary_photo_url) {
        urls.push(user.profile.primary_photo_url);
      }

      if (user.photos && Array.isArray(user.photos)) {
        user.photos.forEach((photo: { url: string }) => {
          if (photo.url) {
            urls.push(photo.url);
          }
        });
      }

      await this.preloadImages(urls, priority);
    }
  }

  /**
   * Background cache cleanup (call periodically)
   */
  backgroundCleanup(): void {
    this.clearExpiredCache();

    // If still over limit, force cleanup
    if (this.cache.size > this.config.maxItems) {
      this.cleanupCacheIfNeeded();
    }
  }
}

// Export singleton instance
export const imageCacheService = new ImageCacheService();

// Auto cleanup every 5 minutes
if (typeof global !== 'undefined') {
  setInterval(() => {
    imageCacheService.backgroundCleanup();
  }, 5 * 60 * 1000);
}