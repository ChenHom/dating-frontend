/**
 * ConnectionIndicator Component
 * 連線狀態指示器組件
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebSocketConnectionState } from '@/services/websocket/types';

interface ConnectionIndicatorProps {
  connectionState: WebSocketConnectionState;
  testID?: string;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  connectionState,
  testID = 'connection-indicator',
}) => {
  const getIndicatorConfig = () => {
    switch (connectionState) {
      case WebSocketConnectionState.CONNECTED:
        return {
          icon: 'wifi' as const,
          text: '已連線',
          color: '#10b981',
          backgroundColor: '#dcfce7',
          visible: false, // Don't show when connected
        };

      case WebSocketConnectionState.CONNECTING:
        return {
          icon: 'wifi-outline' as const,
          text: '連線中...',
          color: '#f59e0b',
          backgroundColor: '#fef3c7',
          visible: true,
        };

      case WebSocketConnectionState.RECONNECTING:
        return {
          icon: 'refresh' as const,
          text: '重新連線中...',
          color: '#f59e0b',
          backgroundColor: '#fef3c7',
          visible: true,
        };

      case WebSocketConnectionState.DISCONNECTED:
        return {
          icon: 'wifi-off' as const,
          text: '連線中斷',
          color: '#ef4444',
          backgroundColor: '#fee2e2',
          visible: true,
        };

      case WebSocketConnectionState.ERROR:
        return {
          icon: 'alert-circle' as const,
          text: '連線錯誤',
          color: '#ef4444',
          backgroundColor: '#fee2e2',
          visible: true,
        };

      default:
        return {
          icon: 'help-circle' as const,
          text: '未知狀態',
          color: '#6b7280',
          backgroundColor: '#f3f4f6',
          visible: true,
        };
    }
  };

  const config = getIndicatorConfig();

  if (!config.visible) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.backgroundColor }
      ]}
      testID={testID}
    >
      <Ionicons
        name={config.icon}
        size={16}
        color={config.color}
        style={styles.icon}
      />
      <Text
        style={[styles.text, { color: config.color }]}
        testID={`${testID}-text`}
      >
        {config.text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});