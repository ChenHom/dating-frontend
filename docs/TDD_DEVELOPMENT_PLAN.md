# TDD Development Plan - React Native + Expo

**專案**: 交友聊天遊戲 APP - Frontend  
**開發方法**: Test-Driven Development (TDD)  
**優先策略**: 核心功能優先 + 套件支援  
**更新時間**: 2025年1月

## 🎯 開發策略確認

### ✅ 核心決策
- **功能優先級**: 認證 → 探索配對 → 聊天 → 推播 → 遊戲
- **UI 實作**: 使用第三方套件加速開發 (react-native-deck-swiper, react-native-gifted-chat)
- **推播通知**: 簡化實作，能接收訊息即可
- **性能優化**: 後續階段處理，專注功能完成
- **TDD 必須**: 所有功能均採測試驅動開發，覆蓋率要求 80%+

### 📋 TDD 開發流程
1. 🔴 **RED**: 先寫失敗測試
2. 🟢 **GREEN**: 寫最少代碼讓測試通過  
3. 🔵 **REFACTOR**: 重構改善代碼品質
4. 📋 **REPEAT**: 重複循環直到功能完成

## 🚀 Phase 3: Frontend Development Roadmap

### ✅ **Week 1: TDD Environment + Infrastructure** - 已完成
**目標**: 建立完整的測試驅動開發環境

#### ✅ Day 1-2: Testing Framework Setup - 已完成
- [x] 安裝 Jest + React Native Testing Library
- [x] 配置 jest.config.js (80% 覆蓋率要求)
- [x] 設定測試腳本和 Mock 策略
- [x] 建立測試工具函數和 Mock 服務
- [x] **成果**: 完整 TDD 測試環境

#### ✅ Day 3-4: Core Dependencies Installation - 已完成
```bash
# TDD 測試框架
jest @testing-library/react-native @testing-library/jest-native

# 核心架構
@tanstack/react-query zustand react-hook-form @hookform/resolvers zod axios

# UI 支援套件  
react-native-deck-swiper react-native-gifted-chat nativewind

# 推播通知
expo-notifications

# 開發工具
@typescript-eslint/eslint-plugin prettier husky
```

#### Day 5-7: Project Structure Restructure
```
frontend/
├── __tests__/              # 測試目錄
│   ├── __mocks__/         # Mock 服務
│   ├── utils/             # 測試工具
│   └── setup.ts           # 測試設定
├── stores/                # Zustand 狀態管理
│   ├── auth.ts
│   ├── user.ts
│   └── chat.ts
├── services/              # API + WebSocket 服務
│   ├── api/
│   │   ├── client.ts
│   │   └── types.ts
│   └── ws/
│       └── echo-client.ts
├── hooks/                 # 自定義 React Hooks
│   ├── useAuth.ts
│   └── useWebSocket.ts
├── features/              # 功能模組
│   ├── auth/             # 認證功能
│   │   ├── components/
│   │   ├── hooks/
│   │   └── __tests__/
│   ├── feed/             # 探索配對
│   └── chat/             # 聊天功能
├── components/ui/         # 基礎 UI 元件
├── lib/                  # 工具函數
│   ├── utils.ts
│   ├── constants.ts
│   └── validators.ts
└── assets/               # 靜態資源
```

### **Week 2: Authentication Feature (TDD)**
**目標**: 完整認證功能，100% TDD 覆蓋

#### Day 1-2: Auth Store Development (TDD)
```typescript
// 測試先行開發順序
1. __tests__/stores/auth.test.ts          (先寫測試)
2. stores/auth.ts                         (實作功能)
3. __tests__/stores/auth.integration.ts   (整合測試)
```

**測試覆蓋範圍**:
- 登入成功/失敗處理
- Token 管理和持久化  
- 自動登出機制
- 錯誤狀態處理

#### Day 3-4: API Client Service (TDD)  
```typescript
// TDD 開發流程
1. __tests__/services/api-client.test.ts  (單元測試)
2. services/api/client.ts                 (API 客戶端)
3. services/api/types.ts                  (TypeScript 類型)
4. __tests__/services/api.integration.ts  (與後端整合測試)
```

**測試覆蓋範圍**:
- 認證請求攔截器
- 錯誤處理和重試機制
- 後端 17 個 API 端點連接
- Token 自動刷新

#### Day 5-7: Login/Register Pages (TDD)
```typescript
// 頁面組件 TDD
1. __tests__/features/auth/login-screen.test.tsx
2. __tests__/features/auth/register-screen.test.tsx  
3. app/(auth)/login.tsx
4. app/(auth)/register.tsx
5. features/auth/hooks/useLogin.ts
6. features/auth/hooks/useRegister.ts
```

**測試覆蓋範圍**:
- 表單驗證邏輯
- 用戶輸入處理
- API 請求處理
- 錯誤訊息顯示
- 導航流程

### **Week 3: Discovery/Matching Feature (TDD)**
**目標**: 探索配對功能，使用 react-native-deck-swiper

