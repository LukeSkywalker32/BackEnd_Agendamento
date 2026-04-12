import { z } from "zod";

export const createBlockedDateSchema = z.object({
   body: z.object({
      date: z.string().min(1, "Data é obrigatória"),
      reason: z.string().min(1, "Motivo é obrigatório"),
   }),
});

export const blockedDateParamsSchema = z.object({
   params: z.object({
      id: z.string().min(1, "ID é obrigatório"),
   }),
});
