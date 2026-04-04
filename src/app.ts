import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'node:path'
import { env } from './config/env'
import { errorMiddleware } from './middlewares/error.middleware'
import routes from './routes'

const app = express()

// Segurança
app.use(helmet())
app.use(cors())

// Parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logger
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// Servir arquivos de upload
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)))

// Rotas
app.use('/api', routes)

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  })
})

// Error handler (deve ser o último middleware)
app.use(errorMiddleware)

export default app
