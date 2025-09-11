/**
 * Chat Page Object
 * 聊天頁面的頁面對象模式實現
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ChatPage extends BasePage {
  // 頁面特有選擇器
  private readonly pageSelectors = {
    // 聊天容器
    chatContainer: '[data-testid="chat-container"], .chat-container',
    messagesList: '[data-testid="messages-list"], .messages-list, .chat-messages',
    
    // 聊天標題和用戶資訊
    chatHeader: '[data-testid="chat-header"], .chat-header',
    recipientName: '[data-testid="recipient-name"], .recipient-name, h1',
    recipientAvatar: '[data-testid="recipient-avatar"], .recipient-avatar, img[alt*="avatar"]',
    onlineStatus: '[data-testid="online-status"], .online-status',
    
    // 訊息元素
    message: '[data-testid="message"], .message',
    myMessage: '[data-testid="my-message"], .message.sent, .message-sent',
    theirMessage: '[data-testid="their-message"], .message.received, .message-received',
    messageText: '[data-testid="message-text"], .message-text, .message-content',
    messageTime: '[data-testid="message-time"], .message-time, .timestamp',
    messageStatus: '[data-testid="message-status"], .message-status',
    
    // 輸入區域
    messageInput: '[data-testid="message-input"], input[placeholder*="message"], textarea[placeholder*="message"]',
    sendButton: '[data-testid="send-button"], button[type="submit"], button:has-text("Send"), .send-btn',
    
    // 附件和多媒體
    attachButton: '[data-testid="attach-button"], button:has-text("Attach"), .attach-btn',
    photoButton: '[data-testid="photo-button"], button:has-text("Photo"), .photo-btn',
    emojiButton: '[data-testid="emoji-button"], button:has-text("😊"), .emoji-btn',
    
    // 遊戲功能
    gameButton: '[data-testid="game-button"], button:has-text("Game"), .game-btn',
    gameModal: '[data-testid="game-modal"], .game-modal, [role="dialog"]:has(text*="game")',
    rockButton: '[data-testid="rock-button"], button:has-text("Rock"), button:has-text("✂️")',
    paperButton: '[data-testid="paper-button"], button:has-text("Paper"), button:has-text("📄")',
    scissorsButton: '[data-testid="scissors-button"], button:has-text("Scissors"), button:has-text("✂️")',
    gameResult: '[data-testid="game-result"], .game-result',
    
    // 虛擬禮物
    giftButton: '[data-testid="gift-button"], button:has-text("Gift"), .gift-btn',
    giftModal: '[data-testid="gift-modal"], .gift-modal',
    giftItem: '[data-testid="gift-item"], .gift-item',
    
    // 載入狀態
    loadingMessages: '[data-testid="loading-messages"], .loading-messages',
    typingIndicator: '[data-testid="typing-indicator"], .typing-indicator',
    
    // 空狀態
    emptyChat: '[data-testid="empty-chat"], .empty-chat, text=No messages yet',
    startConversation: '[data-testid="start-conversation"], .start-conversation',
    
    // 錯誤狀態
    messageError: '[data-testid="message-error"], .message-error',
    connectionError: '[data-testid="connection-error"], .connection-error',
    
    // 聊天操作
    messageOptions: '[data-testid="message-options"], .message-options',
    deleteMessage: '[data-testid="delete-message"], button:has-text("Delete")',
    reportMessage: '[data-testid="report-message"], button:has-text("Report")',
    
    // 導航
    backButton: '[data-testid="back-button"], button:has-text("Back"), .back-btn',
    chatListButton: '[data-testid="chat-list-button"], button:has-text("Chats")',
    
    // 用戶操作
    blockUserButton: '[data-testid="block-user"], button:has-text("Block")',
    reportUserButton: '[data-testid="report-user"], button:has-text("Report")',
    
    // 通知
    newMessageNotification: '[data-testid="new-message"], .new-message-notification'
  };

  constructor(page: Page, baseURL: string) {
    super(page, baseURL);
  }

  /**
   * 導航到特定聊天
   */
  async navigateToChat(chatId?: string): Promise<void> {
    const path = chatId ? `/chat/${chatId}` : '/chat';
    await this.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * 檢查頁面是否已載入
   */
  async isPageLoaded(): Promise<boolean> {
    try {
      await this.waitForElement(this.pageSelectors.chatContainer, { timeout: 10000 });
      
      // 檢查是否有聊天標題或空狀態
      const hasHeader = await this.isElementVisible(this.pageSelectors.chatHeader, 3000);
      const isEmpty = await this.isElementVisible(this.pageSelectors.emptyChat, 2000);
      
      return hasHeader || isEmpty;
    } catch {
      return false;
    }
  }

  /**
   * 發送訊息
   */
  async sendMessage(message: string): Promise<void> {
    await this.fill(this.pageSelectors.messageInput, message);
    await this.click(this.pageSelectors.sendButton);
    
    // 等待訊息出現在聊天中
    await this.waitForMessageToBeSent(message);
  }

  /**
   * 等待訊息發送完成
   */
  async waitForMessageToBeSent(message: string, timeout = 10000): Promise<void> {
    const messageLocator = this.page.locator(this.pageSelectors.myMessage)
      .filter({ hasText: message });
    
    await expect(messageLocator).toBeVisible({ timeout });
  }

  /**
   * 獲取所有訊息
   */
  async getAllMessages(): Promise<Array<{ text: string; isMine: boolean; time?: string }>> {
    const messages = await this.page.locator(this.pageSelectors.message).all();
    const messageData = [];

    for (const message of messages) {
      const text = await message.locator(this.pageSelectors.messageText).textContent() || '';
      const time = await message.locator(this.pageSelectors.messageTime).textContent().catch(() => undefined);
      
      // 判斷是否為自己的訊息
      const isMine = await message.locator(this.pageSelectors.myMessage).count() > 0;
      
      messageData.push({ text, isMine, time });
    }

    return messageData;
  }

  /**
   * 獲取最新訊息
   */
  async getLatestMessage(): Promise<{ text: string; isMine: boolean } | null> {
    const messages = await this.getAllMessages();
    return messages.length > 0 ? messages[messages.length - 1] : null;
  }

  /**
   * 等待收到新訊息
   */
  async waitForNewMessage(timeout = 30000): Promise<string> {
    const initialMessageCount = await this.page.locator(this.pageSelectors.message).count();
    
    // 等待新訊息出現
    await this.page.locator(this.pageSelectors.message).nth(initialMessageCount).waitFor({ 
      state: 'visible', 
      timeout 
    });
    
    const latestMessage = await this.getLatestMessage();
    return latestMessage?.text || '';
  }

  /**
   * 檢查對方是否正在輸入
   */
  async isRecipientTyping(): Promise<boolean> {
    return this.isElementVisible(this.pageSelectors.typingIndicator, 2000);
  }

  /**
   * 開始遊戲
   */
  async startGame(): Promise<void> {
    await this.click(this.pageSelectors.gameButton);
    await this.waitForModal();
  }

  /**
   * 玩石頭剪刀布遊戲
   */
  async playRockPaperScissors(choice: 'rock' | 'paper' | 'scissors'): Promise<void> {
    await this.startGame();
    
    let buttonSelector = '';
    switch (choice) {
      case 'rock':
        buttonSelector = this.pageSelectors.rockButton;
        break;
      case 'paper':
        buttonSelector = this.pageSelectors.paperButton;
        break;
      case 'scissors':
        buttonSelector = this.pageSelectors.scissorsButton;
        break;
    }
    
    await this.click(buttonSelector);
    
    // 等待遊戲結果
    await this.waitForElement(this.pageSelectors.gameResult);
  }

  /**
   * 獲取遊戲結果
   */
  async getGameResult(): Promise<string> {
    const resultElement = await this.waitForElement(this.pageSelectors.gameResult);
    return await resultElement.textContent() || '';
  }

  /**
   * 發送虛擬禮物
   */
  async sendGift(giftIndex = 0): Promise<void> {
    await this.click(this.pageSelectors.giftButton);
    await this.waitForModal();
    
    // 選擇禮物
    const gifts = this.page.locator(this.pageSelectors.giftItem);
    await gifts.nth(giftIndex).click();
    
    // 確認發送
    await this.click(this.selectors.confirmButton);
  }

  /**
   * 獲取聊天對象名稱
   */
  async getRecipientName(): Promise<string> {
    const nameElement = await this.waitForElement(this.pageSelectors.recipientName);
    return await nameElement.textContent() || '';
  }

  /**
   * 檢查對方是否在線上
   */
  async isRecipientOnline(): Promise<boolean> {
    return this.isElementVisible(this.pageSelectors.onlineStatus, 3000);
  }

  /**
   * 刪除訊息
   */
  async deleteMessage(messageText: string): Promise<void> {
    // 找到特定訊息
    const message = this.page.locator(this.pageSelectors.message)
      .filter({ hasText: messageText });
    
    // 長按或右鍵點擊訊息
    await message.click({ button: 'right' });
    
    // 點擊刪除選項
    await this.click(this.pageSelectors.deleteMessage);
    
    // 確認刪除
    await this.click(this.selectors.confirmButton);
  }

  /**
   * 舉報訊息
   */
  async reportMessage(messageText: string): Promise<void> {
    const message = this.page.locator(this.pageSelectors.message)
      .filter({ hasText: messageText });
    
    await message.click({ button: 'right' });
    await this.click(this.pageSelectors.reportMessage);
  }

  /**
   * 封鎖用戶
   */
  async blockUser(): Promise<void> {
    await this.click(this.pageSelectors.blockUserButton);
    await this.click(this.selectors.confirmButton);
  }

  /**
   * 舉報用戶
   */
  async reportUser(): Promise<void> {
    await this.click(this.pageSelectors.reportUserButton);
  }

  /**
   * 滾動到聊天頂部
   */
  async scrollToChatTop(): Promise<void> {
    const chatContainer = await this.waitForElement(this.pageSelectors.messagesList);
    await chatContainer.evaluate(el => el.scrollTop = 0);
  }

  /**
   * 滾動到聊天底部
   */
  async scrollToChatBottom(): Promise<void> {
    const chatContainer = await this.waitForElement(this.pageSelectors.messagesList);
    await chatContainer.evaluate(el => el.scrollTop = el.scrollHeight);
  }

  /**
   * 檢查是否有連線錯誤
   */
  async hasConnectionError(): Promise<boolean> {
    return this.isElementVisible(this.pageSelectors.connectionError, 2000);
  }

  /**
   * 重試連線
   */
  async retryConnection(): Promise<void> {
    await this.reload();
    await this.waitForPageLoad();
  }

  /**
   * 檢查聊天是否為空
   */
  async isChatEmpty(): Promise<boolean> {
    return this.isElementVisible(this.pageSelectors.emptyChat, 3000);
  }

  /**
   * 驗證聊天頁面元素
   */
  async verifyChatPageElements(): Promise<void> {
    await expect(this.page.locator(this.pageSelectors.chatContainer)).toBeVisible();
    await expect(this.page.locator(this.pageSelectors.messageInput)).toBeVisible();
    await expect(this.page.locator(this.pageSelectors.sendButton)).toBeVisible();
    
    // 檢查是否有聊天標題
    const hasHeader = await this.isElementVisible(this.pageSelectors.chatHeader, 3000);
    if (hasHeader) {
      await expect(this.page.locator(this.pageSelectors.recipientName)).toBeVisible();
    }
  }

  /**
   * 模擬長時間聊天對話
   */
  async simulateConversation(messages: string[], delayMs = 1000): Promise<void> {
    for (let i = 0; i < messages.length; i++) {
      await this.sendMessage(messages[i]);
      
      if (i < messages.length - 1) {
        await this.wait(delayMs);
      }
    }
  }

  /**
   * 獲取訊息數量
   */
  async getMessageCount(): Promise<number> {
    return await this.page.locator(this.pageSelectors.message).count();
  }

  /**
   * 等待訊息載入
   */
  async waitForMessagesToLoad(timeout = 10000): Promise<void> {
    // 等待載入指示器消失
    await this.waitForLoadingToComplete();
    
    // 等待至少有一條訊息或顯示空狀態
    await Promise.race([
      this.waitForElement(this.pageSelectors.message, { timeout }),
      this.waitForElement(this.pageSelectors.emptyChat, { timeout })
    ]);
  }

  /**
   * 驗證訊息發送狀態
   */
  async verifyMessageStatus(message: string, expectedStatus: 'sent' | 'delivered' | 'read'): Promise<void> {
    const messageElement = this.page.locator(this.pageSelectors.myMessage)
      .filter({ hasText: message });
    
    const statusElement = messageElement.locator(this.pageSelectors.messageStatus);
    
    // 根據狀態驗證
    switch (expectedStatus) {
      case 'sent':
        await expect(statusElement).toHaveText(/sent|✓/i);
        break;
      case 'delivered':
        await expect(statusElement).toHaveText(/delivered|✓✓/i);
        break;
      case 'read':
        await expect(statusElement).toHaveText(/read|seen|✓✓/i);
        break;
    }
  }

  /**
   * 驗證聊天頁面 URL
   */
  async verifyChatPageURL(chatId?: string): Promise<void> {
    if (chatId) {
      await this.verifyURL(new RegExp(`/chat/${chatId}$`));
    } else {
      await this.verifyURL(/\/chat$/);
    }
  }

  /**
   * 截圖聊天頁面
   */
  async takeChatScreenshot(name: string = 'chat-page'): Promise<void> {
    await this.takeScreenshot(name, { 
      fullPage: true,
      mask: [
        // 遮住個人資訊
        this.page.locator(this.pageSelectors.recipientName),
        this.page.locator(this.pageSelectors.recipientAvatar)
      ]
    });
  }
}