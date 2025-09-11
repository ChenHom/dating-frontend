# WebSocket Events Documentation (React Native + Expo)

**WebSocket Server**: Laravel Reverb  
**Connection URL**: `ws://host.docker.internal:6001` (Development)  
**Authentication**: Laravel Sanctum Bearer Token  
**Protocol**: WebSocket over HTTP/HTTPS  
**按 TECHNICAL_ARCHITECTURE.md 規範實作**

## 🔌 Connection Setup (React Native + Expo)

### Method 1: Laravel Echo + Pusher (推薦)
```typescript
// services/ws/echo-client.ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';

// React Native 環境設定
global.Pusher = Pusher;

interface EchoConfig {
  broadcaster: 'reverb';
  key: string;
  wsHost: string;
  wsPort: number;
  wssPort: number;
  forceTLS: boolean;
  enabledTransports: string[];
  auth: {
    headers: {
      Authorization: string;
    };
  };
}

export class EchoClient {
  private echo: Echo | null = null;

  connect(userToken: string): Echo {
    const config: EchoConfig = {
      broadcaster: 'reverb',
      key: process.env.EXPO_PUBLIC_REVERB_APP_KEY || 'xolhu9bxpdqxvxn0yvok',
      wsHost: process.env.EXPO_PUBLIC_REVERB_HOST || 'host.docker.internal',
      wsPort: Number(process.env.EXPO_PUBLIC_REVERB_PORT) || 6001,
      wssPort: Number(process.env.EXPO_PUBLIC_REVERB_PORT) || 6001,
      forceTLS: process.env.EXPO_PUBLIC_APP_STAGE === 'production',
      enabledTransports: ['ws', 'wss'],
      auth: {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      },
    };

    this.echo = new Echo(config);
    return this.echo;
  }

  disconnect(): void {
    this.echo?.disconnect();
    this.echo = null;
  }

  getEcho(): Echo | null {
    return this.echo;
  }
}

export const echoClient = new EchoClient();
```

### Method 2: Socket.IO Client (替代方案)
```typescript
// services/ws/socketio-client.ts
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';

export class SocketIOClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): Socket {
    const { token } = useAuthStore.getState();
    
    this.socket = io(process.env.EXPO_PUBLIC_WS_URL || 'ws://host.docker.internal:6001', {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔥 WebSocket connection error:', error);
      this.handleReconnect();
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // 1s, 2s, 4s, 8s
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
      
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketClient = new SocketIOClient();
```

## 📢 Available Events

### 1. Message Events

#### `message.new` - New Message Received
**Channel**: `private-conversation.{conversationId}`  
**Triggered**: When a user sends a message in a conversation

**Event Data:**
```json
{
  "id": 123,
  "conversation_id": 1,
  "sender_id": 2,
  "content": "Hello! How are you today?",
  "sequence_number": 5,
  "client_nonce": "msg-unique-123",
  "sent_at": "2025-01-01T12:30:45.123456Z",
  "created_at": "2025-01-01T12:30:45.123456Z",
  "sender": {
    "id": 2,
    "name": "Jane Doe",
    "profile": {
      "display_name": "Jane",
      "primary_photo_url": "storage/photos/user2/avatar.jpg"
    }
  }
}
```

**React Native Usage (Laravel Echo):**
```typescript
// hooks/useMessageListener.ts
import { useEffect } from 'react';
import { echoClient } from '@/services/ws/echo-client';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';

export const useMessageListener = (conversationId: number) => {
  const { addMessage } = useChatStore();
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token || !conversationId) return;

    const echo = echoClient.connect(token);
    
    const channel = echo.private(`conversation.${conversationId}`)
      .listen('message.new', (event: MessageEvent) => {
        console.log('📨 New message from:', event.sender.name);
        console.log('💬 Message content:', event.content);
        
        // Update UI with new message
        addMessage(conversationId, {
          id: event.id,
          content: event.content,
          senderId: event.sender_id,
          senderName: event.sender.name,
          senderAvatar: event.sender.profile?.primary_photo_url,
          timestamp: new Date(event.created_at),
          isFromCurrentUser: event.sender_id === getCurrentUserId(),
          sequenceNumber: event.sequence_number,
          clientNonce: event.client_nonce,
        });
      });

    return () => {
      channel.stopListening('message.new');
      echo.leave(`private-conversation.${conversationId}`);
    };
  }, [conversationId, token]);
};

// 在聊天組件中使用
// app/chat/[id].tsx
export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  
  // 啟用訊息監聽
  useMessageListener(Number(conversationId));
  
  return (
    <View className="flex-1">
      {/* Chat UI */}
    </View>
  );
}
```

