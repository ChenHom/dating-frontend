/**
 * GiftReceiveAnimation Component
 * 禮物接收動畫 - 顯示收到禮物時的慶祝效果
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Image,
} from 'react-native';
import { Gift } from '@/stores/gift';

interface GiftReceiveAnimationProps {
  isVisible: boolean;
  gift: Gift | null;
  senderName: string;
  onComplete?: () => void;
  testID?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
}

export const GiftReceiveAnimation: React.FC<GiftReceiveAnimationProps> = ({
  isVisible,
  gift,
  senderName,
  onComplete,
  testID = 'gift-receive-animation',
}) => {
  // 動畫值
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 漂浮表情符號
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  // 創建漂浮表情符號
  const createFloatingEmojis = () => {
    const emojis = ['🎉', '✨', '💖', '🌟', '💫', '🎊', '💝', '🥰'];
    const newEmojis: FloatingEmoji[] = [];

    for (let i = 0; i < 12; i++) {
      newEmojis.push({
        id: i,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: new Animated.Value(screenWidth * 0.5),
        y: new Animated.Value(screenHeight * 0.5),
        scale: new Animated.Value(0),
        opacity: new Animated.Value(1),
        rotation: new Animated.Value(0),
      });
    }

    setFloatingEmojis(newEmojis);
  };

  // 動畫漂浮表情符號
  const animateFloatingEmojis = () => {
    const animations = floatingEmojis.map((emoji, index) => {
      const angle = (index / floatingEmojis.length) * Math.PI * 2;
      const radius = 100 + Math.random() * 50;
      const targetX = screenWidth * 0.5 + Math.cos(angle) * radius;
      const targetY = screenHeight * 0.5 + Math.sin(angle) * radius;

      return Animated.parallel([
        // 位置動畫
        Animated.timing(emoji.x, {
          toValue: targetX,
          duration: 1000 + Math.random() * 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(emoji.y, {
          toValue: targetY,
          duration: 1000 + Math.random() * 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),

        // 縮放動畫
        Animated.sequence([
          Animated.timing(emoji.scale, {
            toValue: 1.2,
            duration: 300,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
          Animated.timing(emoji.scale, {
            toValue: 0,
            duration: 800,
            delay: 500,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),

        // 透明度動畫
        Animated.sequence([
          Animated.timing(emoji.opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(emoji.opacity, {
            toValue: 0,
            duration: 800,
            delay: 500,
            useNativeDriver: true,
          }),
        ]),

        // 旋轉動畫
        Animated.timing(emoji.rotation, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start();
  };

  // 主要動畫序列
  useEffect(() => {
    if (isVisible && gift) {
      // 創建漂浮效果
      createFloatingEmojis();

      // 主要動畫序列
      Animated.sequence([
        // 1. 快速淡入
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),

        // 2. 爆炸性縮放
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 4,
          useNativeDriver: true,
        }),

        // 3. 彈跳效果
        Animated.spring(bounceAnim, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      // 閃爍動畫
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 脈衝動畫
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 延遲啟動漂浮動畫
      setTimeout(() => {
        animateFloatingEmojis();
      }, 300);

      // 自動關閉
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          onComplete?.();
        });
      }, 3500);

    } else if (!isVisible) {
      // 重置動畫值
      fadeAnim.setValue(0);
      scaleAnim.setValue(0);
      bounceAnim.setValue(0);
      sparkleAnim.setValue(0);
      pulseAnim.setValue(1);
      setFloatingEmojis([]);
    }
  }, [isVisible, gift]);

  if (!isVisible || !gift) return null;

  return (
    <View style={styles.container} testID={testID}>
      {/* 背景遮罩 */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.8],
            }),
          },
        ]}
      />

      {/* 漂浮表情符號 */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {floatingEmojis.map((emoji) => (
          <Animated.View
            key={emoji.id}
            style={[
              styles.floatingEmoji,
              {
                left: emoji.x,
                top: emoji.y,
                transform: [
                  { scale: emoji.scale },
                  {
                    rotate: emoji.rotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
                opacity: emoji.opacity,
              },
            ]}
          >
            <Text style={styles.emojiText}>{emoji.emoji}</Text>
          </Animated.View>
        ))}
      </View>

      {/* 主要內容 */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              {
                scale: bounceAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.05],
                }),
              },
              {
                scale: pulseAnim,
              },
            ],
          },
        ]}
      >
        {/* 禮物圖片容器 */}
        <Animated.View
          style={[
            styles.giftContainer,
            {
              shadowOpacity: sparkleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
            },
          ]}
        >
          <Image
            source={{ uri: gift.icon_url }}
            style={styles.giftImage}
            defaultSource={require('@/assets/images/default-gift.png')}
          />

          {/* 光環效果 */}
          <Animated.View
            style={[
              styles.giftHalo,
              {
                opacity: sparkleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
                transform: [
                  {
                    scale: sparkleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
        </Animated.View>

        {/* 文字內容 */}
        <View style={styles.textContainer}>
          <Animated.Text
            style={[
              styles.titleText,
              {
                opacity: sparkleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ]}
          >
            🎁 收到禮物！
          </Animated.Text>

          <Text style={styles.giftNameText}>{gift.name}</Text>

          <Text style={styles.senderText}>
            來自 <Text style={styles.senderNameText}>{senderName}</Text>
          </Text>
        </View>

        {/* 裝飾星星 */}
        <View style={styles.decorativeStars}>
          {['⭐', '✨', '🌟'].map((star, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.decorativeStar,
                {
                  transform: [
                    {
                      scale: sparkleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    },
                    {
                      rotate: sparkleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    },
                  ],
                  opacity: sparkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ]}
            >
              {star}
            </Animated.Text>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    margin: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  giftContainer: {
    position: 'relative',
    marginBottom: 24,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 8,
  },
  giftImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  giftHalo: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 26,
    backgroundColor: '#fbbf24',
    opacity: 0.3,
  },
  textContainer: {
    alignItems: 'center',
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  giftNameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 8,
    textAlign: 'center',
  },
  senderText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  senderNameText: {
    fontWeight: '600',
    color: '#1f2937',
  },
  decorativeStars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
  },
  decorativeStar: {
    fontSize: 20,
  },
  floatingEmoji: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 20,
  },
});

export default GiftReceiveAnimation;