import { z } from 'zod'

const timeRegex = /^\d{2}:\d{2}$/

export const createTimeWindowSchema = z.object({
  body: z.object({
    date: z.string().min(1, 'Data é obrigatória'),
    startTime: z.string().regex(timeRegex, 'Formato de horário inválido (HH:mm)'),
    endTime: z.string().regex(timeRegex, 'Formato de horário inválido (HH:mm)'),
    maxVehicles: z.coerce.number().min(1, 'Mínimo de 1 veículo'),
  }),
})

export const updateTimeWindowSchema = z.object({
  body: z.object({
    startTime: z.string().regex(timeRegex, 'Formato inválido (HH:mm)').optional(),
    endTime: z.string().regex(timeRegex, 'Formato inválido (HH:mm)').optional(),
    maxVehicles: z.coerce.number().min(1).optional(),
    isActive: z.boolean().optional(),
  }),
})

export const timeWindowParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID é obrigatório'),
  }),
})
