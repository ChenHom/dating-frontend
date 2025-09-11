/**
 * MatchSuccessScreen Component
 * 配對成功頁面 - 展示新的配對結果
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useMatchStore } from '@/stores/match';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const MatchSuccessScreen: React.FC = () => {
  const params = useLocalSearchParams<{ matchedUserId: string }>();
  const { newMatch, clearNewMatch } = useMatchStore();
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const heartsAnim = new Animated.Value(0);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(heartsAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(heartsAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  const handleStartChat = () => {
    if (newMatch) {
      clearNewMatch();
      router.push(`/chat/${newMatch.id}`);
    }
  };

  const handleContinueExploring = () => {
    clearNewMatch();
    router.replace('/discover');
  };

  const handleBack = () => {
    clearNewMatch();
    router.back();
  };

  if (!newMatch) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={64} color="#FFFFFF" />
          <Text style={styles.errorTitle}>配對資訊載入失敗</Text>
          <Text style={styles.errorText}>無法載入配對資訊，請重試</Text>
          <TouchableOpacity onPress={handleBack} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const matchedUser = newMatch;
  const photoUrl = matchedUser.profile?.primary_photo_url;

  return (
    <SafeAreaView 
      style={styles.container} 
      accessibilityLabel="配對成功頁面"
    >
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />
      
      <LinearGradient
        colors={['#FF6B6B', '#FF8E8E', '#FFB3B3']}
        style={styles.gradient}
      >
        {/* Animated Hearts Background */}
        <Animated.View
          testID="celebration-hearts"
          style={[
            styles.heartsContainer,
            {
              opacity: heartsAnim,
            },
          ]}
        >
          {[...Array(6)].map((_, index) => (
            <Ionicons
              key={index}
              name="heart"
              size={20 + (index % 3) * 10}
              color="rgba(255, 255, 255, 0.3)"
              style={[
                styles.heart,
                {
                  left: `${15 + (index * 12)}%`,
                  top: `${10 + (index % 2) * 70}%`,
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Main Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Success Title */}
          <View style={styles.titleContainer}>
            <Ionicons name="heart" size={40} color="#FFFFFF" />
            <Text style={styles.title}>配對成功！</Text>
            <Text style={styles.subtitle}>你們互相喜歡對方</Text>
          </View>

          {/* User Photo */}
          <View style={styles.photoContainer}>
            {photoUrl ? (
              <Image
                testID="matched-user-photo"
                source={{ uri: photoUrl }}
                style={styles.photo}
                contentFit="cover"
              />
            ) : (
              <View style={styles.defaultPhoto} testID="default-photo">
                <Ionicons name="person" size={80} color="#999" />
              </View>
            )}
            <View style={styles.photoOverlay}>
              <Ionicons name="heart" size={30} color="#FFFFFF" />
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {matchedUser.profile?.display_name || '未知用戶'}
            </Text>
            {matchedUser.profile?.bio && (
              <Text style={styles.userBio} numberOfLines={2}>
                {matchedUser.profile.bio}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleStartChat}
              accessibilityLabel={`開始與 ${matchedUser.profile?.display_name} 聊天`}
            >
              <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>開始聊天</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleContinueExploring}
              accessibilityLabel="繼續探索更多用戶"
            >
              <Ionicons name="search" size={20} color="#FF6B6B" />
              <Text style={styles.secondaryButtonText}>繼續探索</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  heartsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  heart: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    zIndex: 2,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    textAlign: 'center',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#F5F5F5',
  },
  defaultPhoto: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 50,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  userBio: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FF6B6B',
  },
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 30,
  },
  errorButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
});