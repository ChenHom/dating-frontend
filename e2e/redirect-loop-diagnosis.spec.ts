/**
 * 無限重定向循環診斷測試
 * 測試用於分析 "Redirecting to login..." 無限載入問題
 */

import { test, expect } from '@playwright/test';

test.describe('無限重定向循環診斷', () => {
  test('分析根頁面重定向行為', async ({ page }) => {
    console.log('🔍 開始診斷無限重定向問題...');

    // 監聽控制台訊息
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(text);
      console.log(`📝 Console: ${text}`);
    });

    // 訪問根頁面
    console.log('🌐 訪問根頁面: http://localhost:8083');
    await page.goto('http://localhost:8083');

    // 等待一段時間觀察行為
    await page.waitForTimeout(3000);

    // 檢查當前 URL
    const currentUrl = page.url();
    console.log(`📍 當前 URL: ${currentUrl}`);

    // 檢查頁面內容
    const bodyText = await page.textContent('body');
    console.log(`📄 頁面內容: ${bodyText?.substring(0, 200)}...`);

    // 檢查是否有重定向相關的訊息
    const hasRedirectingText = await page.locator('text=Redirecting').isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`🔄 是否顯示重定向訊息: ${hasRedirectingText}`);

    // 檢查是否有 loading 指示器
    const hasLoadingIndicator = await page.locator('[testID="auth-loading"], [testID="auth-redirect"], [testID="app-loading"]').isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`⏳ 是否顯示載入指示器: ${hasLoadingIndicator}`);

    // 分析控制台訊息中的路由邏輯
    const navigationMessages = consoleMessages.filter(msg => 
      msg.includes('navigation') || 
      msg.includes('Redirecting') || 
      msg.includes('ProtectedRoute') ||
      msg.includes('Index')
    );
    
    console.log('🧭 導航相關訊息:');
    navigationMessages.forEach(msg => console.log(`  - ${msg}`));

    // 等待更長時間看是否有進一步的重定向
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    console.log(`🎯 最終 URL: ${finalUrl}`);

    // 檢查是否成功導向登入頁面
    const isOnLoginPage = finalUrl.includes('/login');
    console.log(`🔐 是否在登入頁面: ${isOnLoginPage}`);

    if (!isOnLoginPage) {
      console.log('❌ 問題確認：未能成功導向登入頁面');
    }

    // 如果在登入頁面，檢查是否有登入表單
    if (isOnLoginPage) {
      const hasLoginForm = await page.locator('input[type="email"], input[placeholder*="email" i], [data-testid="email-input"]').isVisible({ timeout: 2000 }).catch(() => false);
      const hasPasswordInput = await page.locator('input[type="password"], input[placeholder*="password" i], [data-testid="password-input"]').isVisible({ timeout: 2000 }).catch(() => false);
      
      console.log(`📝 是否有登入表單: ${hasLoginForm && hasPasswordInput}`);
      
      if (!hasLoginForm || !hasPasswordInput) {
        console.log('❌ 問題確認：在登入頁面但沒有正確的登入表單');
      }
    }
  });

  test('測試直接訪問登入頁面', async ({ page }) => {
    console.log('🔍 測試直接訪問登入頁面...');

    // 監聽控制台訊息
    page.on('console', (msg) => {
      console.log(`📝 Console: ${msg.text()}`);
    });

    // 直接訪問登入頁面
    console.log('🌐 直接訪問: http://localhost:8083/login');
    await page.goto('http://localhost:8083/login');

    // 等待頁面載入
    await page.waitForTimeout(2000);

    // 檢查當前 URL
    const currentUrl = page.url();
    console.log(`📍 當前 URL: ${currentUrl}`);

    // 檢查是否停留在登入頁面
    const stayOnLogin = currentUrl.includes('/login');
    console.log(`🔒 是否停留在登入頁面: ${stayOnLogin}`);

    // 檢查頁面內容
    const hasRedirectingText = await page.locator('text=Redirecting').isVisible({ timeout: 1000 }).catch(() => false);
    const hasLoginForm = await page.locator('input[type="email"], input[placeholder*="email" i]').isVisible({ timeout: 2000 }).catch(() => false);

    console.log(`🔄 是否顯示重定向訊息: ${hasRedirectingText}`);
    console.log(`📝 是否有登入表單: ${hasLoginForm}`);

    if (hasRedirectingText && !hasLoginForm) {
      console.log('❌ 問題確認：直接訪問登入頁面也陷入重定向循環');
    }
  });
});