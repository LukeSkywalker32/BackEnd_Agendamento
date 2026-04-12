import type { NextFunction, Request, Response } from "express";
import { type ZodObject, type ZodRawShape, ZodError } from "zod";
import { ApiError } from "../utils/apiError.js";

export function validate(schema: ZodObject<ZodRawShape>) {
   return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      try {
         const parsed = await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
         });

         if (parsed.body) req.body = parsed.body;
         if (parsed.query) req.query = parsed.query as typeof req.query;
         if (parsed.params) req.params = parsed.params as typeof req.params;

         next();
      } catch (error) {
         if (error instanceof ZodError) {
            const messages = error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
            next(ApiError.badRequest(messages));
            return;
         }
         next(error);
      }
   };
}
