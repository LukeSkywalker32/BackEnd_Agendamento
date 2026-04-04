import { z } from 'zod'

export const createSchedulingSchema = z.object({
  body: z.object({
    companyId: z.string().min(1, 'Empresa de insumos é obrigatória'),
    timeWindowId: z.string().min(1, 'Janela de horário é obrigatória'),
    driverName: z.string().min(3, 'Nome do motorista deve ter pelo menos 3 caracteres'),
    driverCpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
    driverPhone: z.string().optional(),
    vehiclePlate: z
      .string()
      .min(7, 'Placa inválida')
      .max(8, 'Placa inválida')
      .transform(val => val.toUpperCase()),
    vehicleType: z.string().min(1, 'Tipo do veículo é obrigatório'),
    cargoDescription: z.string().optional(),
  }),
})

export const updateSchedulingSchema = z.object({
  body: z.object({
    driverName: z.string().min(3).optional(),
    driverCpf: z.string().min(11).max(14).optional(),
    driverPhone: z.string().optional(),
    vehiclePlate: z
      .string()
      .min(7)
      .max(8)
      .transform(val => val.toUpperCase())
      .optional(),
    vehicleType: z.string().min(1).optional(),
    cargoDescription: z.string().optional(),
  }),
})

export const schedulingParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID é obrigatório'),
  }),
})
