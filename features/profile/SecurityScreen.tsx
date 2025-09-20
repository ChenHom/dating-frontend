/**
 * SecurityScreen Component
 * 安全設置頁面 - 管理帳戶安全、隱私設置等
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
import { SecuritySettings, SecuritySettingsData } from './components/SecuritySettings';
import { useAuthStore } from '@/stores/auth';

export const SecurityScreen: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [settings, setSettings] = useState<SecuritySettingsData>({
    email_notifications: true,
    push_notifications: true,
    show_online_status: true,
    show_distance: true,
    allow_message_requests: false,
    block_screenshot: false,
    two_factor_enabled: false,
    profile_visibility: 'public',
    last_password_change: '2024-01-01T00:00:00Z',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    setIsLoading(true);
    try {
      // TODO: 從 API 加載安全設置
      // const response = await apiClient.getSecuritySettings();
      // setSettings(response);

      // 暫時使用默認值
      setSettings({
        email_notifications: true,
        push_notifications: true,
        show_online_status: true,
        show_distance: true,
        allow_message_requests: false,
        block_screenshot: false,
        two_factor_enabled: false,
        profile_visibility: 'public',
        last_password_change: '2024-01-01T00:00:00Z',
      });
    } catch (error) {
      console.error('Failed to load security settings:', error);
      Alert.alert('錯誤', '無法載入安全設置');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSecuritySettings = async () => {
    setIsSaving(true);
    try {
      // TODO: 保存到 API
      // await apiClient.updateSecuritySettings(settings);

      // 暫時模擬保存
      await new Promise(resolve => setTimeout(resolve, 1000));

      setHasChanges(false);
      Alert.alert('成功', '安全設置已保存');
    } catch (error) {
      console.error('Failed to save security settings:', error);
      Alert.alert('錯誤', '保存安全設置失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingsChange = (newSettings: SecuritySettingsData) => {
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleChangePassword = () => {
    Alert.alert(
      '更改密碼',
      '您將被重定向到密碼更改頁面',
      [
        { text: '取消', style: 'cancel' },
        { text: '繼續', onPress: () => router.push('/auth/change-password') },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    try {
      // TODO: 調用刪除帳戶 API
      // await apiClient.deleteAccount();

      // 暫時模擬刪除
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        '帳戶已刪除',
        '您的帳戶已成功刪除',
        [
          { text: '確定', onPress: () => logout() },
        ]
      );
    } catch (error) {
      console.error('Failed to delete account:', error);
      Alert.alert('錯誤', '刪除帳戶失敗，請稍後再試');
    }
  };

  const handleExportData = async () => {
    try {
      // TODO: 調用數據導出 API
      // const response = await apiClient.exportUserData();
      // const downloadUrl = response.download_url;

      // 暫時模擬導出
      await new Promise(resolve => setTimeout(resolve, 3000));

      Alert.alert(
        '數據導出完成',
        '您的數據導出已完成，下載鏈接已發送到您的電子郵件。',
        [{ text: '確定' }]
      );
    } catch (error) {
      console.error('Failed to export data:', error);
      Alert.alert('錯誤', '數據導出失敗，請稍後再試');
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        '未保存的更改',
        '您有未保存的更改，確定要離開嗎？',
        [
          { text: '取消', style: 'cancel' },
          { text: '離開', style: 'destructive', onPress: () => router.back() },
          { text: '保存', onPress: saveSecuritySettings },
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
        testID="security-back-button"
      >
        <Ionicons name="arrow-back" size={24} color="#333333" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>安全設置</Text>

      <TouchableOpacity
        style={[
          styles.saveButton,
          (!hasChanges || isSaving) && styles.saveButtonDisabled,
        ]}
        onPress={saveSecuritySettings}
        disabled={!hasChanges || isSaving}
        testID="security-save-button"
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

      <SecuritySettings
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onChangePassword={handleChangePassword}
        onDeleteAccount={handleDeleteAccount}
        onExportData={handleExportData}
        testID="security-settings-form"
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
    backgroundColor: '#f8f9fa',
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

export default SecurityScreen;