# 交友聊天遊戲 APP - Frontend Development Guide

**Phase 3: Frontend Integration & Mobile App Development**  
**Backend Status**: Phase 2 Complete (100% Ready)  
**Framework**: React Native + Expo (TypeScript)

根據 `TECHNICAL_ARCHITECTURE.md` 的完整規範實作前端應用。

## 🎯 技術架構概述

### 核心技術 (按 TECHNICAL_ARCHITECTURE.md)

#### 基礎框架
- **Expo SDK**: 最新穩定版本
- **TypeScript**: 嚴格模式 (`strict: true`)
- **expo-router**: 檔案系統路由

#### 狀態管理與資料同步
- **zustand**: 本地狀態管理
- **@tanstack/react-query**: API 同步，支援游標分頁
- **智能快取**: 背景重新整理

#### 即時通訊
- **原生 WebSocket** 或 **socket.io-client**: 二選一
- **心跳機制**: 25 秒間隔
- **重連策略**: 指數退避 (1/2/4/8 秒)
- **訊息去重**: client_nonce 機制

#### UI 與體驗
- **nativewind**: Tailwind CSS 風格樣式系統
- **react-native-reanimated**: 高效能動畫
- **expo-image**: 優化圖片載入與快取
- **Haptic Feedback**: 觸覺回饋

#### 表單與驗證
- **react-hook-form**: 表單狀態管理
- **zod**: TypeScript 優先的 schema 驗證

#### 推播通知
- **expo-notifications**: 統一 FCM/APNs 介面
- **深度連結**: app://match/{id}, app://chat/{id}

#### 國際化
- **i18next**: 國際化框架
- **初期語言**: 繁體中文 (zh-TW)

#### 網路層
- **axios/fetch**: HTTP 客戶端
- **openapi-typescript**: 從 OpenAPI 自動產生型別
- **Trace-Id**: 請求追蹤
- **重試機制**: 網路錯誤自動重試

#### 程式碼品質
- **ESLint + Prettier**: 程式碼風格
- **commitlint**: 提交訊息規範
- **Husky**: Git hooks 管理

### 核心依賴包
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.45.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "i18next": "^23.0.0",
    "expo-notifications": "~0.28.0",
    "nativewind": "^2.0.11",
    "react-native-reanimated": "~3.10.0",
    "expo-image": "~1.12.0",
    "socket.io-client": "^4.7.0",
    "axios": "^1.5.0"
  }
}
```

## 🏗️ 專案結構 (按 TECHNICAL_ARCHITECTURE.md)

```
app/                    # expo-router 路由
  (auth)/              # 認證相關頁面
    login.tsx
    register.tsx
  (tabs)/              # 主要分頁
    index.tsx          # 探索頁面
    matches.tsx        # 配對清單
    profile.tsx        # 個人檔案
  chat/[id].tsx        # 聊天頁面
  game/[session].tsx   # 遊戲頁面

components/            # 可重用元件
  ui/                  # 基礎 UI 元件
  forms/               # 表單元件

features/              # 功能模組
  feed/                # 探索功能
  match/               # 配對功能
  chat/                # 聊天功能
  game/                # 遊戲功能
  gift/                # 送禮功能

services/              # 服務層
  api/                 # API 客戶端
  ws/                  # WebSocket 服務
  push/                # 推播服務

stores/                # Zustand 狀態儲存
  auth.ts
  user.ts
  chat.ts

hooks/                 # 自定義 React Hooks
  useAuth.ts
  useWebSocket.ts

lib/                   # 工具函數
  utils.ts
  constants.ts
  validators.ts

assets/                # 靜態資源
  images/
  icons/
