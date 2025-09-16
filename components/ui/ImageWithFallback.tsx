import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { Image, ImageProps, ImageSource } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface ImageWithFallbackProps extends Omit<ImageProps, 'source' | 'onLoad' | 'onError'> {
  source: ImageSource | string;
  fallbackSource?: ImageSource | string;
  placeholder?: string;
  retryable?: boolean;
  maxRetries?: number;
  showRetryButton?: boolean;
  retryDelay?: number; // milliseconds
  onError?: (error: any, retryCount: number) => void;
  onLoad?: () => void;
  onRetry?: (retryCount: number) => void;
  style?: ViewStyle | ViewStyle[];
  containerStyle?: ViewStyle;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  aspectRatio?: number;
}

type LoadState = 'loading' | 'loaded' | 'error' | 'retrying';

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  source,
  fallbackSource,
  placeholder = '📷',
  retryable = true,
  maxRetries = 3,
  showRetryButton = true,
  retryDelay = 1000,
  onError,
  onLoad,
  onRetry,
  style,
  containerStyle,
  loadingComponent,
  errorComponent,
  aspectRatio,
  contentFit = 'cover',
  ...imageProps
}) => {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [currentSource, setCurrentSource] = useState(source);

  const handleLoad = useCallback(() => {
    setLoadState('loaded');
    setRetryCount(0);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((error: any) => {
    // Try fallback source first if available and not already tried
    if (fallbackSource && currentSource !== fallbackSource) {
      setCurrentSource(fallbackSource);
      setLoadState('loading');
      return;
    }

    // Try retry if enabled and within limit
    if (retryable && retryCount < maxRetries) {
      setLoadState('retrying');
      const nextRetryCount = retryCount + 1;
      setRetryCount(nextRetryCount);

      setTimeout(() => {
        setLoadState('loading');
        // Force image reload by adding cache buster
        const newSource = typeof currentSource === 'string'
          ? `${currentSource}?retry=${nextRetryCount}&t=${Date.now()}`
          : currentSource;
        setCurrentSource(newSource);
      }, retryDelay);

      onRetry?.(nextRetryCount);
      return;
    }

    // All retries exhausted or retry disabled
    setLoadState('error');
    onError?.(error, retryCount);
  }, [
    fallbackSource,
    currentSource,
    retryable,
    retryCount,
    maxRetries,
    retryDelay,
    onError,
    onRetry
  ]);

  const handleManualRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      const nextRetryCount = retryCount + 1;
      setRetryCount(nextRetryCount);
      setLoadState('loading');

      // Reset to original source for manual retry
      setCurrentSource(source);
      onRetry?.(nextRetryCount);
    }
  }, [retryCount, maxRetries, source, onRetry]);

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      position: 'relative',
      overflow: 'hidden',
    };

    if (aspectRatio) {
      baseStyle.aspectRatio = aspectRatio;
    }

    return baseStyle;
  };

  const renderLoadingState = () => {
    if (loadingComponent) {
      return loadingComponent;
    }

    return (
      <View style={styles.overlayContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  };

  const renderRetryingState = () => (
    <View style={styles.overlayContainer}>
      <ActivityIndicator size="small" color="#FF9500" />
      <Text style={styles.retryingText}>重試中... ({retryCount}/{maxRetries})</Text>
    </View>
  );

  const renderErrorState = () => {
    if (errorComponent) {
      return errorComponent;
    }

    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="image-outline" size={32} color="#999" />
          <Text style={styles.errorText}>圖片載入失敗</Text>

          {showRetryButton && retryCount < maxRetries && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleManualRetry}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="refresh" size={16} color="#007AFF" />
              <Text style={styles.retryButtonText}>重試</Text>
            </TouchableOpacity>
          )}

          {retryCount >= maxRetries && (
            <Text style={styles.maxRetriesText}>
              已達最大重試次數 ({maxRetries})
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[getContainerStyle(), containerStyle]}>
      <Image
        {...imageProps}
        source={currentSource}
        style={[styles.image, style]}
        onLoad={handleLoad}
        onError={handleError}
        contentFit={contentFit}
        placeholder={placeholder}
        transition={200}
      />

      {/* Overlay States */}
      {loadState === 'loading' && renderLoadingState()}
      {loadState === 'retrying' && renderRetryingState()}
      {loadState === 'error' && renderErrorState()}

      {/* Retry Count Badge (for debugging) */}
      {__DEV__ && retryCount > 0 && (
        <View style={styles.debugBadge}>
          <Text style={styles.debugText}>{retryCount}</Text>
        </View>
      )}
    </View>
  );
};

// Higher-order component for common image types
export const AvatarImage: React.FC<Omit<ImageWithFallbackProps, 'aspectRatio' | 'contentFit'>> = (props) => (
  <ImageWithFallback
    {...props}
    aspectRatio={1}
    contentFit="cover"
    style={[{ borderRadius: 100 }, props.style]}
  />
);

export const ProfileImage: React.FC<Omit<ImageWithFallbackProps, 'aspectRatio' | 'contentFit'>> = (props) => (
  <ImageWithFallback
    {...props}
    aspectRatio={4/5}
    contentFit="cover"
    style={[{ borderRadius: 12 }, props.style]}
  />
);

export const ThumbnailImage: React.FC<Omit<ImageWithFallbackProps, 'aspectRatio' | 'contentFit'>> = (props) => (
  <ImageWithFallback
    {...props}
    aspectRatio={1}
    contentFit="cover"
    maxRetries={1}
    retryDelay={500}
    style={[{ borderRadius: 8 }, props.style]}
  />
);

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  retryingText: {
    fontSize: 12,
    color: '#FF9500',
    marginTop: 8,
    fontWeight: '500',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  errorContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  retryButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  maxRetriesText: {
    fontSize: 10,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  debugBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});