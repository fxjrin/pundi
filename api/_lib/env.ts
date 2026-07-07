import { z } from 'zod'

// Fails fast (at import time) if a required var is missing, rather than surfacing a
// confusing downstream error the first time a handler tries to use it.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is not set'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is not set'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is not set'),
})

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
})
