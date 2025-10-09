/**
 * MessageInput Component
 * 訊息輸入組件
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  testID?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "輸入訊息...",
  maxLength = 500,
  testID = 'message-input',
}) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (!message.trim() || disabled) return;

    onSendMessage(message.trim());
    setMessage('');
  };

  const canSend = message.trim().length > 0 && !disabled;

  // 在 Web 平台添加 Enter 鍵監聽
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleSend();
      }
    };

    // 使用 setTimeout 確保 DOM 元素已渲染
    const timer = setTimeout(() => {
      const input = (inputRef.current as any);
      // 在 React Native Web 中，TextInput 會被轉換為 textarea
      const textarea = input?._node || input;

      if (textarea && textarea.addEventListener) {
        textarea.addEventListener('keydown', handleKeyDown);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      const input = (inputRef.current as any);
      const textarea = input?._node || input;
      if (textarea && textarea.removeEventListener) {
        textarea.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [message, disabled]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <View style={styles.container} testID={testID}>
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              disabled && styles.textInputDisabled
            ]}
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={maxLength}
            editable={!disabled}
            testID={`${testID}-text`}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              canSend ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            onPress={handleSend}
            disabled={!canSend}
            testID={`${testID}-send`}
          >
            <Ionicons
              name="send"
              size={20}
              color={canSend ? '#ffffff' : '#9ca3af'}
            />
          </TouchableOpacity>
        </View>

        {message.length > 0 && (
          <Text
            style={[
              styles.characterCount,
              message.length > maxLength * 0.8 && styles.characterCountWarning
            ]}
            testID={`${testID}-count`}
          >
            {message.length}/{maxLength}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    backgroundColor: '#ffffff',
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    backgroundColor: '#f9fafb',
    textAlignVertical: 'top',
  },
  textInputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#3b82f6',
  },
  sendButtonInactive: {
    backgroundColor: '#e5e7eb',
  },
  characterCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  characterCountWarning: {
    color: '#f59e0b',
  },
});