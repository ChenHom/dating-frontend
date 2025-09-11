/**
 * Global Teardown for Playwright Tests
 * 在所有測試結束後執行的清理工作
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');

  try {
    // 清理臨時認證文件
    const authFile = path.resolve(__dirname, '../fixtures/auth.json');
    if (fs.existsSync(authFile)) {
      // fs.unlinkSync(authFile);  // 保留認證文件供調試使用
      console.log('🔐 Authentication file preserved for debugging');
    }

    // 清理舊的測試結果（保留最近的10個）
    const testResultsDir = path.resolve(__dirname, '../test-results');
    if (fs.existsSync(testResultsDir)) {
      await cleanOldTestResults(testResultsDir);
    }

    // 打印測試報告位置
    const reportsDir = path.resolve(__dirname, '../reports');
    if (fs.existsSync(reportsDir)) {
      console.log(`📊 Test reports available at: ${reportsDir}`);
      
      // 列出可用的報告
      const reports = fs.readdirSync(reportsDir);
      if (reports.length > 0) {
        console.log('Available reports:');
        reports.forEach(report => {
          console.log(`  - ${report}`);
        });
      }
    }

    console.log('✅ Global teardown completed successfully!');

  } catch (error) {
    console.error('❌ Error during global teardown:', error);
  }
}

/**
 * 清理舊的測試結果，只保留最近的幾個
 */
async function cleanOldTestResults(testResultsDir: string, keepLast = 10) {
  try {
    const items = fs.readdirSync(testResultsDir);
    
    // 過濾出目錄（測試運行結果）
    const resultDirs = items
      .map(item => ({
        name: item,
        path: path.join(testResultsDir, item),
        stat: fs.statSync(path.join(testResultsDir, item))
      }))
      .filter(item => item.stat.isDirectory())
      .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime()); // 按修改時間降序排列

    // 刪除舊的結果目錄
    if (resultDirs.length > keepLast) {
      const toDelete = resultDirs.slice(keepLast);
      
      for (const dir of toDelete) {
        try {
          fs.rmSync(dir.path, { recursive: true, force: true });
          console.log(`🗑️  Cleaned old test result: ${dir.name}`);
        } catch (error) {
          console.warn(`⚠️  Could not delete ${dir.name}:`, error);
        }
      }
    }

    console.log(`📁 Kept ${Math.min(resultDirs.length, keepLast)} recent test result directories`);

  } catch (error) {
    console.warn('⚠️  Could not clean old test results:', error);
  }
}

export default globalTeardown;