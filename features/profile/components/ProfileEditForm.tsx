/**
 * ProfileEditForm Component
 * 個人檔案編輯表單
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Profile } from '@/lib/types';
import { profileUpdateSchema, ProfileFormData } from '@/lib/validation';
import { useProfileStore } from '@/stores/profile';

interface ProfileEditFormProps {
  profile: Profile | null;
  onSave: () => void;
  onCancel: () => void;
}

interface FormData extends ProfileFormData {
  display_name: string; // Make display_name required in form
}

const formSchema = profileUpdateSchema.extend({
  display_name: z.string().min(2, '顯示名稱至少需要 2 個字元').max(50, '顯示名稱不能超過 50 個字元'),
});

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  profile,
  onSave,
  onCancel,
}) => {
  const { updateProfile, isLoading, error, clearError } = useProfileStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      birth_date: profile?.birth_date || '',
      gender: profile?.gender || undefined,
      interested_in: profile?.interested_in || undefined,
      location: profile?.location || '',
    },
    mode: 'onChange',
  });

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      Alert.alert('錯誤', error, [{ text: '確定' }]);
    }
  }, [error]);

  const onSubmit = async (data: FormData) => {
    try {
      await updateProfile(data);
      onSave();
    } catch (error) {
      // Error is handled by the store and useEffect above
    }
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const genderOptions = [
    { value: 'male', label: '男性' },
    { value: 'female', label: '女性' },
    { value: 'other', label: '其他' },
  ];

  const interestedInOptions = [
    { value: 'male', label: '男性' },
    { value: 'female', label: '女性' },
    { value: 'both', label: '兩者皆可' },
  ];

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        {/* Display Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>顯示名稱 *</Text>
          <Controller
            control={control}
            name="display_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  errors.display_name && styles.inputError,
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="輸入顯示名稱"
                maxLength={50}
                autoCapitalize="words"
              />
            )}
          />
          {errors.display_name && (
            <Text style={styles.errorText}>{errors.display_name.message}</Text>
          )}
        </View>

        {/* Bio */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>個人簡介</Text>
          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.textArea,
                  errors.bio && styles.inputError,
                ]}
                value={value || ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="簡單介紹一下自己"
                maxLength={500}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            )}
          />
          {errors.bio && (
            <Text style={styles.errorText}>{errors.bio.message}</Text>
          )}
        </View>

        {/* Birth Date */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>生日</Text>
          <Controller
            control={control}
            name="birth_date"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  errors.birth_date && styles.inputError,
                ]}
                value={value || ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="YYYY-MM-DD"
                maxLength={10}
                keyboardType="numeric"
              />
            )}
          />
          {errors.birth_date && (
            <Text style={styles.errorText}>{errors.birth_date.message}</Text>
          )}
        </View>

        {/* Gender */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>性別</Text>
          <Controller
            control={control}
            name="gender"
            render={({ field: { value, onChange } }) => (
              <View style={styles.optionsContainer}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      value === option.value && styles.selectedOption,
                    ]}
                    onPress={() => onChange(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        value === option.value && styles.selectedOptionText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </View>

        {/* Interested In */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>興趣對象</Text>
          <Controller
            control={control}
            name="interested_in"
            render={({ field: { value, onChange } }) => (
              <View style={styles.optionsContainer}>
                {interestedInOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      value === option.value && styles.selectedOption,
                    ]}
                    onPress={() => onChange(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        value === option.value && styles.selectedOptionText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </View>

        {/* Location */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>地點</Text>
          <Controller
            control={control}
            name="location"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  errors.location && styles.inputError,
                ]}
                value={value || ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="輸入所在地點"
                maxLength={100}
                autoCapitalize="words"
              />
            )}
          />
          {errors.location && (
            <Text style={styles.errorText}>{errors.location.message}</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.saveButton,
              (!isValid || isLoading) && styles.disabledButton,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? '儲存中...' : '儲存'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 100,
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});