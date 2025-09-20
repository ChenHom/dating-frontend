/**
 * MessageStatusIndicator Component
 * 訊息狀態指示器 - 顯示完整的訊息狀態流程
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

interface MessageStatusIndicatorProps {
  status: MessageStatus;
  isFromCurrentUser: boolean;
  timestamp?: number;
  error?: string;
  testID?: string;
}

export const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({
  status,
  isFromCurrentUser,
  timestamp,
  error,
  testID = 'message-status-indicator',
}) => {
  // 只有發送者才看到狀態指示器
  if (!isFromCurrentUser) {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <ActivityIndicator
            size="small"
            color="rgba(255, 255, 255, 0.8)"
            testID={`${testID}-sending`}
          />
        );

      case 'sent':
        return (
          <Ionicons
            name="checkmark"
            size={12}
            color="rgba(255, 255, 255, 0.8)"
            testID={`${testID}-sent`}
          />
        );

      case 'delivered':
        return (
          <View style={styles.doubleCheck}>
            <Ionicons
              name="checkmark"
              size={12}
              color="rgba(255, 255, 255, 0.8)"
              style={styles.checkmark1}
            />
            <Ionicons
              name="checkmark"
              size={12}
              color="rgba(255, 255, 255, 0.8)"
              style={styles.checkmark2}
            />
          </View>
        );

      case 'read':
        return (
          <View style={styles.doubleCheck}>
            <Ionicons
              name="checkmark"
              size={12}
              color="#4ade80"
              style={styles.checkmark1}
            />
            <Ionicons
              name="checkmark"
              size={12}
              color="#4ade80"
              style={styles.checkmark2}
            />
          </View>
        );

      case 'failed':
        return (
          <Ionicons
            name="warning"
            size={12}
            color="#ef4444"
            testID={`${testID}-failed`}
          />
        );

      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'sending':
        return '發送中...';
      case 'sent':
        return '已發送';
      case 'delivered':
        return '已送達';
      case 'read':
        return '已讀';
      case 'failed':
        return error || '發送失敗';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'failed':
        return '#ef4444';
      case 'read':
        return '#4ade80';
      default:
        return 'rgba(255, 255, 255, 0.8)';
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.iconContainer}>
        {getStatusIcon()}
      </View>

      {/* 顯示詳細狀態文字（可選，用於調試或詳細模式） */}
      {__DEV__ && (
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      )}
    </View>
  );
};

/**
 * 簡化版本的狀態指示器，只顯示圖標
 */
export const MessageStatusIcon: React.FC<Omit<MessageStatusIndicatorProps, 'timestamp'>> = ({
  status,
  isFromCurrentUser,
  error,
  testID = 'message-status-icon',
}) => {
  if (!isFromCurrentUser) {
    return null;
  }

  const getIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <ActivityIndicator
            size={10}
            color="rgba(255, 255, 255, 0.6)"
            testID={`${testID}-sending`}
          />
        );

      case 'sent':
        return (
          <Ionicons
            name="checkmark"
            size={10}
            color="rgba(255, 255, 255, 0.6)"
          />
        );

      case 'delivered':
        return (
          <View style={styles.miniDoubleCheck}>
            <Ionicons
              name="checkmark"
              size={10}
              color="rgba(255, 255, 255, 0.6)"
              style={styles.miniCheck1}
            />
            <Ionicons
              name="checkmark"
              size={10}
              color="rgba(255, 255, 255, 0.6)"
              style={styles.miniCheck2}
            />
          </View>
        );

      case 'read':
        return (
          <View style={styles.miniDoubleCheck}>
            <Ionicons
              name="checkmark"
              size={10}
              color="#4ade80"
              style={styles.miniCheck1}
            />
            <Ionicons
              name="checkmark"
              size={10}
              color="#4ade80"
              style={styles.miniCheck2}
            />
          </View>
        );

      case 'failed':
        return (
          <Ionicons
            name="warning-outline"
            size={10}
            color="#ef4444"
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.iconOnly} testID={testID}>
      {getIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  iconContainer: {
    minWidth: 16,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '500',
  },
  doubleCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 16,
    height: 12,
    position: 'relative',
  },
  checkmark1: {
    position: 'absolute',
    left: 0,
  },
  checkmark2: {
    position: 'absolute',
    left: 4,
  },
  miniDoubleCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 12,
    height: 10,
    position: 'relative',
  },
  miniCheck1: {
    position: 'absolute',
    left: 0,
  },
  miniCheck2: {
    position: 'absolute',
    left: 3,
  },
  iconOnly: {
    minWidth: 12,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
});

export default MessageStatusIndicator;