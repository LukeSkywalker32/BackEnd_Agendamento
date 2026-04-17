import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AuthRequest, JwtPayload } from "../types";
import { ApiError } from "../utils/apiError";

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
   const authHeader = req.headers.authorization;

   if (!authHeader) {
      next(ApiError.unauthorized("Token não fornecido"));
      return;
   }

   const parts = authHeader.split(" ");

   if (parts.length !== 2 || parts[0] !== "Bearer") {
      next(ApiError.unauthorized("Token mal formatado"));
      return;
   }

   const token = parts[1];

   try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      req.user = decoded;
      next();
   } catch {
      next(ApiError.unauthorized("Token inválido ou expirado"));
      return;
   }
}
