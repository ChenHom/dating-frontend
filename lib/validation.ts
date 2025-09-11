/**
 * Validation Schemas
 * 表單驗證規則 (Zod)
 */

import { z } from 'zod';

// Profile validation schema
export const profileUpdateSchema = z.object({
  display_name: z
    .string()
    .min(2, '顯示名稱至少需要 2 個字元')
    .max(50, '顯示名稱不能超過 50 個字元')
    .optional(),
    
  bio: z
    .string()
    .max(500, '個人簡介不能超過 500 個字元')
    .optional(),
    
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效的生日格式 (YYYY-MM-DD)')
    .optional(),
    
  gender: z
    .enum(['male', 'female', 'other'])
    .optional(),
    
  interested_in: z
    .enum(['male', 'female', 'both'])
    .optional(),
    
  location: z
    .string()
    .max(100, '地點不能超過 100 個字元')
    .optional(),
});

export type ProfileFormData = z.infer<typeof profileUpdateSchema>;

// Photo upload validation
export const photoUploadSchema = z.object({
  image: z.string().min(1, '請選擇要上傳的照片'),
  order: z.number().min(1).max(6).optional(),
});

export type PhotoFormData = z.infer<typeof photoUploadSchema>;