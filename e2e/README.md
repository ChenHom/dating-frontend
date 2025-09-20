# E2E Testing with Playwright

這個目錄包含了交友聊天遊戲 APP 的端對端（E2E）測試，使用 Playwright 框架實現。

## 目錄結構

```
e2e/
├── fixtures/          # 測試數據和固件
│   ├── auth.json      # 認證狀態文件
│   └── test-data.ts   # 測試數據定義
├── pages/             # 頁面對象模式 (Page Object Model)
│   ├── BasePage.ts    # 基礎頁面類
│   ├── LoginPage.ts   # 登入頁面
│   ├── FeedPage.ts    # 配對頁面
│   └── ChatPage.ts    # 聊天頁面
├── tests/             # 測試文件
│   ├── auth.spec.ts   # 認證測試
│   ├── feed.spec.ts   # 配對功能測試
│   ├── chat.spec.ts   # 聊天功能測試
│   ├── visual.spec.ts # 視覺回歸測試
│   ├── auth.setup.ts  # 認證設置
│   └── cleanup.teardown.ts # 清理工作
├── utils/             # 工具函數
│   ├── api-mocks.ts   # API 模擬工具
│   ├── test-helpers.ts # 測試助手函數
│   ├── global-setup.ts # 全局設置
│   └── global-teardown.ts # 全局清理
└── reports/           # 測試報告輸出
```

## 快速開始

### 1. 安裝瀏覽器

```bash
npm run e2e:install
```

### 2. 運行所有測試

```bash
npm run e2e
```

### 3. 在有頭模式下運行（可看到瀏覽器）

```bash
npm run e2e:headed
```

### 4. 使用 UI 模式運行

```bash
npm run e2e:ui
```

## 可用的測試腳本

### 基本運行

- `npm run e2e` - 運行所有 E2E 測試
- `npm run e2e:headed` - 在有頭模式下運行
- `npm run e2e:ui` - 使用 Playwright UI 模式
- `npm run e2e:debug` - 調試模式運行

### 瀏覽器特定測試

- `npm run e2e:chromium` - 只在 Chromium 中運行
- `npm run e2e:firefox` - 只在 Firefox 中運行
- `npm run e2e:webkit` - 只在 WebKit 中運行
- `npm run e2e:msedge` - 只在 Microsoft Edge 中運行
- `npm run e2e:mobile` - 在移動端瀏覽器中運行

### 功能特定測試

- `npm run e2e:auth` - 運行認證測試
- `npm run e2e:feed` - 運行配對功能測試
- `npm run e2e:chat` - 運行聊天功能測試
- `npm run e2e:visual` - 運行視覺回歸測試

### 實用工具

- `npm run e2e:report` - 查看最新的測試報告
- `npm run e2e:codegen` - 啟動 Playwright 代碼生成器
- `npm run test:all` - 運行所有測試（Jest + Playwright）

## 測試配置

測試配置在 `playwright.config.ts` 中定義，包括：

- **多瀏覽器支援**：Chrome、Firefox、Safari、Edge
- **移動端測試**：iPhone、Android 設備模擬
- **並行執行**：提高測試速度
- **重試機制**：失敗時自動重試
- **截圖和錄影**：失敗時自動捕獲
- **測試報告**：HTML、JSON、JUnit 格式

## 頁面對象模式 (POM)

我們使用頁面對象模式來組織測試代碼：

### BasePage
所有頁面的基類，包含共用功能：
- 導航方法
- 元素等待
- 錯誤處理
- 截圖比較

### LoginPage
登入頁面的頁面對象：
```typescript
const loginPage = new LoginPage(page, baseURL);
await loginPage.navigateToLogin();
await loginPage.login('test@example.com', 'password');
```

### FeedPage
配對頁面的頁面對象：
```typescript
const feedPage = new FeedPage(page, baseURL);
await feedPage.navigateToFeed();
await feedPage.swipeRight(); // 喜歡
```

### ChatPage
聊天頁面的頁面對象：
```typescript
const chatPage = new ChatPage(page, baseURL);
await chatPage.navigateToChat('chat-id');
await chatPage.sendMessage('Hello!');
```

## API 模擬

使用 `APIMocks` 類來模擬後端 API 響應：

```typescript
const apiMocks = new APIMocks(page);
await apiMocks.setupAllMocks(); // 設置所有基本模擬
await apiMocks.mockNetworkError('**/feed'); // 模擬網路錯誤
await apiMocks.mockSlowNetwork('**/messages', 3000); // 模擬慢網路
```

