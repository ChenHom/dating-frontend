/**
 * Cleanup Teardown Test
 * 清理測試環境和數據
 */

import { test as teardown } from '@playwright/test';
import { TestDataCleaner } from '../fixtures/test-data';
import path from 'path';
import fs from 'fs';

teardown('cleanup test data', async () => {
  console.log('🧹 Starting test cleanup...');
  
  try {
    // 清理認證狀態文件
    const authFile = path.join(__dirname, '../fixtures/auth.json');
    if (fs.existsSync(authFile)) {
      // fs.unlinkSync(authFile); // 取消註釋以刪除認證文件
      console.log('🔐 Authentication file preserved for debugging');
    }
    
    // 清理測試數據
    await TestDataCleaner.cleanAllTestData();
    
    // 清理臨時文件
    await cleanupTempFiles();
    
    // 清理測試報告中的舊檔案
    await cleanupOldReports();
    
    console.log('✅ Test cleanup completed successfully');
    
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
});

/**
 * 清理臨時文件
 */
async function cleanupTempFiles(): Promise<void> {
  try {
    const tempDirs = [
      path.join(__dirname, '../test-results'),
      path.join(__dirname, '../reports/screenshots'),
      path.join(__dirname, '../reports/videos')
    ];

    for (const tempDir of tempDirs) {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        
        // 只清理超過 7 天的文件
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime.getTime() < sevenDaysAgo) {
            try {
              if (stats.isDirectory()) {
                fs.rmSync(filePath, { recursive: true, force: true });
              } else {
                fs.unlinkSync(filePath);
              }
              console.log(`🗑️  Cleaned old file: ${file}`);
            } catch (error) {
              console.warn(`⚠️  Could not delete ${file}:`, error);
            }
          }
        }
      }
    }
    
    console.log('🧽 Temporary files cleanup completed');
    
  } catch (error) {
    console.warn('⚠️  Temporary files cleanup failed:', error);
  }
}

/**
 * 清理舊的測試報告
 */
async function cleanupOldReports(): Promise<void> {
  try {
    const reportsDir = path.join(__dirname, '../reports');
    
    if (!fs.existsSync(reportsDir)) {
      return;
    }
    
    const items = fs.readdirSync(reportsDir);
    
    // 查找 HTML 報告目錄
    const htmlReportDirs = items
      .map(item => ({
        name: item,
        path: path.join(reportsDir, item),
        stat: fs.statSync(path.join(reportsDir, item))
      }))
      .filter(item => item.stat.isDirectory() && item.name.includes('html-report'))
      .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime()); // 按修改時間降序

    // 保留最近的 5 個報告
    const keepCount = 5;
    if (htmlReportDirs.length > keepCount) {
      const toDelete = htmlReportDirs.slice(keepCount);
      
      for (const dir of toDelete) {
        try {
          fs.rmSync(dir.path, { recursive: true, force: true });
          console.log(`🗑️  Cleaned old report: ${dir.name}`);
        } catch (error) {
          console.warn(`⚠️  Could not delete report ${dir.name}:`, error);
        }
      }
    }
    
    // 清理舊的 JSON 和 XML 報告
    const reportFiles = items
      .filter(item => {
        const stat = fs.statSync(path.join(reportsDir, item));
        return stat.isFile() && (item.endsWith('.json') || item.endsWith('.xml'));
      })
      .map(item => ({
        name: item,
        path: path.join(reportsDir, item),
        stat: fs.statSync(path.join(reportsDir, item))
      }))
      .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

    // 保留最近的 10 個檔案
    const keepFileCount = 10;
    if (reportFiles.length > keepFileCount) {
      const filesToDelete = reportFiles.slice(keepFileCount);
      
      for (const file of filesToDelete) {
        try {
          fs.unlinkSync(file.path);
          console.log(`🗑️  Cleaned old report file: ${file.name}`);
        } catch (error) {
          console.warn(`⚠️  Could not delete report file ${file.name}:`, error);
        }
      }
    }
    
    console.log('📊 Old reports cleanup completed');
    
  } catch (error) {
    console.warn('⚠️  Reports cleanup failed:', error);
  }
}

/**
 * 清理 Playwright 生成的追蹤檔案
 */
async function cleanupTraceFiles(): Promise<void> {
  try {
    const testResultsDir = path.join(__dirname, '../test-results');
    
    if (!fs.existsSync(testResultsDir)) {
      return;
    }
    
    const items = fs.readdirSync(testResultsDir);
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    
    for (const item of items) {
      const itemPath = path.join(testResultsDir, item);
      const stats = fs.statSync(itemPath);
      
      // 清理超過 3 天的追蹤檔案
      if (stats.isDirectory() && stats.mtime.getTime() < threeDaysAgo) {
        const files = fs.readdirSync(itemPath);
        
        for (const file of files) {
          if (file.endsWith('.zip') || file.endsWith('.webm')) {
            const filePath = path.join(itemPath, file);
            try {
              fs.unlinkSync(filePath);
              console.log(`🗑️  Cleaned trace file: ${file}`);
            } catch (error) {
              console.warn(`⚠️  Could not delete trace file ${file}:`, error);
            }
          }
        }
      }
    }
    
    console.log('🔍 Trace files cleanup completed');
    
  } catch (error) {
    console.warn('⚠️  Trace files cleanup failed:', error);
  }
}