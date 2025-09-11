# 開發指南

本文件提供詳細的開發環境設定與工作流程指南。

## 📋 開發環境檢查清單

在開始開發前，請確認以下項目：

- [ ] Docker Desktop 已安裝並運行
- [ ] Node.js 20+ 已安裝
- [ ] Git 已配置使用者名稱和電子郵件
- [ ] iOS/Android 模擬器已設定（可選）
- [ ] Expo Go App 已安裝在測試設備上（可選）

## 🛠️ 初始設定

### 1. 專案初始化

```bash
# 克隆專案
git clone <repository-url>
cd frontend

# 複製環境變數
cp .env.example .env

# 使用 Docker 啟動（推薦）
docker-compose up -d

# 或本地安裝
npm install
```

### 2. 環境變數配置

編輯 `.env` 文件：

```bash
# 開發環境 API
EXPO_PUBLIC_API_URL=http://host.docker.internal:8000/api
EXPO_PUBLIC_WS_URL=ws://host.docker.internal:6001

# 應用環境
EXPO_PUBLIC_APP_STAGE=development

# Expo 專案 ID（從 app.json 獲取）
EXPO_PUBLIC_PROJECT_ID=your-project-id
```

### 3. Git Hooks 設定

```bash
# 進入容器設定 hooks
docker-compose exec app npx husky install

# 或本地設定
npx husky install
```

## 🔄 日常開發流程

### 啟動開發環境

```bash
# 方法一：使用 Docker（推薦）
docker-compose up -d

# 檢查服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f app

# 方法二：本地開發
npm start
```

### 開發工作流程

1. **建立功能分支**
   ```bash
   git checkout -b feature/user-profile
   ```

2. **開發與測試**
   ```bash
   # 執行測試
   npm test
   
   # 類型檢查
   npm run type-check
   
   # 程式碼檢查
   npm run lint:check
   ```

3. **提交變更**
   ```bash
   # 暫存變更
   git add .
   
   # 提交（會自動執行 pre-commit hooks）
   git commit -m "feat: add user profile component"
   ```

4. **推送與合併**
   ```bash
   git push origin feature/user-profile
   # 建立 Pull Request
   ```

## 🧪 測試指南

### 測試類型

#### 單元測試
```bash
# 執行單元測試
npm test

# 監聽模式
npm run test:watch

# 覆蓋率報告
npm run test:coverage
```

#### 整合測試
```bash
# 測試 API 整合
npm test -- --testNamePattern="api"

# 測試路由
npm test -- --testNamePattern="navigation"
```

### 測試撰寫範例

```typescript
// components/ui/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button>Test Button</Button>);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress}>Test Button</Button>
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

## 🎨 UI/UX 開發

### 樣式系統

使用 NativeWind（Tailwind CSS 風格）：

```tsx
// 好的實踐
<View className="flex-1 bg-white p-4">
  <Text className="text-lg font-bold text-gray-900 mb-2">
    標題
  </Text>
  <Button className="bg-primary-500 text-white">
    按鈕
  </Button>
</View>
```

### 響應式設計

```tsx
// 使用條件樣式
<View className={cn(
  "p-4",
  isTablet ? "max-w-md mx-auto" : "w-full"
)}>
  {/* 內容 */}
</View>
```

### 深色模式支援

```tsx
// 使用系統主題
<View className="bg-white dark:bg-gray-900">
  <Text className="text-gray-900 dark:text-white">
    內容
  </Text>
</View>
```

## 🔌 API 整合

### API 客戶端使用

```typescript
// services/api/users.ts
import { apiClient } from './client';
import { User } from '@/types';

