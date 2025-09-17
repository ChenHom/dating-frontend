/**
 * Edit Profile Screen
 * 個人檔案編輯頁面
 */

import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useProfileStore } from '@/stores/profile';
import { PhotoManager } from '@/components/photo/PhotoManager';

interface FormData {
  display_name: string;
  bio: string;
  age: string;
  city: string;
}

interface FormErrors {
  display_name?: string;
  bio?: string;
  age?: string;
  city?: string;
}

export const EditProfileScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    profile, 
    loadProfile, 
    updateProfile, 
    isLoading, 
    error, 
    clearError 
  } = useProfileStore();

  const [formData, setFormData] = useState<FormData>({
    display_name: '',
    bio: '',
    age: '',
    city: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Load profile data on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      const newFormData = {
        display_name: profile.display_name || user?.name || '',
        bio: profile.bio || '',
        age: profile.age?.toString() || '',
        city: profile.city || '',
      };
      setFormData(newFormData);
    }
  }, [profile, user]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.display_name.trim()) {
      errors.display_name = 'Display name is required';
    } else if (formData.display_name.trim().length < 2) {
      errors.display_name = 'Display name must be at least 2 characters';
    } else if (formData.display_name.trim().length > 50) {
      errors.display_name = 'Display name must be less than 50 characters';
    }

    if (formData.bio && formData.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters';
    }

    if (formData.age) {
      const ageNum = parseInt(formData.age, 10);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
        errors.age = 'Age must be between 18 and 100';
      }
    }

    if (formData.city && formData.city.length > 100) {
      errors.city = 'City must be less than 100 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const updateData = {
      display_name: formData.display_name.trim(),
      bio: formData.bio.trim() || null,
      age: formData.age ? parseInt(formData.age, 10) : null,
      city: formData.city.trim() || null,
    };

    try {
      await updateProfile(updateData);
      setHasChanges(false);
      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      // Error is handled by the store
      console.error('Failed to update profile:', err);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    setHasChanges(true);

    // Clear field error if it exists
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Clear global error
    if (error) {
      clearError();
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  if (!profile && isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 16, color: '#6b7280' }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <TouchableOpacity onPress={handleBack} testID="back-button">
            <Text style={{ fontSize: 16, color: '#2563eb' }}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
            Edit Profile
          </Text>
          
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isLoading || !hasChanges}
            testID="save-button"
            style={{
              opacity: (isLoading || !hasChanges) ? 0.5 : 1,
            }}
          >
            <Text style={{ fontSize: 16, color: '#2563eb', fontWeight: '600' }}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Management Section */}
          <View style={{ marginBottom: 20 }}>
            <PhotoManager style={{ backgroundColor: '#ffffff' }} />
          </View>

          <View style={{ padding: 20 }}>
            {/* Display Name */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: '#374151',
                marginBottom: 8,
              }}>
                Display Name *
              </Text>
              <TextInput
                placeholder="Enter your display name"
                value={formData.display_name}
                onChangeText={(text) => handleInputChange('display_name', text)}
                autoCapitalize="words"
                autoCorrect={false}
                testID="display-name-input"
                style={{
                  borderWidth: 1,
                  borderColor: formErrors.display_name ? '#ef4444' : '#d1d5db',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: '#f9fafb',
                }}
              />
              {formErrors.display_name && (
                <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                  {formErrors.display_name}
                </Text>
              )}
            </View>

            {/* Bio */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: '#374151',
                marginBottom: 8,
              }}>
                Bio
              </Text>
              <TextInput
                placeholder="Tell people about yourself..."
                value={formData.bio}
                onChangeText={(text) => handleInputChange('bio', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoCapitalize="sentences"
                testID="bio-input"
                style={{
                  borderWidth: 1,
                  borderColor: formErrors.bio ? '#ef4444' : '#d1d5db',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: '#f9fafb',
                  minHeight: 100,
                }}
              />
              <Text style={{
                fontSize: 12,
                color: '#6b7280',
                marginTop: 4,
                textAlign: 'right',
              }}>
                {formData.bio.length}/500
              </Text>
              {formErrors.bio && (
                <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                  {formErrors.bio}
                </Text>
              )}
            </View>

            {/* Age */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: '#374151',
                marginBottom: 8,
              }}>
                Age
              </Text>
              <TextInput
                placeholder="Enter your age"
                value={formData.age}
                onChangeText={(text) => handleInputChange('age', text)}
                keyboardType="numeric"
                maxLength={3}
                testID="age-input"
                style={{
                  borderWidth: 1,
                  borderColor: formErrors.age ? '#ef4444' : '#d1d5db',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: '#f9fafb',
                }}
              />
              {formErrors.age && (
                <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                  {formErrors.age}
                </Text>
              )}
            </View>

            {/* City */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: '#374151',
                marginBottom: 8,
              }}>
                City
              </Text>
              <TextInput
                placeholder="Enter your city"
                value={formData.city}
                onChangeText={(text) => handleInputChange('city', text)}
                autoCapitalize="words"
                autoCorrect={false}
                testID="city-input"
                style={{
                  borderWidth: 1,
                  borderColor: formErrors.city ? '#ef4444' : '#d1d5db',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: '#f9fafb',
                }}
              />
              {formErrors.city && (
                <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                  {formErrors.city}
                </Text>
              )}
            </View>

            {/* Error Message */}
            {error && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  color: '#ef4444',
                  fontSize: 14,
                  textAlign: 'center',
                  backgroundColor: '#fef2f2',
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#fecaca',
                }}>
                  {error}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};