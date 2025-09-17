# 📱 交友應用程式 - 頁面導航架構文檔

## 🎯 **概述**
本文檔詳細記錄交友應用程式中所有頁面間的連結關係、URL 結構、認證邏輯和導航規則。

## 🗺️ **頁面架構總覽**

```
交友應用程式
├── 🔐 認證系統
│   ├── / (index.tsx) - 首頁/重定向邏輯
│   ├── /login - 登入頁面
│   └── /register - 註冊頁面
├── 📱 主應用 (需要認證)
│   └── /(tabs)/ - Tab 導航容器
│       ├── /discover - 探索/配對頁面
│       ├── /matches - 配對列表頁面
│       ├── /messages - 訊息列表頁面
│       └── /profile - 個人檔案頁面
├── 💬 聊天系統 (需要認證)
│   └── /chat/[id] - 個別聊天對話頁面
├── 👤 個人檔案管理 (需要認證)
│   └── /profile/edit - 編輯個人檔案頁面
├── ⚙️ 設定 (需要認證)
│   └── /settings - 應用程式設定頁面
└── 🚫 錯誤頁面
    └── /+not-found - 404 錯誤頁面
```

## 🔗 **詳細導航關係圖**

### **1. 認證流程導航**

#### 首頁重定向邏輯 (`/`)
```
URL: http://localhost:8083/

認證狀態檢查:
├── 未認證用戶 → 重定向到 /login
└── 已認證用戶 → 重定向到 /(tabs)/discover

載入狀態: 顯示 "Checking authentication..." 或 "Redirecting..."
```

#### 登入頁面 (`/login`)
```
URL: http://localhost:8083/login

可用動作:
├── 填寫表單 + "登入" 按鈕 → 成功: /(tabs)/discover, 失敗: 停留
├── "註冊" 連結 → /register
└── 已認證用戶訪問 → 保持在 /login (不強制重定向)

組件: LoginScreen
TestID: login-form, login-button, register-link
```

#### 註冊頁面 (`/register`)
```
URL: http://localhost:8083/register

可用動作:
├── 填寫表單 + "註冊" 按鈕 → 成功: /(tabs)/discover, 失敗: 停留
├── "登入" 連結 → /login
└── 已認證用戶訪問 → 保持在 /register (不強制重定向)

組件: RegisterScreen
TestID: register-form, register-button, login-link
```

### **2. 主應用 Tab 導航**

#### Tab 容器 (`/(tabs)/`)
```
受保護路由: 需要認證
Tab 順序: 探索 → 配對 → 訊息 → 我的

共用樣式: headerShown: false
組件: TabsLayout
```

#### 探索頁面 (`/(tabs)/discover`)
```
URL: http://localhost:8083/(tabs)/discover

功能:
├── 滑動卡片進行配對
├── 喜歡/跳過按鈕
└── 配對成功 → 可能觸發 /match/success 頁面

組件: DiscoverScreen
Tab 標題: "探索"
TestID: discover-container, swipe-cards, like-button, pass-button
```

#### 配對列表頁面 (`/(tabs)/matches`)
```
URL: http://localhost:8083/(tabs)/matches

功能:
├── 顯示所有配對列表
├── 點擊配對項目 → /chat/[id] (開始對話)
└── 配對管理操作

組件: MatchesScreen
Tab 標題: "配對"
TestID: matches-container, match-item-[id], match-list
```

#### 訊息列表頁面 (`/(tabs)/messages`)
```
URL: http://localhost:8083/(tabs)/messages

功能:
├── 顯示所有對話列表 (SimpleChatListScreen)
├── 點擊對話項目 → /chat/[id]
├── "新聊天" 按鈕 → /(tabs)/discover
└── 未讀訊息計數顯示

組件: SimpleChatListScreen
Tab 標題: "消息"
TestID: chat-list-container, conversation-item-[id], new-chat-button
```

#### 個人檔案頁面 (`/(tabs)/profile`)
```
URL: http://localhost:8083/(tabs)/profile

功能:
├── "Edit Profile" → /profile/edit
├── "Settings" → /settings
├── "Notifications" → (未實作)
├── "Privacy & Safety" → (未實作)
├── "Help & Support" → (未實作)
└── "Logout" 按鈕 → /login

組件: SimpleProfileScreen
Tab 標題: "我的"
TestID: profile-container, edit-profile-option, preferences-option, logout-button
```

### **3. 深層頁面導航**

#### 聊天對話頁面 (`/chat/[id]`)
```
URL: http://localhost:8083/chat/123

參數: id (對話 ID)
受保護路由: 需要認證

功能:
├── 返回按鈕 → /(tabs)/messages
├── 遊戲按鈕 (🎮) → 開啟 GameModal
├── 選單按鈕 → Alert 選項 (重新整理/開始遊戲/離開對話)
├── 訊息輸入和發送
└── 即時訊息接收

組件: ChatScreen
特殊功能: 整合 GameModal (剪刀石頭布遊戲)
TestID: chat-screen, back-button, game-launch-button, menu-button, message-input
```

#### 編輯個人檔案頁面 (`/profile/edit`)
```
URL: http://localhost:8083/profile/edit

受保護路由: 需要認證
呈現方式: Modal (presentation: 'modal')

功能:
├── 編輯個人資料表單
├── 照片管理 (上傳/刪除/設為主要)
├── "儲存" → 返回 /(tabs)/profile
└── "取消" → 返回 /(tabs)/profile

組件: EditProfileScreen
TestID: edit-profile-form, save-button, cancel-button, photo-manager
```