```

## 🔧 核心實作範例

### 1. 狀態管理 (Zustand + React Query)
```typescript
// stores/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        const response = await authApi.login(email, password);
        set({
          user: response.user,
          token: response.token,
          isAuthenticated: true,
        });
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### 2. API 客戶端
```typescript
// services/api/client.ts
import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/stores/auth';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://host.docker.internal:8000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use((config) => {
      const { token } = useAuthStore.getState();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async getConversations() {
    const response = await this.client.get('/chat/conversations');
    return response.data;
  }

  async sendMessage(conversationId: number, content: string, clientNonce: string) {
    const response = await this.client.post(`/chat/conversations/${conversationId}/messages`, {
      content,
      client_nonce: clientNonce,
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

### 3. WebSocket 服務
```typescript
// services/ws/websocket.ts
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    const { token } = useAuthStore.getState();
    
    this.socket = io(process.env.EXPO_PUBLIC_WS_URL || 'ws://host.docker.internal:6001', {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      this.handleReconnect();
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // 1s, 2s, 4s, 8s
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }

  onMessageReceived(callback: (message: any) => void) {
    this.socket?.on('message.new', callback);
  }

  sendMessage(conversationId: number, content: string, clientNonce: string) {
    this.socket?.emit('message.send', {
      conversationId,
      content,
      clientNonce,
    });
  }
}

export const wsService = new WebSocketService();
```

### 4. React Hooks
```typescript
// hooks/useAuth.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { useAuthStore } from '@/stores/auth';

export const useLogin = () => {
  const { login: setAuth } = useAuthStore();
  
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiClient.login(email, password),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
    },
  });
};

// hooks/useWebSocket.ts
import { useEffect } from 'react';
import { wsService } from '@/services/ws/websocket';
import { useChatStore } from '@/stores/chat';

export const useWebSocket = () => {
  const { addMessage } = useChatStore();

  useEffect(() => {
    wsService.connect();
    wsService.onMessageReceived(addMessage);

    return () => wsService.disconnect();
  }, []);

  return {
    sendMessage: wsService.sendMessage.bind(wsService),
  };
};
```

## 🎨 主要頁面實作

### 1. 探索頁面 (Swipe Cards)
```tsx
// app/(tabs)/index.tsx
import { View, Text } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';

export default function DiscoveryScreen() {
  const { data: users = [] } = useQuery({
    queryKey: ['user-feed'],
    queryFn: () => apiClient.getUserFeed(),
  });

  const likeMutation = useMutation({
    mutationFn: (userId: number) => apiClient.likeUser(userId),
    onSuccess: (data) => {
      if (data.isMatch) {
        // Show match dialog
      }
    },
  });

  return (
    <View className="flex-1 bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Swipe cards implementation */}
    </View>
  );
}
```

### 2. 聊天頁面
```tsx
// app/chat/[id].tsx
import { View, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { sendMessage } = useWebSocket();

  const handleSendMessage = (content: string) => {
    const clientNonce = `msg-${Date.now()}`;
    sendMessage(Number(conversationId), content, clientNonce);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Chat UI implementation */}
    </View>
  );
}
```

## 🔄 開發時程

### Week 1-2: 專案初始化
- [ ] 安裝核心依賴包
- [ ] 設定 TypeScript 嚴格模式
- [ ] 配置 ESLint + Prettier + Husky
- [ ] 建立專案結構

### Week 3-4: 核心架構
- [ ] 實作 Zustand stores
- [ ] 建立 API 客戶端
- [ ] WebSocket 服務整合
- [ ] React Query 設定

### Week 5-6: 認證與基礎 UI
- [ ] 登入/註冊頁面
- [ ] 基礎 UI 元件庫
- [ ] Navigation 設定
- [ ] 表單驗證

### Week 7-8: 核心功能
- [ ] 探索/配對頁面
- [ ] 聊天功能
- [ ] 推播通知
- [ ] 基礎遊戲功能

### Week 9: 最佳化與測試
- [ ] 效能最佳化
- [ ] 錯誤處理
- [ ] 測試撰寫
- [ ] 生產環境準備

## 📱 部署配置

### 開發環境變數
```env
EXPO_PUBLIC_API_URL=http://host.docker.internal:8000/api
EXPO_PUBLIC_WS_URL=ws://host.docker.internal:6001
EXPO_PUBLIC_APP_STAGE=development
```

### 生產環境變數
```env
EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
EXPO_PUBLIC_WS_URL=wss://your-ws-domain.com
EXPO_PUBLIC_APP_STAGE=production
```

---

**文件版本**: 1.0.0 (按 TECHNICAL_ARCHITECTURE.md 規範)  
**最後更新**: 2025年1月  
**技術棧**: React Native + Expo + TypeScript