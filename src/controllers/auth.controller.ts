import type { NextFunction, Request, Response } from "express";
import * as authService from "../services/auth.service";

export async function login(req: Request, res: Response, next: NextFunction) {
   try {
      const result = await authService.login(req.body);
      res.json({ status: "success", data: result });
   } catch (error) {
      next(error);
   }
}

export async function register(req: Request, res: Response, next: NextFunction) {
   try {
      const user = await authService.register(req.body);
      res.status(201).json({ status: "success", data: user });
   } catch (error) {
      next(error);
   }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
   try {
      const tokens = await authService.refreshAccessToken(req.body.refreshToken);
      res.json({ status: "success", data: tokens });
   } catch (error) {
      next(error);
   }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
   try {
      await authService.logout(req.body.refreshToken);
      res.json({ status: "success", message: "Logout realizado com sucesso" });
   } catch (error) {
      next(error);
   }
}
