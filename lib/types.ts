/**
 * Global Type Definitions
 * 全域型別定義，與後端 API 對應
 */

// User Related Types
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Profile {
  id: number;
  user_id: number;
  display_name: string;
  bio?: string;
  birth_date?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  interested_in?: 'male' | 'female' | 'both';
  location?: string;
  primary_photo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Authentication Types
export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

// Feed & Matching Types
export interface FeedUser {
  id: number;
  profile: Profile;
  photos?: Photo[];
  distance?: number;
}

export interface LikeResponse {
  liked: boolean;
  is_match: boolean;
  matched_user?: User;
}

export interface Match {
  id: number;
  user1_id: number;
  user2_id: number;
  matched_at: string;
  is_opened: boolean;
  opened_at?: string;
  user1: User;
  user2: User;
}

// Chat Types
export interface Conversation {
  id: number;
  user1_id: number;
  user2_id: number;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  user1: User;
  user2: User;
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  sequence_number: number;
  client_nonce: string;
  sent_at: string;
  created_at: string;
  updated_at: string;
  sender: User;
}

// Photo Types
export interface Photo {
  id: number;
  user_id: number;
  url: string;
  order: number;
  is_primary: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Profile management types
export interface ProfileUpdateRequest {
  display_name?: string;
  bio?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  interested_in?: 'male' | 'female' | 'both';
  location?: string;
}

export interface PhotoUploadRequest {
  image: string; // base64 encoded image
  order?: number;
}

export interface PhotoUpdateRequest {
  order?: number;
  is_primary?: boolean;
}

export interface ProfileWithPhotos extends Profile {
  photos: Photo[];
}

// Game Types
export type GameChoice = 'rock' | 'paper' | 'scissors';
export type GameStatus = 'waiting' | 'playing' | 'completed' | 'expired';

export interface GameSession {
  id: number;
  conversation_id: number;
  initiator_id: number;
  status: GameStatus;
  best_of: number;
  current_round: number;
  started_at?: string;
  completed_at?: string;
  winner_id?: number;
  created_at: string;
  updated_at: string;
  initiator: User;
}

export interface GameResult {
  id: number;
  game_session_id: number;
  round_number: number;
  initiator_choice: GameChoice;
  participant_choice: GameChoice;
  winner_id?: number;
  played_at: string;
  created_at: string;
}

// WebSocket Event Types
export interface MessageEvent {
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

export interface GameStartedEvent {
  game_session_id: number;
  conversation_id: number;
  status: GameStatus;
  best_of: number;
  initiator: {
    id: number;
    name: string;
  };
  participant: {
    id: number;
    name: string;
  };
  started_at: string;
}

export interface UserJoinedEvent {
  user_id: number;
  conversation_id: number;
  user: {
    id: number;
    name: string;
    profile?: {
      display_name: string;
      primary_photo_url?: string;
    };
  };
  joined_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev?: string;
    next?: string;
  };
}

// Error Types
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}