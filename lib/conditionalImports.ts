/**
 * Conditional Imports
 * 條件導入 - 根據平台和需求動態導入組件
 */

// 按需導入圖標
export const Icons = {
  // 只導入需要的圖標，而不是整個圖標庫
  Ionicons: () => import('@expo/vector-icons/Ionicons').then(m => m.default),
  AntDesign: () => import('@expo/vector-icons/AntDesign').then(m => m.default),
  MaterialIcons: () => import('@expo/vector-icons/MaterialIcons').then(m => m.default),
};

// 按需導入功能模組
export const Features = {
  // 遊戲相關功能
  GameModal: () => import('../features/game/GameModal').then(m => ({ default: m.GameModal })),
  GameButton: () => import('../features/game/components/GameButton').then(m => ({ default: m.GameButton })),
  GameInvite: () => import('../features/game/components/GameInvite').then(m => ({ default: m.GameInvite })),

  // 禮物相關功能
  GiftManager: () => import('../features/gifts/GiftManager').then(m => ({ default: m.GiftManager })),
  GiftSelector: () => import('../features/gifts/components/GiftSelector').then(m => ({ default: m.GiftSelector })),

  // 個人檔案相關功能
  ProfileEditor: () => import('../features/profile/EditProfileScreen').then(m => ({ default: m.EditProfileScreen })),
  PhotoManager: () => import('../features/profile/components/PhotoManager').then(m => ({ default: m.PhotoManager })),
  ProfileStats: () => import('../features/profile/components/ProfileStats').then(m => ({ default: m.ProfileStats })),

  // 設置相關功能
  SettingsScreen: () => import('../features/profile/SettingsScreen').then(m => ({ default: m.SettingsScreen })),
  SecurityScreen: () => import('../features/profile/SecurityScreen').then(m => ({ default: m.SecurityScreen })),

  // 聊天相關功能
  MessageBubble: () => import('../features/chat/components/MessageBubble').then(m => ({ default: m.MessageBubble })),
  TypingIndicator: () => import('../features/chat/components/TypingIndicator').then(m => ({ default: m.TypingIndicator })),
};

// 按需導入動畫組件
export const Animations = {
  VictoryCelebration: () => import('../features/game/components/VictoryCelebration').then(m => ({ default: m.VictoryCelebration })),
  GiftReceiveAnimation: () => import('../features/gifts/components/GiftReceiveAnimation').then(m => ({ default: m.GiftReceiveAnimation })),
  HandGestureAnimation: () => import('../features/game/components/HandGestureAnimation').then(m => ({ default: m.HandGestureAnimation })),
};

// 按需導入工具庫
export const Utils = {
  // 圖片處理工具 - 只在需要時導入
  ImageUtils: () => import('../lib/imageUtils'),
  // 驗證工具
  Validation: () => import('../lib/validation'),
  // 日期工具 - 使用較小的替代方案
  DateUtils: () => import('date-fns/format').then(m => ({ format: m.format })),
};

// 創建條件導入 Hook
import { useState, useEffect } from 'react';

export function useConditionalImport<T>(
  importFn: () => Promise<T>,
  condition: boolean = true
): [T | null, boolean, Error | null] {
  const [module, setModule] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!condition) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    importFn()
      .then(m => {
        if (!cancelled) {
          setModule(m);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [condition, importFn]);

  return [module, loading, error];
}

export default {
  Icons,
  Features,
  Animations,
  Utils,
  useConditionalImport,
};