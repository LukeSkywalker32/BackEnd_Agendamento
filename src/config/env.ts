import 'dotenv'
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  MONGODB_URI: z.string().url('MONGODB_URI é obrigatória'),

  JWT_SECRET: z.string().min(10, 'JWT_SECRET deve ter pelo menos 10 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  JWT_REFRESH_SECRET: z.string().min(10, 'JWT_REFRESH_SECRET deve ter pelo menos 10 caracteres'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  UPLOAD_MAX_SIZE_MB: z.coerce.number().default(10),
  UPLOAD_DIR: z.string().default('uploads'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
