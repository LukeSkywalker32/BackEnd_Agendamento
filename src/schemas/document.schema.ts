import { z } from 'zod'

export const validateDocumentSchema = z.object({
  body: z.object({
    status: z.enum(['approved', 'rejected'], {
      message: 'Status deve ser: approved ou rejected',
    }),
    rejectionReason: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'ID do agendamento é obrigatório'),
  }),
})

export const driverCpfSchema = z.object({
  params: z.object({
    cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
  }),
})

export const checkinSchema = z.object({
  body: z.object({
    cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
  }),
})
