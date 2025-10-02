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
 * 注意：後端目前可能尚未實作此端點，需要確認或新增
 */
export async function deleteConversation(conversationId: number): Promise<void> {
  // TODO: 確認後端是否有實作 DELETE /conversations/{id} 端點
  // 暫時拋出錯誤提示需要後端支援
  throw new Error('刪除對話功能需要後端 API 支援：DELETE /api/conversations/{id}');
}

/**
 * 靜音對話
 * 注意：後端目前可能尚未實作此端點，需要確認或新增
 */
export async function muteConversation(conversationId: number): Promise<void> {
  // TODO: 確認後端是否有實作 PUT /conversations/{id}/mute 端點
  // 暫時拋出錯誤提示需要後端支援
  throw new Error('靜音對話功能需要後端 API 支援：PUT /api/conversations/{id}/mute');
}