**React Native Usage (Socket.IO):**
```typescript
// hooks/useSocketMessageListener.ts
import { useEffect } from 'react';
import { socketClient } from '@/services/ws/socketio-client';
import { useChatStore } from '@/stores/chat';

export const useSocketMessageListener = (conversationId: number) => {
  const { addMessage } = useChatStore();

  useEffect(() => {
    const socket = socketClient.connect();
    
    // 加入對話房間
    socket.emit('join-conversation', { conversationId });
    
    // 監聽新訊息
    socket.on('message.new', (event: MessageEvent) => {
      console.log('📨 Received message:', event);
      
      addMessage(conversationId, {
        id: event.id,
        content: event.content,
        senderId: event.sender_id,
        senderName: event.sender.name,
        senderAvatar: event.sender.profile?.primary_photo_url,
        timestamp: new Date(event.created_at),
        isFromCurrentUser: event.sender_id === getCurrentUserId(),
      });
    });

    return () => {
      socket.off('message.new');
      socket.emit('leave-conversation', { conversationId });
    };
  }, [conversationId]);
};
```

### Zustand Store Integration
```typescript
// stores/chat.ts
import { create } from 'zustand';

interface Message {
  id: number;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  isFromCurrentUser: boolean;
  sequenceNumber?: number;
  clientNonce?: string;
}

interface ChatState {
  conversations: Record<number, Message[]>;
  addMessage: (conversationId: number, message: Message) => void;
  markAsRead: (conversationId: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: {},
  
  addMessage: (conversationId, message) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [conversationId]: [
          ...(state.conversations[conversationId] || []),
          message,
        ],
      },
    }));
  },
  
  markAsRead: (conversationId) => {
    // Implementation for marking messages as read
  },
}));
```

---

### 2. Game Events

#### `game.started` - Game Session Started
**Channel**: `private-conversation.{conversationId}`  
**Triggered**: When a user accepts a game invitation and the game begins

**Event Data:**
```json
{
  "game_session_id": 456,
  "conversation_id": 1,
  "status": "PLAYING",
  "best_of": 3,
  "initiator": {
    "id": 1,
    "name": "John Doe"
  },
  "participant": {
    "id": 2,
    "name": "Jane Doe"
  },
  "started_at": "2025-01-01T12:35:00.123456Z"
}
```

**JavaScript Usage:**
```javascript
echo.private(`conversation.${conversationId}`)
    .listen('game.started', (event) => {
        console.log('Game started!');
        console.log('Players:', event.initiator.name, 'vs', event.participant.name);
        
        // Navigate to game screen or show game UI
        showGameInterface({
            sessionId: event.game_session_id,
            bestOf: event.best_of,
            players: [event.initiator, event.participant],
            currentUserId: currentUserId
        });
        
        // Start game timer if needed
        startGameTimer();
    });
```

**React Native Usage:**
```typescript
// hooks/useGameListener.ts
import { useEffect } from 'react';
import { router } from 'expo-router';
import { echoClient } from '@/services/ws/echo-client';
import { useGameStore } from '@/stores/game';
import { useAuthStore } from '@/stores/auth';

export const useGameListener = (conversationId: number) => {
  const { setCurrentGame } = useGameStore();
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token || !conversationId) return;

    const echo = echoClient.connect(token);
    
    const channel = echo.private(`conversation.${conversationId}`)
      .listen('game.started', (event: GameStartedEvent) => {
        console.log('🎮 Game started!');
        console.log('Players:', event.initiator.name, 'vs', event.participant.name);
        
        // 儲存遊戲狀態
        setCurrentGame({
          sessionId: event.game_session_id,
          conversationId: event.conversation_id,
          bestOf: event.best_of,
          initiator: event.initiator,
          participant: event.participant,
          startedAt: new Date(event.started_at),
        });

        // 導航到遊戲頁面
        router.push(`/game/${event.game_session_id}`);
        
        // 顯示遊戲通知
        showToast(`🎮 Game started with ${getOpponentName(event)}!`);
      });

    return () => {
      channel.stopListening('game.started');
    };
  }, [conversationId, token]);
};

---

### 3. Presence Events

#### `chat.joined` - User Joined Conversation
**Channel**: `private-conversation.{conversationId}`  
**Triggered**: When a user becomes active in a conversation (opens chat)

**Event Data:**
```json
{
  "user_id": 2,
  "conversation_id": 1,
  "user": {
    "id": 2,
    "name": "Jane Doe",
    "profile": {
      "display_name": "Jane",
      "primary_photo_url": "storage/photos/user2/avatar.jpg"
    }
  },
  "joined_at": "2025-01-01T12:40:15.123456Z"
}
```

**React Native Usage:**
```typescript
// hooks/usePresenceListener.ts
import { useEffect } from 'react';
import { echoClient } from '@/services/ws/echo-client';
import { usePresenceStore } from '@/stores/presence';
import { useAuthStore } from '@/stores/auth';

