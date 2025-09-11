/**
 * Enhanced Login Flow E2E Tests
 * 增強的登入流程端對端測試
 */

import { test, expect } from '@playwright/test';

test.describe('Enhanced Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should complete full login flow and navigate to feed', async ({ page }) => {
    console.log('🚀 Starting enhanced login flow test...');
    
    // Navigate to login page
    await page.goto('http://localhost:8083/login');
    console.log('📄 Login page loaded');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Fill credentials
    await page.fill('input[placeholder="Email"]', 'test@example.com');
    await page.fill('input[placeholder="Password"]', 'testpassword123');
    console.log('✏️ Credentials filled');
    
    // Click login and wait for response
    const loginPromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.status() === 200
    );
    
    await page.click('text=Login');
    console.log('🔘 Login button clicked');
    
    // Wait for successful API response
    const response = await loginPromise;
    const responseData = await response.json();
    console.log('✅ Login API successful:', responseData.message);
    
    // Wait for navigation to feed page
    await page.waitForURL('**/feed', { timeout: 10000 });
    console.log('🎉 Successfully navigated to feed page!');
    
    // Verify we're on the feed page
    expect(page.url()).toContain('/feed');
    
    // Verify auth state is persisted
    const authStorage = await page.evaluate(() => {
      return localStorage.getItem('auth-storage');
    });
    expect(authStorage).toBeTruthy();
    console.log('💾 Auth state persisted');
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'e2e/reports/enhanced-login-success.png', 
      fullPage: true 
    });
  });

  test('should show proper error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:8083/login');
    await page.waitForLoadState('networkidle');
    
    // Fill invalid credentials
    await page.fill('input[placeholder="Email"]', 'invalid@example.com');
    await page.fill('input[placeholder="Password"]', 'wrongpassword');
    
    // Click login
    await page.click('text=Login');
    
    // Wait for error message
    await page.waitForSelector('text=Invalid credentials', { timeout: 5000 });
    
    // Verify still on login page
    expect(page.url()).toContain('/login');
    
    // Verify no auth state
    const authStorage = await page.evaluate(() => {
      return localStorage.getItem('auth-storage');
    });
    expect(authStorage).toBeFalsy();
  });
});