#### 設定頁面 (`/settings`)
```
URL: http://localhost:8083/settings

受保護路由: 需要認證
呈現方式: Modal (presentation: 'modal')

功能:
├── 應用程式設定選項
├── 推播通知設定
├── 隱私設定
└── 返回 → /(tabs)/profile

組件: SettingsScreen
TestID: settings-container, notification-settings, privacy-settings
```

#### 配對成功頁面 (`/match/success`)
```
URL: http://localhost:8083/match/success

功能:
├── 慶祝配對成功
├── "開始聊天" → /chat/[id]
└── "繼續探索" → /(tabs)/discover

組件: MatchSuccessScreen
TestID: match-success-container, start-chat-button, continue-discover-button
```

## 🛡️ **認證與存取控制**

### **受保護路由列表**
```typescript
受保護路由 (需要認證):
- /(tabs)/*                 // 所有 Tab 頁面
- /chat/*                   // 所有聊天頁面
- /profile/*                // 個人檔案相關頁面
- /settings                 // 設定頁面
- /match/*                  // 配對相關頁面

公開路由 (不需認證):
- /                         // 首頁 (會重定向)
- /login                    // 登入頁面
- /register                 // 註冊頁面
- /+not-found              // 404 錯誤頁面
```

### **ProtectedRoute 組件邏輯**
```typescript
檢查順序:
1. isLoading || !isNavigationReady → 顯示載入畫面
2. !isAuthenticated && isInProtectedRoute → 重定向到 /login
3. !isAuthenticated && isInAuthRoute → 正常渲染
4. !isAuthenticated && other routes → 正常渲染
5. isAuthenticated → 正常渲染

重定向邏輯:
- 使用 requestAnimationFrame 確保平滑重定向
- 錯誤處理: router.replace 失敗時使用 window.location.href
```

## 🔄 **重定向規則總表**

| 當前頁面 | 認證狀態 | 重定向目標 | 觸發條件 |
|---------|---------|-----------|---------|
| `/` | 未認證 | `/login` | 自動 |
| `/` | 已認證 | `/(tabs)/discover` | 自動 |
| `/(tabs)/*` | 未認證 | `/login` | 存取受保護路由 |
| `/chat/*` | 未認證 | `/login` | 存取受保護路由 |
| `/profile/*` | 未認證 | `/login` | 存取受保護路由 |
| `/settings` | 未認證 | `/login` | 存取受保護路由 |
| `/login` | 登入成功 | `/(tabs)/discover` | 登入完成 |
| `/register` | 註冊成功 | `/(tabs)/discover` | 註冊完成 |
| 任何頁面 | 登出 | `/login` | 登出動作 |

## 🎮 **特殊功能: 遊戲模態視窗**

### **GameModal 導航邏輯**
```typescript
觸發位置: /chat/[id] 頁面
觸發方式:
1. 標題列遊戲按鈕 (🎮)
2. 選單中的 "開始遊戲" 選項

模態視窗狀態:
├── 邀請階段 → GameInvite 組件
├── 遊戲進行中 → 選擇界面 + 計時器
├── 遊戲結束 → GameResult 組件
└── 關閉模態視窗 → 返回聊天頁面

特殊行為:
- 遊戲進行中關閉 → 確認投降對話框
- 自動投降 → 遊戲結束並關閉模態視窗
```

## 📱 **URL 結構規範**

```
基礎 URL: http://localhost:8083

完整 URL 列表:
├── http://localhost:8083/                     // 首頁
├── http://localhost:8083/login                // 登入
├── http://localhost:8083/register             // 註冊
├── http://localhost:8083/(tabs)/discover      // 探索
├── http://localhost:8083/(tabs)/matches       // 配對列表
├── http://localhost:8083/(tabs)/messages      // 訊息列表
├── http://localhost:8083/(tabs)/profile       // 個人檔案
├── http://localhost:8083/chat/123             // 聊天 (動態 ID)
├── http://localhost:8083/profile/edit         // 編輯檔案
├── http://localhost:8083/settings             // 設定
├── http://localhost:8083/match/success        // 配對成功
└── http://localhost:8083/+not-found          // 404 錯誤

動態路由:
- /chat/[id] → id 為數字 (對話 ID)
```

## 🧪 **測試考量重點**

### **必須測試的導航路徑**
1. **認證流程**: 登入 → 主頁面, 註冊 → 主頁面, 登出 → 登入頁
2. **Tab 切換**: 所有 4 個 Tab 間的相互切換
3. **深層導航**: 訊息列表 → 聊天頁面 → 返回
4. **模態視窗**: 設定/編輯檔案的開啟與關閉
5. **遊戲功能**: 聊天中開啟遊戲模態視窗
6. **受保護路由**: 未認證狀態下的重定向
7. **錯誤處理**: 無效 URL 的 404 處理

### **測試用 TestID 標準**
```typescript
頁面容器: [page-name]-container
主要按鈕: [action]-button
導航元素: [navigation-type]-[target]
列表項目: [item-type]-item-[id]
表單元素: [form-name]-[field-name]
```

## 📈 **效能考量**

### **路由懶加載**
- 目前所有路由都是直接導入
- 未來可考慮對大型頁面實作懶加載

### **狀態保持**
- Tab 間切換保持狀態
- 聊天頁面保持訊息歷史
- 個人檔案編輯保持草稿

### **快取策略**
- 認證狀態持久化
- 聊天列表快取
- 用戶檔案快取

---

**文檔版本**: v1.0.0
**最後更新**: 2025-09-17
**維護者**: Claude Code Assistant
**狀態**: ✅ 已完成並測試驗證