#### Day 1-3: User Feed & Swipe Logic (TDD)
```typescript
// TDD 開發重點
1. __tests__/features/feed/discovery.test.tsx
2. __tests__/features/feed/swipe-logic.test.ts
3. features/feed/components/SwipeCard.tsx  
4. features/feed/hooks/useUserFeed.ts
5. features/feed/hooks/useSwipeActions.ts
```

**測試覆蓋範圍**:
- 用戶 Feed 載入邏輯
- 滑卡手勢處理 (使用套件)
- Like/Pass 動作處理
- 配對成功檢測
- 無限捲動載入

#### Day 4-7: Match Detection & UI (TDD)
```typescript
// 配對功能測試
1. __tests__/features/feed/match-modal.test.tsx
2. features/feed/components/MatchModal.tsx
3. stores/matches.ts
4. hooks/useMatches.ts
```

### **Week 4: Basic Chat Feature (TDD)**
**目標**: 基礎聊天功能，使用 react-native-gifted-chat

#### Day 1-4: Chat Interface (TDD)
```typescript
// 聊天功能 TDD
1. __tests__/features/chat/chat-screen.test.tsx
2. __tests__/features/chat/message-input.test.tsx
3. app/chat/[id].tsx (使用 react-native-gifted-chat)
4. features/chat/hooks/useChatMessages.ts
5. stores/chat.ts
```

**測試覆蓋範圍**:
- 訊息載入和顯示
- 新訊息發送
- 訊息狀態處理 (送達、已讀)
- 樂觀更新 UI

#### Day 5-7: WebSocket Integration (TDD)
```typescript
// WebSocket 整合測試
1. __tests__/services/ws/websocket.test.ts
2. services/ws/echo-client.ts
3. hooks/useWebSocket.ts
4. __tests__/features/chat/websocket-integration.test.tsx
```

### **Week 5: Push Notifications (Simplified)**
**目標**: 基礎推播通知，能接收訊息即可

#### Day 1-3: Notification Setup (TDD)
```typescript
// 推播通知測試
1. __tests__/services/push/notifications.test.ts
2. services/push/expo-notifications.ts
3. hooks/useNotifications.ts
```

**功能範圍**:
- 通知權限請求
- 接收訊息通知
- 基礎通知處理

#### Day 4-7: Integration & Testing
- 端到端通知測試
- 與聊天功能整合
- 基礎錯誤處理

## 📊 Quality Assurance Standards

### **測試覆蓋率要求**
- **最低標準**: 80% overall coverage
- **核心功能**: 90% coverage (Auth, API, Stores)
- **UI 組件**: 70% coverage
- **Integration Tests**: 100% critical paths

### **TDD Code Quality Metrics**  
- **每次提交**: 必須包含對應測試
- **CI/CD Pipeline**: 測試失敗禁止合併
- **Code Review**: 檢查 TDD 流程遵循
- **技術債務**: 每週 refactor 時間

### **Testing Tools & Configuration**
```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  collectCoverageFrom: [
    'stores/**/*.{js,ts,tsx}',
    'services/**/*.{js,ts,tsx}',
    'hooks/**/*.{js,ts,tsx}',
    'features/**/*.{js,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|expo-.*|@expo/.*|react-native-.*)/)'
  ]
};
```

## 🔧 Development Environment

### **Docker Configuration**
- 現有 Docker 環境已就緒
- Expo Dev Server: `http://localhost:8081`
- Backend API: `http://host.docker.internal:8000/api`
- WebSocket: `ws://host.docker.internal:6001`

### **Environment Variables**
```env
EXPO_PUBLIC_API_URL=http://host.docker.internal:8000/api
EXPO_PUBLIC_WS_URL=ws://host.docker.internal:6001
EXPO_PUBLIC_APP_STAGE=development
EXPO_PUBLIC_REVERB_APP_KEY=xolhu9bxpdqxvxn0yvok
EXPO_PUBLIC_REVERB_HOST=host.docker.internal
EXPO_PUBLIC_REVERB_PORT=6001
```

## 📋 Success Criteria

### **Week 1 Completion**
- [ ] Jest + Testing Library 配置完成
- [ ] 專案結構重組完成
- [ ] 核心依賴安裝並配置
- [ ] 測試覆蓋率報告可生成
- [ ] TDD 工作流程建立

### **Week 2 Completion**  
- [ ] 認證功能 100% 測試覆蓋
- [ ] 登入/註冊頁面完成
- [ ] API 客戶端與後端連接成功
- [ ] Auth Store 狀態管理正常

### **Week 3 Completion**
- [ ] 滑卡配對功能完成
- [ ] 配對邏輯測試通過
- [ ] 用戶 Feed 載入正常
- [ ] 配對成功提示功能

### **Week 4 Completion**
- [ ] 基礎聊天介面完成
- [ ] WebSocket 訊息收發功能
- [ ] 聊天記錄載入和顯示
- [ ] 即時訊息更新

### **Week 5 Completion**
- [ ] 推播通知基礎功能
- [ ] 通知權限和接收處理
- [ ] 與聊天功能整合完成

---

**文件版本**: 1.0.0  
**開發方法**: Test-Driven Development  
**更新時間**: 2025年1月  
**預計完成**: 5 週後達到 MVP 功能完整性