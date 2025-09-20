/**
 * NotificationSettings Component
 * 通知設置界面 - 管理推送通知、聲音、振動等設置
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNotificationStore, NotificationSettings as Settings } from '@/stores/notification';
import * as Notifications from 'expo-notifications';
import { notificationPermissionManager, PermissionState } from '@/services/notifications/NotificationPermissionManager';

interface NotificationSettingsProps {
  isVisible: boolean;
  onClose: () => void;
  testID?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  isVisible,
  onClose,
  testID = 'notification-settings',
}) => {
  const { settings, updateSettings } = useNotificationStore();
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>({
    status: 'undetermined',
    canAskAgain: true,
    lastRequestTime: null,
    requestCount: 0,
  });

  // 檢查推送權限
  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    const state = await notificationPermissionManager.getPermissionState();
    setPermissionState(state);
  };

  // 請求推送權限
  const requestNotificationPermission = async () => {
    const newState = await notificationPermissionManager.requestPermission({
      showRationale: true,
      rationaleTitle: '開啟推送通知',
      rationaleMessage: '為了及時通知您新訊息、配對和遊戲邀請，我們需要您的推送通知權限。',
      fallbackToSettings: true,
    });

    setPermissionState(newState);

    // 如果權限被授予，自動啟用推送通知設置
    if (newState.status === 'granted' && !localSettings.pushEnabled) {
      updateLocalSettings({ pushEnabled: true });
    }
  };

  // 保存設置
  const handleSaveSettings = async () => {
    await updateSettings(localSettings);
    Alert.alert('設置已保存', '通知設置已成功更新', [
      { text: '確定', onPress: onClose }
    ]);
  };

  // 更新本地設置
  const updateLocalSettings = (updates: Partial<Settings>) => {
    setLocalSettings(prev => ({ ...prev, ...updates }));
  };

  // 切換類別設置
  const toggleCategory = (category: keyof Settings['categories']) => {
    updateLocalSettings({
      categories: {
        ...localSettings.categories,
        [category]: !localSettings.categories[category],
      },
    });
  };

  // 處理時間選擇
  const handleTimeChange = (type: 'start' | 'end', selectedTime: Date) => {
    const timeString = selectedTime.toTimeString().slice(0, 5);

    if (type === 'start') {
      setShowStartTimePicker(false);
      updateLocalSettings({
        quietHours: {
          ...localSettings.quietHours,
          startTime: timeString,
        },
      });
    } else {
      setShowEndTimePicker(false);
      updateLocalSettings({
        quietHours: {
          ...localSettings.quietHours,
          endTime: timeString,
        },
      });
    }
  };

  // 解析時間字符串
  const parseTime = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // 渲染設置項目
  const renderSettingItem = (
    title: string,
    subtitle: string,
    value: boolean,
    onToggle: () => void,
    icon: string,
    iconColor: string = '#3b82f6'
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>

      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
        thumbColor={value ? '#3b82f6' : '#f3f4f6'}
      />
    </View>
  );

  // 渲染類別設置項目
  const renderCategoryItem = (
    category: keyof Settings['categories'],
    title: string,
    subtitle: string,
    icon: string,
    iconColor: string
  ) => (
    <View key={category} style={styles.categoryItem}>
      <View style={styles.categoryIcon}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>

      <View style={styles.categoryContent}>
        <Text style={styles.categoryTitle}>{title}</Text>
        <Text style={styles.categorySubtitle}>{subtitle}</Text>
      </View>

      <Switch
        value={localSettings.categories[category]}
        onValueChange={() => toggleCategory(category)}
        trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
        thumbColor={localSettings.categories[category] ? '#3b82f6' : '#f3f4f6'}
      />
    </View>
  );

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            testID={`${testID}-cancel`}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>

          <Text style={styles.title}>通知設置</Text>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveSettings}
            testID={`${testID}-save`}
          >
            <Text style={styles.saveButtonText}>保存</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 權限狀態 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>推送權限</Text>

            <View style={styles.permissionStatus}>
              <View style={styles.permissionInfo}>
                <Ionicons
                  name={permissionState.status === 'granted' ? 'checkmark-circle' : 'alert-circle'}
                  size={20}
                  color={permissionState.status === 'granted' ? '#10b981' : '#ef4444'}
                />
                <View style={styles.permissionDetails}>
                  <Text style={styles.permissionText}>
                    {permissionState.status === 'granted' ? '已授權' : '未授權'}
                  </Text>
                  {permissionState.status !== 'granted' && permissionState.requestCount > 0 && (
                    <Text style={styles.permissionSubtext}>
                      已請求 {permissionState.requestCount} 次
                      {!permissionState.canAskAgain && ' (需要手動開啟)'}
                    </Text>
                  )}
                </View>
              </View>

              {permissionState.status !== 'granted' && (
                <TouchableOpacity
                  style={[
                    styles.permissionButton,
                    !permissionState.canAskAgain && styles.permissionButtonDisabled
                  ]}
                  onPress={requestNotificationPermission}
                  testID={`${testID}-request-permission`}
                  disabled={!permissionState.canAskAgain}
                >
                  <Text style={[
                    styles.permissionButtonText,
                    !permissionState.canAskAgain && styles.permissionButtonTextDisabled
                  ]}>
                    {permissionState.canAskAgain ? '請求權限' : '前往設置'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 基本設置 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>基本設置</Text>

            {renderSettingItem(
              '推送通知',
              '接收推送通知',
              localSettings.pushEnabled,
              () => updateLocalSettings({ pushEnabled: !localSettings.pushEnabled }),
              'notifications',
              '#3b82f6'
            )}

            {renderSettingItem(
              '聲音提示',
              '播放通知聲音',
              localSettings.soundEnabled,
              () => updateLocalSettings({ soundEnabled: !localSettings.soundEnabled }),
              'volume-high',
              '#10b981'
            )}

            {renderSettingItem(
              '振動提示',
              '收到通知時振動',
              localSettings.vibrationEnabled,
              () => updateLocalSettings({ vibrationEnabled: !localSettings.vibrationEnabled }),
              'phone-portrait',
              '#f59e0b'
            )}

            {renderSettingItem(
              'App 內通知',
              '在應用內顯示通知',
              localSettings.showInApp,
              () => updateLocalSettings({ showInApp: !localSettings.showInApp }),
              'eye',
              '#8b5cf6'
            )}
          </View>

          {/* 通知類別 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>通知類別</Text>
            <Text style={styles.sectionSubtitle}>選擇要接收的通知類型</Text>

            <View style={styles.categoriesContainer}>
              {renderCategoryItem('game', '遊戲邀請', '剪刀石頭布遊戲邀請', 'game-controller', '#3b82f6')}
              {renderCategoryItem('message', '聊天訊息', '新的聊天訊息', 'chatbubble', '#10b981')}
              {renderCategoryItem('gift', '禮物通知', '收到禮物時通知', 'gift', '#f59e0b')}
              {renderCategoryItem('match', '配對通知', '新的配對和喜歡', 'heart', '#ef4444')}
              {renderCategoryItem('system', '系統通知', '系統更新和公告', 'settings', '#6b7280')}
            </View>
          </View>

          {/* 勿擾時間 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>勿擾時間</Text>
            <Text style={styles.sectionSubtitle}>設置不接收通知的時間段</Text>

            {renderSettingItem(
              '啟用勿擾模式',
              '在指定時間段內不接收通知',
              localSettings.quietHours.enabled,
              () => updateLocalSettings({
                quietHours: {
                  ...localSettings.quietHours,
                  enabled: !localSettings.quietHours.enabled,
                },
              }),
              'moon',
              '#6b7280'
            )}

            {localSettings.quietHours.enabled && (
              <View style={styles.quietHoursContainer}>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowStartTimePicker(true)}
                  testID={`${testID}-start-time`}
                >
                  <Text style={styles.timeButtonLabel}>開始時間</Text>
                  <Text style={styles.timeButtonValue}>{localSettings.quietHours.startTime}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowEndTimePicker(true)}
                  testID={`${testID}-end-time`}
                >
                  <Text style={styles.timeButtonLabel}>結束時間</Text>
                  <Text style={styles.timeButtonValue}>{localSettings.quietHours.endTime}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 測試通知 */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={async () => {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: '測試通知',
                    body: '這是一個測試通知，用於確認設置是否正常工作。',
                  },
                  trigger: { seconds: 1 },
                });
                Alert.alert('測試通知已發送', '請檢查是否收到通知');
              }}
              testID={`${testID}-test-notification`}
            >
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.testButtonText}>發送測試通知</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Time Pickers */}
        {showStartTimePicker && (
          <DateTimePicker
            value={parseTime(localSettings.quietHours.startTime)}
            mode="time"
            is24Hour={true}
            onChange={(event, selectedTime) => {
              if (selectedTime) {
                handleTimeChange('start', selectedTime);
              } else {
                setShowStartTimePicker(false);
              }
            }}
          />
        )}

        {showEndTimePicker && (
          <DateTimePicker
            value={parseTime(localSettings.quietHours.endTime)}
            mode="time"
            is24Hour={true}
            onChange={(event, selectedTime) => {
              if (selectedTime) {
                handleTimeChange('end', selectedTime);
              } else {
                setShowEndTimePicker(false);
              }
            }}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  saveButton: {
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  permissionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionDetails: {
    marginLeft: 8,
  },
  permissionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  permissionSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  permissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  permissionButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  permissionButtonTextDisabled: {
    color: '#d1d5db',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoriesContainer: {
    marginTop: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  quietHoursContainer: {
    marginTop: 16,
    gap: 12,
  },
  timeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  timeButtonValue: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    marginTop: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default NotificationSettings;