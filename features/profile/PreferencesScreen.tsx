/**
 * PreferencesScreen Component
 * 用戶偏好設置頁面 - 管理配對偏好和篩選條件
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProfilePreferences, ProfilePreferencesData } from './components/ProfilePreferences';
import { useAuthStore } from '@/stores/auth';

export const PreferencesScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [preferences, setPreferences] = useState<ProfilePreferencesData>({
    min_age: 18,
    max_age: 35,
    max_distance: 25,
    show_online_only: false,
    show_verified_only: false,
    interested_in: 'both',
    interests: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      // TODO: 從 API 加載用戶偏好設置
      // const response = await apiClient.getUserPreferences();
      // setPreferences(response);

      // 暫時使用默認值
      setPreferences({
        min_age: 18,
        max_age: 35,
        max_distance: 25,
        show_online_only: false,
        show_verified_only: false,
        interested_in: 'both',
        interests: [],
      });
    } catch (error) {
      console.error('Failed to load preferences:', error);
      Alert.alert('錯誤', '無法載入偏好設置');
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      // TODO: 保存到 API
      // await apiClient.updateUserPreferences(preferences);

      // 暫時模擬保存
      await new Promise(resolve => setTimeout(resolve, 1000));

      setHasChanges(false);
      Alert.alert('成功', '偏好設置已保存');
      router.back();
    } catch (error) {
      console.error('Failed to save preferences:', error);
      Alert.alert('錯誤', '保存偏好設置失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesChange = (newPreferences: ProfilePreferencesData) => {
    setPreferences(newPreferences);
    setHasChanges(true);
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        '未保存的更改',
        '您有未保存的更改，確定要離開嗎？',
        [
          { text: '取消', style: 'cancel' },
          { text: '離開', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        testID="preferences-back-button"
      >
        <Ionicons name="arrow-back" size={24} color="#333333" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>偏好設置</Text>

      <TouchableOpacity
        style={[
          styles.saveButton,
          (!hasChanges || isSaving) && styles.saveButtonDisabled,
        ]}
        onPress={savePreferences}
        disabled={!hasChanges || isSaving}
        testID="preferences-save-button"
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.saveButtonText}>保存</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E91E63" />
          <Text style={styles.loadingText}>載入設置中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <ProfilePreferences
        preferences={preferences}
        onPreferencesChange={handlePreferencesChange}
        testID="preferences-form"
      />

      {hasChanges && (
        <View style={styles.changesIndicator}>
          <View style={styles.changesIndicatorContent}>
            <Ionicons name="information-circle" size={16} color="#E91E63" />
            <Text style={styles.changesIndicatorText}>您有未保存的更改</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  changesIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff5f5',
    borderTopWidth: 1,
    borderTopColor: '#E91E63',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  changesIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changesIndicatorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#E91E63',
    fontWeight: '500',
  },
});

export default PreferencesScreen;