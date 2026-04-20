import { z } from "zod";

const unitEnum = z.enum(["ton", "kg", "sacas", "litros", "litros", "m3"], {
   message: "Unidade invalida. Use: ton, kg, sacas, litros ou m3",
});

export const createProductSchema = z.object({
   body: z.object({
      name: z
         .string()
         .min(2, "Nome deve ter no mínimo 2 caracteres")
         .max(100, "Nome deve ter no máximo 100 caracteres")
         .trim(),
      unit: unitEnum,
      description: z.string().max(500).optional(),
   }),
});
export const updateProductSchema = z.object({
   body: z.object({
      name: z.string().min(2).max(100).trim().optional(),
      unit: unitEnum.optional(),
      description: z.string().max(500).optional(),
      isActive: z.boolean().optional(),
   }),
});
export const productParamsSchema = z.object({
   params: z.object({
      id: z.string().min(1, "ID é obrigatório"),
   }),
});
