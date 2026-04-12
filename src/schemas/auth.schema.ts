import { z } from "zod";

export const loginSchema = z.object({
   body: z.object({
      email: z.string().email("E-mail inválido"),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
   }),
});

export const registerSchema = z.object({
   body: z.object({
      name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
      email: z.string().email("E-mail inválido"),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      role: z.enum(["admin", "company", "carrier"], {
         message: "Role deve ser: admin, company ou carrier",
      }),
      document: z.string().min(11, "Documento inválido"),
      phone: z.string().optional(),
   }),
});

export const refreshTokenSchema = z.object({
   body: z.object({
      refreshToken: z.string().min(1, "Refresh token é obrigatório"),
   }),
});