export const usersApi = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put('/me', data);
    return response.data;
  },
};
```

### React Query 整合

```typescript
// hooks/useUser.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/services/api/users';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: usersApi.getProfile,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}
```

## 🔄 狀態管理

### Zustand Store 結構

```typescript
// stores/userStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  // 狀態
  preferences: UserPreferences;
  
  // 動作
  setPreferences: (preferences: UserPreferences) => void;
  resetPreferences: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      
      setPreferences: (preferences) => set({ preferences }),
      
      resetPreferences: () => set({ preferences: defaultPreferences }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
);
```

## 🌐 國際化

### 添加新語言

1. 在 `src/lib/i18n.ts` 中添加翻譯：

```typescript
const resources = {
  'zh-TW': { /* 現有翻譯 */ },
  'en': {
    translation: {
      common: {
        confirm: 'Confirm',
        cancel: 'Cancel',
        // ...
      },
    },
  },
};
```

2. 在組件中使用：

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <Text>{t('common.confirm')}</Text>
  );
}
```

## 📱 平台特定開發

### iOS 特定功能

```tsx
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // iOS 特定邏輯
}
```

### Android 特定功能

```tsx
if (Platform.OS === 'android') {
  // Android 特定邏輯
}
```

## 🚀 效能優化

### 渲染優化

```tsx
// 使用 React.memo
const UserCard = React.memo(({ user }: { user: User }) => {
  return (
    <View>
      <Text>{user.name}</Text>
    </View>
  );
});

// 使用 useCallback
const handlePress = useCallback(() => {
  // 處理邏輯
}, [dependency]);
```

### 圖片優化

```tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: user.avatar }}
  style={{ width: 100, height: 100 }}
  contentFit="cover"
  transition={200}
/>
```

### 列表優化

```tsx
import { FlatList } from 'react-native';

<FlatList
  data={users}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <UserCard user={item} />}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

## 🐛 除錯指南

### 常見問題與解決方案

#### 1. Metro 伺服器無法啟動
```bash
# 清除快取
npx expo start -c

# 重置 Metro
npx expo r -c
```

#### 2. 模組解析錯誤
```bash
# 清除 node_modules
rm -rf node_modules
npm install

# 重建容器
docker-compose down -v
docker-compose build --no-cache
```

#### 3. 型別錯誤
```bash
# 檢查型別
npm run type-check

# 重新生成 API 型別
npm run generate:api-types
```

#### 4. 樣式不生效
```bash
# 確認 NativeWind 配置
# 檢查 tailwind.config.js 和 metro.config.js
```

### 除錯工具

#### React Native Debugger
1. 安裝：`brew install react-native-debugger`
2. 啟動：在開發選單中選擇 "Debug"

#### Flipper 整合
```bash
# 安裝 Flipper 桌面應用
# 在開發建置中會自動連接
```

## 📊 監控與分析

### 錯誤追蹤

```typescript
// lib/error-tracking.ts
export function logError(error: Error, context?: Record<string, any>) {
  if (__DEV__) {
    console.error('Error:', error, context);
  } else {
    // 發送到錯誤追蹤服務
    // crashlytics().recordError(error);
  }
}
```

### 效能監控

```typescript
// 追蹤畫面載入時間
useEffect(() => {
  const startTime = Date.now();
  
  return () => {
    const loadTime = Date.now() - startTime;
    console.log(`Screen load time: ${loadTime}ms`);
  };
}, []);
```

## 🔧 故障排除

### 開發環境重置

```bash
# 完整重置
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# 清除所有快取
npm run clean:cache
```

### 依賴問題

```bash
# 檢查過期依賴
npm outdated

# 更新依賴
npm update

# 修復依賴衝突
npm install --legacy-peer-deps
```

## 📋 發佈檢查清單

發佈前確認：

- [ ] 所有測試通過
- [ ] 型別檢查通過
- [ ] 程式碼檢查通過
- [ ] 效能測試完成
- [ ] UI/UX 檢視完成
- [ ] 多裝置測試完成
- [ ] API 整合測試完成
- [ ] 錯誤處理測試完成

## 📚 學習資源

- [React Native 官方文檔](https://reactnative.dev/docs/getting-started)
- [Expo 文檔](https://docs.expo.dev/)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/)
- [React Query 文檔](https://tanstack.com/query/latest)
- [Zustand 文檔](https://github.com/pmndrs/zustand)
- [NativeWind 文檔](https://www.nativewind.dev/)