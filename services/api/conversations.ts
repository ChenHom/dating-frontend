/**
 * Conversation API
 * 對話管理相關的 API 函式
 */

import { apiClient } from './client';

export interface BlockConversationRequest {
  target_user_id: number;
}

export interface ReportConversationRequest {
  target_user_id: number;
  type: 'ABUSE' | 'NUDITY' | 'SPAM' | 'OTHER';
  reason?: string;
}

/**
 * 封鎖對話中的對方使用者
 */
export async function blockConversationUser(request: BlockConversationRequest): Promise<void> {
  await apiClient['client'].post('/blocks', request);
}

/**
 * 檢舉對話中的對方使用者
 */
export async function reportConversationUser(request: ReportConversationRequest): Promise<void> {
  await apiClient['client'].post('/reports', request);
}

/**
 * 刪除對話（軟刪除）
 */
export async function deleteConversation(conversationId: number): Promise<void> {
  await apiClient['client'].delete(`/conversation/conversations/${conversationId}`);
}

/**
 * 靜音對話
 */
export async function muteConversation(conversationId: number): Promise<void> {
  await apiClient['client'].put(`/conversation/conversations/${conversationId}/mute`);
}

/**
 * 取消靜音對話
 */
export async function unmuteConversation(conversationId: number): Promise<void> {
  await apiClient['client'].put(`/conversation/conversations/${conversationId}/unmute`);
}

/**
 * 恢復已刪除的對話
 */
export async function restoreConversation(conversationId: number): Promise<void> {
  await apiClient['client'].put(`/conversation/conversations/${conversationId}/restore`);
}
