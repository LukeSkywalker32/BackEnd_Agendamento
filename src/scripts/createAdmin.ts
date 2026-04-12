import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { env } from '../config/env'

async function main() {
  await mongoose.connect(env.MONGODB_URI);

  const password= await bcrypt.hash('Admin@123', 10)

  await User.create({
    name: 'Admin SATA',
    email: "admin@sata.com.br",
    password,
    role: 'admin',
    document: '00000000000',
    isActive: true,
  })

  console.log('Usuário admin criado com sucesso!')
  await mongoose.disconnect()
}

main().catch(console.error)