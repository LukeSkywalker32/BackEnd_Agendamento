import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      MONGODB_URI: 'mongodb://127.0.0.1:27017/dummy',
      JWT_SECRET: 'test-secret-key-123456789',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_SECRET: 'test-refresh-secret-123456789',
      JWT_REFRESH_EXPIRES_IN: '7d',
      UPLOAD_DIR: 'uploads'
    },
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    // Executa testes sequencialmente caso problemas com concorrência no MongoDB em memória
    fileParallelism: false,
  },
})
