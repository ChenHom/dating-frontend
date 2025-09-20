/**
 * GameInviteMessage Component
 * 遊戲邀請訊息組件
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

export interface GameInviteMessageData {
  id: number;
  type: 'game_invite';
  game_session_id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  sender: {
    id: number;
    name: string;
    profile?: {
      display_name: string;
      primary_photo_url?: string;
    };
  };
}

interface GameInviteMessageProps {
  message: GameInviteMessageData;
  isFromCurrentUser: boolean;
  onAccept?: (gameSessionId: number) => void;
  onDecline?: (gameSessionId: number) => void;
  currentUserId?: number;
  testID?: string;
}

export const GameInviteMessage: React.FC<GameInviteMessageProps> = ({
  message,
  isFromCurrentUser,
  onAccept,
  onDecline,
  currentUserId,
  testID = 'game-invite-message',
}) => {
  const isExpired = dayjs().isAfter(dayjs(message.expires_at));
  const canRespond = !isFromCurrentUser && message.status === 'pending' && !isExpired;

  const getStatusText = () => {
    if (isExpired) return '邀請已過期';
    switch (message.status) {
      case 'accepted':
        return '已接受邀請';
      case 'declined':
        return '已拒絕邀請';
      case 'pending':
        return isFromCurrentUser ? '等待回應...' : '等待你的回應';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    if (isExpired) return '#6b7280';
    switch (message.status) {
      case 'accepted':
        return '#10b981';
      case 'declined':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const handleAccept = () => {
    if (onAccept && canRespond) {
      onAccept(message.game_session_id);
    }
  };

  const handleDecline = () => {
    if (onDecline && canRespond) {
      onDecline(message.game_session_id);
    }
  };

  return (
    <View
      style={[
        styles.container,
        isFromCurrentUser ? styles.myMessageContainer : styles.theirMessageContainer
      ]}
      testID={testID}
    >
      {!isFromCurrentUser && message.sender?.profile?.primary_photo_url && (
        <Image
          source={{ uri: message.sender.profile.primary_photo_url }}
          style={styles.avatar}
          testID={`${testID}-avatar`}
        />
      )}

      <View
        style={[
          styles.inviteCard,
          isFromCurrentUser ? styles.myInviteCard : styles.theirInviteCard
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.gameIcon}>
            <Text style={styles.gameEmoji}>🎮</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>剪刀石頭布邀請</Text>
            <Text style={styles.subtitle}>
              {isFromCurrentUser
                ? `邀請 ${message.conversation_id} 對話的對方`
                : `${message.sender?.profile?.display_name || message.sender?.name} 邀請你`
              }
            </Text>
          </View>
        </View>

        {/* Game details */}
        <View style={styles.gameDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="trophy-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>3局2勝制</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>每回合10秒限時</Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor() + '20' }
            ]}
          >
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        {canRespond && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={handleDecline}
              testID={`${testID}-decline`}
            >
              <Ionicons name="close" size={16} color="#ef4444" />
              <Text style={styles.declineText}>拒絕</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
              testID={`${testID}-accept`}
            >
              <Ionicons name="checkmark" size={16} color="#ffffff" />
              <Text style={styles.acceptText}>接受</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Timestamp */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.timestamp,
              isFromCurrentUser ? styles.myTimestamp : styles.theirTimestamp
            ]}
            testID={`${testID}-time`}
          >
            {dayjs(message.created_at).format('HH:mm')}
          </Text>
          {!isExpired && message.status === 'pending' && (
            <Text style={styles.expiryText}>
              {dayjs(message.expires_at).format('MM/DD HH:mm')} 到期
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    marginTop: 4,
  },
  inviteCard: {
    maxWidth: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  myInviteCard: {
    backgroundColor: '#e0f2fe',
    borderBottomRightRadius: 4,
  },
  theirInviteCard: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gameEmoji: {
    fontSize: 20,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  gameDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 6,
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 4,
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  declineButton: {
    backgroundColor: '#fee2e2',
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  declineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
  },
  myTimestamp: {
    color: '#6b7280',
  },
  theirTimestamp: {
    color: '#6b7280',
  },
  expiryText: {
    fontSize: 11,
    color: '#f59e0b',
    fontStyle: 'italic',
  },
});