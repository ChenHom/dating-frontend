/**
 * 快速測試 matches.length 修復
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { MatchesScreen } from '@/features/match/MatchesScreen';

// Mock the store
jest.mock('@/stores/match', () => ({
  useMatchStore: () => ({
    matches: undefined, // 故意設置為 undefined 來測試防護
    isLoading: false,
    error: null,
    loadMatches: jest.fn(),
    openMatch: jest.fn(),
    clearError: jest.fn(),
  }),
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

describe('MatchesScreen matches.length fix', () => {
  it('should handle undefined matches without error', () => {
    // 這個測試應該不會拋出 "Cannot read properties of undefined (reading 'length')" 錯誤
    expect(() => {
      render(<MatchesScreen />);
    }).not.toThrow();
  });
});
