import { z } from "zod";

export const createBlockedDateSchema = z.object({
   body: z.object({
      date: z
         .string()
         .refine(val => !Number.isNaN(Date.parse(val)), "Data inválida")
         .refine(val => {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            return new Date(`${val}T00:00:00.000Z`) >= today;
         }, "Data não pode ser no passado"),
      reason: z.string().min(1, "Motivo é obrigatório"),
   }),
});

export const blockedDateParamsSchema = z.object({
   params: z.object({
      id: z.string().min(1, "ID é obrigatório"),
   }),
});
