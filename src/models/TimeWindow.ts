import mongoose, { type Document, Schema } from 'mongoose'

export interface ITimeWindow extends Document {
  companyId: mongoose.Types.ObjectId
  date: Date
  startTime: string
  endTime: string
  maxVehicles: number
  currentCount: number
  isActive: boolean
  createdAt: Date
}

const timeWindowSchema = new Schema<ITimeWindow>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Empresa é obrigatória'],
    },
    date: {
      type: Date,
      required: [true, 'Data é obrigatória'],
    },
    startTime: {
      type: String,
      required: [true, 'Horário de início é obrigatório'],
      match: [/^\d{2}:\d{2}$/, 'Formato de horário inválido (HH:mm)'],
    },
    endTime: {
      type: String,
      required: [true, 'Horário de fim é obrigatório'],
      match: [/^\d{2}:\d{2}$/, 'Formato de horário inválido (HH:mm)'],
    },
    maxVehicles: {
      type: Number,
      required: [true, 'Limite de veículos é obrigatório'],
      min: [1, 'Mínimo de 1 veículo'],
    },
    currentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

timeWindowSchema.index({ companyId: 1, date: 1 })
timeWindowSchema.index({ date: 1, isActive: 1 })

export const TimeWindow = mongoose.model<ITimeWindow>('TimeWindow', timeWindowSchema)
