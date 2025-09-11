# React Native + Expo 開發指南
**交友聊天遊戲 APP** - 前端開發完整指南

## 🎯 技術架構概述

根據 `TECHNICAL_ARCHITECTURE.md` 的規範，前端採用以下技術棧：

### 核心技術
- **框架**: React Native + Expo SDK (最新穩定版)
- **語言**: TypeScript (嚴格模式)
- **路由**: expo-router (檔案系統路由)
- **狀態管理**: zustand (本地狀態) + @tanstack/react-query (API 同步)
- **樣式**: nativewind (Tailwind CSS 風格)
- **動畫**: react-native-reanimated
- **表單**: react-hook-form + zod (schema 驗證)

## 🚀 專案初始化

### 1. 建立 Expo 專案
```bash
# 使用官方模板建立專案
npx create-expo-app@latest dating-app-mobile --template tabs@beta
cd dating-app-mobile

# 安裝核心依賴
npx expo install @tanstack/react-query zustand react-hook-form @hookform/resolvers zod i18next expo-notifications nativewind react-native-reanimated expo-image

# WebSocket 支援 (原生 WebSocket 或 socket.io-client 二選一)
npm install socket.io-client

# 安裝開發工具
npm install --save-dev @types/node eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin husky commitlint
```

### 2. TypeScript 配置 (tsconfig.json)
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### 3. ESLint 配置 (.eslintrc.js)
```javascript
module.exports = {
  extends: [
    'expo',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'prefer-const': 'error'
  }
};
```

## 📁 專案結構

```
dating-app-mobile/
├── app/                    # expo-router 路由結構
│   ├── (auth)/            # 認證相關頁面
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/            # 主要分頁導航
│   │   ├── index.tsx      # 探索頁面 (首頁)
│   │   ├── matches.tsx    # 配對清單
│   │   └── profile.tsx    # 個人檔案
│   ├── chat/[id].tsx      # 聊天頁面
│   ├── game/[session].tsx # 遊戲頁面
│   └── _layout.tsx        # 根佈局
├── components/            # 可重用元件
│   ├── ui/               # 基礎 UI 元件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   └── forms/            # 表單元件
│       └── AuthForm.tsx
├── features/              # 功能模組
│   ├── feed/             # 探索功能
│   ├── match/            # 配對功能
│   ├── chat/             # 聊天功能
│   ├── game/             # 遊戲功能
│   └── gift/             # 送禮功能
├── services/              # 服務層
│   ├── api/              # API 客戶端
│   │   ├── client.ts
│   │   └── types.ts      # API 型別定義
│   ├── ws/               # WebSocket 服務
│   │   └── client.ts
│   └── push/             # 推播服務
│       └── notifications.ts
├── stores/                # Zustand 狀態儲存
│   ├── auth.ts
│   ├── user.ts
│   └── chat.ts
├── hooks/                 # 自定義 React Hooks
│   ├── useAuth.ts
│   ├── useWebSocket.ts
│   └── useQuery.ts
├── lib/                   # 工具函數
│   ├── utils.ts
│   ├── constants.ts
│   └── validators.ts
└── assets/                # 靜態資源
    ├── images/
    └── icons/
```

## 🗄️ 狀態管理 (Zustand)

