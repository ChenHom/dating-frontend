/**
 * PhotoUploadProgress Component
 * 照片上傳進度指示器組件
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PhotoUploadProgressProps {
  isUploading: boolean;
  progress: number; // 0-100
  fileName?: string;
  error?: string;
  success?: boolean;
  style?: any;
  testID?: string;
}

export const PhotoUploadProgress: React.FC<PhotoUploadProgressProps> = ({
  isUploading,
  progress,
  fileName,
  error,
  success = false,
  style,
  testID = 'photo-upload-progress',
}) => {
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  if (!isUploading && !error && !success) {
    return null;
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
                backgroundColor: error ? '#ef4444' : success ? '#10b981' : '#3b82f6',
              },
            ]}
          />
        </View>
      </View>

      {/* Status Information */}
      <View style={styles.statusContainer}>
        <View style={styles.statusLeft}>
          {error ? (
            <Ionicons name="alert-circle" size={16} color="#ef4444" />
          ) : success ? (
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          ) : (
            <Ionicons name="cloud-upload-outline" size={16} color="#3b82f6" />
          )}

          <Text style={[
            styles.statusText,
            error && styles.errorText,
            success && styles.successText,
          ]}>
            {error ? '上傳失敗' : success ? '上傳完成' : '上傳中...'}
          </Text>
        </View>

        <Text style={styles.progressText}>
          {error ? '' : `${Math.round(progress)}%`}
        </Text>
      </View>

      {/* File Name */}
      {fileName && (
        <Text style={styles.fileName} numberOfLines={1}>
          {fileName}
        </Text>
      )}

      {/* Error Message */}
      {error && (
        <Text style={styles.errorMessage} numberOfLines={2}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 6,
  },
  errorText: {
    color: '#ef4444',
  },
  successText: {
    color: '#10b981',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  fileName: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  errorMessage: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});