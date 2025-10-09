# 聊天可靠性改進實施計劃

## ✅ 已完成：修復 Broadcasting Auth

### 問題
- Broadcasting auth 返回 403 Access Denied
- `channels.php` 中使用了不存在的 `$user->name` 欄位
- Broadcasting 中間件配置錯誤（使用 `api` 而非 `web`）

### 解決方案
1. 修改 `channels.php` 使用 `$user->email` 代替 `$user->name`
2. 修改 `bootstrap/app.php` 的 broadcasting 配置：
   - 從 `['prefix' => 'api', 'middleware' => ['api', 'auth:sanctum']]`
   - 改為 `['prefix' => '', 'middleware' => ['web', 'auth:sanctum']]`

### 測試結果
```bash
✅ Broadcasting auth 現在返回正確的認證令牌
{
  "auth": "xolhu9bxpdqxvxn0yvok:..."
}
```

---

## 🎯 待實施方案

### 方案 1：完善降級機制 - 確保基本功能

#### 目標
確保即使 Echo/WebSocket 失敗，系統仍可通過 HTTP API 正常工作

#### 實施內容
1. **EchoService 改進**
   - 添加初始化超時機制（5秒）
   - 失敗時不拋出錯誤，改為使用降級方案
   - 初始化 WebSocket Manager 作為備用連線

2. **subscribeToConversation 改進**
   - Echo 不可用時自動使用 WebSocket Manager
   - WebSocket Manager 也不可用時發出 subscription_failed 事件

3. **sendMessage 改進**
   - 優先使用可用的連線（Echo > WebSocket > HTTP）
   - 自動降級到下一層

#### 代碼位置
- `frontend/services/websocket/EchoService.ts`
- `frontend/stores/chat.ts`

---

### 方案 2：自動重連機制 - 改善連線穩定性

#### 目標
網路暫時中斷後能自動重新連線，無需手動重新整理

#### 實施內容
1. **重連策略**
   - 最多重試 3 次
   - 使用指數退避（2s, 4s, 8s）
   - 重連成功後自動重新訂閱所有頻道

2. **連線健康監控**
   - 定期檢查連線狀態（每 30 秒）
   - 檢測到斷線立即嘗試重連
   - 記錄連線統計資訊

3. **狀態同步**
   - 重連後自動重新載入未讀訊息
   - 重新訂閱當前對話

#### 代碼位置
- `frontend/services/websocket/EchoService.ts`
- `frontend/stores/chat.ts`

---

### 方案 3：用戶提示 - 改善用戶體驗

#### 目標
讓用戶清楚了解當前連線狀態和可能的影響

#### 實施內容
1. **連線狀態顯示**
   - 聊天列表頂部顯示連線狀態指示器
   - 不同狀態使用不同顏色：
     - 綠色：正常連線
     - 橙色：降級模式（使用 HTTP）
     - 紅色：連線中斷（重連中）

2. **友好的錯誤提示**
   - Echo 初始化失敗：「即時連線暫時無法使用，訊息將透過網路傳送」
   - 訊息發送失敗：顯示重試按鈕
   - 網路中斷：「網路連線中斷，正在重新連線...」

3. **視覺反饋**
   - 訊息發送狀態（發送中、已送達、失敗）
   - 重連進度提示
   - 降級模式警告橫幅

#### 代碼位置
- `frontend/features/chat/ChatListScreen.tsx`
- `frontend/features/chat/ChatScreen.tsx`
- `frontend/components/ConnectionStatusBanner.tsx`（新增）

---

## 📋 實施順序

### 階段 1：核心功能保障（高優先級）
1. ✅ 修復 Broadcasting Auth
2. ⏳ 實施方案 1 - 完善降級機制
3. ⏳ 基本的連線狀態提示

### 階段 2：穩定性改進（中優先級）
4. ⏳ 實施方案 2 - 自動重連機制
5. ⏳ 連線健康監控

### 階段 3：用戶體驗優化（中優先級）
6. ⏳ 實施方案 3 - 完整的用戶提示
7. ⏳ 視覺反饋和狀態指示器

---

## 🔧 技術細節

### 連線優先級
```
1. Laravel Echo (Reverb WebSocket)
   ↓ 失敗
2. WebSocket Manager (原生 WebSocket)
   ↓ 失敗
3. HTTP API (REST)
```

### 狀態機
```
DISCONNECTED
    ↓ initialize()
CONNECTING
    ↓ success
CONNECTED
    ↓ error / disconnect
RECONNECTING (retry 1-3)
    ↓ all retries failed
ERROR / HTTP_FALLBACK
```

### 事件流
```
User Action → sendMessage()
    ↓
Check Echo → available?
    ↓ yes
Send via Echo
    ↓ no
Check WebSocket → available?
    ↓ yes
Send via WebSocket
    ↓ no
Send via HTTP API
    ↓
Update UI with result
```

---

## 📊 成功指標

### 功能性
- ✅ Broadcasting auth 正常工作
- ⏳ 訊息 100% 可送達（至少通過 HTTP）
- ⏳ 網路恢復後自動重連

### 用戶體驗
- ⏳ 用戶知道當前連線狀態
- ⏳ 錯誤提示清晰易懂
- ⏳ 降級對用戶影響最小

### 可靠性
- ⏳ 任何單點故障都不影響基本功能
- ⏳ 系統可自動恢復
- ⏳ 錯誤日誌完整可追蹤

---

## 🚀 下一步

現在開始實施三個方案的代碼！
