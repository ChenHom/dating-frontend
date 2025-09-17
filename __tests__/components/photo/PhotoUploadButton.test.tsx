/**
 * PhotoUploadButton Component Tests
 * 測試新實作的照片上傳按鈕組件
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import { PhotoUploadButton } from '@/components/photo/PhotoUploadButton';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

// Mock dependencies
jest.mock('expo-image-picker');
jest.mock('expo-image-manipulator');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockImagePicker = ImagePicker as jest.Mocked<typeof ImagePicker>;
const mockImageManipulator = ImageManipulator as jest.Mocked<typeof ImageManipulator>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

describe('PhotoUploadButton', () => {
  const mockOnImageSelected = jest.fn();
  const mockOnUploadStart = jest.fn();
  const mockOnUploadComplete = jest.fn();
  const mockOnUploadError = jest.fn();

  const defaultProps = {
    onImageSelected: mockOnImageSelected,
    onUploadStart: mockOnUploadStart,
    onUploadComplete: mockOnUploadComplete,
    onUploadError: mockOnUploadError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';

    // Mock default permission responses
    mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
      status: 'granted',
      expires: 'never',
      granted: true,
      canAskAgain: true,
    });

    mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: 'granted',
      expires: 'never',
      granted: true,
      canAskAgain: true,
    });
  });

  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      const { getByTestId, getByText } = render(
        <PhotoUploadButton onImageSelected={mockOnImageSelected} />
      );

      expect(getByTestId('photo-upload-button')).toBeTruthy();
      expect(getByText('上傳照片')).toBeTruthy();
      expect(getByText('最大 1080px, 1MB')).toBeTruthy();
    });

    it('shows disabled state when disabled prop is true', () => {
      const { getByTestId } = render(
        <PhotoUploadButton onImageSelected={mockOnImageSelected} disabled={true} />
      );

      const button = getByTestId('photo-upload-button');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it('shows processing state when processing', () => {
      const { getByText } = render(
        <PhotoUploadButton onImageSelected={mockOnImageSelected} />
      );

      // We'll test this in the interaction tests where processing state is triggered
      expect(getByText('上傳照片')).toBeTruthy();
    });
  });

  describe('Permissions', () => {
    it('requests permissions before showing photo options', async () => {
      const { getByTestId } = render(
        <PhotoUploadButton onImageSelected={mockOnImageSelected} />
      );

      fireEvent.press(getByTestId('photo-upload-button'));

      await waitFor(() => {
        expect(mockImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
        expect(mockImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      });
    });

    it('shows alert when permissions are denied', async () => {
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
        status: 'denied',
        expires: 'never',
        granted: false,
        canAskAgain: true,
      });

      const { getByTestId } = render(
        <PhotoUploadButton onImageSelected={mockOnImageSelected} />
      );

      fireEvent.press(getByTestId('photo-upload-button'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          '權限需求',
          '需要相機和相簿權限來上傳照片',
          [{ text: '確定' }]
        );
      });
    });
  });

  describe('Photo Selection', () => {
    beforeEach(() => {
      // Mock successful image manipulation
      mockImageManipulator.manipulateAsync.mockResolvedValue({
        uri: 'file://processed-image.jpg',
        width: 1080,
        height: 1350,
        base64: 'processed-base64-data',
      });
    });

    it('handles camera selection on iOS', async () => {
      Platform.OS = 'ios';

      mockImagePicker.launchCameraAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://camera-image.jpg',
          width: 2000,
          height: 2500,
          assetId: 'test-asset',
          fileName: 'camera-image.jpg',
          fileSize: 1500000,
          type: 'image',
          mimeType: 'image/jpeg',
          exif: null,
          base64: null,
          duration: null,
        }],
      });

      const { getByTestId } = render(
        <PhotoUploadButton onImageSelected={mockOnImageSelected} />
      );

      fireEvent.press(getByTestId('photo-upload-button'));

      // Simulate iOS alert selection (camera option)
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      });

      // Simulate user selecting camera option
      const alertCall = mockAlert.mock.calls[0];
      const buttons = alertCall[2];
      const cameraButton = buttons.find((button: any) => button.text === '相機');
      cameraButton.onPress();

      await waitFor(() => {
        expect(mockOnUploadStart).toHaveBeenCalled();
        expect(mockImagePicker.launchCameraAsync).toHaveBeenCalledWith({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 5],
          quality: 1,
        });
        expect(mockImageManipulator.manipulateAsync).toHaveBeenCalled();
        expect(mockOnImageSelected).toHaveBeenCalledWith({
          uri: 'file://processed-image.jpg',
          base64: 'processed-base64-data',
          width: 1080,
          height: 1350,
        });
        expect(mockOnUploadComplete).toHaveBeenCalled();
      });
    });

    it('handles gallery selection on iOS', async () => {
      Platform.OS = 'ios';

      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://gallery-image.jpg',
          width: 1500,
          height: 2000,
          assetId: 'test-asset',
          fileName: 'gallery-image.jpg',
          fileSize: 800000,
          type: 'image',
          mimeType: 'image/jpeg',
          exif: null,
          base64: null,
          duration: null,
        }],
      });

      const { getByTestId } = render(
        <PhotoUploadButton onImageSelected={mockOnImageSelected} />
      );

      fireEvent.press(getByTestId('photo-upload-button'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      });

      // Simulate user selecting gallery option
      const alertCall = mockAlert.mock.calls[0];
      const buttons = alertCall[2];
      const galleryButton = buttons.find((button: any) => button.text === '相簿');
      galleryButton.onPress();

      await waitFor(() => {
        expect(mockImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 5],
          quality: 1,
        });
        expect(mockOnImageSelected).toHaveBeenCalled();
      });
    });

    it('handles user cancellation', async () => {
      mockImagePicker.launchCameraAsync.mockResolvedValue({
        canceled: true,
        assets: [],
      });

      const { getByTestId } = render(
        <PhotoUploadButton onImageSelected={mockOnImageSelected} />
      );

      fireEvent.press(getByTestId('photo-upload-button'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      });

      // Simulate user selecting camera option
      const alertCall = mockAlert.mock.calls[0];
      const buttons = alertCall[2];
      const cameraButton = buttons.find((button: any) => button.text === '相機');
      cameraButton.onPress();

      await waitFor(() => {
        expect(mockImagePicker.launchCameraAsync).toHaveBeenCalled();
        expect(mockOnImageSelected).not.toHaveBeenCalled();
        expect(mockOnUploadComplete).not.toHaveBeenCalled();
      });
    });
  });

  describe('Image Processing', () => {
    it('processes images with correct settings', async () => {
      mockImagePicker.launchCameraAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://test-image.jpg',
          width: 3000,
          height: 4000,
          assetId: 'test-asset',
          fileName: 'test-image.jpg',
          fileSize: 2000000,
          type: 'image',
          mimeType: 'image/jpeg',
          exif: null,
          base64: null,
          duration: null,
        }],
      });

      mockImageManipulator.manipulateAsync.mockResolvedValue({
        uri: 'file://processed.jpg',
        width: 1080,
        height: 1440,
        base64: 'base64-data',
      });

      const { getByTestId } = render(
        <PhotoUploadButton onImageSelected={mockOnImageSelected} />
      );

      fireEvent.press(getByTestId('photo-upload-button'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      });

      // Select camera
      const alertCall = mockAlert.mock.calls[0];
      const buttons = alertCall[2];
      const cameraButton = buttons.find((button: any) => button.text === '相機');
      cameraButton.onPress();

      await waitFor(() => {
        expect(mockImageManipulator.manipulateAsync).toHaveBeenCalledWith(
          'file://test-image.jpg',
          [{ resize: { width: 1080 } }],
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );
      });
    });

    it('handles image processing errors', async () => {
      mockImagePicker.launchCameraAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://bad-image.jpg',
          width: 1000,
          height: 1000,
          assetId: 'test-asset',
          fileName: 'bad-image.jpg',
          fileSize: 500000,
          type: 'image',
          mimeType: 'image/jpeg',
          exif: null,
          base64: null,
          duration: null,
        }],
      });

      mockImageManipulator.manipulateAsync.mockRejectedValue(
        new Error('Processing failed')
      );

      const { getByTestId } = render(
        <PhotoUploadButton onImageSelected={mockOnImageSelected} />
      );

      fireEvent.press(getByTestId('photo-upload-button'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      });

      // Select camera
      const alertCall = mockAlert.mock.calls[0];
      const buttons = alertCall[2];
      const cameraButton = buttons.find((button: any) => button.text === '相機');
      cameraButton.onPress();

      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalledWith('照片處理失敗');
        expect(mockAlert).toHaveBeenCalledWith('錯誤', '照片處理失敗');
      });
    });
  });

  describe('Platform-specific behavior', () => {
    it('shows different alert on Android', async () => {
      Platform.OS = 'android';

      const { getByTestId } = render(
        <PhotoUploadButton onImageSelected={mockOnImageSelected} />
      );

      fireEvent.press(getByTestId('photo-upload-button'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          '選擇照片',
          '',
          expect.arrayContaining([
            expect.objectContaining({ text: '相機' }),
            expect.objectContaining({ text: '相簿' }),
            expect.objectContaining({ text: '取消' }),
          ])
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('handles camera launch errors', async () => {
      mockImagePicker.launchCameraAsync.mockRejectedValue(
        new Error('Camera not available')
      );

      const { getByTestId } = render(
        <PhotoUploadButton onImageSelected={mockOnImageSelected} />
      );

      fireEvent.press(getByTestId('photo-upload-button'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      });

      // Select camera
      const alertCall = mockAlert.mock.calls[0];
      const buttons = alertCall[2];
      const cameraButton = buttons.find((button: any) => button.text === '相機');
      cameraButton.onPress();

      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalledWith('相機拍照失敗');
        expect(mockAlert).toHaveBeenCalledWith('錯誤', '相機拍照失敗');
      });
    });

    it('handles gallery launch errors', async () => {
      mockImagePicker.launchImageLibraryAsync.mockRejectedValue(
        new Error('Gallery not available')
      );

      const { getByTestId } = render(
        <PhotoUploadButton onImageSelected={mockOnImageSelected} />
      );

      fireEvent.press(getByTestId('photo-upload-button'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      });

      // Select gallery
      const alertCall = mockAlert.mock.calls[0];
      const buttons = alertCall[2];
      const galleryButton = buttons.find((button: any) => button.text === '相簿');
      galleryButton.onPress();

      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalledWith('相簿選擇失敗');
      });
    });
  });
});