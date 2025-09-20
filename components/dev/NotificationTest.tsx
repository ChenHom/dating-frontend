/**
 * 通知去重測試組件 - 用於開發時測試通知系統
 * 模擬 WebSocket 和 Push Notification 的重複通知場景
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { notificationManager } from '@/services/notifications/NotificationManager';
import { webSocketConnectionManager } from '@/services/websocket/WebSocketConnectionManager';

const NotificationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [`${new Date().toLocaleTimeString()}: ${result}`, ...prev]);
  };

  /**
   * 測試 1: 模擬 WebSocket 通知
   */
  const testWebSocketNotification = () => {
    const invitationId = `test_invitation_${Date.now()}`;

    notificationManager.handleWebSocketNotification({
      id: invitationId,
      type: 'game_invite',
      title: '🎮 遊戲邀請（WebSocket）',
      body: '測試用戶邀請你玩剪刀石頭布！',
      data: {
        invitation: {
          id: invitationId,
          conversation_id: 123,
          from_user_id: 456,
          to_user_id: 1,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5分鐘後過期
          created_at: new Date().toISOString(),
        },
        senderName: '測試用戶',
        avatarUrl: 'https://via.placeholder.com/150',
        conversationId: 123,
        senderId: 456,
      },
      conversationId: 123,
      senderId: 456,
    });

    addTestResult(`WebSocket 遊戲邀請通知發送 - ID: ${invitationId}`);
  };

  /**
   * 測試 2: 模擬 Push Notification
   */
  const testPushNotification = () => {
    const invitationId = `test_invitation_${Date.now()}`;

    notificationManager.handlePushNotification({
      id: invitationId,
      type: 'game_invite',
      title: '🎮 遊戲邀請（Push）',
      body: '測試用戶邀請你玩剪刀石頭布！',
      data: {
        invitation: {
          id: invitationId,
          conversation_id: 123,
          from_user_id: 456,
          to_user_id: 1,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        },
        senderName: '測試用戶（Push）',
        avatarUrl: 'https://via.placeholder.com/150/ff6b35/ffffff?text=P',
        conversationId: 123,
        senderId: 456,
      },
      conversationId: 123,
      senderId: 456,
    });

    addTestResult(`Push 遊戲邀請通知發送 - ID: ${invitationId}`);
  };

  /**
   * 測試 3: 模擬重複通知（相同 ID）
   */
  const testDuplicateNotifications = () => {
    const invitationId = `duplicate_test_${Date.now()}`;

    // 先發送 WebSocket 通知
    notificationManager.handleWebSocketNotification({
      id: invitationId,
      type: 'game_invite',
      title: '🎮 重複測試（WebSocket）',
      body: '這是第一個通知（WebSocket）',
      data: {},
    });

    // 延遲 500ms 後發送 Push 通知（相同 ID）
    setTimeout(() => {
      notificationManager.handlePushNotification({
        id: invitationId,
        type: 'game_invite',
        title: '🎮 重複測試（Push）',
        body: '這是第二個通知（Push）- 應該被阻擋',
        data: {},
      });

      addTestResult(`重複通知測試完成 - ID: ${invitationId} (只應顯示 WebSocket 通知)`);
    }, 500);

    addTestResult(`重複通知測試開始 - ID: ${invitationId}`);
  };

  /**
   * 測試 4: 模擬 Push 優先延遲機制
   */
  const testPushDelayMechanism = () => {
    const invitationId = `delay_test_${Date.now()}`;

    // 先發送 Push 通知
    notificationManager.handlePushNotification({
      id: invitationId,
      type: 'game_invite',
      title: '🎮 延遲測試（Push）',
      body: 'Push 通知（應延遲 1 秒顯示）',
      data: {},
    });

    // 在 500ms 後發送 WebSocket 通知
    setTimeout(() => {
      notificationManager.handleWebSocketNotification({
        id: invitationId,
        type: 'game_invite',
        title: '🎮 延遲測試（WebSocket）',
        body: 'WebSocket 通知（應立即顯示並阻擋 Push）',
        data: {},
      });

      addTestResult(`延遲測試 - WebSocket 通知發送（應阻擋之前的 Push）`);
    }, 500);

    addTestResult(`延遲測試開始 - Push 通知延遲中...`);
  };

  /**
   * 測試 5: 模擬不同類型的通知
   */
  const testDifferentNotificationTypes = () => {
    const timestamp = Date.now();

    // 遊戲邀請
    notificationManager.handleWebSocketNotification({
      id: `game_${timestamp}`,
      type: 'game_invite',
      title: '🎮 遊戲邀請',
      body: '用戶 A 邀請你玩遊戲',
      data: {},
    });

    // 新訊息
    notificationManager.handleWebSocketNotification({
      id: `message_${timestamp}`,
      type: 'message',
      title: '💬 新訊息',
      body: '用戶 B 發送了一條訊息',
      data: {},
    });

    // 新配對
    notificationManager.handleWebSocketNotification({
      id: `match_${timestamp}`,
      type: 'match',
      title: '❤️ 新配對',
      body: '你們互相按讚了！',
      data: {},
    });

    // 禮物
    notificationManager.handleWebSocketNotification({
      id: `gift_${timestamp}`,
      type: 'gift',
      title: '🎁 收到禮物',
      body: '用戶 C 送給你一個禮物',
      data: {},
    });

    addTestResult('發送多種類型通知測試完成');
  };

  /**
   * 測試 6: 測試遊戲邀請專用通知 UI
   */
  const testGameInviteNotificationUI = () => {
    const invitationId = `ui_test_${Date.now()}`;

    notificationManager.handleWebSocketNotification({
      id: invitationId,
      type: 'game_invite',
      title: '🎮 UI 測試邀請',
      body: '這是測試新的遊戲邀請通知 UI 組件！',
      data: {
        invitation: {
          id: invitationId,
          conversation_id: 999,
          from_user_id: 888,
          to_user_id: 1,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        },
        senderName: 'UI 測試用戶',
        avatarUrl: 'https://via.placeholder.com/150/10b981/ffffff?text=UI',
        conversationId: 999,
        senderId: 888,
      },
      conversationId: 999,
      senderId: 888,
    });

    addTestResult(`遊戲邀請專用 UI 測試 - ID: ${invitationId}`);
  };

  /**
   * 測試 7: 清除所有通知
   */
  const testClearAllNotifications = () => {
    const displayedNotifications = notificationManager.getDisplayedNotifications();

    displayedNotifications.forEach(notification => {
      notificationManager.hideNotification(notification.id);
    });

    addTestResult(`清除 ${displayedNotifications.length} 個顯示中的通知`);
  };

  /**
   * 顯示通知管理器統計
   */
  const showNotificationStats = () => {
    const stats = notificationManager.getStats();
    const connectionStats = webSocketConnectionManager.getConnectionStatus();

    Alert.alert(
      '通知系統統計',
      `顯示中通知: ${stats.displayedCount}
待處理通知: ${stats.pendingCount}
歷史記錄: ${stats.historyCount}
去重窗口: ${stats.dedupWindow}ms
優先延遲: ${stats.priorityDelay}ms

WebSocket 連接: ${connectionStats.isConnected ? '已連接' : '未連接'}
初始化狀態: ${connectionStats.isInitialized ? '已初始化' : '未初始化'}
重連次數: ${connectionStats.reconnectAttempts}`,
      [{ text: '確定' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>通知去重測試工具</Text>

      <ScrollView style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testWebSocketNotification}>
          <Text style={styles.buttonText}>測試 WebSocket 通知</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testPushNotification}>
          <Text style={styles.buttonText}>測試 Push 通知</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={testDuplicateNotifications}>
          <Text style={[styles.buttonText, styles.primaryButtonText]}>測試重複通知去重</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={testPushDelayMechanism}>
          <Text style={[styles.buttonText, styles.primaryButtonText]}>測試 Push 延遲機制</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testDifferentNotificationTypes}>
          <Text style={styles.buttonText}>測試多種通知類型</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.specialButton]} onPress={testGameInviteNotificationUI}>
          <Text style={[styles.buttonText, styles.specialButtonText]}>測試遊戲邀請專用 UI</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={testClearAllNotifications}>
          <Text style={[styles.buttonText, styles.dangerButtonText]}>清除所有通知</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={showNotificationStats}>
          <Text style={[styles.buttonText, styles.infoButtonText]}>顯示統計信息</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>測試日誌:</Text>
        <ScrollView style={styles.logScroll}>
          {testResults.map((result, index) => (
            <Text key={index} style={styles.logText}>
              {result}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    flex: 1,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
  },
  dangerButton: {
    backgroundColor: '#FF4458',
  },
  infoButton: {
    backgroundColor: '#7B68EE',
  },
  specialButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  dangerButtonText: {
    color: '#FFFFFF',
  },
  infoButtonText: {
    color: '#FFFFFF',
  },
  specialButtonText: {
    color: '#FFFFFF',
  },
  logContainer: {
    height: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  logScroll: {
    flex: 1,
  },
  logText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
});

export default NotificationTest;