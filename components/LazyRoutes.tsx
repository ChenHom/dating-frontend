/**
 * Lazy Route Components
 * 懶加載路由組件 - 減少初始包大小
 */

import { lazy } from 'react';

// 探索頁面 - 包含大型卡片滑動動畫
export const LazyDiscoverScreen = lazy(() =>
  import('../app/(tabs)/discover').then(module => ({
    default: module.default
  }))
);

// 個人檔案頁面 - 包含圖片處理功能
export const LazyProfileScreen = lazy(() =>
  import('../features/profile/ProfileScreen').then(module => ({
    default: module.ProfileScreen
  }))
);

// 個人檔案編輯頁面 - 包含複雜的表單和圖片上傳
export const LazyEditProfileScreen = lazy(() =>
  import('../features/profile/EditProfileScreen').then(module => ({
    default: module.EditProfileScreen
  }))
);

// 遊戲模態窗口 - 包含複雜的遊戲邏輯和動畫
export const LazyGameModal = lazy(() =>
  import('../features/game/GameModal').then(module => ({
    default: module.GameModal
  }))
);

// 禮物管理器 - 包含複雜的禮物動畫和狀態
export const LazyGiftManager = lazy(() =>
  import('../features/gifts/GiftManager').then(module => ({
    default: module.GiftManager
  }))
);

// 設置頁面 - 包含多個配置選項
export const LazySettingsScreen = lazy(() =>
  import('../features/profile/SettingsScreen').then(module => ({
    default: module.SettingsScreen
  }))
);

// 統計頁面 - 包含圖表和數據可視化
export const LazyStatsScreen = lazy(() =>
  import('../features/profile/StatsScreen').then(module => ({
    default: module.StatsScreen
  }))
);

// 安全設置頁面
export const LazySecurityScreen = lazy(() =>
  import('../features/profile/SecurityScreen').then(module => ({
    default: module.SecurityScreen
  }))
);

// 偏好設置頁面
export const LazyPreferencesScreen = lazy(() =>
  import('../features/profile/PreferencesScreen').then(module => ({
    default: module.PreferencesScreen
  }))
);

export default {
  LazyDiscoverScreen,
  LazyProfileScreen,
  LazyEditProfileScreen,
  LazyGameModal,
  LazyGiftManager,
  LazySettingsScreen,
  LazyStatsScreen,
  LazySecurityScreen,
  LazyPreferencesScreen,
};