import { z } from "zod";

// Empresa Cadastrando uma transportadora com role fixo = carrier
export const registerCarrierSchema = z.object({
   body: z.object({
      name: z.string().min(3, "Nome deve ter pelo menos três caracteres"),
      email: z.email("E-mail inválido"),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      document: z.string().min(11, "Documento inválido (CNPJ/CPF)"),
      phone: z.string().optional(),
   }),
});
