import { z } from "zod";

export const createBalanceSchema = z.object({
   body: z.object({
      productId: z.string().min(1, "Produto é obrigatório"),
      date: z
         .string()
         .refine(val => !Number.isNaN(Date.parse(val)), "Data inválida")
         .refine(val => {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            return new Date(`${val}T00:00:00.000Z`) >= today;
         }, "Data não pode ser no passado"),
      totalAmount: z.coerce.number().positive("Quantidade total deve ser maior que zero"),
   }),
});

export const updateBalanceSchema = z.object({
   body: z.object({
      totalAmount: z.coerce
         .number()
         .positive("Quantidade total deve ser maior que zero")
         .optional(),
   }),
});
export const balanceParamsSchema = z.object({
   params: z.object({
      id: z.string().min(1, "ID é obrigatório"),
   }),
});
export const balanceQuerySchema = z.object({
   query: z.object({
      date: z.string().optional(),
      productId: z.string().optional(),
   }),
});
