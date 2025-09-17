/**
 * PhotoUploadProgress Component Tests
 * 測試照片上傳進度指示器組件
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { PhotoUploadProgress } from '@/components/photo/PhotoUploadProgress';

describe('PhotoUploadProgress', () => {
  const defaultProps = {
    isUploading: true,
    progress: 50,
  };

  describe('Visibility', () => {
    it('renders when uploading', () => {
      const { getByTestId } = render(
        <PhotoUploadProgress {...defaultProps} />
      );

      expect(getByTestId('photo-upload-progress')).toBeTruthy();
    });

    it('renders when there is an error', () => {
      const { getByTestId } = render(
        <PhotoUploadProgress
          isUploading={false}
          progress={0}
          error="Upload failed"
        />
      );

      expect(getByTestId('photo-upload-progress')).toBeTruthy();
    });

    it('renders when upload is successful', () => {
      const { getByTestId } = render(
        <PhotoUploadProgress
          isUploading={false}
          progress={100}
          success={true}
        />
      );

      expect(getByTestId('photo-upload-progress')).toBeTruthy();
    });

    it('does not render when not uploading, no error, and not successful', () => {
      const { queryByTestId } = render(
        <PhotoUploadProgress
          isUploading={false}
          progress={0}
        />
      );

      expect(queryByTestId('photo-upload-progress')).toBeNull();
    });
  });

  describe('Progress Display', () => {
    it('shows correct progress percentage', () => {
      const { getByText } = render(
        <PhotoUploadProgress isUploading={true} progress={75} />
      );

      expect(getByText('75%')).toBeTruthy();
    });

    it('shows uploading status text', () => {
      const { getByText } = render(
        <PhotoUploadProgress isUploading={true} progress={30} />
      );

      expect(getByText('上傳中...')).toBeTruthy();
    });

    it('shows upload icon when uploading', () => {
      const { UNSAFE_getByType } = render(
        <PhotoUploadProgress isUploading={true} progress={30} />
      );

      // Check for Ionicons component with cloud-upload-outline
      const icons = UNSAFE_getByType(require('@expo/vector-icons').Ionicons);
      expect(icons.props.name).toBe('cloud-upload-outline');
    });

    it('rounds progress to nearest integer', () => {
      const { getByText } = render(
        <PhotoUploadProgress isUploading={true} progress={33.7} />
      );

      expect(getByText('34%')).toBeTruthy();
    });
  });

  describe('Success State', () => {
    it('shows success status when upload completes', () => {
      const { getByText } = render(
        <PhotoUploadProgress
          isUploading={false}
          progress={100}
          success={true}
        />
      );

      expect(getByText('上傳完成')).toBeTruthy();
      expect(getByText('100%')).toBeTruthy();
    });

    it('shows success icon when successful', () => {
      const { UNSAFE_getByType } = render(
        <PhotoUploadProgress
          isUploading={false}
          progress={100}
          success={true}
        />
      );

      const icons = UNSAFE_getByType(require('@expo/vector-icons').Ionicons);
      expect(icons.props.name).toBe('checkmark-circle');
    });

    it('applies success text styling', () => {
      const { getByText } = render(
        <PhotoUploadProgress
          isUploading={false}
          progress={100}
          success={true}
        />
      );

      const statusText = getByText('上傳完成');
      expect(statusText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#10b981' }),
        ])
      );
    });
  });

  describe('Error State', () => {
    it('shows error status when upload fails', () => {
      const { getByText } = render(
        <PhotoUploadProgress
          isUploading={false}
          progress={25}
          error="Network error"
        />
      );

      expect(getByText('上傳失敗')).toBeTruthy();
      expect(getByText('Network error')).toBeTruthy();
    });

    it('shows error icon when failed', () => {
      const { UNSAFE_getByType } = render(
        <PhotoUploadProgress
          isUploading={false}
          progress={25}
          error="Upload failed"
        />
      );

      const icons = UNSAFE_getByType(require('@expo/vector-icons').Ionicons);
      expect(icons.props.name).toBe('alert-circle');
    });

    it('applies error text styling', () => {
      const { getByText } = render(
        <PhotoUploadProgress
          isUploading={false}
          progress={25}
          error="Upload failed"
        />
      );

      const statusText = getByText('上傳失敗');
      expect(statusText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#ef4444' }),
        ])
      );
    });

    it('does not show progress percentage when error occurs', () => {
      const { queryByText } = render(
        <PhotoUploadProgress
          isUploading={false}
          progress={25}
          error="Upload failed"
        />
      );

      expect(queryByText('25%')).toBeNull();
    });

    it('truncates long error messages', () => {
      const longError = 'This is a very long error message that should be truncated to fit properly in the component display area';

      const { getByText } = render(
        <PhotoUploadProgress
          isUploading={false}
          progress={0}
          error={longError}
        />
      );

      const errorText = getByText(longError);
      expect(errorText.props.numberOfLines).toBe(2);
    });
  });

  describe('File Name Display', () => {
    it('shows file name when provided', () => {
      const { getByText } = render(
        <PhotoUploadProgress
          isUploading={true}
          progress={50}
          fileName="my-photo.jpg"
        />
      );

      expect(getByText('my-photo.jpg')).toBeTruthy();
    });

    it('truncates long file names', () => {
      const longFileName = 'this-is-a-very-long-file-name-that-should-be-truncated.jpg';

      const { getByText } = render(
        <PhotoUploadProgress
          isUploading={true}
          progress={50}
          fileName={longFileName}
        />
      );

      const fileNameText = getByText(longFileName);
      expect(fileNameText.props.numberOfLines).toBe(1);
    });

    it('does not show file name when not provided', () => {
      const { queryByText } = render(
        <PhotoUploadProgress isUploading={true} progress={50} />
      );

      // Should not have any specific file name text
      expect(queryByText(/\.jpg|\.png|\.jpeg/)).toBeNull();
    });
  });

  describe('Progress Bar Animation', () => {
    it('renders progress bar with correct initial width', () => {
      const { UNSAFE_getByType } = render(
        <PhotoUploadProgress isUploading={true} progress={60} />
      );

      // The animated view should exist (progress bar)
      const animatedViews = UNSAFE_getByType(require('react-native').Animated.View);
      expect(animatedViews).toBeTruthy();
    });

    it('applies correct progress bar color based on state', () => {
      // Test normal progress color
      const { rerender, UNSAFE_getByType } = render(
        <PhotoUploadProgress isUploading={true} progress={50} />
      );

      let animatedView = UNSAFE_getByType(require('react-native').Animated.View);
      expect(animatedView.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#3b82f6' }),
        ])
      );

      // Test error color
      rerender(
        <PhotoUploadProgress
          isUploading={false}
          progress={50}
          error="Failed"
        />
      );

      animatedView = UNSAFE_getByType(require('react-native').Animated.View);
      expect(animatedView.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#ef4444' }),
        ])
      );

      // Test success color
      rerender(
        <PhotoUploadProgress
          isUploading={false}
          progress={100}
          success={true}
        />
      );

      animatedView = UNSAFE_getByType(require('react-native').Animated.View);
      expect(animatedView.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#10b981' }),
        ])
      );
    });
  });

  describe('Custom Styling', () => {
    it('applies custom style prop', () => {
      const customStyle = { backgroundColor: '#custom-color' };

      const { getByTestId } = render(
        <PhotoUploadProgress
          isUploading={true}
          progress={50}
          style={customStyle}
        />
      );

      const container = getByTestId('photo-upload-progress');
      expect(container.props.style).toEqual(
        expect.arrayContaining([customStyle])
      );
    });

    it('applies custom testID', () => {
      const { getByTestId } = render(
        <PhotoUploadProgress
          isUploading={true}
          progress={50}
          testID="custom-progress"
        />
      );

      expect(getByTestId('custom-progress')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles 0% progress', () => {
      const { getByText } = render(
        <PhotoUploadProgress isUploading={true} progress={0} />
      );

      expect(getByText('0%')).toBeTruthy();
    });

    it('handles 100% progress', () => {
      const { getByText } = render(
        <PhotoUploadProgress isUploading={true} progress={100} />
      );

      expect(getByText('100%')).toBeTruthy();
    });

    it('handles progress values greater than 100', () => {
      const { getByText } = render(
        <PhotoUploadProgress isUploading={true} progress={150} />
      );

      expect(getByText('150%')).toBeTruthy();
    });

    it('handles negative progress values', () => {
      const { getByText } = render(
        <PhotoUploadProgress isUploading={true} progress={-10} />
      );

      expect(getByText('-10%')).toBeTruthy();
    });
  });
});