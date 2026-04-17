import type { NextFunction, Response } from "express";
import type { AuthRequest, UserRole } from "../types";
import { ApiError } from "../utils/apiError";

export function roleMiddleware(...roles: UserRole[]) {
   return (req: AuthRequest, _res: Response, next: NextFunction): void => {
      if (!req.user) {
         next(ApiError.unauthorized("Usuário não autenticado"));
         return;
      }

      if (!roles.includes(req.user.role)) {
         next(ApiError.forbidden("Você não tem permissão para acessar este recurso"));
         return;
      }

      next();
   };
}
