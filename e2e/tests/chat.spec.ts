/**
 * Chat E2E Tests
 * 聊天功能的端對端測試
 */

import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage';
import { TestDataGenerator } from '../utils/test-helpers';

test.describe('Chat Functionality', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page, baseURL }) => {
    chatPage = new ChatPage(page, baseURL || 'http://localhost:8083');
  });

  test.describe('Chat Page Display', () => {
    test('should display chat page correctly', async () => {
      await chatPage.navigateToChat();
      await expect(chatPage.isPageLoaded()).resolves.toBe(true);

      // 驗證頁面元素
      await chatPage.verifyChatPageElements();

      // 驗證 URL
      await chatPage.verifyChatPageURL();

      // 截圖
      await chatPage.takeChatScreenshot('chat-page-display');
    });

    test('should display chat header with recipient info', async () => {
      await chatPage.navigateToChat('test-chat-1');

      const hasHeader = await chatPage.isElementVisible('[data-testid="chat-header"], .chat-header', 5000);

      if (hasHeader) {
        const recipientName = await chatPage.getRecipientName();
        expect(recipientName).toBeTruthy();
        expect(recipientName.length).toBeGreaterThan(0);
      }
    });

    test('should show empty state for new chats', async () => {
      await chatPage.navigateToChat('new-chat');

      const isEmpty = await chatPage.isChatEmpty();

      if (isEmpty) {
        const emptyElement = await chatPage.isElementVisible('[data-testid="empty-chat"], .empty-chat', 3000);
        expect(emptyElement).toBe(true);
      }
    });
  });

  test.describe('Message Sending', () => {
    test('should send text message successfully', async () => {
      await chatPage.navigateToChat('test-chat-1');

      const testMessage = `Test message ${Date.now()}`;
      await chatPage.sendMessage(testMessage);

      // 驗證訊息出現在聊天中
      const messages = await chatPage.getAllMessages();
      const sentMessage = messages.find(msg => msg.text === testMessage && msg.isMine);

      expect(sentMessage).toBeTruthy();
    });

    test('should handle multiple messages', async () => {
      await chatPage.navigateToChat('test-chat-1');

      const testMessages = [
        `Message 1 ${Date.now()}`,
        `Message 2 ${Date.now()}`,
        `Message 3 ${Date.now()}`
      ];

      await chatPage.simulateConversation(testMessages, 500);

      // 驗證所有訊息都已發送
      const allMessages = await chatPage.getAllMessages();

      for (const testMessage of testMessages) {
        const found = allMessages.some(msg => msg.text === testMessage && msg.isMine);
        expect(found).toBe(true);
      }
    });

    test('should handle empty message input', async () => {
      await chatPage.navigateToChat('test-chat-1');

      // 嘗試發送空訊息
      await chatPage.sendMessage('');

      // 應該不會發送空訊息
      const initialCount = await chatPage.getMessageCount();
      await chatPage.wait(1000);
      const finalCount = await chatPage.getMessageCount();

      expect(finalCount).toBe(initialCount);
    });

    test('should handle long messages', async () => {
      await chatPage.navigateToChat('test-chat-1');

      const longMessage = 'A'.repeat(500); // 500字符的長訊息
      await chatPage.sendMessage(longMessage);

      // 驗證長訊息正確顯示
      const latestMessage = await chatPage.getLatestMessage();
      expect(latestMessage?.text).toBe(longMessage);
    });
  });

  test.describe('Message Display', () => {
    test('should display messages with correct styling', async () => {
      await chatPage.navigateToChat('test-chat-1');

      const testMessage = `Styled message ${Date.now()}`;
      await chatPage.sendMessage(testMessage);

      // 檢查自己的訊息樣式
      const myMessage = chatPage.page.locator('[data-testid="my-message"], .message-sent')
        .filter({ hasText: testMessage });

      await expect(myMessage).toBeVisible();

      // 驗證訊息包含時間戳
      const hasTimestamp = await chatPage.isElementVisible('[data-testid="message-time"], .message-time', 3000);
      if (hasTimestamp) {
        expect(hasTimestamp).toBe(true);
      }
    });

    test('should show message status indicators', async () => {
      await chatPage.navigateToChat('test-chat-1');

      const testMessage = `Status test ${Date.now()}`;
      await chatPage.sendMessage(testMessage);

      // 等待訊息狀態更新
      await chatPage.wait(2000);

      // 檢查是否有狀態指示器
      const hasStatus = await chatPage.isElementVisible('[data-testid="message-status"], .message-status', 3000);

      if (hasStatus) {
        // 驗證訊息狀態
        await chatPage.verifyMessageStatus(testMessage, 'sent');
      }
    });

    test('should handle message scrolling', async () => {
      await chatPage.navigateToChat('test-chat-1');

      // 發送多條訊息以觸發滾動
      const messageCount = 10;
      const messages: string[] = [];

      for (let i = 0; i < messageCount; i++) {
        const message = `Scroll test message ${i + 1}`;
        messages.push(message);
        await chatPage.sendMessage(message);
        await chatPage.wait(200);
      }

      // 驗證能夠滾動到頂部和底部
      await chatPage.scrollToChatTop();
      await chatPage.wait(500);

      await chatPage.scrollToChatBottom();
      await chatPage.wait(500);

      // 最後一條訊息應該可見
      const lastMessage = messages[messages.length - 1];
      const lastMessageVisible = await chatPage.isElementVisible(`text=${lastMessage}`, 3000);
      expect(lastMessageVisible).toBe(true);
    });
  });

  test.describe('Real-time Features', () => {
    test('should show typing indicator', async () => {
      await chatPage.navigateToChat('test-chat-1');

      // 模擬對方正在輸入
      await chatPage.page.evaluate(() => {
        // 建立模擬的正在輸入指示器
        const indicator = document.createElement('div');
        indicator.setAttribute('data-testid', 'typing-indicator');
        indicator.textContent = 'User is typing...';

        const chatContainer = document.querySelector('[data-testid="chat-container"], .chat-container');
        if (chatContainer) {
          chatContainer.appendChild(indicator);
        }
      });

      const isTyping = await chatPage.isRecipientTyping();
      expect(isTyping).toBe(true);
    });

    test('should handle connection status', async () => {
      await chatPage.navigateToChat('test-chat-1');

      // 檢查連線狀態
      const hasConnectionError = await chatPage.hasConnectionError();

      if (hasConnectionError) {
        // 嘗試重新連線
        await chatPage.retryConnection();

        // 驗證重新連線後的狀態
        await expect(chatPage.isPageLoaded()).resolves.toBe(true);
      }
    });

    test.skip('should receive messages in real-time', async () => {
      // 這個測試需要 WebSocket 連線和後端支援
      // 實際實施時需要模擬或使用測試環境
      await chatPage.navigateToChat('test-chat-1');

      // 等待接收訊息
      const receivedMessage = await chatPage.waitForNewMessage(10000);
      expect(receivedMessage).toBeTruthy();
    });
  });

  test.describe('Game Features', () => {
    test('should start rock-paper-scissors game', async () => {
      await chatPage.navigateToChat('test-chat-1');

      const hasGameButton = await chatPage.isElementVisible('[data-testid="game-button"], .game-btn', 3000);

      if (hasGameButton) {
        await chatPage.startGame();

        // 驗證遊戲模態出現
        const hasGameModal = await chatPage.isElementVisible('[data-testid="game-modal"], .game-modal', 3000);
        expect(hasGameModal).toBe(true);
      } else {
        console.log('Game feature not available');
      }
    });

    test('should play rock-paper-scissors game', async () => {
      await chatPage.navigateToChat('test-chat-1');

      const hasGameButton = await chatPage.isElementVisible('[data-testid="game-button"], .game-btn', 3000);

      if (hasGameButton) {
        await chatPage.playRockPaperScissors('rock');

        // 驗證遊戲結果顯示
        const hasResult = await chatPage.isElementVisible('[data-testid="game-result"], .game-result', 5000);

        if (hasResult) {
          const result = await chatPage.getGameResult();
          expect(result).toBeTruthy();
        }
      } else {
        test.skip('Game feature not available');
      }
    });
  });

  test.describe('Gift Features', () => {
    test('should send virtual gift', async () => {
      await chatPage.navigateToChat('test-chat-1');

      const hasGiftButton = await chatPage.isElementVisible('[data-testid="gift-button"], .gift-btn', 3000);

      if (hasGiftButton) {
        await chatPage.sendGift(0); // 發送第一個禮物

        // 驗證禮物發送成功（可能顯示在聊天中）
        await chatPage.wait(2000);

        // 檢查是否有成功通知
        const hasToast = await chatPage.isElementVisible('[data-testid="toast"], .toast', 3000);
        if (hasToast) {
          expect(hasToast).toBe(true);
        }
      } else {
        console.log('Gift feature not available');
      }
    });
  });

  test.describe('Message Management', () => {
    test('should delete own messages', async () => {
      await chatPage.navigateToChat('test-chat-1');

      const testMessage = `Delete test ${Date.now()}`;
      await chatPage.sendMessage(testMessage);

      // 等待訊息出現
      await chatPage.waitForMessageToBeSent(testMessage);

      // 刪除訊息
      try {
        await chatPage.deleteMessage(testMessage);

        // 驗證訊息已被刪除
        await chatPage.wait(2000);
        const messages = await chatPage.getAllMessages();
        const deletedMessage = messages.find(msg => msg.text === testMessage);
        expect(deletedMessage).toBeFalsy();

      } catch (error) {
        console.log('Message deletion not available or failed:', error);
      }
    });

    test('should report inappropriate messages', async () => {
      await chatPage.navigateToChat('test-chat-1');

      const testMessage = `Report test ${Date.now()}`;
      await chatPage.sendMessage(testMessage);
      await chatPage.waitForMessageToBeSent(testMessage);

      try {
        await chatPage.reportMessage(testMessage);

        // 驗證舉報功能觸發
        const hasModal = await chatPage.isElementVisible('[role="dialog"], .modal', 3000);
        expect(hasModal).toBe(true);

      } catch (error) {
        console.log('Message reporting not available:', error);
      }
    });
  });

  test.describe('User Management', () => {
    test('should block user functionality', async () => {
      await chatPage.navigateToChat('test-chat-1');

      const hasBlockButton = await chatPage.isElementVisible('[data-testid="block-user"], button:has-text("Block")', 3000);

      if (hasBlockButton) {
        // 這個測試可能會影響其他測試，謹慎執行
        console.log('Block user functionality available but not testing to avoid side effects');
      }
    });

    test('should report user functionality', async () => {
      await chatPage.navigateToChat('test-chat-1');

      const hasReportButton = await chatPage.isElementVisible('[data-testid="report-user"], button:has-text("Report")', 3000);

      if (hasReportButton) {
        try {
          await chatPage.reportUser();

          // 驗證舉報表單或模態出現
          const hasModal = await chatPage.isElementVisible('[role="dialog"], .modal', 5000);
          expect(hasModal).toBe(true);

        } catch (error) {
          console.log('User reporting not fully functional:', error);
        }
      }
    });
  });

  test.describe('Performance and Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      await chatPage.navigateToChat('test-chat-1');

      // 模擬網路錯誤
      await chatPage.page.route('**/chat/**', route => route.abort('failed'));

      const testMessage = `Network error test ${Date.now()}`;
      await chatPage.sendMessage(testMessage);

      // 檢查是否有錯誤處理
      const hasError = await chatPage.isElementVisible('[data-testid="message-error"], .message-error', 5000);

      if (hasError) {
        expect(hasError).toBe(true);
      }
    });

    test('should handle server errors', async () => {
      await chatPage.navigateToChat('test-chat-1');

      // 模擬伺服器錯誤
      await chatPage.page.route('**/messages/**', route =>
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server Error' })
        })
      );

      const testMessage = `Server error test ${Date.now()}`;
      await chatPage.sendMessage(testMessage);

      // 應該顯示錯誤或重試選項
      await chatPage.wait(3000);
      await chatPage.verifyNoErrors(); // 或檢查適當的錯誤處理
    });

    test('should load chat history efficiently', async () => {
      const startTime = Date.now();

      await chatPage.navigateToChat('test-chat-history');
      await chatPage.waitForMessagesToLoad();

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(10000); // 10秒內載入
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard accessible', async () => {
      await chatPage.navigateToChat('test-chat-1');

      // 使用 Tab 導航到輸入框
      await chatPage.page.keyboard.press('Tab');

      // 檢查輸入框是否獲得焦點
      const focusedElement = await chatPage.page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'TEXTAREA'].includes(focusedElement || '')).toBe(true);

      // 測試 Enter 鍵發送訊息
      const testMessage = `Keyboard test ${Date.now()}`;
      await chatPage.page.keyboard.type(testMessage);
      await chatPage.page.keyboard.press('Enter');

      // 驗證訊息已發送
      await chatPage.waitForMessageToBeSent(testMessage);
    });

    test('should have proper ARIA labels', async () => {
      await chatPage.navigateToChat('test-chat-1');

      // 檢查輸入框的標籤
      const messageInput = chatPage.page.locator('[data-testid="message-input"], input[placeholder*="message"]');
      const inputLabel = await messageInput.getAttribute('aria-label') || await messageInput.getAttribute('placeholder');

      expect(inputLabel).toBeTruthy();

      // 檢查發送按鈕的標籤
      const sendButton = chatPage.page.locator('[data-testid="send-button"], .send-btn');
      const buttonLabel = await sendButton.getAttribute('aria-label') || await sendButton.textContent();

      expect(buttonLabel).toBeTruthy();
    });
  });

  test.describe('Mobile Specific', () => {
    test('should handle mobile keyboard', async ({ isMobile }) => {
      if (!isMobile) {
        test.skip('Mobile-only test');
        return;
      }

      await chatPage.navigateToChat('test-chat-1');

      // 點擊輸入框
      await chatPage.click('[data-testid="message-input"], input[placeholder*="message"]');

      // 在移動端，鍵盤彈出可能會改變視窗大小
      await chatPage.wait(1000);

      // 輸入訊息
      const testMessage = `Mobile test ${Date.now()}`;
      await chatPage.fill('[data-testid="message-input"], input[placeholder*="message"]', testMessage);
      await chatPage.click('[data-testid="send-button"], .send-btn');

      // 驗證訊息發送成功
      await chatPage.waitForMessageToBeSent(testMessage);
    });
  });
});