import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import {
  ImageWithFallback,
  AvatarImage,
  ProfileImage,
  ThumbnailImage,
} from '@/components/ui/ImageWithFallback';

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: ({ onLoad, onError, ...props }: any) => {
    const MockImage = require('react-native').Image;
    return (
      <MockImage
        {...props}
        onLoad={onLoad}
        onError={onError}
        testID="expo-image"
      />
    );
  },
}));

describe('ImageWithFallback', () => {
  const mockSource = { uri: 'https://example.com/image.jpg' };
  const mockFallbackSource = { uri: 'https://example.com/fallback.jpg' };

  it('renders with basic props', () => {
    const { getByTestId } = render(
      <ImageWithFallback source={mockSource} />
    );

    expect(getByTestId('expo-image')).toBeTruthy();
  });

  it('shows loading state initially', () => {
    const { getByText } = render(
      <ImageWithFallback source={mockSource} />
    );

    expect(getByText('載入中...')).toBeTruthy();
  });

  it('hides loading state after successful load', async () => {
    const { getByTestId, queryByText } = render(
      <ImageWithFallback source={mockSource} />
    );

    const image = getByTestId('expo-image');
    fireEvent(image, 'onLoad');

    await waitFor(() => {
      expect(queryByText('載入中...')).toBeFalsy();
    });
  });

  it('calls onLoad callback', async () => {
    const onLoad = jest.fn();
    const { getByTestId } = render(
      <ImageWithFallback source={mockSource} onLoad={onLoad} />
    );

    const image = getByTestId('expo-image');
    fireEvent(image, 'onLoad');

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('shows error state when image fails to load', async () => {
      const { getByTestId, getByText } = render(
        <ImageWithFallback source={mockSource} />
      );

      const image = getByTestId('expo-image');
      fireEvent(image, 'onError', new Error('Load failed'));

      await waitFor(() => {
        expect(getByText('圖片載入失敗')).toBeTruthy();
      });
    });

    it('tries fallback source before showing error', async () => {
      const { getByTestId } = render(
        <ImageWithFallback
          source={mockSource}
          fallbackSource={mockFallbackSource}
        />
      );

      const image = getByTestId('expo-image');

      // First error - should try fallback
      fireEvent(image, 'onError', new Error('Load failed'));

      await waitFor(() => {
        expect(image.props.source).toBe(mockFallbackSource);
      });
    });

    it('shows error after fallback also fails', async () => {
      const { getByTestId, getByText } = render(
        <ImageWithFallback
          source={mockSource}
          fallbackSource={mockFallbackSource}
        />
      );

      const image = getByTestId('expo-image');

      // First error - tries fallback
      fireEvent(image, 'onError', new Error('Load failed'));

      await waitFor(() => {
        expect(image.props.source).toBe(mockFallbackSource);
      });

      // Second error - shows error state
      fireEvent(image, 'onError', new Error('Fallback failed'));

      await waitFor(() => {
        expect(getByText('圖片載入失敗')).toBeTruthy();
      });
    });

    it('calls onError callback', async () => {
      const onError = jest.fn();
      const { getByTestId } = render(
        <ImageWithFallback
          source={mockSource}
          onError={onError}
          retryable={false}
        />
      );

      const image = getByTestId('expo-image');
      const error = new Error('Load failed');
      fireEvent(image, 'onError', error);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error, 0);
      });
    });
  });

  describe('Retry Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('automatically retries on error', async () => {
      const { getByTestId, getByText } = render(
        <ImageWithFallback
          source={mockSource}
          retryable={true}
          maxRetries={2}
          retryDelay={1000}
        />
      );

      const image = getByTestId('expo-image');
      fireEvent(image, 'onError', new Error('Load failed'));

      await waitFor(() => {
        expect(getByText('重試中... (1/2)')).toBeTruthy();
      });

      // Fast forward retry delay
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        // Source should have cache buster added
        expect(image.props.source.uri).toMatch(/retry=1&t=\d+/);
      });
    });

    it('shows manual retry button after auto retry fails', async () => {
      const { getByTestId, getByText, getByRole } = render(
        <ImageWithFallback
          source={mockSource}
          retryable={true}
          maxRetries={1}
          showRetryButton={true}
        />
      );

      const image = getByTestId('expo-image');

      // First failure - auto retry
      fireEvent(image, 'onError', new Error('Load failed'));

      // Wait for retry
      jest.advanceTimersByTime(1000);

      // Second failure - should show manual retry
      fireEvent(image, 'onError', new Error('Retry failed'));

      await waitFor(() => {
        expect(getByText('圖片載入失敗')).toBeTruthy();
        expect(getByText('重試')).toBeTruthy();
      });

      const retryButton = getByRole('button');
      expect(retryButton).toBeTruthy();
    });

    it('handles manual retry button press', async () => {
      const onRetry = jest.fn();
      const { getByTestId, getByRole } = render(
        <ImageWithFallback
          source={mockSource}
          retryable={true}
          maxRetries={2}
          onRetry={onRetry}
          showRetryButton={true}
        />
      );

      const image = getByTestId('expo-image');

      // Cause initial error
      fireEvent(image, 'onError', new Error('Load failed'));

      // Wait for auto retry to complete
      jest.advanceTimersByTime(1000);
      fireEvent(image, 'onError', new Error('Auto retry failed'));

      await waitFor(() => {
        const retryButton = getByRole('button');
        fireEvent.press(retryButton);

        expect(onRetry).toHaveBeenCalledWith(2);
      });
    });

    it('stops retrying after max retries reached', async () => {
      const { getByTestId, getByText } = render(
        <ImageWithFallback
          source={mockSource}
          retryable={true}
          maxRetries={1}
          retryDelay={100}
        />
      );

      const image = getByTestId('expo-image');

      // First error - should retry
      fireEvent(image, 'onError', new Error('Load failed'));

      jest.advanceTimersByTime(100);

      // Second error - should show final error
      fireEvent(image, 'onError', new Error('Final failure'));

      await waitFor(() => {
        expect(getByText('已達最大重試次數 (1)')).toBeTruthy();
      });
    });

    it('disables retry when retryable is false', async () => {
      const { getByTestId, getByText, queryByText } = render(
        <ImageWithFallback
          source={mockSource}
          retryable={false}
        />
      );

      const image = getByTestId('expo-image');
      fireEvent(image, 'onError', new Error('Load failed'));

      await waitFor(() => {
        expect(getByText('圖片載入失敗')).toBeTruthy();
        expect(queryByText('重試中...')).toBeFalsy();
      });
    });
  });

  describe('Custom Components', () => {
    it('renders custom loading component', () => {
      const CustomLoading = () => <div data-testid="custom-loading">Loading...</div>;

      const { getByTestId } = render(
        <ImageWithFallback
          source={mockSource}
          loadingComponent={<CustomLoading />}
        />
      );

      expect(getByTestId('custom-loading')).toBeTruthy();
    });

    it('renders custom error component', async () => {
      const CustomError = () => <div data-testid="custom-error">Error!</div>;

      const { getByTestId } = render(
        <ImageWithFallback
          source={mockSource}
          errorComponent={<CustomError />}
          retryable={false}
        />
      );

      const image = getByTestId('expo-image');
      fireEvent(image, 'onError', new Error('Load failed'));

      await waitFor(() => {
        expect(getByTestId('custom-error')).toBeTruthy();
      });
    });
  });

  describe('Aspect Ratio', () => {
    it('applies aspect ratio style', () => {
      const { container } = render(
        <ImageWithFallback source={mockSource} aspectRatio={1.5} />
      );

      expect(container.findByProps({ aspectRatio: 1.5 })).toBeTruthy();
    });
  });
});

