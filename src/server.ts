import app from './app'
import { env } from './config/env'
import { connectDatabase } from './config/database'

async function bootstrap() {
  await connectDatabase()

  app.listen(env.PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${env.PORT}`)
    console.log(`📋 Ambiente: ${env.NODE_ENV}`)
    console.log(`🔗 http://localhost:${env.PORT}`)
    console.log(`❤️  Health: http://localhost:${env.PORT}/health`)
  })
}

bootstrap().catch(error => {
  console.error('❌ Erro ao iniciar servidor:', error)
  process.exit(1)
})
