/**
 * GameSoundManager Component
 * 遊戲音效管理組件 - 處理遊戲中的音效和觸覺反饋
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// 音效類型定義
export type GameSoundType =
  | 'countdown'
  | 'choice_select'
  | 'choice_confirm'
  | 'round_win'
  | 'round_lose'
  | 'round_draw'
  | 'game_win'
  | 'game_lose'
  | 'time_warning'
  | 'time_critical'
  | 'opponent_join'
  | 'opponent_leave';

// 觸覺反饋類型定義
export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error';

interface GameSoundManagerProps {
  enabled: boolean;
  volume: number;
  hapticEnabled: boolean;
  children?: React.ReactNode;
}

interface SoundConfig {
  enabled: boolean;
  volume: number;
  hapticType?: HapticType;
  hapticIntensity?: Haptics.ImpactFeedbackStyle;
}

class GameSoundService {
  private static instance: GameSoundService;
  private enabled = true;
  private volume = 1.0;
  private hapticEnabled = true;
  private sounds: Map<GameSoundType, SoundConfig> = new Map();

  private constructor() {
    this.initializeSounds();
  }

  public static getInstance(): GameSoundService {
    if (!GameSoundService.instance) {
      GameSoundService.instance = new GameSoundService();
    }
    return GameSoundService.instance;
  }

  private initializeSounds() {
    // 配置各種音效和觸覺反饋
    this.sounds.set('countdown', {
      enabled: true,
      volume: 0.6,
      hapticType: 'light',
      hapticIntensity: Haptics.ImpactFeedbackStyle.Light,
    });

    this.sounds.set('choice_select', {
      enabled: true,
      volume: 0.4,
      hapticType: 'light',
      hapticIntensity: Haptics.ImpactFeedbackStyle.Light,
    });

    this.sounds.set('choice_confirm', {
      enabled: true,
      volume: 0.7,
      hapticType: 'medium',
      hapticIntensity: Haptics.ImpactFeedbackStyle.Medium,
    });

    this.sounds.set('round_win', {
      enabled: true,
      volume: 0.8,
      hapticType: 'success',
      hapticIntensity: Haptics.ImpactFeedbackStyle.Heavy,
    });

    this.sounds.set('round_lose', {
      enabled: true,
      volume: 0.6,
      hapticType: 'error',
      hapticIntensity: Haptics.ImpactFeedbackStyle.Medium,
    });

    this.sounds.set('round_draw', {
      enabled: true,
      volume: 0.5,
      hapticType: 'light',
      hapticIntensity: Haptics.ImpactFeedbackStyle.Light,
    });

    this.sounds.set('game_win', {
      enabled: true,
      volume: 1.0,
      hapticType: 'success',
      hapticIntensity: Haptics.ImpactFeedbackStyle.Heavy,
    });

    this.sounds.set('game_lose', {
      enabled: true,
      volume: 0.8,
      hapticType: 'error',
      hapticIntensity: Haptics.ImpactFeedbackStyle.Medium,
    });

    this.sounds.set('time_warning', {
      enabled: true,
      volume: 0.7,
      hapticType: 'warning',
      hapticIntensity: Haptics.ImpactFeedbackStyle.Medium,
    });

    this.sounds.set('time_critical', {
      enabled: true,
      volume: 0.9,
      hapticType: 'error',
      hapticIntensity: Haptics.ImpactFeedbackStyle.Heavy,
    });

    this.sounds.set('opponent_join', {
      enabled: true,
      volume: 0.6,
      hapticType: 'light',
      hapticIntensity: Haptics.ImpactFeedbackStyle.Light,
    });

    this.sounds.set('opponent_leave', {
      enabled: true,
      volume: 0.5,
      hapticType: 'warning',
      hapticIntensity: Haptics.ImpactFeedbackStyle.Medium,
    });
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public setHapticEnabled(enabled: boolean) {
    this.hapticEnabled = enabled;
  }

  public async playSound(type: GameSoundType, options?: Partial<SoundConfig>) {
    if (!this.enabled) return;

    const config = this.sounds.get(type);
    if (!config?.enabled) return;

    const finalVolume = (options?.volume ?? config.volume) * this.volume;

    try {
      // 在實際應用中，這裡會播放真實的音效文件
      // 例如使用 expo-av 的 Audio.Sound
      console.log(`Playing sound: ${type} with volume: ${finalVolume}`);

      // 模擬音效播放
      await this.simulateAudioPlayback(type, finalVolume);

      // 觸覺反饋
      if (this.hapticEnabled) {
        await this.playHaptic(config.hapticType, config.hapticIntensity);
      }
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  private async simulateAudioPlayback(type: GameSoundType, volume: number) {
    // 模擬音效播放延遲
    return new Promise<void>((resolve) => {
      setTimeout(resolve, 100);
    });
  }

  private async playHaptic(type?: HapticType, intensity?: Haptics.ImpactFeedbackStyle) {
    if (!this.hapticEnabled) return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        default:
          if (intensity) {
            await Haptics.impactAsync(intensity);
          }
          break;
      }
    } catch (error) {
      console.warn('Failed to play haptic feedback:', error);
    }
  }

  public async playSequence(sequence: Array<{ type: GameSoundType; delay?: number }>) {
    for (const item of sequence) {
      if (item.delay) {
        await new Promise(resolve => setTimeout(resolve, item.delay));
      }
      await this.playSound(item.type);
    }
  }
}

export const GameSoundManager: React.FC<GameSoundManagerProps> = ({
  enabled,
  volume,
  hapticEnabled,
  children,
}) => {
  const soundService = useRef(GameSoundService.getInstance());

  useEffect(() => {
    soundService.current.setEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    soundService.current.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    soundService.current.setHapticEnabled(hapticEnabled);
  }, [hapticEnabled]);

  return <>{children}</>;
};

// Hook for using game sounds
export const useGameSounds = () => {
  const soundService = useRef(GameSoundService.getInstance());

  const playSound = useCallback(async (type: GameSoundType, options?: Partial<SoundConfig>) => {
    await soundService.current.playSound(type, options);
  }, []);

  const playSequence = useCallback(async (sequence: Array<{ type: GameSoundType; delay?: number }>) => {
    await soundService.current.playSequence(sequence);
  }, []);

  const playCountdownSequence = useCallback(async () => {
    // 倒計時音效序列：3-2-1-開始
    await playSequence([
      { type: 'countdown', delay: 0 },
      { type: 'countdown', delay: 1000 },
      { type: 'countdown', delay: 1000 },
      { type: 'choice_confirm', delay: 1000 },
    ]);
  }, [playSequence]);

  const playRoundResult = useCallback(async (result: 'win' | 'lose' | 'draw') => {
    switch (result) {
      case 'win':
        await playSound('round_win');
        break;
      case 'lose':
        await playSound('round_lose');
        break;
      case 'draw':
        await playSound('round_draw');
        break;
    }
  }, [playSound]);

  const playGameResult = useCallback(async (result: 'win' | 'lose') => {
    // 遊戲結束音效序列
    const sequence = result === 'win'
      ? [
          { type: 'game_win' as GameSoundType, delay: 0 },
          { type: 'choice_confirm' as GameSoundType, delay: 500 },
          { type: 'choice_confirm' as GameSoundType, delay: 200 },
        ]
      : [
          { type: 'game_lose' as GameSoundType, delay: 0 },
        ];

    await playSequence(sequence);
  }, [playSequence]);

  const playTimeWarning = useCallback(async (timeLeft: number) => {
    if (timeLeft <= 3) {
      await playSound('time_critical');
    } else if (timeLeft <= 5) {
      await playSound('time_warning');
    }
  }, [playSound]);

  return {
    playSound,
    playSequence,
    playCountdownSequence,
    playRoundResult,
    playGameResult,
    playTimeWarning,
  };
};

// 預設的聲音管理器實例
export const gameSoundManager = GameSoundService.getInstance();

export default GameSoundManager;