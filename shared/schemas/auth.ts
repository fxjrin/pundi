import { z } from 'zod'

// Used both client-side (react-hook-form, for UX) and server-side (the real security
// boundary, in every api/auth/* handler) so the two never drift apart.

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
})
export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z.string().min(8).max(72).optional(),
  })
  .refine((data) => !data.newPassword || data.currentPassword, {
    message: 'Current password is required to set a new password',
    path: ['currentPassword'],
  })
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
