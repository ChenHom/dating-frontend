/**
 * Settings Screen
 * 設定頁面 - 帳戶管理、密碼修改等功能
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth';

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuthStore();
  
  // Password change form
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<ChangePasswordErrors>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Settings toggles
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);

  const validatePasswordForm = (): boolean => {
    const errors: ChangePasswordErrors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)) {
      errors.newPassword = 'Password must contain uppercase, lowercase, and numbers';
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    setIsChangingPassword(true);

    try {
      // TODO: Implement password change API call
      // await apiClient.changePassword({
      //   current_password: passwordForm.currentPassword,
      //   new_password: passwordForm.newPassword,
      //   new_password_confirmation: passwordForm.confirmPassword,
      // });

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Success',
        'Password changed successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowPasswordForm(false);
              setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              });
              setPasswordErrors({});
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to change password. Please check your current password and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordInputChange = (
    field: keyof ChangePasswordForm,
    value: string
  ) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    
    // Clear field error if it exists
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'This will permanently delete your account and all associated data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    // TODO: Implement account deletion API call
                    console.log('Account deletion requested');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
        }}>
          <TouchableOpacity onPress={() => router.back()} testID="back-button">
            <Text style={{ fontSize: 16, color: '#2563eb' }}>Back</Text>
          </TouchableOpacity>
          
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
            Settings
          </Text>
          
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={{ flex: 1 }}>
          {/* Account Section */}
          <View style={{
            backgroundColor: '#fff',
            marginTop: 20,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: '#e5e7eb',
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              paddingHorizontal: 20,
              paddingVertical: 12,
              backgroundColor: '#f9fafb',
            }}>
              Account
            </Text>

            <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
              <Text style={{ fontSize: 16, color: '#1f2937', marginBottom: 4 }}>
                {user?.name}
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>
                {user?.email}
              </Text>
            </View>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderTopWidth: 1,
                borderTopColor: '#f3f4f6',
              }}
              onPress={() => setShowPasswordForm(!showPasswordForm)}
              testID="change-password-button"
            >
              <Text style={{ fontSize: 16, color: '#1f2937' }}>
                Change Password
              </Text>
              <Text style={{ fontSize: 18, color: '#9ca3af' }}>
                {showPasswordForm ? '−' : '+'}
              </Text>
            </TouchableOpacity>

            {showPasswordForm && (
              <View style={{
                paddingHorizontal: 20,
                paddingBottom: 20,
                backgroundColor: '#f9fafb',
              }}>
                {/* Current Password */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: 6,
                  }}>
                    Current Password
                  </Text>
                  <TextInput
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChangeText={(text) => handlePasswordInputChange('currentPassword', text)}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    testID="current-password-input"
                    style={{
                      borderWidth: 1,
                      borderColor: passwordErrors.currentPassword ? '#ef4444' : '#d1d5db',
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                      backgroundColor: '#fff',
                    }}
                  />
                  {passwordErrors.currentPassword && (
                    <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                      {passwordErrors.currentPassword}
                    </Text>
                  )}
                </View>

                {/* New Password */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: 6,
                  }}>
                    New Password
                  </Text>
                  <TextInput
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChangeText={(text) => handlePasswordInputChange('newPassword', text)}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    testID="new-password-input"
                    style={{
                      borderWidth: 1,
                      borderColor: passwordErrors.newPassword ? '#ef4444' : '#d1d5db',
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                      backgroundColor: '#fff',
                    }}
                  />
                  {passwordErrors.newPassword && (
                    <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                      {passwordErrors.newPassword}
                    </Text>
                  )}
                </View>

                {/* Confirm Password */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: 6,
                  }}>
                    Confirm New Password
                  </Text>
                  <TextInput
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChangeText={(text) => handlePasswordInputChange('confirmPassword', text)}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    testID="confirm-password-input"
                    style={{
                      borderWidth: 1,
                      borderColor: passwordErrors.confirmPassword ? '#ef4444' : '#d1d5db',
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                      backgroundColor: '#fff',
                    }}
                  />
                  {passwordErrors.confirmPassword && (
                    <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                      {passwordErrors.confirmPassword}
                    </Text>
                  )}
                </View>

                {/* Change Password Button */}
                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={isChangingPassword}
                  testID="save-password-button"
                  style={{
                    backgroundColor: isChangingPassword ? '#9ca3af' : '#2563eb',
                    borderRadius: 6,
                    paddingVertical: 12,
                    alignItems: 'center',
                  }}
                >
                  {isChangingPassword ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500' }}>
                      Change Password
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Preferences Section */}
          <View style={{
            backgroundColor: '#fff',
            marginTop: 20,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: '#e5e7eb',
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              paddingHorizontal: 20,
              paddingVertical: 12,
              backgroundColor: '#f9fafb',
            }}>
              Preferences
            </Text>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
            }}>
              <Text style={{ fontSize: 16, color: '#1f2937' }}>
                Push Notifications
              </Text>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                testID="push-notifications-switch"
              />
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderTopWidth: 1,
              borderTopColor: '#f3f4f6',
            }}>
              <Text style={{ fontSize: 16, color: '#1f2937' }}>
                Email Notifications
              </Text>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                testID="email-notifications-switch"
              />
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderTopWidth: 1,
              borderTopColor: '#f3f4f6',
            }}>
              <Text style={{ fontSize: 16, color: '#1f2937' }}>
                Share Location
              </Text>
              <Switch
                value={locationSharing}
                onValueChange={setLocationSharing}
                testID="location-sharing-switch"
              />
            </View>
          </View>

          {/* Actions Section */}
          <View style={{
            backgroundColor: '#fff',
            marginTop: 20,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: '#e5e7eb',
          }}>
            <TouchableOpacity
              style={{
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}
              onPress={handleLogout}
              testID="logout-button"
            >
              <Text style={{ fontSize: 16, color: '#ef4444', fontWeight: '500' }}>
                Logout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderTopWidth: 1,
                borderTopColor: '#f3f4f6',
              }}
              onPress={handleDeleteAccount}
              testID="delete-account-button"
            >
              <Text style={{ fontSize: 16, color: '#ef4444', fontWeight: '500' }}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Spacer */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
