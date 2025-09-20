/**
 * SecuritySettings Component
 * 賬戶安全設置組件 - 管理密碼、隱私設置、賬戶安全等
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SecuritySettingsData {
  email_notifications: boolean;
  push_notifications: boolean;
  show_online_status: boolean;
  show_distance: boolean;
  allow_message_requests: boolean;
  block_screenshot: boolean;
  two_factor_enabled: boolean;
  profile_visibility: 'public' | 'matches_only' | 'private';
  last_password_change: string;
}

interface SecuritySettingsProps {
  settings: SecuritySettingsData;
  onSettingsChange: (settings: SecuritySettingsData) => void;
  onChangePassword: () => void;
  onDeleteAccount: () => void;
  onExportData: () => void;
  testID?: string;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  settings,
  onSettingsChange,
  onChangePassword,
  onDeleteAccount,
  onExportData,
  testID = 'security-settings',
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isExporting, setIsExporting] = useState(false);

  const updateSetting = (key: keyof SecuritySettingsData, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      await onExportData();
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '刪除帳戶',
      '此操作無法撤銷，您的所有資料將被永久刪除。確定要繼續嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '確認刪除',
              '請再次確認，您真的要刪除帳戶嗎？',
              [
                { text: '取消', style: 'cancel' },
                { text: '確定刪除', style: 'destructive', onPress: onDeleteAccount },
              ]
            );
          },
        },
      ]
    );
  };

  const formatLastPasswordChange = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return '今天';
    if (diffInDays === 1) return '昨天';
    if (diffInDays < 30) return `${diffInDays} 天前`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} 個月前`;
    return `${Math.floor(diffInDays / 365)} 年前`;
  };

  const renderSectionHeader = (title: string, subtitle?: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderSwitchOption = (
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    icon: keyof typeof Ionicons.glyphMap,
    testId?: string
  ) => (
    <View style={styles.optionRow}>
      <View style={styles.optionIcon}>
        <Ionicons name={icon} size={20} color="#666666" />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
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
    subtitle: string,
    onPress: () => void,
    icon: keyof typeof Ionicons.glyphMap,
    isDestructive = false,
    isLoading = false,
    testId?: string
  ) => (
    <TouchableOpacity
      style={styles.optionRow}
      onPress={onPress}
      disabled={isLoading}
      testID={testId}
    >
      <View style={styles.optionIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={isDestructive ? '#F44336' : '#666666'}
        />
      </View>
      <View style={styles.optionContent}>
        <Text style={[styles.optionTitle, isDestructive && styles.destructiveText]}>
          {title}
        </Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color="#666666" />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
      )}
    </TouchableOpacity>
  );

  const renderVisibilityOption = () => (
    <View style={styles.section}>
      {renderSectionHeader('個人資料可見性', '控制誰可以看到您的個人資料')}

      {[
        { value: 'public', label: '公開', description: '所有用戶都可以看到' },
        { value: 'matches_only', label: '僅配對用戶', description: '只有配對的用戶才能看到' },
        { value: 'private', label: '私人', description: '完全隱藏個人資料' },
      ].map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.visibilityOption,
            localSettings.profile_visibility === option.value && styles.visibilityOptionSelected,
          ]}
          onPress={() => updateSetting('profile_visibility', option.value)}
          testID={`${testID}-visibility-${option.value}`}
        >
          <View style={styles.visibilityOptionContent}>
            <Text style={[
              styles.visibilityLabel,
              localSettings.profile_visibility === option.value && styles.visibilityLabelSelected,
            ]}>
              {option.label}
            </Text>
            <Text style={styles.visibilityDescription}>{option.description}</Text>
          </View>
          {localSettings.profile_visibility === option.value && (
            <Ionicons name="checkmark-circle" size={20} color="#E91E63" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      testID={testID}
    >
      {/* 密碼與認證 */}
      <View style={styles.section}>
        {renderSectionHeader('密碼與認證', '管理您的帳戶安全')}

        {renderActionOption(
          '更改密碼',
          `上次更改：${formatLastPasswordChange(localSettings.last_password_change)}`,
          onChangePassword,
          'key',
          false,
          false,
          `${testID}-change-password`
        )}

        {renderSwitchOption(
          '雙重驗證',
          '為您的帳戶增加額外的安全保護',
          localSettings.two_factor_enabled,
          (value) => updateSetting('two_factor_enabled', value),
          'shield-checkmark',
          `${testID}-2fa-switch`
        )}
      </View>

      {/* 隱私設置 */}
      <View style={styles.section}>
        {renderSectionHeader('隱私設置', '控制您的資訊可見性')}

        {renderSwitchOption(
          '顯示在線狀態',
          '讓其他用戶看到您是否在線',
          localSettings.show_online_status,
          (value) => updateSetting('show_online_status', value),
          'radio-button-on',
          `${testID}-online-status-switch`
        )}

        {renderSwitchOption(
          '顯示距離',
          '在您的個人資料中顯示距離信息',
          localSettings.show_distance,
          (value) => updateSetting('show_distance', value),
          'location',
          `${testID}-distance-switch`
        )}

        {renderSwitchOption(
          '允許陌生人發送訊息',
          '允許未配對的用戶向您發送訊息請求',
          localSettings.allow_message_requests,
          (value) => updateSetting('allow_message_requests', value),
          'mail',
          `${testID}-message-requests-switch`
        )}

        {renderSwitchOption(
          '防止截屏',
          '嘗試阻止其他用戶對您的資料截屏',
          localSettings.block_screenshot,
          (value) => updateSetting('block_screenshot', value),
          'eye-off',
          `${testID}-screenshot-switch`
        )}
      </View>

      {/* 個人資料可見性 */}
      {renderVisibilityOption()}

      {/* 通知設置 */}
      <View style={styles.section}>
        {renderSectionHeader('通知設置', '管理您接收的通知')}

        {renderSwitchOption(
          '推送通知',
          '接收新配對、訊息等推送通知',
          localSettings.push_notifications,
          (value) => updateSetting('push_notifications', value),
          'notifications',
          `${testID}-push-notifications-switch`
        )}

        {renderSwitchOption(
          '電子郵件通知',
          '接收重要更新的電子郵件',
          localSettings.email_notifications,
          (value) => updateSetting('email_notifications', value),
          'mail',
          `${testID}-email-notifications-switch`
        )}
      </View>

      {/* 數據與帳戶 */}
      <View style={styles.section}>
        {renderSectionHeader('數據與帳戶', '管理您的個人數據')}

        {renderActionOption(
          '匯出我的數據',
          '下載您的所有個人數據副本',
          handleExportData,
          'download',
          false,
          isExporting,
          `${testID}-export-data`
        )}

        {renderActionOption(
          '刪除帳戶',
          '永久刪除您的帳戶和所有數據',
          handleDeleteAccount,
          'trash',
          true,
          false,
          `${testID}-delete-account`
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  sectionHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  destructiveText: {
    color: '#F44336',
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  visibilityOptionSelected: {
    backgroundColor: '#ffeef5',
  },
  visibilityOptionContent: {
    flex: 1,
  },
  visibilityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  visibilityLabelSelected: {
    color: '#E91E63',
  },
  visibilityDescription: {
    fontSize: 14,
    color: '#666666',
  },
});

export default SecuritySettings;