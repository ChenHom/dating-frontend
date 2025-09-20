/**
 * MessageSearchOverlay Component
 * 訊息搜索覆蓋層 - 顯示搜索結果並支持快速跳轉
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageSearchBar, SearchResult } from './MessageSearchBar';
import { SearchResultItem } from './SearchResultItem';

interface MessageSearchOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onResultPress: (result: SearchResult) => void;
  testID?: string;
}

export const MessageSearchOverlay: React.FC<MessageSearchOverlayProps> = ({
  isVisible,
  onClose,
  onResultPress,
  testID = 'message-search-overlay',
}) => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 處理搜索結果
  const handleSearchResultsFound = (results: SearchResult[]) => {
    setSearchResults(results);
    setIsLoading(false);
  };

  // 處理結果點擊
  const handleResultPress = (result: SearchResult) => {
    onResultPress(result);
    onClose(); // 關閉搜索覆蓋層
  };

  // 重置狀態當覆蓋層關閉時
  useEffect(() => {
    if (!isVisible) {
      setSearchResults([]);
      setIsLoading(false);
    }
  }, [isVisible]);

  // 渲染搜索結果項目
  const renderResultItem = ({ item }: { item: SearchResult }) => (
    <SearchResultItem
      result={item}
      onPress={handleResultPress}
      testID={`${testID}-result-${item.messageId}`}
    />
  );

  // 渲染空狀態
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="hourglass-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyStateText}>搜索中...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="search-outline" size={48} color="#9ca3af" />
        <Text style={styles.emptyStateText}>輸入關鍵字搜索訊息</Text>
        <Text style={styles.emptyStateSubtext}>
          搜索會在所有對話中尋找匹配的內容
        </Text>
      </View>
    );
  };

  // 渲染無結果狀態
  const renderNoResults = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
      <Text style={styles.emptyStateText}>未找到相關訊息</Text>
      <Text style={styles.emptyStateSubtext}>
        請嘗試其他關鍵字
      </Text>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={Platform.OS === 'android'}
      testID={testID}
    >
      <SafeAreaView style={styles.container}>
        {/* Android 狀態欄處理 */}
        {Platform.OS === 'android' && (
          <StatusBar
            backgroundColor="transparent"
            translucent
            barStyle="dark-content"
          />
        )}

        {/* 搜索欄 */}
        <MessageSearchBar
          isVisible={true}
          onClose={onClose}
          onSearchResultsFound={handleSearchResultsFound}
          testID={`${testID}-search-bar`}
        />

        {/* 搜索結果列表 */}
        <View style={styles.resultsContainer}>
          {searchResults.length === 0 ? (
            isLoading ? renderEmptyState() : renderNoResults()
          ) : (
            <>
              {/* 結果統計 */}
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  找到 {searchResults.length} 條相關訊息
                </Text>
              </View>

              {/* 結果列表 */}
              <FlatList
                data={searchResults}
                renderItem={renderResultItem}
                keyExtractor={(item) => item.messageId}
                style={styles.resultsList}
                contentContainerStyle={styles.resultsListContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                testID={`${testID}-results-list`}
              />
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  resultsCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  resultsList: {
    flex: 1,
  },
  resultsListContent: {
    paddingBottom: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MessageSearchOverlay;