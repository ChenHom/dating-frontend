/**
 * Register Screen
 * 用戶註冊頁面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

export const RegisterScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak');

  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  // Navigate to main app when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/(tabs)/discover');
    }
  }, [isAuthenticated]);

  // Update password strength when password changes
  useEffect(() => {
    if (password) {
      setPasswordStrength(getPasswordStrength(password));
    }
  }, [password]);

  const getPasswordStrength = (pwd: string): PasswordStrength => {
    if (pwd.length < 6) return 'weak';
    
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    
    const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (score >= 3 && pwd.length >= 8) return 'strong';
    if (score >= 2 && pwd.length >= 6) return 'medium';
    return 'weak';
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!name.trim()) {
      errors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const trimmedName = name.trim();

      await register({
        name: trimmedName,
        display_name: trimmedName,
        email: email.trim(),
        password: password,
        password_confirmation: confirmPassword,
      });
    } catch (err) {
      // Error is handled by the store
      console.error('Registration failed:', err);
    }
  };

  const handleInputChange = (
    setter: (value: string) => void,
    field: keyof FormErrors,
    value: string
  ) => {
    setter(value);
    if (error) clearError();
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  const getPasswordStrengthColor = (): string => {
    switch (passwordStrength) {
      case 'weak': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'strong': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPasswordStrengthText = (): string => {
    switch (passwordStrength) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      default: return '';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#2563eb' }}>
                Join Us
              </Text>
              <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 8 }}>
                Create your account to get started
              </Text>
            </View>

            {/* Form */}
            <View style={{ marginBottom: 30 }}>
              {/* Name Input */}
              <View style={{ marginBottom: 20 }}>
                <TextInput
                  placeholder="Full Name"
                  value={name}
                  onChangeText={(text) => handleInputChange(setName, 'name', text)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={{
                    borderWidth: 1,
                    borderColor: formErrors.name ? '#ef4444' : '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    backgroundColor: '#f9fafb',
                  }}
                />
                {formErrors.name && (
                  <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                    {formErrors.name}
                  </Text>
                )}
              </View>

              {/* Email Input */}
              <View style={{ marginBottom: 20 }}>
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={(text) => handleInputChange(setEmail, 'email', text)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  style={{
                    borderWidth: 1,
                    borderColor: formErrors.email ? '#ef4444' : '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    backgroundColor: '#f9fafb',
                  }}
                />
                {formErrors.email && (
                  <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                    {formErrors.email}
                  </Text>
                )}
              </View>

              {/* Password Input */}
              <View style={{ marginBottom: 20 }}>
                <TextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={(text) => handleInputChange(setPassword, 'password', text)}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    borderWidth: 1,
                    borderColor: formErrors.password ? '#ef4444' : '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    backgroundColor: '#f9fafb',
                  }}
                />
                
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    marginTop: 8,
                    marginBottom: 4 
                  }}>
                    <View style={{
                      width: 60,
                      height: 4,
                      backgroundColor: '#e5e7eb',
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}>
                      <View style={{
                        width: passwordStrength === 'weak' ? '33%' : 
                              passwordStrength === 'medium' ? '66%' : '100%',
                        height: '100%',
                        backgroundColor: getPasswordStrengthColor(),
                      }} />
                    </View>
                    <Text style={{ 
                      marginLeft: 8, 
                      fontSize: 12, 
                      color: getPasswordStrengthColor(),
                      fontWeight: '500'
                    }}>
                      {getPasswordStrengthText()}
                    </Text>
                  </View>
                )}
                
                {formErrors.password && (
                  <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                    {formErrors.password}
                  </Text>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={{ marginBottom: 20 }}>
                <TextInput
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={(text) => handleInputChange(setConfirmPassword, 'confirmPassword', text)}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    borderWidth: 1,
                    borderColor: formErrors.confirmPassword ? '#ef4444' : '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    backgroundColor: '#f9fafb',
                  }}
                />
                {formErrors.confirmPassword && (
                  <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                    {formErrors.confirmPassword}
                  </Text>
                )}
              </View>

              {/* Error Message */}
              {error && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#ef4444', fontSize: 14, textAlign: 'center' }}>
                    {error}
                  </Text>
                </View>
              )}

              {/* Register Button */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={isLoading}
                style={{
                  backgroundColor: isLoading ? '#9ca3af' : '#2563eb',
                  borderRadius: 8,
                  paddingVertical: 14,
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={{ color: '#2563eb', fontSize: 16 }}>
                  Already have an account? Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
