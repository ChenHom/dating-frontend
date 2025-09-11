/**
 * WebSocket Types & Interfaces
 * WebSocket 連線管理相關類型定義
 */

export enum WebSocketConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

export interface WebSocketEvent {
  type: string;
  [key: string]: any;
}

export interface HeartbeatEvent extends WebSocketEvent {
  type: 'heartbeat';
  timestamp: number;
}

export interface ChatJoinEvent extends WebSocketEvent {
  type: 'chat.join';
  conversation_id: number;
  user_id: number;
}

export interface ChatJoinedEvent extends WebSocketEvent {
  type: 'chat.joined';
  conversation_id: number;
  user_id: number;
  joined_at: string;
}

export interface MessageSendEvent extends WebSocketEvent {
  type: 'message.send';
  conversation_id: number;
  content: string;
  client_nonce: string;
  sent_at: string;
}

export interface MessageAckEvent extends WebSocketEvent {
  type: 'message.ack';
  client_nonce: string;
  message_id: number;
  sequence_number: number;
  sent_at: string;
}

export interface MessageNewEvent extends WebSocketEvent {
  type: 'message.new';
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  sequence_number: number;
  client_nonce: string;
  sent_at: string;
  created_at: string;
  sender: {
    id: number;
    name: string;
    profile?: {
      display_name: string;
      primary_photo_url?: string;
    };
  };
}

export interface GameStartEvent extends WebSocketEvent {
  type: 'game.start';
  conversation_id: number;
  game_session_id: number;
  initiator_id: number;
  best_of: number;
  started_at: string;
}

export interface GamePlayEvent extends WebSocketEvent {
  type: 'game.play';
  game_session_id: number;
  round_number: number;
  choice: 'rock' | 'paper' | 'scissors';
  player_id: number;
}

export interface GameEndedEvent extends WebSocketEvent {
  type: 'game.ended';
  game_session_id: number;
  winner_id?: number;
  final_scores: {
    [player_id: number]: number;
  };
  completed_at: string;
}

export type WebSocketEventType = 
  | HeartbeatEvent
  | ChatJoinEvent
  | ChatJoinedEvent
  | MessageSendEvent
  | MessageAckEvent
  | MessageNewEvent
  | GameStartEvent
  | GamePlayEvent
  | GameEndedEvent;

export interface WebSocketManagerEventMap {
  connected: () => void;
  disconnected: () => void;
  reconnecting: () => void;
  reconnection_attempt: (attempt: number) => void;
  connection_timeout: () => void;
  connection_state_changed: (newState: WebSocketConnectionState, oldState: WebSocketConnectionState) => void;
  message: (event: WebSocketEventType) => void;
  error: (error: Error) => void;
}

export interface WebSocketManagerConfig {
  heartbeatInterval: number; // milliseconds
  heartbeatTimeout: number; // milliseconds
  reconnectionDelay: number; // milliseconds  
  maxReconnectionDelay: number; // milliseconds
  maxReconnectionAttempts: number;
  messageQueueMaxSize: number;
}

export interface QueuedMessage {
  event: WebSocketEvent;
  timestamp: number;
  attempts: number;
}