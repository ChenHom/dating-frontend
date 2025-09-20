/**
 * Logout Button Component
 * 登出按鈕組件 - 提供用戶登出功能
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../stores/auth';

interface LogoutButtonProps {
  style?: any;
  textStyle?: any;
  showConfirm?: boolean;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  style,
  textStyle,
  showConfirm = true
}) => {
  const { logout } = useAuthStore();

  const handleLogout = () => {
    const performLogout = () => {
      try {
        logout();
        console.log('🚪 User logged out successfully');
      } catch (error) {
        console.error('Logout error:', error);
        Alert.alert('Error', 'Failed to logout. Please try again.');
      }
    };

    if (showConfirm) {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    } else {
      performLogout();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleLogout}
      testID="logout-button"
    >
      <Text style={[styles.buttonText, textStyle]} testID="logout-text">
        Logout
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LogoutButton;
