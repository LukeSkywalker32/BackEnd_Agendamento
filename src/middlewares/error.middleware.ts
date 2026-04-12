import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError";

export function errorMiddleware(
   error: Error,
   _req: Request,
   res: Response,
   _next: NextFunction,
): void {
   if (error instanceof ApiError) {
      res.status(error.statusCode).json({
         status: "error",
         message: error.message,
      });
      return;
   }

   if (error.name === "ValidationError") {
      res.status(400).json({
         status: "error",
         message: error.message,
      });
      return;
   }

   if (error.name === "CastError") {
      res.status(400).json({
         status: "error",
         message: "ID inválido",
      });
      return;
   }

   if ((error as NodeJS.ErrnoException).code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
         status: "error",
         message: "Arquivo excede o tamanho máximo permitido",
      });
      return;
   }

   console.error("❌ Erro não tratado:", error);

   res.status(500).json({
      status: "error",
      message: "Erro interno do servidor",
   });
}
