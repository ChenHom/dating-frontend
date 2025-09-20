/**
 * MessageSearchBar Component
 * 訊息搜索欄 - 提供全文搜索歷史訊息功能
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Keyboard,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '@/stores/chat';

interface MessageSearchBarProps {
  isVisible: boolean;
  onClose: () => void;
  onSearchResultsFound: (results: SearchResult[]) => void;
  placeholder?: string;
  testID?: string;
}

export interface SearchResult {
  messageId: string;
  conversationId: number;
  content: string;
  highlightedContent: string;
  senderName: string;
  timestamp: string;
  matchIndex: number;
  matchLength: number;
}

export const MessageSearchBar: React.FC<MessageSearchBarProps> = ({
  isVisible,
  onClose,
  onSearchResultsFound,
  placeholder = '搜索訊息...',
  testID = 'message-search-bar',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const { searchMessages, clearSearchResults } = useChatStore();

  // 動畫效果
  useEffect(() => {
    if (isVisible) {
      // 顯示搜索欄
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // 動畫完成後自動聚焦
        searchInputRef.current?.focus();
      });
    } else {
      // 隱藏搜索欄
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  // 搜索邏輯
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      // 搜索詞太短，清除結果
      clearSearchResults();
      onSearchResultsFound([]);
      return;
    }

    setIsSearching(true);

    try {
      const results = await searchMessages(query.trim());
      onSearchResultsFound(results);
    } catch (error) {
      console.error('Search error:', error);
      onSearchResultsFound([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 清除搜索
  const handleClear = () => {
    setSearchQuery('');
    clearSearchResults();
    onSearchResultsFound([]);
    searchInputRef.current?.focus();
  };

  // 關閉搜索
  const handleClose = () => {
    setSearchQuery('');
    clearSearchResults();
    onSearchResultsFound([]);
    Keyboard.dismiss();
    onClose();
  };

  // 防抖搜索
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery !== '') {
        handleSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      testID={testID}
    >
      <View style={styles.searchContainer}>
        {/* 搜索圖標 */}
        <View style={styles.searchIcon}>
          {isSearching ? (
            <Ionicons
              name="hourglass-outline"
              size={20}
              color="#6b7280"
            />
          ) : (
            <Ionicons
              name="search"
              size={20}
              color="#6b7280"
            />
          )}
        </View>

        {/* 搜索輸入框 */}
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never" // 使用自定義清除按鈕
          testID={`${testID}-input`}
        />

        {/* 清除按鈕 */}
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            testID={`${testID}-clear`}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color="#6b7280"
            />
          </TouchableOpacity>
        )}

        {/* 關閉按鈕 */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          testID={`${testID}-close`}
        >
          <Ionicons
            name="close"
            size={24}
            color="#6b7280"
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    paddingTop: Platform.OS === 'ios' ? 50 : 8, // iOS 狀態欄高度
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    minHeight: 40,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default MessageSearchBar;