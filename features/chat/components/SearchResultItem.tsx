/**
 * SearchResultItem Component
 * 搜索結果項目 - 顯示單個搜索結果並支持高亮和快速跳轉
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import dayjs from 'dayjs';
import { SearchResult } from './MessageSearchBar';

interface SearchResultItemProps {
  result: SearchResult;
  onPress: (result: SearchResult) => void;
  testID?: string;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  onPress,
  testID = 'search-result-item',
}) => {
  const handlePress = () => {
    onPress(result);
  };

  // 渲染高亮文本
  const renderHighlightedText = (content: string, highlightedContent: string) => {
    // 解析高亮內容，假設使用 <mark> 標籤標記高亮部分
    const parts = highlightedContent.split(/(<mark>.*?<\/mark>)/);

    return parts.map((part, index) => {
      if (part.startsWith('<mark>') && part.endsWith('</mark>')) {
        // 高亮部分
        const highlightText = part.replace('<mark>', '').replace('</mark>', '');
        return (
          <Text key={index} style={styles.highlightText}>
            {highlightText}
          </Text>
        );
      } else {
        // 普通文本
        return (
          <Text key={index} style={styles.normalText}>
            {part}
          </Text>
        );
      }
    });
  };

  // 格式化時間
  const formatTime = (timestamp: string) => {
    const messageTime = dayjs(timestamp);
    const now = dayjs();

    if (messageTime.isSame(now, 'day')) {
      return messageTime.format('HH:mm');
    } else if (messageTime.isSame(now, 'year')) {
      return messageTime.format('MM/DD HH:mm');
    } else {
      return messageTime.format('YYYY/MM/DD');
    }
  };

  // 截斷長文本
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) {
      return content;
    }

    // 找到匹配位置周圍的文本
    const { matchIndex, matchLength } = result;
    const start = Math.max(0, matchIndex - 30);
    const end = Math.min(content.length, matchIndex + matchLength + 30);

    let truncated = content.substring(start, end);

    if (start > 0) {
      truncated = '...' + truncated;
    }
    if (end < content.length) {
      truncated = truncated + '...';
    }

    return truncated;
  };

  const displayContent = truncateContent(result.content);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      testID={testID}
    >
      <View style={styles.content}>
        {/* 發送者和時間 */}
        <View style={styles.header}>
          <Text style={styles.senderName} numberOfLines={1}>
            {result.senderName}
          </Text>
          <Text style={styles.timestamp}>
            {formatTime(result.timestamp)}
          </Text>
        </View>

        {/* 訊息內容 */}
        <View style={styles.messageContent}>
          <Text style={styles.messageText} numberOfLines={2}>
            {result.highlightedContent ?
              renderHighlightedText(displayContent, result.highlightedContent) :
              displayContent
            }
          </Text>
        </View>
      </View>

      {/* 右側箭頭 */}
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  messageContent: {
    marginTop: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
  normalText: {
    color: '#4b5563',
  },
  highlightText: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
    fontWeight: '600',
  },
  arrow: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: '#9ca3af',
    fontWeight: '300',
  },
});

export default SearchResultItem;