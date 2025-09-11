/**
 * Test Data Fixtures
 * 測試數據固件 - 提供一致的測試數據
 */

export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
  age: number;
  bio: string;
  location: string;
  photos: string[];
  preferences: {
    minAge: number;
    maxAge: number;
    maxDistance: number;
  };
  stats: {
    likes: number;
    matches: number;
    conversations: number;
  };
}

export interface TestMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'gift' | 'game';
  status: 'sent' | 'delivered' | 'read';
}

export interface TestConversation {
  id: string;
  participants: string[];
  messages: TestMessage[];
  lastActivity: string;
  isMatch: boolean;
}

export interface TestGame {
  id: string;
  conversationId: string;
  players: string[];
  type: 'rock-paper-scissors';
  rounds: Array<{
    player1Choice: string;
    player2Choice: string;
    winner: string;
  }>;
  status: 'waiting' | 'active' | 'completed';
}

/**
 * 測試用戶數據
 */
export const TEST_USERS: TestUser[] = [
  {
    id: 'test-user-1',
    email: 'alice@test.com',
    password: 'TestPassword123!',
    name: 'Alice Johnson',
    age: 25,
    bio: 'Love traveling, photography, and good coffee. Always up for new adventures! 📸✈️☕',
    location: 'San Francisco, CA',
    photos: [
      '/test-photos/alice-1.jpg',
      '/test-photos/alice-2.jpg',
      '/test-photos/alice-3.jpg'
    ],
    preferences: {
      minAge: 22,
      maxAge: 35,
      maxDistance: 50
    },
    stats: {
      likes: 45,
      matches: 12,
      conversations: 8
    }
  },
  {
    id: 'test-user-2',
    email: 'bob@test.com',
    password: 'TestPassword123!',
    name: 'Bob Smith',
    age: 28,
    bio: 'Software developer by day, chef by night. Love hiking and trying new restaurants.',
    location: 'New York, NY',
    photos: [
      '/test-photos/bob-1.jpg',
      '/test-photos/bob-2.jpg'
    ],
    preferences: {
      minAge: 24,
      maxAge: 32,
      maxDistance: 30
    },
    stats: {
      likes: 32,
      matches: 18,
      conversations: 15
    }
  },
  {
    id: 'test-user-3',
    email: 'carol@test.com',
    password: 'TestPassword123!',
    name: 'Carol Williams',
    age: 23,
    bio: 'Artist and yoga instructor. Spreading good vibes everywhere I go! 🎨🧘‍♀️',
    location: 'Los Angeles, CA',
    photos: [
      '/test-photos/carol-1.jpg',
      '/test-photos/carol-2.jpg',
      '/test-photos/carol-3.jpg',
      '/test-photos/carol-4.jpg'
    ],
    preferences: {
      minAge: 21,
      maxAge: 30,
      maxDistance: 25
    },
    stats: {
      likes: 67,
      matches: 23,
      conversations: 19
    }
  },
  {
    id: 'test-user-4',
    email: 'david@test.com',
    password: 'TestPassword123!',
    name: 'David Lee',
    age: 30,
    bio: 'Marketing professional who loves running, reading, and exploring new places.',
    location: 'Seattle, WA',
    photos: [
      '/test-photos/david-1.jpg'
    ],
    preferences: {
      minAge: 25,
      maxAge: 35,
      maxDistance: 40
    },
    stats: {
      likes: 28,
      matches: 9,
      conversations: 6
    }
  },
  {
    id: 'test-user-5',
    email: 'emma@test.com',
    password: 'TestPassword123!',
    name: 'Emma Davis',
    age: 26,
    bio: 'Veterinarian who adores animals and nature. Looking for someone who shares my passions.',
    location: 'Austin, TX',
    photos: [
      '/test-photos/emma-1.jpg',
      '/test-photos/emma-2.jpg',
      '/test-photos/emma-3.jpg'
    ],
    preferences: {
      minAge: 24,
      maxAge: 33,
      maxDistance: 35
    },
    stats: {
      likes: 52,
      matches: 16,
      conversations: 12
    }
  }
];