export const usePresenceListener = (conversationId: number) => {
  const { setUserOnline, setUserOffline } = usePresenceStore();
  const { user: currentUser, token } = useAuthStore();

  useEffect(() => {
    if (!token || !conversationId || !currentUser) return;

    const echo = echoClient.connect(token);
    
    const channel = echo.private(`conversation.${conversationId}`)
      .listen('chat.joined', (event: UserJoinedEvent) => {
        if (event.user_id !== currentUser.id) {
          console.log(event.user.name, 'is now active in chat');
          
          // 更新用戶在線狀態
          setUserOnline(event.user_id, {
            id: event.user.id,
            name: event.user.name,
            displayName: event.user.profile?.display_name,
            avatar: event.user.profile?.primary_photo_url,
            joinedAt: new Date(event.joined_at),
          });
          
          // 顯示用戶上線提示
          showPresenceToast(`${event.user.name} joined the conversation`);
          
          // 30秒後自動隱藏在線指示器
          setTimeout(() => {
            setUserOffline(event.user_id);
          }, 30000);
        }
      });

    return () => {
      channel.stopListening('chat.joined');
    };
  }, [conversationId, currentUser?.id, token]);
};

// 在聊天組件中使用
// app/chat/[id].tsx
export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  
  // 啟用在線狀態監聽
  usePresenceListener(Number(conversationId));
  
  return (
    <View className="flex-1">
      <PresenceIndicator conversationId={Number(conversationId)} />
      {/* 其他 Chat UI */}
    </View>
  );
}
```

---

## 🔐 Channel Authorization

### Private Channels
All channels are private and require authentication. Users can only join channels for conversations they participate in.

**Authorization Process:**
1. Client attempts to subscribe to `private-conversation.{id}`
2. Laravel checks if authenticated user is a participant (user1_id or user2_id)
3. Access granted only to conversation participants

**Example Authorization Check:**
```php
// In routes/channels.php
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $conversation = Conversation::find($conversationId);
    
    return $conversation && (
        $conversation->user1_id === $user->id || 
        $conversation->user2_id === $user->id
    );
});
```

---

## 🎯 Event Listening Patterns

### React Native/Web Implementation
```javascript
class ChatManager {
    constructor(conversationId, userId) {
        this.conversationId = conversationId;
        this.userId = userId;
        this.channel = null;
    }
    
    connect() {
        this.channel = echo.private(`conversation.${this.conversationId}`);
        
        // Listen to all events
        this.channel
            .listen('message.new', this.handleNewMessage.bind(this))
            .listen('game.started', this.handleGameStarted.bind(this))
            .listen('chat.joined', this.handleUserJoined.bind(this));
    }
    
    handleNewMessage(event) {
        if (event.sender_id !== this.userId) {
            // Play notification sound
            Audio.playMessageSound();
            
            // Update unread count
            this.updateUnreadCount(1);
            
            // Add to message list
            this.addMessage(event);
        }
    }
    
    handleGameStarted(event) {
        // Show game invitation or start game
        this.showGameModal(event);
    }
    
    handleUserJoined(event) {
        if (event.user_id !== this.userId) {
            this.updateUserPresence(event.user_id, true);
        }
    }
    
    disconnect() {
        if (this.channel) {
            echo.leave(`private-conversation.${this.conversationId}`);
        }
    }
}
```

### Flutter Implementation
```dart
class WebSocketManager {
  final String conversationId;
  final String userId;
  late Echo echo;
  
  WebSocketManager({
    required this.conversationId,
    required this.userId,
  });
  
  void connect() {
    echo.private('conversation.$conversationId')
      ..listen('message.new', _handleNewMessage)
      ..listen('game.started', _handleGameStarted)  
      ..listen('chat.joined', _handleUserJoined);
  }
  
  void _handleNewMessage(dynamic event) {
    if (event['sender_id'] != userId) {
      // Play sound
      AudioCache().play('message_sound.mp3');
      
      // Show notification
      _showNotification(event);
      
      // Update UI
      _addMessageToList(event);
    }
  }
  
  void _handleGameStarted(dynamic event) {
    // Navigate to game screen
    Navigator.pushNamed(context, '/game', arguments: event);
  }
  
  void _handleUserJoined(dynamic event) {
    if (event['user_id'] != userId) {
      _updatePresenceIndicator(true);
    }
  }
  
  void disconnect() {
    echo.leave('private-conversation.$conversationId');
  }
}
```

---

## 🚨 Error Handling & Reconnection

### Connection Events
```javascript
echo.connector.pusher.connection.bind('connected', () => {
    console.log('WebSocket connected');
    setConnectionStatus('connected');
});