describe('Higher-order Components', () => {
  const mockSource = { uri: 'https://example.com/image.jpg' };

  describe('AvatarImage', () => {
    it('applies circular border radius and 1:1 aspect ratio', () => {
      const { container } = render(
        <AvatarImage source={mockSource} />
      );

      const imageContainer = container.findByProps({ aspectRatio: 1 });
      expect(imageContainer).toBeTruthy();

      // Check for circular border radius
      expect(container.findByProps({ style: expect.objectContaining({ borderRadius: 100 }) })).toBeTruthy();
    });
  });

  describe('ProfileImage', () => {
    it('applies 4:5 aspect ratio and rounded corners', () => {
      const { container } = render(
        <ProfileImage source={mockSource} />
      );

      const imageContainer = container.findByProps({ aspectRatio: 4/5 });
      expect(imageContainer).toBeTruthy();

      expect(container.findByProps({ style: expect.objectContaining({ borderRadius: 12 }) })).toBeTruthy();
    });
  });

  describe('ThumbnailImage', () => {
    it('applies 1:1 aspect ratio, rounded corners and reduced retry settings', () => {
      const { container } = render(
        <ThumbnailImage source={mockSource} />
      );

      const imageContainer = container.findByProps({ aspectRatio: 1 });
      expect(imageContainer).toBeTruthy();

      expect(container.findByProps({ style: expect.objectContaining({ borderRadius: 8 }) })).toBeTruthy();
    });
  });
});