### 認證狀態 (stores/auth.ts)
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email: string;
  profile?: UserProfile;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await apiClient.post('/auth/login', {
            email,
            password,
          });
          
          if (response.data.success) {
            set({
              user: response.data.data.user,
              token: response.data.data.token,
              isAuthenticated: true,
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Login failed:', error);
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      register: async (userData: RegisterData) => {
        try {
          const response = await apiClient.post('/auth/register', userData);
          
          if (response.data.success) {
            set({
              user: response.data.data.user,
              token: response.data.data.token,
              isAuthenticated: true,
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Registration failed:', error);
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### 聊天狀態 (stores/chat.ts)
```typescript
import { create } from 'zustand';

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  sequence_number: number;
  created_at: string;
  sender: {
    id: number;
    name: string;
    profile?: UserProfile;
  };
}

interface Conversation {
  id: number;
  other_user: {
    id: number;
    name: string;
    avatar?: string;
  };
  last_message?: Message;
  unread_count: number;
  updated_at: string;
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<number, Message[]>;
  currentConversation: number | null;
  
  setCurrentConversation: (id: number) => void;
  addMessage: (message: Message) => void;
  updateConversations: (conversations: Conversation[]) => void;
  markAsRead: (conversationId: number) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  currentConversation: null,

  setCurrentConversation: (id: number) => {
    set({ currentConversation: id });
  },

  addMessage: (message: Message) => {
    const { messages } = get();
    const conversationMessages = messages[message.conversation_id] || [];
    
    set({
      messages: {
        ...messages,
        [message.conversation_id]: [...conversationMessages, message],
      },
    });
  },

  updateConversations: (conversations: Conversation[]) => {
    set({ conversations });
  },

  markAsRead: (conversationId: number) => {
    const { conversations } = get();
    const updatedConversations = conversations.map(conv =>
      conv.id === conversationId 
        ? { ...conv, unread_count: 0 }
        : conv
    );
    set({ conversations: updatedConversations });
  },
}));
```

## 🌐 API 客戶端 (services/api/client.ts)

```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../stores/auth';

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - 添加 auth token 和 trace-id
    this.client.interceptors.request.use(
      (config) => {
        const { token } = useAuthStore.getState();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // 添加 trace-id 用於請求追蹤
        config.headers['X-Trace-Id'] = this.generateTraceId();
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - 統一錯誤處理
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token 過期，登出用戶
          useAuthStore.getState().logout();
        }
        
        return Promise.reject(error);
      }
    );
  }

  private generateTraceId(): string {
    return `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // GET 請求
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  // POST 請求  
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  // PUT 請求
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  // DELETE 請求
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // 文件上傳
  async uploadFile<T>(
    url: string, 
    file: any, 
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });

    return response.data;
  }
}

export const apiClient = new ApiClient();

// API 方法定義
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  
  register: (userData: any) =>
    apiClient.post('/auth/register', userData),
    
  refreshToken: () =>
    apiClient.post('/auth/refresh'),
};

export const userApi = {
  getProfile: () =>
    apiClient.get('/user/me'),
    
  updateProfile: (data: any) =>
    apiClient.put('/user/me', data),
    
  getFeed: (limit = 10, offset = 0) =>
    apiClient.get(`/user/feed?limit=${limit}&offset=${offset}`),
};

export const chatApi = {
  getConversations: () =>
    apiClient.get('/chat/conversations'),
    
  getMessages: (conversationId: number) =>
    apiClient.get(`/chat/conversations/${conversationId}/messages`),
    
  sendMessage: (conversationId: number, content: string, clientNonce: string) =>
    apiClient.post(`/chat/conversations/${conversationId}/messages`, {
      content,
      client_nonce: clientNonce,
    }),
    
  markAsRead: (messageId: number) =>
    apiClient.put(`/chat/messages/${messageId}/read`),
};
```

## 🔌 WebSocket 客戶端 (services/ws/client.ts)

```typescript
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chat';

interface WebSocketMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  sender: {
    id: number;
    name: string;
    profile?: any;
  };
  created_at: string;
}

interface GameStartedEvent {
  game_session_id: number;
  conversation_id: number;
  status: string;
  initiator: { id: number; name: string };
  participant: { id: number; name: string };
  started_at: string;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1秒開始，指數退避

  constructor() {
    this.connect();
  }

  private connect(): void {
    const { token } = useAuthStore.getState();
    
    if (!token) {
      console.warn('No auth token available for WebSocket connection');
      return;
    }

    this.socket = io(process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080', {
      auth: {
        token: token,
      },
      transports: ['websocket'],
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // 連接事件
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // 服務器主動斷開，需要重新連接
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnection();
    });

    // 業務事件監聽
    this.socket.on('message.new', this.handleNewMessage.bind(this));
    this.socket.on('game.started', this.handleGameStarted.bind(this));
    this.socket.on('chat.joined', this.handleUserJoined.bind(this));
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    
    // 指數退避策略: 1, 2, 4, 8 秒
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      8000
    );
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleNewMessage(event: WebSocketMessage): void {
    console.log('📨 New message received:', event);
    
    // 更新 chat store
    useChatStore.getState().addMessage(event);
    
    // 如果不是當前用戶發送的消息，顯示通知
    const currentUserId = useAuthStore.getState().user?.id;
    if (event.sender_id !== currentUserId) {
      this.showNotification(
        event.sender.name,
        event.content
      );
    }
  }

  private handleGameStarted(event: GameStartedEvent): void {
    console.log('🎮 Game started:', event);
    
    // 顯示遊戲開始通知
    const currentUserId = useAuthStore.getState().user?.id;
    const opponent = event.initiator.id === currentUserId 
      ? event.participant 
      : event.initiator;
      
    this.showNotification(
      '遊戲開始！',
      `與 ${opponent.name} 的石頭剪刀布對戰已開始`
    );
  }

  private handleUserJoined(event: any): void {
    console.log('👋 User joined conversation:', event);
    
    const currentUserId = useAuthStore.getState().user?.id;
    if (event.user_id !== currentUserId) {
      // 其他用戶加入對話，可以顯示「正在輸入」狀態
      console.log(`${event.user.name} joined the conversation`);
    }
  }

  private showNotification(title: string, body: string): void {
    // 整合 expo-notifications 顯示本地通知
    // 這裡先簡單 console.log，後續整合推播服務
    console.log(`🔔 Notification: ${title} - ${body}`);
  }

  // 訂閱特定對話的事件
  public subscribeToConversation(conversationId: number): void {
    if (this.socket) {
      this.socket.emit('join', `conversation.${conversationId}`);
    }
  }

  // 取消訂閱對話事件
  public unsubscribeFromConversation(conversationId: number): void {
    if (this.socket) {
      this.socket.emit('leave', `conversation.${conversationId}`);
    }
  }

  // 斷開連接
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // 檢查連接狀態
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsClient = new WebSocketClient();
```

## 🎨 UI 元件系統

### 基礎按鈕元件 (components/ui/Button.tsx)
```tsx
import React from 'react';
import { Pressable, Text, ActivityIndicator, PressableProps } from 'react-native';
import { styled } from 'nativewind';

const StyledPressable = styled(Pressable);
const StyledText = styled(Text);

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-rose-500 active:bg-rose-600 disabled:bg-gray-300';
      case 'secondary':
        return 'bg-gray-100 active:bg-gray-200 disabled:bg-gray-50';
      case 'outline':
        return 'border-2 border-rose-500 bg-transparent active:bg-rose-50';
      case 'ghost':
        return 'bg-transparent active:bg-gray-100';
      default:
        return 'bg-rose-500 active:bg-rose-600';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 rounded-lg';
      case 'md':
        return 'px-6 py-3 rounded-xl';
      case 'lg':
        return 'px-8 py-4 rounded-2xl';
      default:
        return 'px-6 py-3 rounded-xl';
    }
  };

  const getTextStyles = () => {
    const baseStyles = 'font-semibold text-center';
    const colorStyles = variant === 'primary' 
      ? 'text-white' 
      : variant === 'outline' 
        ? 'text-rose-500'
        : 'text-gray-900';
    
    const sizeStyles = size === 'sm' 
      ? 'text-sm' 
      : size === 'lg' 
        ? 'text-lg'
        : 'text-base';

    return `${baseStyles} ${colorStyles} ${sizeStyles}`;
  };

  return (
    <StyledPressable
      className={`
        flex-row items-center justify-center
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${disabled || loading ? 'opacity-50' : ''}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? 'white' : '#ef4444'} 
        />
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          <StyledText className={getTextStyles()}>
            {title}
          </StyledText>
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </StyledPressable>
  );
};

export default Button;
```

## 🎮 關鍵頁面實作

### 探索頁面 (app/(tabs)/index.tsx)
```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, PanGestureHandler } from 'react-native';
import { styled } from 'nativewind';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../services/api/client';
import UserCard from '../components/UserCard';
import Button from '../components/ui/Button';

const StyledView = styled(View);
const StyledText = styled(Text);

const { width: screenWidth } = Dimensions.get('window');

interface User {
  id: number;
  name: string;
  age: number;
  photos: string[];
  bio: string;
  distance: number;
}

const DiscoveryScreen: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [users, setUsers] = useState<User[]>([]);

  // 使用 React Query 獲取用戶推薦
  const { data: feedData, isLoading, refetch } = useQuery({
    queryKey: ['userFeed'],
    queryFn: () => userApi.getFeed(10, 0),
    staleTime: 1000 * 60 * 5, // 5分鐘內不重新獲取
  });

  useEffect(() => {
    if (feedData?.data) {
      setUsers(feedData.data);
    }
  }, [feedData]);

  const handleSwipeLeft = () => {
    // 向左滑動 - Pass
    console.log('Pass on user:', users[currentIndex]?.name);
    nextUser();
  };

  const handleSwipeRight = async () => {
    // 向右滑動 - Like
    const currentUser = users[currentIndex];
    if (!currentUser) return;

    try {
      const response = await userApi.likeUser(currentUser.id);
      console.log('Liked user:', currentUser.name);
      
      if (response.data.is_mutual) {
        // 顯示配對成功 Modal
        showMatchModal(currentUser);
      }
      
      nextUser();
    } catch (error) {
      console.error('Like failed:', error);
    }
  };

  const nextUser = () => {
    if (currentIndex < users.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 沒有更多用戶，重新載入
      refetch();
      setCurrentIndex(0);
    }
  };

  const showMatchModal = (user: User) => {
    // TODO: 實作配對成功 Modal
    alert(`🎉 與 ${user.name} 配對成功！`);
  };

  if (isLoading) {
    return (
      <StyledView className="flex-1 justify-center items-center bg-white">
        <StyledText className="text-lg text-gray-600">載入中...</StyledText>
      </StyledView>
    );
  }

  const currentUser = users[currentIndex];

  return (
    <StyledView className="flex-1 bg-gradient-to-b from-rose-50 to-white">
      {/* 用戶卡片區域 */}
      <StyledView className="flex-1 justify-center items-center px-4">
        {currentUser ? (
          <UserCard
            user={currentUser}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />
        ) : (
          <StyledView className="justify-center items-center">
            <StyledText className="text-xl text-gray-600 mb-4">
              暫時沒有更多推薦
            </StyledText>
            <Button
              title="重新載入"
              onPress={() => refetch()}
            />
          </StyledView>
        )}
      </StyledView>

      {/* 底部操作按鈕 */}
      <StyledView className="flex-row justify-center items-center pb-8 px-8">
        <Button
          title="❌"
          variant="outline"
          size="lg"
          onPress={handleSwipeLeft}
          className="mr-8"
        />
        <Button
          title="❤️"
          variant="primary"
          size="lg"
          onPress={handleSwipeRight}
        />
      </StyledView>

      {/* 用戶計數 */}
      <StyledView className="absolute top-12 right-4">
        <StyledText className="text-sm text-gray-500">
          {currentIndex + 1} / {users.length}
        </StyledText>
      </StyledView>
    </StyledView>
  );
};

export default DiscoveryScreen;
```

### 聊天頁面 (app/chat/[id].tsx)
```tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { styled } from 'nativewind';
import { useChatStore } from '../../stores/chat';
import { useAuthStore } from '../../stores/auth';
import { chatApi } from '../../services/api/client';
import { wsClient } from '../../services/ws/client';
import MessageBubble from '../../components/MessageBubble';
import Button from '../../components/ui/Button';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);

const ChatScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = parseInt(id as string);
  
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  const { user } = useAuthStore();
  const { 
    messages, 
    currentConversation,
    setCurrentConversation, 
    addMessage 
  } = useChatStore();

  const conversationMessages = messages[conversationId] || [];

  useEffect(() => {
    // 設置當前對話
    setCurrentConversation(conversationId);
    
    // 載入歷史訊息
    loadMessages();
    
    // 訂閱 WebSocket 事件
    wsClient.subscribeToConversation(conversationId);
    
    return () => {
      wsClient.unsubscribeFromConversation(conversationId);
    };
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      const response = await chatApi.getMessages(conversationId);
      if (response.success) {
        // 批量添加歷史訊息到 store
        response.data.forEach((message: any) => {
          addMessage(message);
        });
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || isLoading) return;

    const content = messageText.trim();
    const clientNonce = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 樂觀更新 - 先在 UI 顯示訊息
    const optimisticMessage = {
      id: 0, // 臨時 ID
      conversation_id: conversationId,
      sender_id: user!.id,
      content,
      sequence_number: 0,
      client_nonce: clientNonce,
      created_at: new Date().toISOString(),
      sender: {
        id: user!.id,
        name: user!.name,
        profile: user!.profile,
      },
    };

    addMessage(optimisticMessage);
    setMessageText('');
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(
        conversationId,
        content,
        clientNonce
      );
      
      if (response.success) {
        // WebSocket 會自動更新真實的訊息
        console.log('Message sent successfully');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: 處理發送失敗，從 UI 移除樂觀訊息
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameInvite = () => {
    // TODO: 實作遊戲邀請
    console.log('Game invite clicked');
  };

  const handleGiftSend = () => {
    // TODO: 實作送禮功能
    console.log('Gift send clicked');
  };

  const renderMessage = ({ item }: { item: any }) => (
    <MessageBubble
      message={item}
      isFromCurrentUser={item.sender_id === user?.id}
    />
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StyledView className="flex-1 bg-white">
        {/* 訊息列表 */}
        <FlatList
          ref={flatListRef}
          data={conversationMessages}
          keyExtractor={(item) => `${item.id}-${item.client_nonce}`}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />

        {/* 輸入區域 */}
        <StyledView className="flex-row items-end p-4 border-t border-gray-200">
          {/* 遊戲按鈕 */}
          <Button
            title="🎮"
            variant="ghost"
            size="sm"
            onPress={handleGameInvite}
            className="mr-2"
          />

          {/* 送禮按鈕 */}
          <Button
            title="🎁"
            variant="ghost"
            size="sm"
            onPress={handleGiftSend}
            className="mr-2"
          />

          {/* 訊息輸入框 */}
          <StyledView className="flex-1 mr-2">
            <StyledTextInput
              className="
                border border-gray-300 rounded-full
                px-4 py-3 text-base
                max-h-24
              "
              placeholder="輸入訊息..."
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
            />
          </StyledView>

          {/* 發送按鈕 */}
          <Button
            title="發送"
            variant="primary"
            size="sm"
            onPress={sendMessage}
            loading={isLoading}
            disabled={!messageText.trim()}
          />
        </StyledView>
      </StyledView>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
```

## 📱 推播通知 (services/push/notifications.ts)

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

// 設置通知行為
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  private expoPushToken: string | null = null;

  async initialize(): Promise<void> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return;
    }

    // 請求通知權限
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }

    // 獲取 Expo Push Token
    const token = await Notifications.getExpoPushTokenAsync();
    this.expoPushToken = token.data;

    // 註冊設備到後端
    await this.registerDevice();

    // 監聽通知
    this.setupNotificationListeners();

    console.log('✅ Push notifications initialized');
  }

  private async registerDevice(): Promise<void> {
    if (!this.expoPushToken) return;

    try {
      await apiClient.post('/push-notification/push/devices', {
        token: this.expoPushToken,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        app_version: '1.0.0', // 從 app.json 獲取
      });
      console.log('Device registered for push notifications');
    } catch (error) {
      console.error('Failed to register device:', error);
    }
  }

  private setupNotificationListeners(): void {
    // 收到通知時處理
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('📱 Notification received:', notification);
      
      // 可以在這裡更新應用狀態
      const { data } = notification.request.content;
      
      if (data?.type === 'new_message') {
        // 更新未讀訊息計數
        this.handleNewMessageNotification(data);
      } else if (data?.type === 'new_match') {
        // 處理新配對通知
        this.handleNewMatchNotification(data);
      }
    });

    // 點擊通知時處理
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('📱 Notification clicked:', response);
      
      const { data } = response.notification.request.content;
      
      // 根據通知類型導航到對應頁面
      if (data?.type === 'new_message' && data?.conversation_id) {
        // 導航到聊天頁面
        // router.push(`/chat/${data.conversation_id}`);
      } else if (data?.type === 'new_match' && data?.match_id) {
        // 導航到配對頁面
        // router.push(`/matches`);
      }
    });
  }

  private handleNewMessageNotification(data: any): void {
    // 更新聊天狀態，增加未讀計數等
    console.log('Handle new message notification:', data);
  }

  private handleNewMatchNotification(data: any): void {
    // 處理新配對，可能顯示慶祝動畫等
    console.log('Handle new match notification:', data);
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    delay: number = 0
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: delay > 0 ? { seconds: delay } : null,
    });

    return notificationId;
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async clearAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const pushNotificationService = new PushNotificationService();
```

## 🧪 測試配置

### Jest 配置 (jest.config.js)
```javascript
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'stores/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/node_modules/**'
  ]
};
```

### 測試範例 (components/__tests__/Button.test.tsx)
```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../ui/Button';