echo.connector.pusher.connection.bind('disconnected', () => {
    console.log('WebSocket disconnected');
    setConnectionStatus('disconnected');
    
    // Show reconnection UI
    showReconnectionIndicator();
});

echo.connector.pusher.connection.bind('error', (error) => {
    console.error('WebSocket error:', error);
    setConnectionStatus('error');
});
```

### Automatic Reconnection
Laravel Echo automatically handles reconnection with exponential backoff:
- Initial retry: 1 second
- Second retry: 2 seconds  
- Third retry: 4 seconds
- Max retry: 8 seconds

### Manual Reconnection
```javascript
// Force reconnection
function reconnectWebSocket() {
    echo.disconnect();
    echo.connect();
    
    // Re-subscribe to channels
    subscribeToConversation(conversationId);
}
```

---

## 📊 Performance Considerations

### Connection Limits
- Max connections per user: 5 devices
- Heartbeat interval: 25 seconds
- Connection timeout: 60 seconds
- Message rate limit: 1 per second per user

### Memory Management
```javascript
// Clean up when leaving chat
function leaveChatScreen() {
    // Stop listening to events
    echo.leave(`private-conversation.${conversationId}`);
    
    // Clear message cache
    messages = [];
    
    // Stop timers
    clearInterval(heartbeatTimer);
}
```

### Battery Optimization (Mobile)
```dart
// Disconnect when app goes to background
class _ChatScreenState extends State<ChatScreen> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      webSocketManager.disconnect();
    } else if (state == AppLifecycleState.resumed) {
      webSocketManager.connect();
    }
  }
}
```

---

## 🧪 Testing WebSocket Events (React Native)

### Development Testing
```typescript
// services/ws/__tests__/websocket.test.ts
import { echoClient } from '../echo-client';
import { apiClient } from '@/services/api/client';

describe('WebSocket Integration Tests', () => {
  let testToken: string;
  let conversationId: number;

  beforeAll(async () => {
    // Get test auth token
    const authResponse = await apiClient.login('test@example.com', 'password');
    testToken = authResponse.token;
    conversationId = 1; // Test conversation ID
  });

  test('should connect successfully', (done) => {
    const echo = echoClient.connect(testToken);
    
    // Test connection
    echo.connector.pusher.connection.bind('connected', () => {
      console.log('✅ WebSocket connected successfully');
      done();
    });
  });

  test('should receive message events', (done) => {
    const echo = echoClient.connect(testToken);
    
    // Listen for message events
    echo.private(`conversation.${conversationId}`)
      .listen('message.new', (event: MessageEvent) => {
        console.log('📨 Received message event:', event);
        expect(event.content).toBeDefined();
        expect(event.sender_id).toBeDefined();
        done();
      });

    // Send test message via API to trigger event
    setTimeout(() => {
      apiClient.sendMessage(conversationId, 'Test WebSocket message', `test-${Date.now()}`);
    }, 1000);
  });

  afterAll(() => {
    echoClient.disconnect();
  });
});
```

### React Native Testing Utils
```typescript
// hooks/__tests__/useWebSocket.test.tsx
import { renderHook } from '@testing-library/react-hooks';
import { useMessageListener } from '@/hooks/useMessageListener';
import { MockChatProvider } from '@/test-utils/providers';

describe('useMessageListener', () => {
  test('should handle message events correctly', () => {
    const { result } = renderHook(
      () => useMessageListener(1),
      { wrapper: MockChatProvider }
    );

    // Test hook behavior
    expect(result.current).toBeDefined();
  });
});
```

### Production Monitoring (React Native)
- **Connection Success Rate**: Target >99.5% (monitor via analytics)
- **Message Delivery Time**: Target <100ms (measure round-trip time)
- **Reconnection Frequency**: Alert if >5 reconnects per session
- **Error Rate Monitoring**: Alert on >2% WebSocket errors
- **Battery Impact**: Monitor background WebSocket usage
- **Memory Usage**: Track WebSocket client memory footprint

### Environment Configuration
```env
# Development
EXPO_PUBLIC_REVERB_HOST=host.docker.internal
EXPO_PUBLIC_REVERB_PORT=6001
EXPO_PUBLIC_REVERB_APP_KEY=xolhu9bxpdqxvxn0yvok
EXPO_PUBLIC_WS_URL=ws://host.docker.internal:6001

# Production
EXPO_PUBLIC_REVERB_HOST=your-ws-domain.com
EXPO_PUBLIC_REVERB_PORT=6001
EXPO_PUBLIC_REVERB_APP_KEY=your-production-key
EXPO_PUBLIC_WS_URL=wss://your-ws-domain.com
```

---

**Documentation Version**: 2.0.0 (React Native + Expo)  
**Last Updated**: January 2025  
**WebSocket Server**: Laravel Reverb v1.5.0  
**Frontend**: React Native + Expo + TypeScript