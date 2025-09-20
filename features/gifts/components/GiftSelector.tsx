/**
 * GiftSelector Component
 * 禮物選擇器 - 顯示禮物網格並處理選擇和發送
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGiftStore, Gift } from '@/stores/gift';

interface GiftSelectorProps {
  isVisible: boolean;
  conversationId: number;
  receiverId: number;
  receiverName: string;
  onClose: () => void;
  onGiftSent?: (gift: Gift) => void;
  testID?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const GiftSelector: React.FC<GiftSelectorProps> = ({
  isVisible,
  conversationId,
  receiverId,
  receiverName,
  onClose,
  onGiftSent,
  testID = 'gift-selector',
}) => {
  // 動畫值
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 禮物 store
  const {
    gifts,
    isLoadingGifts,
    isSending,
    sendingGiftId,
    error,
    loadGifts,
    sendGift,
    checkCooldown,
    getCooldownTimeLeft,
    clearError,
  } = useGiftStore();

  // 選中的禮物
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [cooldownTimers, setCooldownTimers] = useState<Record<number, number>>({});

  // 載入禮物目錄
  useEffect(() => {
    if (isVisible && gifts.length === 0) {
      loadGifts();
    }
  }, [isVisible]);

  // 入場動畫
  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // 啟動冷卻計時器
      startCooldownTimers();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setSelectedGift(null);
    }
  }, [isVisible]);

  // 脈衝動畫
  useEffect(() => {
    if (selectedGift) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    }
  }, [selectedGift]);

  // 冷卻計時器
  const startCooldownTimers = () => {
    const updateTimers = () => {
      const newTimers: Record<number, number> = {};
      gifts.forEach(gift => {
        if (!checkCooldown(gift.id)) {
          newTimers[gift.id] = getCooldownTimeLeft(gift.id);
        }
      });
      setCooldownTimers(newTimers);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);

    return () => clearInterval(interval);
  };

  // 處理禮物選擇
  const handleGiftSelect = (gift: Gift) => {
    if (!checkCooldown(gift.id)) {
      const timeLeft = getCooldownTimeLeft(gift.id);
      Alert.alert(
        '禮物冷卻中',
        `「${gift.name}」還需等待 ${timeLeft} 秒才能再次發送`,
        [{ text: '確定', style: 'default' }]
      );
      return;
    }

    setSelectedGift(selectedGift?.id === gift.id ? null : gift);
  };

  // 發送禮物
  const handleSendGift = async () => {
    if (!selectedGift) return;

    const success = await sendGift(conversationId, receiverId, selectedGift.id);

    if (success) {
      onGiftSent?.(selectedGift);
      Alert.alert(
        '禮物已發送',
        `你向 ${receiverName} 發送了「${selectedGift.name}」`,
        [
          {
            text: '確定',
            onPress: () => {
              setSelectedGift(null);
              onClose();
            }
          }
        ]
      );
    }
  };

  // 格式化冷卻時間
  const formatCooldownTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // 錯誤處理
  useEffect(() => {
    if (error) {
      Alert.alert('錯誤', error, [
        { text: '確定', onPress: clearError }
      ]);
    }
  }, [error]);

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Ionicons name="gift" size={24} color="#f59e0b" />
              <Text style={styles.title}>發送禮物</Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              testID={`${testID}-close`}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.receiverInfo}>
            <Text style={styles.receiverText}>
              發送給: <Text style={styles.receiverName}>{receiverName}</Text>
            </Text>
          </View>

          {/* Gift Grid */}
          <ScrollView
            style={styles.giftGrid}
            contentContainerStyle={styles.giftGridContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoadingGifts ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>載入禮物中...</Text>
              </View>
            ) : (
              <View style={styles.giftsContainer}>
                {gifts.map((gift) => {
                  const isSelected = selectedGift?.id === gift.id;
                  const isOnCooldown = !checkCooldown(gift.id);
                  const cooldownTime = cooldownTimers[gift.id] || 0;
                  const isSendingThis = isSending && sendingGiftId === gift.id;

                  return (
                    <Animated.View
                      key={gift.id}
                      style={[
                        styles.giftItem,
                        isSelected && {
                          transform: [{ scale: pulseAnim }]
                        }
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.giftButton,
                          isSelected && styles.giftButtonSelected,
                          isOnCooldown && styles.giftButtonCooldown,
                          isSendingThis && styles.giftButtonSending,
                        ]}
                        onPress={() => handleGiftSelect(gift)}
                        disabled={isSendingThis}
                        testID={`${testID}-gift-${gift.id}`}
                      >
                        <View style={styles.giftImageContainer}>
                          <Image
                            source={{ uri: gift.icon_url }}
                            style={[
                              styles.giftImage,
                              isOnCooldown && styles.giftImageCooldown
                            ]}
                            defaultSource={require('@/assets/images/default-gift.png')}
                          />

                          {isSelected && (
                            <View style={styles.selectedIndicator}>
                              <Ionicons name="checkmark" size={16} color="#fff" />
                            </View>
                          )}

                          {isSendingThis && (
                            <View style={styles.sendingIndicator}>
                              <Ionicons name="time" size={16} color="#fff" />
                            </View>
                          )}
                        </View>

                        <Text
                          style={[
                            styles.giftName,
                            isOnCooldown && styles.giftNameCooldown
                          ]}
                          numberOfLines={1}
                        >
                          {gift.name}
                        </Text>

                        {isOnCooldown && (
                          <Text style={styles.cooldownText}>
                            {formatCooldownTime(cooldownTime)}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Send Button */}
          {selectedGift && (
            <View style={styles.sendContainer}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  isSending && styles.sendButtonDisabled
                ]}
                onPress={handleSendGift}
                disabled={isSending}
                testID={`${testID}-send`}
              >
                {isSending ? (
                  <Ionicons name="time" size={20} color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
                <Text style={styles.sendButtonText}>
                  {isSending ? '發送中...' : `發送「${selectedGift.name}」`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.8,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
  },
  closeButton: {
    padding: 8,
  },
  receiverInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  receiverText: {
    fontSize: 14,
    color: '#6b7280',
  },
  receiverName: {
    fontWeight: '600',
    color: '#1f2937',
  },
  giftGrid: {
    flex: 1,
    paddingHorizontal: 20,
  },
  giftGridContent: {
    paddingVertical: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  giftsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  giftItem: {
    width: '31%',
    marginBottom: 16,
  },
  giftButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  giftButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  giftButtonCooldown: {
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  giftButtonSending: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  giftImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  giftImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  giftImageCooldown: {
    opacity: 0.5,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendingIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  giftNameCooldown: {
    color: '#9ca3af',
  },
  cooldownText: {
    fontSize: 10,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 2,
  },
  sendContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default GiftSelector;