import request from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import app from '../app'
import { User } from '../models/User'
import jwt from 'jsonwebtoken'

describe('Auth Endpoints', () => {
  const adminData = {
    name: 'Admin Test',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
    document: '00100000000082',
  }

  let adminToken: string

  beforeEach(async () => {
    // Para testar rota de registro, precisamos de um admin logado
    const admin = await User.create({
      ...adminData,
      password: 'hashedpassword',
    })
    adminToken = jwt.sign(
      { userId: String(admin._id), role: admin.role },
      process.env.JWT_SECRET || 'test-secret',
    )
  })

  it('should register a new company when requested by admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Company SA',
        email: 'company@test.com',
        password: 'password123',
        role: 'company',
        document: '00100000000163', 
      })

    if (res.status === 400) console.log(res.body)
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('success')
    expect(res.body.data).toHaveProperty('_id')
    expect(res.body.data.role).toBe('company')
    expect(res.body.data.document).toBe('00100000000163') // Deve salvar apenas os números
  })

  it('should fail to register if not admin', async () => {
    const userToken = jwt.sign(
      { userId: 'fakeid', role: 'company' },
      process.env.JWT_SECRET || 'test-secret',
    )

    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Carrier SA',
        email: 'carrier@test.com',
        password: 'password123',
        role: 'carrier',
        document: '00100000000244',
      })

    expect(res.status).toBe(403) // Forbidden, pois roleMiddleware barra
  })

  it('should login an existing user', async () => {
    // Precisamos criar pela rota para triggar o hash de senha
    await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Login Test',
        email: 'login@test.com',
        password: 'password123',
        role: 'carrier',
        document: '00100000000244',
      })

    const res = await request(app).post('/api/auth/login').send({
      email: 'login@test.com',
      password: 'password123',
    })

    if (res.status === 401 || res.status === 400) console.log(res.body)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('tokens')
    expect(res.body.data.tokens).toHaveProperty('accessToken')
    expect(res.body.data.tokens).toHaveProperty('refreshToken')
    expect(res.body.data.user.email).toBe('login@test.com')
    // Não deve expor a senha no json
    expect(res.body.data.user).not.toHaveProperty('password')
  })
})
