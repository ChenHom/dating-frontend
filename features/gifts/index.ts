/**
 * Gifts Feature Exports
 * 禮物功能導出文件
 */

// Main Manager
export { default as GiftManager, useGiftReceiver } from './GiftManager';

// Individual Components
export { default as GiftSelector } from './components/GiftSelector';
export { default as GiftReceiveAnimation } from './components/GiftReceiveAnimation';
export { default as GiftHistory } from './components/GiftHistory';
export { default as GiftButton } from './components/GiftButton';

// Store
export { useGiftStore } from '@/stores/gift';
export type { Gift, GiftSend, GiftCooldown } from '@/stores/gift';