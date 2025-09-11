# Phase 3: 高級功能實施計劃

## 🎯 **Phase 3 總體目標**
實現完整的社交互動功能：配對系統、即時聊天、推播通知

## 📋 **Phase 3A: Match 配對系統** (預計 5-7 項任務)

### **核心功能需求**:
根據 CLAUDE.md 規格，配對系統需要：
- 每日 Like 限制：30 次
- 互相 Like 才能配對成功
- 24 小時重新曝光冷卻時間
- 配對成功即時通知

### **實施任務列表**:

1. **建立 Match 狀態管理 (MatchStore + API 整合)**
   - 實現配對邏輯狀態管理
   - API 整合：`likeUser()`, `passUser()`, `getMatches()`
   - 日常限制追蹤 (30 likes/day)
   - TDD 測試套件

2. **實作滑動式配對組件 (SwipeCard + react-native-deck-swiper)**
   - 高效能滑動動畫
   - 手勢識別 (向左拒絕、向右喜歡)
   - 卡片預載入和記憶體管理
   - 用戶照片輪播顯示

3. **建立配對成功頁面 (MatchSuccessScreen)**
   - 配對成功動畫效果
   - 雙方照片展示
   - "開始聊天" 行動按鈕
   - 分享配對功能

4. **實作 Match 測試套件 (Unit + Integration)**
   - Match Store 單元測試
   - 滑動互動測試
   - 配對流程整合測試
   - 邊界條件測試 (達到 like 限制等)

5. **添加 Match 路由與導航整合**
   - 配對主頁面路由
   - 配對成功頁面導航
   - 深層連結支援
   - 從 Feed 到 Match 流程整合

### **技術架構設計**:

```typescript
// Match Store 架構
interface MatchState {
  // Data
  matches: Match[];
  dailyLikes: number;
  likeLimit: number;
  lastLikeReset: string;
  
  // UI State  
  isLoading: boolean;
  error: string | null;
  
  // Actions
  likeUser: (userId: number) => Promise<LikeResponse>;
  passUser: (userId: number) => Promise<void>;
  getMatches: () => Promise<Match[]>;
  resetDailyLikes: () => void;
}
```

## 📋 **Phase 3B: 即時聊天功能** (預計 5 項任務)

### **核心功能需求**:
根據 CLAUDE.md 規格：
- WebSocket 連接 (Laravel Reverb)
- 25 秒心跳檢測，60 秒超時
- 訊息去重 (client_nonce，24小時窗口)
- 每秒最多 1 條訊息限制

### **實施任務列表**:

6. **建立 WebSocket 連線管理 (ConnectionManager)**
   - Laravel Reverb WebSocket 整合
   - 自動重連邏輯 (指數退避：1→2→4→8s)
   - 心跳檢測和連線狀態管理
   - 訊息佇列和離線處理

7. **實作 Chat Store 與訊息管理**
   - 聊天狀態管理 (conversations, messages)
   - 訊息傳送/接收邏輯
   - 去重機制 (client_nonce)
   - 讀取狀態和輸入狀態

8. **整合 react-native-gifted-chat 組件**
   - 自定義訊息泡泡設計
   - 圖片/多媒體訊息支援
   - 輸入框和發送邏輯
   - 歷史訊息載入 (分頁)

9. **建立聊天列表與對話頁面**
   - ConversationList 組件 (最近聊天)
   - ChatScreen 主聊天介面
   - 未讀訊息計數
   - 訊息搜尋功能

10. **實作 Chat 測試套件 (包含 WebSocket 模擬)**
    - WebSocket 連線測試
    - 訊息收發測試
    - 重連機制測試
    - 整合流程測試

### **WebSocket 架構設計**:

```typescript
// WebSocket Events 架構
interface ChatEvents {
  // Connection Events
  'chat.join': { conversation_id: number };
  'chat.joined': { conversation_id: number, user_id: number };
  
  // Message Events
  'message.send': { content: string, client_nonce: string };
  'message.ack': { message_id: number, client_nonce: string };
  'message.new': Message;
}
```

## 📋 **Phase 3C: 推播通知系統** (預計 3 項任務)

### **核心功能需求**:
根據 CLAUDE.md 規格：
- 通知類型：new_match, new_message, gift
- 速率限制：30 秒內最多 3 種不同類型
- 訊息合併：同對話 10 秒內合併

### **實施任務列表**:

11. **建立推播通知服務 (NotificationService)**
    - Expo Push Token 管理
    - 本地通知排程
    - 通知分類和優先權
    - 背景狀態處理

12. **整合 expo-notifications 系統**
    - iOS/Android 權限請求
    - 推播接收和處理
    - 應用內通知顯示
    - 通知互動處理

13. **實作推播測試與模擬器**
    - 推播服務測試
    - 模擬通知觸發
    - 權限狀態測試
    - 跨平台兼容性測試

## 📋 **Phase 3D: 系統整合與優化** (預計 1 項任務)

14. **整合所有功能的終端到終端測試**
    - 完整用戶流程測試 (註冊→配對→聊天→通知)
    - 跨功能整合測試
    - 效能基準測試
    - 生產環境部署驗證

## 🎯 **Phase 3 成功指標**

### **功能完整性**:
- ✅ 用戶可以滑動配對並獲得配對成功
- ✅ 配對後可以即時聊天通訊  
- ✅ 重要事件會收到推播通知
- ✅ 所有功能在離線/網路不穩定時仍可運作

### **技術品質**:
- **測試覆蓋**: 新增 ~30 個測試 (目標總計 ~80 個測試)
- **效能指標**: WebSocket 連線成功率 >95%
- **用戶體驗**: 所有互動 <300ms 響應時間
- **穩定性**: 24 小時無崩潰運行

### **預期時程**:
- **Phase 3A (Match)**: 3-4 工作天
- **Phase 3B (Chat)**: 4-5 工作天  
- **Phase 3C (Notifications)**: 2-3 工作天
- **Phase 3D (Integration)**: 1-2 工作天
- **總計**: 10-14 工作天 (約 2-3 週)

完成 Phase 3 後，應用程式將具備完整的核心社交功能，可進入 Beta 測試和生產環境部署階段。