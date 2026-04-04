import { Router } from 'express'
import * as authController from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { roleMiddleware } from '../middlewares/role.middleware'
import { validate } from '../middlewares/validate.middleware'
import { loginSchema, refreshTokenSchema, registerSchema } from '../schemas/auth.schema'

const router = Router()

router.post('/login', validate(loginSchema), authController.login)

router.post(
  '/register',
  authMiddleware,
  roleMiddleware('admin'),
  validate(registerSchema),
  authController.register,
)

router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken)

router.post('/logout', authController.logout)

export default router
