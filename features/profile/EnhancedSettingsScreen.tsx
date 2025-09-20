/**
 * Enhanced Settings Screen
 * 增強版設置頁面 - 整合所有個人檔案管理功能
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth';

export const EnhancedSettingsScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  // Basic settings states
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      '確認登出',
      '您確定要登出嗎？',
      [
        { text: '取消', style: 'cancel' },
        { text: '登出', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '刪除帳戶',
      '此操作無法撤銷，您的所有資料將被永久刪除。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            console.log('Delete account');
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        testID="settings-back-button"
      >
        <Ionicons name="arrow-back" size={24} color="#333333" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>設置</Text>

      <View style={styles.headerRight} />
    </View>
  );

  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const renderNavigationOption = (
    title: string,
    subtitle: string,
    icon: keyof typeof Ionicons.glyphMap,
    onPress: () => void,
    testId?: string
  ) => (
    <TouchableOpacity
      style={styles.navigationOption}
      onPress={onPress}
      testID={testId}
    >
      <View style={styles.navigationIconContainer}>
        <Ionicons name={icon} size={20} color="#666666" />
      </View>
      <View style={styles.navigationContent}>
        <Text style={styles.navigationTitle}>{title}</Text>
        <Text style={styles.navigationSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
    </TouchableOpacity>
  );

  const renderSwitchOption = (
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    testId?: string
  ) => (
    <View style={styles.switchOption}>
      <View style={styles.switchContent}>
        <Text style={styles.switchTitle}>{title}</Text>
        <Text style={styles.switchSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E0E0E0', true: '#E91E63' }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
        testID={testId}
      />
    </View>
  );

  const renderActionOption = (
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    onPress: () => void,
    isDestructive = false,
    testId?: string
  ) => (
    <TouchableOpacity
      style={styles.actionOption}
      onPress={onPress}
      testID={testId}
    >
      <View style={styles.actionIconContainer}>
        <Ionicons
          name={icon}
          size={20}
          color={isDestructive ? '#F44336' : '#666666'}
        />
      </View>
      <Text style={[styles.actionTitle, isDestructive && styles.destructiveText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Management */}
        <View style={styles.section}>
          {renderSectionHeader('個人檔案管理')}

          {renderNavigationOption(
            '編輯個人檔案',
            '修改您的個人資料和照片',
            'person-circle',
            () => router.push('/profile/edit'),
            'edit-profile-option'
          )}

          {renderNavigationOption(
            '我的統計',
            '查看活動統計和配對數據',
            'stats-chart',
            () => router.push('/profile/stats'),
            'stats-option'
          )}

          {renderNavigationOption(
            '配對偏好',
            '設置年齡範圍、距離和興趣',
            'heart',
            () => router.push('/profile/preferences'),
            'preferences-option'
          )}
        </View>

        {/* Account & Security */}
        <View style={styles.section}>
          {renderSectionHeader('帳戶與安全')}

          {renderNavigationOption(
            '安全設置',
            '密碼、隱私和帳戶安全',
            'shield-checkmark',
            () => router.push('/profile/security'),
            'security-option'
          )}

          {renderNavigationOption(
            '通知設置',
            '管理推送和電子郵件通知',
            'notifications',
            () => router.push('/profile/notifications'),
            'notifications-option'
          )}

          {renderNavigationOption(
            '隱私控制',
            '控制誰可以看到您的資料',
            'eye',
            () => router.push('/profile/privacy'),
            'privacy-option'
          )}
        </View>

        {/* Quick Settings */}
        <View style={styles.section}>
          {renderSectionHeader('快速設置')}

          {renderSwitchOption(
            '推送通知',
            '接收新配對和訊息通知',
            pushNotifications,
            setPushNotifications,
            'push-notifications-switch'
          )}

          {renderSwitchOption(
            '電子郵件通知',
            '接收重要更新的電子郵件',
            emailNotifications,
            setEmailNotifications,
            'email-notifications-switch'
          )}

          {renderSwitchOption(
            '位置分享',
            '顯示您與其他用戶的距離',
            locationSharing,
            setLocationSharing,
            'location-sharing-switch'
          )}
        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          {renderSectionHeader('幫助與支援')}

          {renderNavigationOption(
            '常見問題',
            '查看常見問題解答',
            'help-circle',
            () => router.push('/support/faq'),
            'faq-option'
          )}

          {renderNavigationOption(
            '聯繫客服',
            '獲得即時幫助和支援',
            'chatbubble-ellipses',
            () => router.push('/support/contact'),
            'contact-option'
          )}

          {renderNavigationOption(
            '使用條款',
            '查看服務條款和隱私政策',
            'document-text',
            () => router.push('/legal/terms'),
            'terms-option'
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          {renderSectionHeader('帳戶操作')}

          {renderActionOption(
            '登出',
            'log-out',
            handleLogout,
            false,
            'logout-button'
          )}

          {renderActionOption(
            '刪除帳戶',
            'trash',
            handleDeleteAccount,
            true,
            'delete-account-button'
          )}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>版本 1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 Dating App</Text>
        </View>
      </ScrollView>
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
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  navigationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  navigationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  navigationContent: {
    flex: 1,
  },
  navigationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  navigationSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  switchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchContent: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  switchSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  destructiveText: {
    color: '#F44336',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appVersion: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#CCCCCC',
  },
});

export default EnhancedSettingsScreen;