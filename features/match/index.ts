/**
 * Match Feature Exports
 * 配對功能模組導出
 */

// Components
export { SwipeCard } from './components/SwipeCard';
export type { SwipeCardRef } from './components/SwipeCard';

// Screens
export { DiscoverScreen } from './DiscoverScreen';
export { MatchSuccessScreen } from './MatchSuccessScreen';
export { MatchesScreen } from './MatchesScreen';

// Types (re-export from lib/types)
export type { 
  Match, 
  LikeResponse, 
  FeedUser 
} from '@/lib/types';