/**
 * 測試對話數據
 */
export const TEST_CONVERSATIONS: TestConversation[] = [
  {
    id: 'conv-1',
    participants: ['test-user-1', 'test-user-2'],
    lastActivity: '2024-01-15T10:30:00Z',
    isMatch: true,
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'test-user-1',
        content: 'Hey! Thanks for the like 😊',
        timestamp: '2024-01-15T10:00:00Z',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        senderId: 'test-user-2',
        content: 'No problem! I love your photos from Japan',
        timestamp: '2024-01-15T10:05:00Z',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-3',
        conversationId: 'conv-1',
        senderId: 'test-user-1',
        content: 'Thank you! It was an amazing trip. Have you been to Japan?',
        timestamp: '2024-01-15T10:10:00Z',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-4',
        conversationId: 'conv-1',
        senderId: 'test-user-2',
        content: 'Not yet, but it\'s on my bucket list! Maybe we could talk about it over coffee?',
        timestamp: '2024-01-15T10:30:00Z',
        type: 'text',
        status: 'delivered'
      }
    ]
  },
  {
    id: 'conv-2',
    participants: ['test-user-1', 'test-user-3'],
    lastActivity: '2024-01-14T18:45:00Z',
    isMatch: true,
    messages: [
      {
        id: 'msg-5',
        conversationId: 'conv-2',
        senderId: 'test-user-3',
        content: 'Hi Alice! Love your travel photos 📸',
        timestamp: '2024-01-14T18:00:00Z',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-6',
        conversationId: 'conv-2',
        senderId: 'test-user-1',
        content: 'Thanks Carol! Your art is incredible 🎨',
        timestamp: '2024-01-14T18:15:00Z',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-7',
        conversationId: 'conv-2',
        senderId: 'test-user-3',
        content: '🌹',
        timestamp: '2024-01-14T18:45:00Z',
        type: 'gift',
        status: 'delivered'
      }
    ]
  },
  {
    id: 'conv-3',
    participants: ['test-user-2', 'test-user-4'],
    lastActivity: '2024-01-13T14:20:00Z',
    isMatch: true,
    messages: [
      {
        id: 'msg-8',
        conversationId: 'conv-3',
        senderId: 'test-user-2',
        content: 'Hey David! Fellow Seattle explorer here',
        timestamp: '2024-01-13T14:00:00Z',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-9',
        conversationId: 'conv-3',
        senderId: 'test-user-4',
        content: 'Nice! Want to play a quick game?',
        timestamp: '2024-01-13T14:20:00Z',
        type: 'text',
        status: 'read'
      }
    ]
  }
];

/**
 * 測試遊戲數據
 */
export const TEST_GAMES: TestGame[] = [
  {
    id: 'game-1',
    conversationId: 'conv-1',
    players: ['test-user-1', 'test-user-2'],
    type: 'rock-paper-scissors',
    status: 'completed',
    rounds: [
      {
        player1Choice: 'rock',
        player2Choice: 'scissors',
        winner: 'test-user-1'
      },
      {
        player1Choice: 'paper',
        player2Choice: 'rock',
        winner: 'test-user-1'
      },
      {
        player1Choice: 'scissors',
        player2Choice: 'paper',
        winner: 'test-user-1'
      }
    ]
  },
  {
    id: 'game-2',
    conversationId: 'conv-2',
    players: ['test-user-1', 'test-user-3'],
    type: 'rock-paper-scissors',
    status: 'active',
    rounds: [
      {
        player1Choice: 'rock',
        player2Choice: 'rock',
        winner: 'draw'
      }
    ]
  }
];

/**
 * 測試禮物數據
 */
export const TEST_GIFTS = [
  { id: 'gift-1', name: 'Rose', icon: '🌹', cost: 0 },
  { id: 'gift-2', name: 'Heart', icon: '❤️', cost: 0 },
  { id: 'gift-3', name: 'Kiss', icon: '💋', cost: 0 },
  { id: 'gift-4', name: 'Hug', icon: '🤗', cost: 0 },
  { id: 'gift-5', name: 'Smile', icon: '😊', cost: 0 },
  { id: 'gift-6', name: 'Wink', icon: '😉', cost: 0 }
];

