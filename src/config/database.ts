import mongoose from 'mongoose'
import { env } from './env'

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI)
    console.log('✅ MongoDB Atlas conectado com sucesso')
  } catch (error) {
    console.error('❌ Erro ao conectar no MongoDB:', error)
    process.exit(1)
  }

  mongoose.connection.on('error', error => {
    console.error('❌ Erro na conexão MongoDB:', error)
  })

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB desconectado')
  })
}
