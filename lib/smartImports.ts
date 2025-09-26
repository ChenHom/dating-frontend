/**
 * Smart Import Manager
 * 智能導入管理器 - 優化包大小的導入策略
 */

import { Platform } from 'react-native';

// 功能特定的最小化導入
export const MinimalImports = {
  // 只導入需要的 date-fns 函數
  formatDate: () => import('date-fns/format'),
  parseDate: () => import('date-fns/parse'),
  isValid: () => import('date-fns/isValid'),

  // 只導入需要的動畫庫功能
  SpringAnimation: () => import('react-native-reanimated').then(m => ({
    withSpring: m.withSpring,
    useSharedValue: m.useSharedValue
  })),
};

// 條件導入策略
export class ConditionalImportStrategy {
  private loadedModules = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();

  // 智能緩存導入
  async smartImport<T>(
    key: string,
    importFn: () => Promise<T>,
    condition: boolean = true
  ): Promise<T | null> {
    if (!condition) {
      return null;
    }

    // 返回已緩存的模組
    if (this.loadedModules.has(key)) {
      return this.loadedModules.get(key);
    }

    // 返回進行中的加載 Promise
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    // 開始新的導入
    const promise = importFn().then(module => {
      this.loadedModules.set(key, module);
      this.loadingPromises.delete(key);
      return module;
    }).catch(error => {
      this.loadingPromises.delete(key);
      console.error(`Failed to load module ${key}:`, error);
      throw error;
    });

    this.loadingPromises.set(key, promise);
    return promise;
  }

  // 預加載重要模組
  async preloadCritical() {
    const criticalModules: Array<{ key: string; importFn: () => Promise<any> }> = [
      { key: 'auth', importFn: () => import('../stores/auth') },
      { key: 'chat', importFn: () => import('../stores/chat') },
    ];

    for (const { key, importFn } of criticalModules) {
      try {
        await this.smartImport(key, importFn);
      } catch (error) {
        console.warn(`Failed to preload ${key}:`, error);
      }
    }
  }

  // 按優先級預加載
  preloadByPriority(modules: Array<{
    key: string;
    importFn: () => Promise<any>;
    priority: number;
    condition?: boolean;
  }>) {
    const sortedModules = modules
      .filter(m => m.condition !== false)
      .sort((a, b) => a.priority - b.priority);

    sortedModules.forEach((module, index) => {
      setTimeout(() => {
        this.smartImport(module.key, module.importFn);
      }, index * 100);
    });
  }

  // 清理緩存
  clearCache() {
    this.loadedModules.clear();
    this.loadingPromises.clear();
  }

  // 獲取緩存狀態
  getCacheInfo() {
    return {
      loaded: Array.from(this.loadedModules.keys()),
      loading: Array.from(this.loadingPromises.keys()),
      cacheSize: this.loadedModules.size,
    };
  }
}

// 單例實例
export const importManager = new ConditionalImportStrategy();

// 在應用啟動時預加載關鍵模組
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  setTimeout(() => {
    importManager.preloadCritical();
  }, 1000);
}

export default {
  MinimalImports,
  ConditionalImportStrategy,
  importManager,
};