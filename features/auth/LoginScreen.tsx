/**
 * Login Screen
 * 用戶登入頁面
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
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';

interface FormErrors {
  email?: string;
  password?: string;
}

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  // Navigate to main app when authenticated
  useEffect(() => {
    console.log('🔄 Auth state changed:', { isAuthenticated });
    if (isAuthenticated) {
      console.log('🚀 Navigating to discover page...');
      router.push('/(tabs)/discover');
    }
  }, [isAuthenticated]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

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

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await login(email.trim(), password);
    } catch (err) {
      // Error is handled by the store
      console.error('Login failed:', err);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (error) clearError();
    if (formErrors.email) {
      setFormErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (error) clearError();
    if (formErrors.password) {
      setFormErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const navigateToRegister = () => {
    router.push('/register');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 40 }} testID="login-header">
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#2563eb' }} testID="login-title">
              Welcome Back
            </Text>
            <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 8 }} testID="login-subtitle">
              Sign in to continue
            </Text>
          </View>

          {/* Form */}
          <View style={{ marginBottom: 30 }}>
            {/* Email Input */}
            <View style={{ marginBottom: 20 }}>
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={handleEmailChange}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                testID="email-input"
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
                <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }} testID="email-error">
                  {formErrors.email}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View style={{ marginBottom: 20 }}>
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                testID="password-input"
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
              {formErrors.password && (
                <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }} testID="password-error">
                  {formErrors.password}
                </Text>
              )}
            </View>

            {/* Error Message */}
            {error && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: '#ef4444', fontSize: 14, textAlign: 'center' }} testID="login-error">
                  {error}
                </Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              testID="login-button"
              style={{
                backgroundColor: isLoading ? '#9ca3af' : '#2563eb',
                borderRadius: 8,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity onPress={navigateToRegister} testID="register-link">
              <Text style={{ color: '#2563eb', fontSize: 16 }}>
                Don't have an account? Register
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};