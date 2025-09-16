import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import { PhotoUploadButton } from '@/features/profile/components/PhotoUploadButton';
import { usePhotoStore } from '@/stores/photo';
import * as ImageUtils from '@/lib/imageUtils';

// Mock dependencies
jest.mock('@/stores/photo');
jest.mock('@/lib/imageUtils');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockUsePhotoStore = usePhotoStore as jest.MockedFunction<typeof usePhotoStore>;
const mockImageUtils = ImageUtils as jest.Mocked<typeof ImageUtils>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

describe('PhotoUploadButton', () => {
  const mockStore = {
    photos: [],
    addToUploadQueue: jest.fn(),
    uploadPhoto: jest.fn(),
    uploadsToday: 0,
    uploadLimit: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePhotoStore.mockReturnValue(mockStore as any);
    Platform.OS = 'ios';
  });

  it('renders correctly with default props', () => {
    const { getByRole } = render(<PhotoUploadButton />);

    const button = getByRole('button');
    expect(button).toBeTruthy();
  });

  it('shows photo count information', () => {
    const { getByText } = render(
      <PhotoUploadButton maxPhotos={6} size="medium" />
    );

    expect(getByText('0/6 張照片')).toBeTruthy();
  });

  it('shows remaining uploads info when limit is approached', () => {
    mockUsePhotoStore.mockReturnValue({
      ...mockStore,
      uploadsToday: 7,
      uploadLimit: 10,
    } as any);

    const { getByText } = render(
      <PhotoUploadButton maxPhotos={6} size="medium" />
    );

    expect(getByText('今日剩餘 3 次上傳')).toBeTruthy();
  });

  it('disables button when photo limit reached', () => {
    mockUsePhotoStore.mockReturnValue({
      ...mockStore,
      photos: new Array(6).fill({}),
    } as any);

    const { getByRole } = render(
      <PhotoUploadButton maxPhotos={6} />
    );

    const button = getByRole('button');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('disables button when daily upload limit reached', () => {
    mockUsePhotoStore.mockReturnValue({
      ...mockStore,
      uploadsToday: 10,
      uploadLimit: 10,
    } as any);

    const { getByRole } = render(<PhotoUploadButton />);

    const button = getByRole('button');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('shows alert when trying to upload beyond photo limit', () => {
    mockUsePhotoStore.mockReturnValue({
      ...mockStore,
      photos: new Array(6).fill({}),
    } as any);

    const { getByRole } = render(
      <PhotoUploadButton maxPhotos={6} />
    );

    const button = getByRole('button');
    fireEvent.press(button);

    expect(mockAlert).toHaveBeenCalledWith(
      '照片數量已滿',
      '您已上傳 6 張照片，請先刪除一些照片再上傳新的'
    );
  });

  it('shows alert when trying to upload beyond daily limit', () => {
    mockUsePhotoStore.mockReturnValue({
      ...mockStore,
      uploadsToday: 10,
      uploadLimit: 10,
    } as any);

    const { getByRole } = render(<PhotoUploadButton />);

    const button = getByRole('button');
    fireEvent.press(button);

    expect(mockAlert).toHaveBeenCalledWith(
      '今日上傳次數已達上限',
      '每日最多可上傳 10 次'
    );
  });

  describe('iOS ActionSheet', () => {
    it('shows action sheet on iOS when button is pressed', async () => {
      const mockActionSheet = jest.fn();
      Platform.OS = 'ios';

      const ActionSheetIOS = require('react-native').ActionSheetIOS;
      ActionSheetIOS.showActionSheetWithOptions = mockActionSheet;

      const { getByRole } = render(<PhotoUploadButton />);

      const button = getByRole('button');
      fireEvent.press(button);

      expect(mockActionSheet).toHaveBeenCalled();
      expect(mockActionSheet.mock.calls[0][0].options).toEqual([
        '拍照',
        '從相簿選擇',
        '取消'
      ]);
    });

    it('shows multiple selection option when allowMultiple is true', () => {
      const mockActionSheet = jest.fn();
      Platform.OS = 'ios';

      const ActionSheetIOS = require('react-native').ActionSheetIOS;
      ActionSheetIOS.showActionSheetWithOptions = mockActionSheet;

      const { getByRole } = render(
        <PhotoUploadButton allowMultiple={true} />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      expect(mockActionSheet).toHaveBeenCalled();
      expect(mockActionSheet.mock.calls[0][0].options).toEqual([
        '拍照',
        '從相簿選擇多張',
        '取消'
      ]);
    });
  });

  describe('Android Alert', () => {
    it('shows alert on Android when button is pressed', () => {
      Platform.OS = 'android';

      const { getByRole } = render(<PhotoUploadButton />);

      const button = getByRole('button');
      fireEvent.press(button);

      expect(mockAlert).toHaveBeenCalledWith(
        '選擇圖片來源',
        undefined,
        expect.arrayContaining([
          expect.objectContaining({ text: '拍照' }),
          expect.objectContaining({ text: '從相簿選擇' }),
          expect.objectContaining({ text: '取消' }),
        ])
      );
    });
  });

  describe('Image Selection and Upload', () => {
    it('handles successful camera upload', async () => {
      const mockProcessedImage = {
        base64: 'mock-base64',
        uri: 'mock-uri',
        width: 1080,
        height: 1080,
        fileSize: 500000,
      };

      mockImageUtils.pickImageFromCamera.mockResolvedValue(mockProcessedImage);
      mockStore.addToUploadQueue.mockReturnValue('mock-upload-id');
      mockStore.uploadPhoto.mockResolvedValue(undefined);

      const onUploadSuccess = jest.fn();

      const { getByRole } = render(
        <PhotoUploadButton onUploadSuccess={onUploadSuccess} />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      // Simulate ActionSheet camera selection
      const ActionSheetIOS = require('react-native').ActionSheetIOS;
      const mockCallback = ActionSheetIOS.showActionSheetWithOptions.mock.calls[0][1];
      mockCallback(0); // Camera option

      await waitFor(() => {
        expect(mockImageUtils.pickImageFromCamera).toHaveBeenCalled();
        expect(mockStore.addToUploadQueue).toHaveBeenCalledWith({
          image: 'mock-base64',
          localUri: 'mock-uri',
          order: 1,
        });
        expect(mockStore.uploadPhoto).toHaveBeenCalledWith('mock-upload-id');
        expect(onUploadSuccess).toHaveBeenCalledWith([mockProcessedImage]);
      });
    });

    it('handles camera permission denied', async () => {
      const permissionError = new Error('需要相機權限才能拍照');
      mockImageUtils.pickImageFromCamera.mockRejectedValue(permissionError);

      const onUploadError = jest.fn();

      const { getByRole } = render(
        <PhotoUploadButton onUploadError={onUploadError} />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      // Simulate ActionSheet camera selection
      const ActionSheetIOS = require('react-native').ActionSheetIOS;
      const mockCallback = ActionSheetIOS.showActionSheetWithOptions.mock.calls[0][1];
      mockCallback(0); // Camera option

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          '上傳失敗',
          '需要相機權限才能拍照'
        );
        expect(onUploadError).toHaveBeenCalledWith('需要相機權限才能拍照');
      });
    });

    it('handles multiple image selection', async () => {
      const mockProcessedImages = [
        {
          base64: 'mock-base64-1',
          uri: 'mock-uri-1',
          width: 1080,
          height: 1080,
          fileSize: 500000,
        },
        {
          base64: 'mock-base64-2',
          uri: 'mock-uri-2',
          width: 1080,
          height: 1080,
          fileSize: 500000,
        },
      ];

      mockImageUtils.getImageSourceOptions.mockReturnValue([
        {
          title: '拍照',
          action: jest.fn().mockResolvedValue(null),
        },
        {
          title: '從相簿選擇多張',
          action: jest.fn().mockResolvedValue(mockProcessedImages),
        },
      ]);

      mockStore.addToUploadQueue
        .mockReturnValueOnce('mock-upload-id-1')
        .mockReturnValueOnce('mock-upload-id-2');

      const onUploadSuccess = jest.fn();

      const { getByRole } = render(
        <PhotoUploadButton allowMultiple={true} onUploadSuccess={onUploadSuccess} />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      // Simulate ActionSheet multiple selection
      const ActionSheetIOS = require('react-native').ActionSheetIOS;
      const mockCallback = ActionSheetIOS.showActionSheetWithOptions.mock.calls[0][1];
      mockCallback(1); // Multiple selection option

      await waitFor(() => {
        expect(mockStore.addToUploadQueue).toHaveBeenCalledTimes(2);
        expect(mockStore.uploadPhoto).toHaveBeenCalledTimes(2);
        expect(onUploadSuccess).toHaveBeenCalledWith(mockProcessedImages);
      });
    });

    it('prevents upload when exceeding photo limit', async () => {
      const mockProcessedImages = new Array(3).fill({
        base64: 'mock-base64',
        uri: 'mock-uri',
        width: 1080,
        height: 1080,
        fileSize: 500000,
      });

      mockUsePhotoStore.mockReturnValue({
        ...mockStore,
        photos: new Array(5).fill({}), // Already have 5 photos
      } as any);

      mockImageUtils.getImageSourceOptions.mockReturnValue([
        {
          title: '拍照',
          action: jest.fn().mockResolvedValue(null),
        },
        {
          title: '從相簿選擇多張',
          action: jest.fn().mockResolvedValue(mockProcessedImages),
        },
      ]);

      const { getByRole } = render(
        <PhotoUploadButton maxPhotos={6} allowMultiple={true} />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      // Simulate ActionSheet multiple selection
      const ActionSheetIOS = require('react-native').ActionSheetIOS;
      const mockCallback = ActionSheetIOS.showActionSheetWithOptions.mock.calls[0][1];
      mockCallback(1); // Multiple selection option

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          '照片數量超限',
          '您最多只能上傳 6 張照片，目前已有 5 張'
        );
      });
    });

    it('handles user cancellation', async () => {
      mockImageUtils.pickImageFromCamera.mockResolvedValue(null);

      const onUploadSuccess = jest.fn();
      const onUploadError = jest.fn();

      const { getByRole } = render(
        <PhotoUploadButton
          onUploadSuccess={onUploadSuccess}
          onUploadError={onUploadError}
        />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      // Simulate ActionSheet camera selection
      const ActionSheetIOS = require('react-native').ActionSheetIOS;
      const mockCallback = ActionSheetIOS.showActionSheetWithOptions.mock.calls[0][1];
      mockCallback(0); // Camera option

      await waitFor(() => {
        expect(mockImageUtils.pickImageFromCamera).toHaveBeenCalled();
        expect(onUploadSuccess).not.toHaveBeenCalled();
        expect(onUploadError).not.toHaveBeenCalled();
      });
    });
  });

  describe('Component States', () => {
    it('shows processing state during upload', async () => {
      // Mock a slow upload
      mockStore.uploadPhoto.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      mockImageUtils.pickImageFromCamera.mockResolvedValue({
        base64: 'mock-base64',
        uri: 'mock-uri',
        width: 1080,
        height: 1080,
        fileSize: 500000,
      });

      const { getByRole, getByText } = render(<PhotoUploadButton />);

      const button = getByRole('button');
      fireEvent.press(button);

      // Simulate ActionSheet camera selection
      const ActionSheetIOS = require('react-native').ActionSheetIOS;
      const mockCallback = ActionSheetIOS.showActionSheetWithOptions.mock.calls[0][1];
      mockCallback(0); // Camera option

      await waitFor(() => {
        expect(getByText('處理中...')).toBeTruthy();
      });
    });

    it('applies correct size styles', () => {
      const { rerender, getByRole } = render(
        <PhotoUploadButton size="small" />
      );

      let button = getByRole('button');
      expect(button.props.style).toEqual(
        expect.objectContaining({
          width: 60,
          height: 60,
        })
      );

      rerender(<PhotoUploadButton size="large" />);
      button = getByRole('button');
      expect(button.props.style).toEqual(
        expect.objectContaining({
          width: 120,
          height: 120,
        })
      );
    });
  });
});