## 測試數據管理

### 測試用戶
預定義的測試用戶在 `fixtures/test-data.ts` 中：

```typescript
import { TEST_USERS, TEST_CREDENTIALS } from '../fixtures/test-data';

// 使用預定義用戶
await loginPage.login(TEST_CREDENTIALS.valid.email, TEST_CREDENTIALS.valid.password);

// 或建立隨機用戶
const randomUser = TestDataFactory.createUser({
  name: 'Custom Test User'
});
```

### 測試對話和消息
```typescript
import { TEST_CONVERSATIONS, TEST_MESSAGES } from '../fixtures/test-data';

// 使用預定義對話數據
const conversation = TEST_CONVERSATIONS[0];
await chatPage.navigateToChat(conversation.id);
```

## 視覺測試

視覺回歸測試確保 UI 沒有意外變化：

```typescript
// 截圖比較
await expect(page).toHaveScreenshot('login-page.png');

// 帶遮罩的截圖（隱藏動態內容）
await expect(page).toHaveScreenshot('feed-page.png', {
  mask: [page.locator('[data-testid="profile-image"]')]
});
```

## 最佳實踐

### 1. 選擇器策略
優先使用 `data-testid` 屬性：
```html
<button data-testid="login-button">Login</button>
```

```typescript
await page.click('[data-testid="login-button"]');
```

### 2. 等待策略
使用適當的等待方法：
```typescript
// 等待元素出現
await page.waitForSelector('[data-testid="profile-card"]');

// 等待網路請求完成
await page.waitForLoadState('networkidle');

// 等待特定條件
await page.waitForFunction(() => window.location.pathname === '/feed');
```

### 3. 錯誤處理
始終包含錯誤處理：
```typescript
try {
  await page.click('[data-testid="button"]');
} catch (error) {
  await page.screenshot({ path: 'error-state.png' });
  throw error;
}
```

### 4. 數據清理
在測試後清理數據：
```typescript
test.afterEach(async () => {
  await TestDataCleaner.cleanUserData(userId);
});
```

## 調試技巧

### 1. 查看瀏覽器
使用 headed 模式查看測試執行：
```bash
npm run e2e:headed
```

### 2. 調試特定測試
```bash
npx playwright test auth.spec.ts --debug
```

### 3. 截圖和錄影
失敗時自動截圖，或手動截圖：
```typescript
await page.screenshot({ path: 'debug.png' });
```

### 4. 控制台日志
檢查瀏覽器控制台：
```typescript
page.on('console', msg => console.log(msg.text()));
```

### 5. 網路請求
監控網路請求：
```typescript
page.on('request', request => console.log(request.url()));
page.on('response', response => console.log(response.status()));
```

## CI/CD 集成

### GitHub Actions 範例

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run e2e:install
      - run: npm run e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: e2e/reports/
```

## 故障排除

### 1. 瀏覽器安裝問題
```bash
npm run e2e:install-deps
npm run e2e:install
```

### 2. 權限問題
確保有足夠權限寫入測試結果目錄。

### 3. 網路問題
檢查是否可以訪問 `localhost:8083`。

### 4. 時區問題
確保測試環境和CI環境時區一致。

### 5. 截圖差異
調整 `threshold` 值或使用 `mask` 隱藏動態內容。

## 擴展測試

### 添加新頁面對象
1. 在 `pages/` 目錄建立新的頁面類
2. 繼承 `BasePage`
3. 實現 `isPageLoaded()` 方法
4. 添加頁面特定的方法

### 添加新測試
1. 在 `tests/` 目錄建立新的 `.spec.ts` 文件
2. 導入需要的頁面對象
3. 編寫測試用例
4. 運行測試驗證

### 添加 API 模擬
1. 在 `APIMocks` 類中添加新方法
2. 定義模擬響應數據
3. 在測試中使用模擬

## 聯繫支援

如果遇到問題或需要添加新功能，請：
1. 檢查現有的測試案例是否有類似實現
2. 查看 Playwright 官方文檔
3. 提交 issue 或 PR

## 相關連結

- [Playwright 官方文檔](https://playwright.dev/)
- [頁面對象模式指南](https://playwright.dev/docs/pom)
- [視覺測試指南](https://playwright.dev/docs/test-snapshots)