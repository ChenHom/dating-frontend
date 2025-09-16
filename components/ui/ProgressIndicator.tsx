import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  size?: number;
  thickness?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  showCancel?: boolean;
  onCancel?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  status?: 'idle' | 'active' | 'success' | 'error';
  errorMessage?: string;
  estimatedTime?: number; // seconds
  uploadSpeed?: string; // e.g., "2.1 MB/s"
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  size = 80,
  thickness = 4,
  color = '#007AFF',
  backgroundColor = '#E5E5EA',
  showPercentage = true,
  showCancel = false,
  onCancel,
  style,
  textStyle,
  status = 'active',
  errorMessage,
  estimatedTime,
  uploadSpeed,
}) => {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#34C759';
      case 'error':
        return '#FF3B30';
      case 'idle':
        return '#8E8E93';
      default:
        return color;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      default:
        return null;
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}秒`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${Math.round(remainingSeconds)}秒`;
  };

  const statusColor = getStatusColor();
  const statusIcon = getStatusIcon();

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Progress Circle */}
      <View style={styles.circleContainer}>
        <View
          style={[
            styles.backgroundCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: thickness,
              borderColor: backgroundColor,
            },
          ]}
        />
        <View
          style={[
            styles.progressCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: thickness,
              borderColor: statusColor,
              transform: [
                { rotate: '-90deg' },
                { scaleX: -1 }, // Flip to make it clockwise
              ],
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: size - thickness * 2,
                height: size - thickness * 2,
                borderRadius: (size - thickness * 2) / 2,
                borderColor: statusColor,
                borderWidth: thickness,
                borderTopColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: 'transparent',
                transform: [
                  { rotate: `${(progress / 100) * 360}deg` },
                ],
              },
            ]}
          />
        </View>

        {/* Center Content */}
        <View style={styles.centerContent}>
          {statusIcon ? (
            <Ionicons name={statusIcon} size={size * 0.3} color={statusColor} />
          ) : showPercentage ? (
            <Text style={[styles.percentageText, { fontSize: size * 0.2 }, textStyle]}>
              {Math.round(progress)}%
            </Text>
          ) : null}

          {showCancel && onCancel && status === 'active' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={size * 0.15} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Text */}
      {(status === 'error' && errorMessage) && (
        <Text style={[styles.statusText, styles.errorText]}>
          {errorMessage}
        </Text>
      )}

      {(status === 'success') && (
        <Text style={[styles.statusText, styles.successText]}>
          上傳完成
        </Text>
      )}

      {(status === 'active' && (estimatedTime || uploadSpeed)) && (
        <View style={styles.infoContainer}>
          {estimatedTime && (
            <Text style={styles.infoText}>
              剩餘 {formatTime(estimatedTime)}
            </Text>
          )}
          {uploadSpeed && (
            <Text style={styles.infoText}>
              {uploadSpeed}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

// Linear Progress Bar Component
interface LinearProgressProps {
  progress: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  animated?: boolean;
}

export const LinearProgress: React.FC<LinearProgressProps> = ({
  progress,
  height = 4,
  color = '#007AFF',
  backgroundColor = '#E5E5EA',
  style,
  animated = true,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(progress);
    }
  }, [progress, animated]);

  return (
    <View
      style={[
        styles.linearContainer,
        { height, backgroundColor, borderRadius: height / 2 },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.linearProgress,
          {
            height,
            backgroundColor: color,
            borderRadius: height / 2,
            width: animatedValue.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
              extrapolate: 'clamp',
            }),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
  },
  progressCircle: {
    position: 'absolute',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  percentageText: {
    fontWeight: '600',
    color: '#1C1C1E',
  },
  cancelButton: {
    position: 'absolute',
    top: -5,
    right: -15,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorText: {
    color: '#FF3B30',
  },
  successText: {
    color: '#34C759',
  },
  infoContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
  },
  linearContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  linearProgress: {
    height: '100%',
  },
});