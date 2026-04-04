import type { NextFunction, Response } from 'express'
import type { AuthRequest, UserRole } from '../types'
import { ApiError } from '../utils/apiError'

export function roleMiddleware(...roles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized('Usuário não autenticado')
    }

    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('Você não tem permissão para acessar este recurso')
    }

    next()
  }
}
