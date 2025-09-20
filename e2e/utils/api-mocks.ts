/**
 * API Mocking Utilities for E2E Tests
 * 為端對端測試提供 API 模擬功能
 */

import { Page, Route } from '@playwright/test';

export interface MockUser {
  id: string;
  email: string;
  name: string;
  age: number;
  bio: string;
  location: string;
  photos: string[];
  isOnline: boolean;
}

export interface MockMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'gift' | 'game';
  status: 'sent' | 'delivered' | 'read';
}

export interface MockConversation {
  id: string;
  participants: string[];
  lastMessage?: MockMessage;
  unreadCount: number;
  createdAt: string;
}

export class APIMocks {
  private page: Page;
  private mockUsers: MockUser[] = [];
  private mockMessages: MockMessage[] = [];
  private mockConversations: MockConversation[] = [];

  constructor(page: Page) {
    this.page = page;
    this.initializeMockData();
  }

  /**
   * 初始化模擬數據
   */
  private initializeMockData(): void {
    // 建立模擬用戶
    this.mockUsers = [
      {
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
        age: 25,
        bio: 'Love traveling and photography',
        location: 'San Francisco, CA',
        photos: ['/mock-photos/alice1.jpg', '/mock-photos/alice2.jpg'],
        isOnline: true
      },
      {
        id: 'user-2',
        email: 'bob@example.com',
        name: 'Bob',
        age: 28,
        bio: 'Software developer and coffee enthusiast',
        location: 'New York, NY',
        photos: ['/mock-photos/bob1.jpg'],
        isOnline: false
      },
      {
        id: 'user-3',
        email: 'carol@example.com',
        name: 'Carol',
        age: 23,
        bio: 'Artist and yoga instructor',
        location: 'Los Angeles, CA',
        photos: ['/mock-photos/carol1.jpg', '/mock-photos/carol2.jpg', '/mock-photos/carol3.jpg'],
        isOnline: true
      }
    ];

    // 建立模擬對話
    this.mockConversations = [
      {
        id: 'conv-1',
        participants: ['current-user', 'user-1'],
        unreadCount: 2,
        createdAt: '2024-01-01T10:00:00Z'
      },
      {
        id: 'conv-2',
        participants: ['current-user', 'user-2'],
        unreadCount: 0,
        createdAt: '2024-01-02T15:30:00Z'
      }
    ];

    // 建立模擬消息
    this.mockMessages = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Hey, how are you?',
        timestamp: '2024-01-01T10:00:00Z',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        senderId: 'current-user',
        content: 'I\'m good, thanks! How about you?',
        timestamp: '2024-01-01T10:05:00Z',
        type: 'text',
        status: 'read'
      }
    ];
  }

  /**
   * 設置認證相關的 API 模擬
   */
  async mockAuthAPIs(): Promise<void> {
    // 模擬登入 API
    await this.page.route('**/auth/login', async (route: Route) => {
      const request = route.request();
      const body = request.postDataJSON();

      if (body?.email === 'test@example.com' && body?.password === 'validpassword123') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: 'current-user',
              email: 'test@example.com',
              name: 'Test User'
            },
            token: 'mock-jwt-token'
          })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid credentials'
          })
        });
      }
    });

    // 模擬註冊 API
    await this.page.route('**/auth/register', async (route: Route) => {
      const request = route.request();
      const body = request.postDataJSON();

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'new-user',
            email: body?.email,
            name: body?.name
          },
          token: 'mock-jwt-token-new'
        })
      });
    });

    // 模擬用戶資訊 API
    await this.page.route('**/me', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'current-user',
          email: 'test@example.com',
          name: 'Test User',
          age: 25,
          bio: 'Test user bio',
          location: 'Test City'
        })
      });
    });
  }

  /**
   * 設置配對相關的 API 模擬
   */
  async mockFeedAPIs(): Promise<void> {
    // 模擬 feed API
    await this.page.route('**/feed', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profiles: this.mockUsers.slice(0, 3), // 返回前3個用戶
          hasMore: true
        })
      });
    });

    // 模擬點讚 API
    await this.page.route('**/likes/*', async (route: Route) => {
      const url = route.request().url();
      const userId = url.split('/').pop();

      // 模擬配對（50% 機率）
      const isMatch = Math.random() > 0.5;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          match: isMatch,
          user: this.mockUsers.find(u => u.id === userId)
        })
      });
    });

    // 模擬配對列表 API
    await this.page.route('**/matches', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          matches: this.mockConversations.map(conv => ({
            id: conv.id,
            user: this.mockUsers.find(u => u.id !== 'current-user' && conv.participants.includes(u.id)),
            lastMessage: this.mockMessages.find(m => m.conversationId === conv.id),
            unreadCount: conv.unreadCount
          }))
        })
      });
    });
  }

  /**
   * 設置聊天相關的 API 模擬
   */
  async mockChatAPIs(): Promise<void> {
    // 模擬對話列表 API
    await this.page.route('**/conversations', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          conversations: this.mockConversations.map(conv => ({
            ...conv,
            user: this.mockUsers.find(u => u.id !== 'current-user' && conv.participants.includes(u.id)),
            lastMessage: this.mockMessages.find(m => m.conversationId === conv.id)
          }))
        })
      });
    });

    // 模擬特定對話的訊息 API
    await this.page.route('**/conversations/*/messages', async (route: Route) => {
      const url = route.request().url();
      const conversationId = url.split('/')[url.split('/').length - 2];

      const messages = this.mockMessages.filter(m => m.conversationId === conversationId);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: messages.map(msg => ({
            ...msg,
            sender: this.mockUsers.find(u => u.id === msg.senderId)
          }))
        })
      });
    });

    // 模擬發送訊息 API
    await this.page.route('**/messages', async (route: Route) => {
      const request = route.request();
      const body = request.postDataJSON();

      const newMessage: MockMessage = {
        id: `msg-${Date.now()}`,
        conversationId: body?.conversationId,
        senderId: 'current-user',
        content: body?.content,
        timestamp: new Date().toISOString(),
        type: 'text',
        status: 'sent'
      };

      this.mockMessages.push(newMessage);

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: newMessage
        })
      });
    });
  }

  /**
   * 設置遊戲相關的 API 模擬
   */
  async mockGameAPIs(): Promise<void> {
    // 模擬開始遊戲 API
    await this.page.route('**/games/start', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          gameId: 'game-' + Date.now(),
          type: 'rock-paper-scissors',
          status: 'waiting'
        })
      });
    });

    // 模擬遊戲動作 API
    await this.page.route('**/games/*/play', async (route: Route) => {
      const request = route.request();
      const body = request.postDataJSON();

      const choices = ['rock', 'paper', 'scissors'];
      const opponentChoice = choices[Math.floor(Math.random() * choices.length)];
      const playerChoice = body?.choice;

      let result = 'draw';
      if (playerChoice === 'rock' && opponentChoice === 'scissors' ||
          playerChoice === 'paper' && opponentChoice === 'rock' ||
          playerChoice === 'scissors' && opponentChoice === 'paper') {
        result = 'win';
      } else if (playerChoice !== opponentChoice) {
        result = 'lose';
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          playerChoice,
          opponentChoice,
          result,
          status: 'completed'
        })
      });
    });
  }

  /**
   * 設置禮物相關的 API 模擬
   */
  async mockGiftAPIs(): Promise<void> {
    // 模擬禮物目錄 API
    await this.page.route('**/gifts', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          gifts: [
            { id: 'gift-1', name: 'Rose', icon: '🌹', cost: 0 },
            { id: 'gift-2', name: 'Heart', icon: '❤️', cost: 0 },
            { id: 'gift-3', name: 'Kiss', icon: '💋', cost: 0 },
            { id: 'gift-4', name: 'Hug', icon: '🤗', cost: 0 },
            { id: 'gift-5', name: 'Smile', icon: '😊', cost: 0 },
            { id: 'gift-6', name: 'Wink', icon: '😉', cost: 0 }
          ]
        })
      });
    });

    // 模擬發送禮物 API
    await this.page.route('**/conversations/*/gifts/send', async (route: Route) => {
      const request = route.request();
      const body = request.postDataJSON();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          giftId: body?.giftId,
          cooldownUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小時後
        })
      });
    });
  }

  /**
   * 模擬網路錯誤
   */
  async mockNetworkError(pattern: string | RegExp): Promise<void> {
    await this.page.route(pattern, route => route.abort('failed'));
  }

  /**
   * 模擬伺服器錯誤
   */
  async mockServerError(pattern: string | RegExp, status = 500): Promise<void> {
    await this.page.route(pattern, route =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    );
  }

  /**
   * 模擬慢速網路
   */
  async mockSlowNetwork(pattern: string | RegExp, delayMs = 3000): Promise<void> {
    await this.page.route(pattern, async route => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      await route.continue();
    });
  }

  /**
   * 模擬空回應
   */
  async mockEmptyResponse(pattern: string | RegExp): Promise<void> {
    await this.page.route(pattern, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], hasMore: false })
      })
    );
  }

  /**
   * 清除所有 API 模擬
   */
  async clearMocks(): Promise<void> {
    await this.page.unrouteAll();
  }

  /**
   * 設置所有基本 API 模擬
   */
  async setupAllMocks(): Promise<void> {
    await this.mockAuthAPIs();
    await this.mockFeedAPIs();
    await this.mockChatAPIs();
    await this.mockGameAPIs();
    await this.mockGiftAPIs();
  }

  /**
   * 添加模擬用戶
   */
  addMockUser(user: MockUser): void {
    this.mockUsers.push(user);
  }

  /**
   * 添加模擬訊息
   */
  addMockMessage(message: MockMessage): void {
    this.mockMessages.push(message);
  }

  /**
   * 獲取模擬用戶
   */
  getMockUsers(): MockUser[] {
    return this.mockUsers;
  }

  /**
   * 獲取模擬訊息
   */
  getMockMessages(): MockMessage[] {
    return this.mockMessages;
  }
}