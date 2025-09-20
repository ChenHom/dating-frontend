/**
 * GiftManager Component
 * 禮物管理器 - 集成禮物選擇、發送、接收動畫和歷史記錄
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { GiftSelector } from './components/GiftSelector';
import { GiftReceiveAnimation } from './components/GiftReceiveAnimation';
import { GiftHistory } from './components/GiftHistory';
import { GiftButton } from './components/GiftButton';
import { useGiftStore, Gift, GiftSend } from '@/stores/gift';
import { useAuthStore } from '@/stores/auth';

interface GiftManagerProps {
  conversationId: number;
  receiverId: number;
  receiverName: string;
  mode?: 'button' | 'history' | 'inline';
  showHistory?: boolean;
  onGiftSent?: (gift: Gift) => void;
  onGiftReceived?: (giftSend: GiftSend) => void;
  testID?: string;
}

export const GiftManager: React.FC<GiftManagerProps> = ({
  conversationId,
  receiverId,
  receiverName,
  mode = 'button',
  showHistory = false,
  onGiftSent,
  onGiftReceived,
  testID = 'gift-manager',
}) => {
  // 狀態管理
  const [showGiftSelector, setShowGiftSelector] = useState(false);
  const [showReceiveAnimation, setShowReceiveAnimation] = useState(false);
  const [receivedGift, setReceivedGift] = useState<Gift | null>(null);
  const [receivedFromName, setReceivedFromName] = useState('');

  // Stores
  const { loadGiftHistory } = useGiftStore();
  const { user } = useAuthStore();

  // 初始化禮物歷史
  useEffect(() => {
    if (mode === 'history' || showHistory) {
      loadGiftHistory(conversationId);
    }
  }, [conversationId, mode, showHistory]);

  // 處理禮物發送
  const handleGiftSent = (gift: Gift) => {
    setShowGiftSelector(false);
    onGiftSent?.(gift);
  };

  // 處理禮物接收（通常通過 WebSocket 或其他方式觸發）
  const handleGiftReceived = (giftSend: GiftSend, senderName: string) => {
    if (giftSend.gift) {
      setReceivedGift(giftSend.gift);
      setReceivedFromName(senderName);
      setShowReceiveAnimation(true);
      onGiftReceived?.(giftSend);
    }
  };

  // 禮物接收動畫完成
  const handleReceiveAnimationComplete = () => {
    setShowReceiveAnimation(false);
    setReceivedGift(null);
    setReceivedFromName('');
  };

  // 渲染不同模式
  const renderContent = () => {
    switch (mode) {
      case 'history':
        return (
          <GiftHistory
            conversationId={conversationId}
            testID={`${testID}-history`}
          />
        );

      case 'inline':
        return (
          <View style={styles.inlineContainer}>
            <GiftButton
              onPress={() => setShowGiftSelector(true)}
              size="medium"
              variant="primary"
              animated={true}
              testID={`${testID}-button`}
            />

            {showHistory && (
              <View style={styles.historySection}>
                <GiftHistory
                  conversationId={conversationId}
                  testID={`${testID}-history`}
                />
              </View>
            )}
          </View>
        );

      default: // 'button' mode
        return (
          <GiftButton
            onPress={() => setShowGiftSelector(true)}
            size="medium"
            variant="primary"
            animated={true}
            testID={`${testID}-button`}
          />
        );
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      {renderContent()}

      {/* 禮物選擇器 */}
      <GiftSelector
        isVisible={showGiftSelector}
        conversationId={conversationId}
        receiverId={receiverId}
        receiverName={receiverName}
        onClose={() => setShowGiftSelector(false)}
        onGiftSent={handleGiftSent}
        testID={`${testID}-selector`}
      />

      {/* 禮物接收動畫 */}
      <GiftReceiveAnimation
        isVisible={showReceiveAnimation}
        gift={receivedGift}
        senderName={receivedFromName}
        onComplete={handleReceiveAnimationComplete}
        testID={`${testID}-receive-animation`}
      />
    </View>
  );
};

// 額外的 Hook 用於在其他組件中觸發禮物接收動畫
export const useGiftReceiver = () => {
  const [giftManagerRef, setGiftManagerRef] = useState<GiftManager | null>(null);

  const triggerGiftReceive = (giftSend: GiftSend, senderName: string) => {
    if (giftManagerRef && 'handleGiftReceived' in giftManagerRef) {
      (giftManagerRef as any).handleGiftReceived(giftSend, senderName);
    }
  };

  return {
    setGiftManagerRef,
    triggerGiftReceive,
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  inlineContainer: {
    flex: 1,
  },
  historySection: {
    flex: 1,
    marginTop: 16,
  },
});

export default GiftManager;