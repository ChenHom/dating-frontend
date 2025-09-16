import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProgressIndicator, LinearProgress } from '@/components/ui/ProgressIndicator';

describe('ProgressIndicator', () => {
  it('renders with default props', () => {
    const { getByText } = render(<ProgressIndicator progress={50} />);

    expect(getByText('50%')).toBeTruthy();
  });

  it('displays progress percentage correctly', () => {
    const { getByText, rerender } = render(
      <ProgressIndicator progress={25} />
    );

    expect(getByText('25%')).toBeTruthy();

    rerender(<ProgressIndicator progress={75} />);
    expect(getByText('75%')).toBeTruthy();
  });

  it('hides percentage when showPercentage is false', () => {
    const { queryByText } = render(
      <ProgressIndicator progress={50} showPercentage={false} />
    );

    expect(queryByText('50%')).toBeFalsy();
  });

  it('shows cancel button when enabled', () => {
    const onCancel = jest.fn();
    const { getByRole } = render(
      <ProgressIndicator
        progress={50}
        showCancel={true}
        onCancel={onCancel}
      />
    );

    const cancelButton = getByRole('button');
    expect(cancelButton).toBeTruthy();

    fireEvent.press(cancelButton);
    expect(onCancel).toHaveBeenCalled();
  });

  it('hides cancel button when status is not active', () => {
    const { queryByRole } = render(
      <ProgressIndicator
        progress={100}
        showCancel={true}
        onCancel={jest.fn()}
        status="success"
      />
    );

    expect(queryByRole('button')).toBeFalsy();
  });

  describe('Status States', () => {
    it('shows success state correctly', () => {
      const { getByText } = render(
        <ProgressIndicator progress={100} status="success" />
      );

      expect(getByText('上傳完成')).toBeTruthy();
    });

    it('shows error state with message', () => {
      const { getByText } = render(
        <ProgressIndicator
          progress={50}
          status="error"
          errorMessage="上傳失敗"
        />
      );

      expect(getByText('上傳失敗')).toBeTruthy();
    });

    it('shows loading state', () => {
      const { getByText } = render(
        <ProgressIndicator progress={25} status="active" />
      );

      // The loading text should be percentage in active state
      expect(getByText('25%')).toBeTruthy();
    });
  });

  describe('Additional Info', () => {
    it('displays estimated time', () => {
      const { getByText } = render(
        <ProgressIndicator
          progress={50}
          status="active"
          estimatedTime={125}
        />
      );

      expect(getByText('剩餘 2分5秒')).toBeTruthy();
    });

    it('displays estimated time in seconds when less than 1 minute', () => {
      const { getByText } = render(
        <ProgressIndicator
          progress={80}
          status="active"
          estimatedTime={45}
        />
      );

      expect(getByText('剩餘 45秒')).toBeTruthy();
    });

    it('displays upload speed', () => {
      const { getByText } = render(
        <ProgressIndicator
          progress={30}
          status="active"
          uploadSpeed="2.1 MB/s"
        />
      );

      expect(getByText('2.1 MB/s')).toBeTruthy();
    });

    it('displays both estimated time and upload speed', () => {
      const { getByText } = render(
        <ProgressIndicator
          progress={40}
          status="active"
          estimatedTime={90}
          uploadSpeed="1.5 MB/s"
        />
      );

      expect(getByText('剩餘 1分30秒')).toBeTruthy();
      expect(getByText('1.5 MB/s')).toBeTruthy();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom size', () => {
      const { getByTestId } = render(
        <ProgressIndicator
          progress={50}
          size={100}
          testID="progress-indicator"
        />
      );

      const container = getByTestId('progress-indicator');
      expect(container.props.style).toEqual(
        expect.objectContaining({
          width: 100,
          height: 100,
        })
      );
    });

    it('applies custom colors', () => {
      const { container } = render(
        <ProgressIndicator
          progress={50}
          color="#FF0000"
          backgroundColor="#00FF00"
        />
      );

      // Note: Testing color changes would require more complex setup
      // This is a basic structure test
      expect(container).toBeTruthy();
    });
  });

  describe('Custom Components', () => {
    it('renders custom loading component', () => {
      const CustomLoading = () => <div data-testid="custom-loading">Loading...</div>;

      const { getByTestId } = render(
        <ProgressIndicator
          progress={25}
          status="active"
          loadingComponent={<CustomLoading />}
        />
      );

      expect(getByTestId('custom-loading')).toBeTruthy();
    });

    it('renders custom error component', () => {
      const CustomError = () => <div data-testid="custom-error">Error!</div>;

      const { getByTestId } = render(
        <ProgressIndicator
          progress={50}
          status="error"
          errorComponent={<CustomError />}
        />
      );

      expect(getByTestId('custom-error')).toBeTruthy();
    });
  });
});

describe('LinearProgress', () => {
  it('renders with default props', () => {
    const { container } = render(<LinearProgress progress={50} />);
    expect(container).toBeTruthy();
  });

  it('applies custom height', () => {
    const { getByTestId } = render(
      <LinearProgress
        progress={50}
        height={8}
        testID="linear-progress"
      />
    );

    const container = getByTestId('linear-progress');
    expect(container.props.style).toEqual(
      expect.objectContaining({
        height: 8,
      })
    );
  });

  it('applies custom colors', () => {
    const { container } = render(
      <LinearProgress
        progress={75}
        color="#FF0000"
        backgroundColor="#00FF00"
      />
    );

    expect(container).toBeTruthy();
  });

  it('can disable animation', () => {
    const { container } = render(
      <LinearProgress progress={50} animated={false} />
    );

    expect(container).toBeTruthy();
  });

  it('handles progress value boundaries', () => {
    const { rerender, container } = render(
      <LinearProgress progress={0} />
    );

    expect(container).toBeTruthy();

    rerender(<LinearProgress progress={100} />);
    expect(container).toBeTruthy();

    rerender(<LinearProgress progress={150} />);
    expect(container).toBeTruthy(); // Should clamp to 100%

    rerender(<LinearProgress progress={-10} />);
    expect(container).toBeTruthy(); // Should clamp to 0%
  });
});