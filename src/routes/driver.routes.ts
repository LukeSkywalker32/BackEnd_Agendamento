import { Router } from 'express'
import * as driverController from '../controllers/driver.controller'
import { validate } from '../middlewares/validate.middleware'
import { checkinSchema, driverCpfSchema } from '../schemas/document.schema'

const router = Router()

// Rotas públicas — motorista não precisa de login
router.get('/schedulings/:cpf', validate(driverCpfSchema), driverController.getSchedulingsByCpf)
router.post('/checkin', validate(checkinSchema), driverController.performCheckin)

export default router