describe('Button Component', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(<Button title="Test Button" />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={onPressMock} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when loading', () => {
    const { getByTestId } = render(
      <Button title="Test Button" loading={true} />
    );
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" disabled={true} onPress={onPressMock} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });
});
```

## 📋 開發檢查清單 (9週計劃)

### Week 1: 專案設置與認證
- [ ] Expo 專案初始化
- [ ] 安裝核心依賴套件
- [ ] 設置 TypeScript 嚴格模式
- [ ] 配置 ESLint & Prettier
- [ ] 實作 API 客戶端
- [ ] 實作認證 Store (Zustand)
- [ ] 建立登入/註冊頁面
- [ ] 設置路由結構 (expo-router)

### Week 2: 用戶資料與照片管理
- [ ] 實作個人檔案編輯
- [ ] 照片上傳功能 (expo-image-picker)
- [ ] 照片裁切與壓縮
- [ ] 照片管理界面
- [ ] 個人資料展示頁面

### Week 3: 探索與配對
- [ ] 實作探索頁面 (卡片滑動)
- [ ] 手勢處理 (PanGestureHandler)
- [ ] Like/Pass 功能
- [ ] 配對成功 Modal
- [ ] 配對列表頁面

### Week 4: 即時聊天
- [ ] WebSocket 客戶端整合
- [ ] 聊天頁面 UI
- [ ] 訊息發送/接收
- [ ] 訊息狀態管理
- [ ] 對話列表

### Week 5: 遊戲功能
- [ ] 石頭剪刀布遊戲 UI
- [ ] 遊戲狀態管理
- [ ] 即時遊戲更新
- [ ] 遊戲結果顯示
- [ ] 遊戲邀請功能

### Week 6: 虛擬禮物與安全
- [ ] 禮物目錄展示
- [ ] 送禮功能實作
- [ ] 用戶舉報介面
- [ ] 封鎖/解除封鎖功能
- [ ] 安全設置頁面

### Week 7: 推播通知與體驗優化
- [ ] Expo Notifications 整合
- [ ] 本地與遠端通知處理
- [ ] 深度連結 (Deep Links)
- [ ] 動畫效果 (Reanimated)
- [ ] 觸覺回饋 (Haptic)
- [ ] 國際化設置 (i18next)

### Week 8: 測試與除錯
- [ ] 單元測試撰寫
- [ ] 元件測試
- [ ] API 整合測試
- [ ] WebSocket 連接測試
- [ ] 效能測試與優化
- [ ] Bug 修復

### Week 9: 發布準備
- [ ] App 圖標與啟動畫面
- [ ] App Store 資訊準備
- [ ] 建置設定最佳化
- [ ] 安全性檢查
- [ ] 最終測試與品質保證

---

**總結**: 此開發指南完全符合 `TECHNICAL_ARCHITECTURE.md` 中定義的技術架構，採用 React Native + Expo + TypeScript 的組合，提供完整的 9 週開發路線圖和實作細節。後端 API 已 100% 準備就緒，可立即開始前端開發工作。