/**
 * 測試認證憑據
 */
export const TEST_CREDENTIALS = {
  valid: {
    email: 'test@example.com',
    password: 'TestPassword123!'
  },
  invalid: {
    email: 'invalid@test.com',
    password: 'wrongpassword'
  },
  admin: {
    email: 'admin@test.com',
    password: 'AdminPassword123!'
  }
};

/**
 * 測試配置
 */
export const TEST_CONFIG = {
  delays: {
    short: 500,
    medium: 1000,
    long: 3000
  },
  limits: {
    maxSwipes: 10,
    maxMessages: 50,
    maxPhotos: 6
  },
  timeouts: {
    pageLoad: 10000,
    apiResponse: 5000,
    elementVisible: 3000
  }
};

/**
 * 生成隨機測試數據的工廠函數
 */
export class TestDataFactory {
  static createUser(overrides: Partial<TestUser> = {}): TestUser {
    const random = Math.random().toString(36).substring(7);
    
    return {
      id: `user-${random}`,
      email: `test-${random}@example.com`,
      password: 'TestPassword123!',
      name: `Test User ${random}`,
      age: Math.floor(Math.random() * 15) + 22, // 22-36 years old
      bio: 'Generated test user bio',
      location: 'Test City',
      photos: [`/test-photos/user-${random}.jpg`],
      preferences: {
        minAge: 22,
        maxAge: 35,
        maxDistance: 50
      },
      stats: {
        likes: Math.floor(Math.random() * 100),
        matches: Math.floor(Math.random() * 50),
        conversations: Math.floor(Math.random() * 30)
      },
      ...overrides
    };
  }

  static createMessage(overrides: Partial<TestMessage> = {}): TestMessage {
    const random = Math.random().toString(36).substring(7);
    
    return {
      id: `msg-${random}`,
      conversationId: 'test-conv',
      senderId: 'test-user',
      content: `Test message ${random}`,
      timestamp: new Date().toISOString(),
      type: 'text',
      status: 'sent',
      ...overrides
    };
  }

  static createConversation(overrides: Partial<TestConversation> = {}): TestConversation {
    const random = Math.random().toString(36).substring(7);
    
    return {
      id: `conv-${random}`,
      participants: ['user-1', 'user-2'],
      messages: [],
      lastActivity: new Date().toISOString(),
      isMatch: true,
      ...overrides
    };
  }

  static createGame(overrides: Partial<TestGame> = {}): TestGame {
    const random = Math.random().toString(36).substring(7);
    
    return {
      id: `game-${random}`,
      conversationId: 'test-conv',
      players: ['user-1', 'user-2'],
      type: 'rock-paper-scissors',
      rounds: [],
      status: 'waiting',
      ...overrides
    };
  }
}

/**
 * 測試數據清理工具
 */
export class TestDataCleaner {
  /**
   * 清理用戶相關數據
   */
  static async cleanUserData(userId: string): Promise<void> {
    // 這裡可以添加實際的數據清理邏輯
    console.log(`Cleaning data for user: ${userId}`);
  }

  /**
   * 清理對話數據
   */
  static async cleanConversationData(conversationId: string): Promise<void> {
    console.log(`Cleaning conversation data: ${conversationId}`);
  }

  /**
   * 清理所有測試數據
   */
  static async cleanAllTestData(): Promise<void> {
    console.log('Cleaning all test data...');
    // 實際實施時會清理資料庫中的測試數據
  }
}

/**
 * 測試環境設置
 */
export class TestEnvironment {
  /**
   * 設置測試環境
   */
  static async setup(): Promise<void> {
    console.log('Setting up test environment...');
    // 這裡可以添加數據庫種子、API 模擬等設置
  }

  /**
   * 清理測試環境
   */
  static async teardown(): Promise<void> {
    console.log('Tearing down test environment...');
    await TestDataCleaner.cleanAllTestData();
  }

  /**
   * 重置測試環境
   */
  static async reset(): Promise<void> {
    await this.teardown();
    await this.setup();
  }
}