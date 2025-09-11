# 交友聊天遊戲 APP - 前端

基於 React Native + Expo 的跨平台交友應用前端實作。

## 🚀 快速開始

### 系統需求

- Node.js 20+
- npm 或 yarn
- Docker & Docker Compose（推薦）
- Expo CLI
- iOS 模擬器或 Android 模擬器

### 使用 Docker 開發（推薦）

```bash
# 啟動開發環境
docker-compose up -d

# 查看日誌
docker-compose logs -f app

# 進入容器執行指令
docker-compose exec app bash

# 停止服務
docker-compose down
```

開發服務器將在以下端口運行：
- **Metro**: http://localhost:8081
- **Expo DevTools**: http://localhost:8082

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run start

# 啟動特定平台
npm run ios      # iOS 模擬器
npm run android  # Android 模擬器
npm run web      # Web 瀏覽器
```

## 📁 專案結構

```
src/
├── app/                    # Expo Router 路由
│   ├── (auth)/            # 認證頁面組
│   ├── (tabs)/            # 主要分頁組
│   ├── chat/[id].tsx      # 聊天頁面
│   ├── game/[session].tsx # 遊戲頁面
│   └── _layout.tsx        # 根布局
├── components/            # 可重用元件
│   ├── ui/               # 基礎 UI 元件
│   └── forms/            # 表單元件
├── features/              # 功能模組
│   ├── feed/             # 探索功能
│   ├── match/            # 配對功能
│   ├── chat/             # 聊天功能
│   ├── game/             # 遊戲功能
│   └── gift/             # 送禮功能
├── services/              # 服務層
│   ├── api/              # API 客戶端
│   ├── ws/               # WebSocket 服務
│   └── push/             # 推播服務
├── stores/                # Zustand 狀態管理
├── hooks/                 # 自定義 Hooks
├── lib/                   # 工具函數
└── assets/                # 靜態資源
```

## 🔧 開發指令

### 程式碼品質

```bash
# ESLint 檢查
npm run lint:check

# ESLint 修復
npm run lint

# Prettier 檢查
npm run format:check

# Prettier 格式化
npm run format

# TypeScript 類型檢查
npm run type-check
```

### 測試

```bash
# 執行測試
npm test

# 監聽模式測試
npm run test:watch

# 測試覆蓋率
npm run test:coverage
```

### 建置與部署

```bash
# Android 建置
npm run build:android

# iOS 建置
npm run build:ios

# 全平台建置
npm run build:all

# OTA 更新
npm run update
```

## 🏗️ 技術架構

### 核心技術

- **框架**: React Native + Expo
- **語言**: TypeScript（嚴格模式）
- **路由**: Expo Router（檔案系統路由）
- **狀態管理**: Zustand + React Query
- **樣式**: NativeWind（Tailwind CSS）
- **動畫**: React Native Reanimated
- **國際化**: i18next

### 開發工具

- **程式碼品質**: ESLint + Prettier
- **Git Hooks**: Husky + Commitlint
- **測試**: Jest + Testing Library
- **API 類型**: OpenAPI TypeScript

## 🌐 環境配置

複製 `.env.example` 為 `.env` 並配置：

```bash
# API 配置
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_WS_URL=ws://localhost:6001

# 應用環境
EXPO_PUBLIC_APP_STAGE=development

# Expo 配置
EXPO_PUBLIC_PROJECT_ID=your-project-id
```

## 📱 使用 Expo Go 測試

1. 在手機上安裝 Expo Go 應用
2. 啟動開發服務器：`npm start`
3. 掃描二維碼或輸入開發 URL

## 🔄 與後端整合

確保後端服務正在運行：
- **API**: http://localhost:8000
- **WebSocket**: ws://localhost:6001

API 客戶端會自動處理：
- JWT 認證
- 請求重試
- 錯誤處理
- 追蹤 ID

## 🧪 測試策略

### 單元測試
- 工具函數測試
- Hook 測試
- 狀態管理測試

### 整合測試
- API 整合測試
- 路由測試

### E2E 測試
- 關鍵用戶流程測試

## 📝 開發規範

### Git Commit 規範

使用 Conventional Commits：

```
feat: 添加新功能
fix: 修復 bug
docs: 更新文檔
style: 程式碼格式修改
refactor: 重構程式碼
test: 測試相關
chore: 建置或工具變動
```

### 程式碼風格

- 使用 TypeScript 嚴格模式
- 遵循 ESLint 規則
- 使用 Prettier 格式化
- 元件使用 PascalCase
- 檔案使用 camelCase

### 命名規範

- **元件**: `UserCard.tsx`
- **Hook**: `useAuth.ts`
- **Store**: `authStore.ts`
- **Type**: `UserProfile`
- **API**: `getUserProfile`

## 🚨 故障排除

### 常見問題

**Metro 快取問題**
```bash
npx expo start -c
```

**模組解析問題**
```bash
rm -rf node_modules && npm install
```

**型別錯誤**
```bash
npm run type-check
```

**容器重建**
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### 效能優化

- 使用 `React.memo` 避免不必要渲染
- 使用 `useMemo` 和 `useCallback` 優化計算
- 圖片使用 `expo-image` 進行優化
- 列表使用 `VirtualizedList` 或 `FlatList`

## 📞 支援

如有問題，請：
1. 檢查 [Issues](../../issues)
2. 查看開發日誌：`docker-compose logs -f app`
3. 聯繫開發團隊

## 📄 授權

本專案採用 MIT 授權條款。