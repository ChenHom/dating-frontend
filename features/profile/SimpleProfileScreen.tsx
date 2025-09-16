/**
 * Simple Profile Screen for E2E Testing
 * 簡化的個人資料頁面用於端對端測試
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth';
import { LogoutButton } from '../../components/auth/LogoutButton';

export const SimpleProfileScreen: React.FC = () => {
  const { user } = useAuthStore();

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handlePreferences = () => {
    router.push('/settings');
  };

  return (
    <ScrollView style={styles.container} testID="profile-container">
      {/* Header */}
      <View style={styles.header} testID="profile-header">
        <Text style={styles.headerTitle} testID="profile-title">Profile</Text>
      </View>

      {/* Profile Content */}
      <View style={styles.content}>
        {/* Profile Picture */}
        <View style={styles.profilePictureContainer} testID="profile-picture-container">
          <View style={styles.profilePicture} testID="profile-picture">
            <Text style={styles.profilePictureText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <TouchableOpacity style={styles.editPictureButton} testID="edit-picture-button">
            <Text style={styles.editPictureText}>📷</Text>
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userInfoSection} testID="user-info-section">
          <Text style={styles.userName} testID="user-name">
            {user?.name || 'Unknown User'}
          </Text>
          <Text style={styles.userEmail} testID="user-email">
            {user?.email || 'No email provided'}
          </Text>
        </View>

        {/* Profile Stats */}
        <View style={styles.statsContainer} testID="profile-stats">
          <View style={styles.statItem} testID="matches-stat">
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statItem} testID="likes-stat">
            <Text style={styles.statNumber}>28</Text>
            <Text style={styles.statLabel}>Likes Given</Text>
          </View>
          <View style={styles.statItem} testID="chats-stat">
            <Text style={styles.statNumber}>4</Text>
            <Text style={styles.statLabel}>Active Chats</Text>
          </View>
        </View>

        {/* Profile Options */}
        <View style={styles.optionsContainer} testID="profile-options">
          <TouchableOpacity 
            style={styles.optionItem} 
            testID="edit-profile-option"
            onPress={handleEditProfile}
          >
            <Text style={styles.optionIcon}>👤</Text>
            <Text style={styles.optionText}>Edit Profile</Text>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionItem} 
            testID="preferences-option"
            onPress={handlePreferences}
          >
            <Text style={styles.optionIcon}>⚙️</Text>
            <Text style={styles.optionText}>Settings</Text>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} testID="notifications-option">
            <Text style={styles.optionIcon}>🔔</Text>
            <Text style={styles.optionText}>Notifications</Text>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} testID="privacy-option">
            <Text style={styles.optionIcon}>🔒</Text>
            <Text style={styles.optionText}>Privacy & Safety</Text>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} testID="help-option">
            <Text style={styles.optionIcon}>❓</Text>
            <Text style={styles.optionText}>Help & Support</Text>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.actionsContainer} testID="profile-actions">
          <LogoutButton 
            style={styles.logoutButton}
            showConfirm={false}
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfoContainer} testID="app-info">
          <Text style={styles.appVersion} testID="app-version">
            Dating App v1.0.0
          </Text>
          <Text style={styles.buildInfo} testID="build-info">
            Build 2024.01.15
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  profilePictureText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  editPictureButton: {
    position: 'absolute',
    bottom: 8,
    right: '35%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPictureText: {
    fontSize: 16,
  },
  userInfoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  optionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  optionArrow: {
    fontSize: 20,
    color: '#9ca3af',
  },
  actionsContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutButton: {
    width: '100%',
    paddingVertical: 16,
  },
  appInfoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appVersion: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  buildInfo: {
    fontSize: 12,
    color: '#d1d5db',
  },
});

export default SimpleProfileScreen;