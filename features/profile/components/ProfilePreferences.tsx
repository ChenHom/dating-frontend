/**
 * ProfilePreferences Component
 * 用戶偏好設置組件 - 包含年齡範圍、距離範圍、興趣標籤等設置
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';

export interface ProfilePreferencesData {
  min_age: number;
  max_age: number;
  max_distance: number;
  show_online_only: boolean;
  show_verified_only: boolean;
  interested_in: 'male' | 'female' | 'both';
  interests: string[];
}

interface ProfilePreferencesProps {
  preferences: ProfilePreferencesData;
  onPreferencesChange: (preferences: ProfilePreferencesData) => void;
  testID?: string;
}

const INTEREST_OPTIONS = [
  { id: 'sports', label: '運動', icon: '🏃‍♂️' },
  { id: 'music', label: '音樂', icon: '🎵' },
  { id: 'movies', label: '電影', icon: '🎬' },
  { id: 'food', label: '美食', icon: '🍔' },
  { id: 'travel', label: '旅行', icon: '✈️' },
  { id: 'art', label: '藝術', icon: '🎨' },
  { id: 'reading', label: '閱讀', icon: '📚' },
  { id: 'gaming', label: '遊戲', icon: '🎮' },
  { id: 'photography', label: '攝影', icon: '📸' },
  { id: 'cooking', label: '烹飪', icon: '👨‍🍳' },
  { id: 'fitness', label: '健身', icon: '💪' },
  { id: 'nature', label: '自然', icon: '🌲' },
];

export const ProfilePreferences: React.FC<ProfilePreferencesProps> = ({
  preferences,
  onPreferencesChange,
  testID = 'profile-preferences',
}) => {
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const updatePreferences = (updates: Partial<ProfilePreferencesData>) => {
    const newPreferences = { ...localPreferences, ...updates };
    setLocalPreferences(newPreferences);
    onPreferencesChange(newPreferences);
  };

  const toggleInterest = (interestId: string) => {
    const currentInterests = localPreferences.interests;
    const newInterests = currentInterests.includes(interestId)
      ? currentInterests.filter(id => id !== interestId)
      : [...currentInterests, interestId];

    updatePreferences({ interests: newInterests });
  };

  const renderGenderPreference = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>興趣對象</Text>
      <View style={styles.genderOptions}>
        {[
          { value: 'male', label: '男性', icon: '👨' },
          { value: 'female', label: '女性', icon: '👩' },
          { value: 'both', label: '兩者皆可', icon: '👫' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.genderOption,
              localPreferences.interested_in === option.value && styles.genderOptionSelected,
            ]}
            onPress={() => updatePreferences({ interested_in: option.value as any })}
            testID={`${testID}-gender-${option.value}`}
          >
            <Text style={styles.genderIcon}>{option.icon}</Text>
            <Text
              style={[
                styles.genderLabel,
                localPreferences.interested_in === option.value && styles.genderLabelSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAgeRange = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        年齡範圍：{localPreferences.min_age} - {localPreferences.max_age} 歲
      </Text>

      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>最小年齡</Text>
        <Slider
          style={styles.slider}
          minimumValue={18}
          maximumValue={localPreferences.max_age - 1}
          value={localPreferences.min_age}
          step={1}
          minimumTrackTintColor="#E91E63"
          maximumTrackTintColor="#E0E0E0"
          thumbStyle={styles.sliderThumb}
          onValueChange={(value) => updatePreferences({ min_age: Math.round(value) })}
          testID={`${testID}-min-age-slider`}
        />
      </View>

      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>最大年齡</Text>
        <Slider
          style={styles.slider}
          minimumValue={localPreferences.min_age + 1}
          maximumValue={65}
          value={localPreferences.max_age}
          step={1}
          minimumTrackTintColor="#E91E63"
          maximumTrackTintColor="#E0E0E0"
          thumbStyle={styles.sliderThumb}
          onValueChange={(value) => updatePreferences({ max_age: Math.round(value) })}
          testID={`${testID}-max-age-slider`}
        />
      </View>
    </View>
  );

  const renderDistanceRange = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        距離範圍：{localPreferences.max_distance} 公里內
      </Text>

      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={100}
        value={localPreferences.max_distance}
        step={1}
        minimumTrackTintColor="#E91E63"
        maximumTrackTintColor="#E0E0E0"
        thumbStyle={styles.sliderThumb}
        onValueChange={(value) => updatePreferences({ max_distance: Math.round(value) })}
        testID={`${testID}-distance-slider`}
      />
    </View>
  );

  const renderFilterOptions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>篩選選項</Text>

      <View style={styles.switchOption}>
        <Text style={styles.switchLabel}>只顯示在線用戶</Text>
        <Switch
          value={localPreferences.show_online_only}
          onValueChange={(value) => updatePreferences({ show_online_only: value })}
          trackColor={{ false: '#E0E0E0', true: '#E91E63' }}
          thumbColor={localPreferences.show_online_only ? '#ffffff' : '#f4f3f4'}
          testID={`${testID}-show-online-switch`}
        />
      </View>

      <View style={styles.switchOption}>
        <Text style={styles.switchLabel}>只顯示認證用戶</Text>
        <Switch
          value={localPreferences.show_verified_only}
          onValueChange={(value) => updatePreferences({ show_verified_only: value })}
          trackColor={{ false: '#E0E0E0', true: '#E91E63' }}
          thumbColor={localPreferences.show_verified_only ? '#ffffff' : '#f4f3f4'}
          testID={`${testID}-show-verified-switch`}
        />
      </View>
    </View>
  );

  const renderInterests = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>興趣標籤</Text>
      <Text style={styles.sectionSubtitle}>選擇你的興趣，幫助我們推薦更合適的人</Text>

      <View style={styles.interestsGrid}>
        {INTEREST_OPTIONS.map((interest) => (
          <TouchableOpacity
            key={interest.id}
            style={[
              styles.interestTag,
              localPreferences.interests.includes(interest.id) && styles.interestTagSelected,
            ]}
            onPress={() => toggleInterest(interest.id)}
            testID={`${testID}-interest-${interest.id}`}
          >
            <Text style={styles.interestIcon}>{interest.icon}</Text>
            <Text
              style={[
                styles.interestLabel,
                localPreferences.interests.includes(interest.id) && styles.interestLabelSelected,
              ]}
            >
              {interest.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      testID={testID}
    >
      {renderGenderPreference()}
      {renderAgeRange()}
      {renderDistanceRange()}
      {renderFilterOptions()}
      {renderInterests()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  genderOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  genderOptionSelected: {
    borderColor: '#E91E63',
    backgroundColor: '#ffeef5',
  },
  genderIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  genderLabelSelected: {
    color: '#E91E63',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#E91E63',
    width: 20,
    height: 20,
  },
  switchOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333333',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  interestTagSelected: {
    borderColor: '#E91E63',
    backgroundColor: '#ffeef5',
  },
  interestIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  interestLabel: {
    fontSize: 14,
    color: '#666666',
  },
  interestLabelSelected: {
    color: '#E91E63',
    fontWeight: '600',
  },
});

export default ProfilePreferences;