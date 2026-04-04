import { CheckIn } from '../models/CheckIn'
import { Scheduling } from '../models/Scheduling'
import { TimeWindow } from '../models/TimeWindow'
import type { CheckInStatus } from '../types'
import { ApiError } from '../utils/apiError'
import { cleanCPF, isValidCPF } from '../utils/cpf'

export async function getSchedulingsByCpf(cpf: string) {
  const cleanedCpf = cleanCPF(cpf)

  if (!isValidCPF(cleanedCpf)) {
    throw ApiError.badRequest('CPF inválido')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const schedulings = await Scheduling.find({
    driverCpf: cleanedCpf,
    status: { $in: ['pending', 'confirmed'] },
  })
    .populate('companyId', 'name document')
    .populate('timeWindowId', 'date startTime endTime')
    .sort({ createdAt: -1 })

  return schedulings
}

export async function performCheckin(cpf: string) {
  const cleanedCpf = cleanCPF(cpf)

  if (!isValidCPF(cleanedCpf)) {
    throw ApiError.badRequest('CPF inválido')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const scheduling = await Scheduling.findOne({
    driverCpf: cleanedCpf,
    status: 'confirmed',
  }).populate('timeWindowId')

  if (!scheduling) {
    const pending = await Scheduling.findOne({
      driverCpf: cleanedCpf,
      status: 'pending',
    })

    if (pending) {
      if (pending.documentStatus === 'pending') {
        throw ApiError.badRequest('Seus documentos ainda estão em análise. Aguarde a aprovação.')
      }
      if (pending.documentStatus === 'rejected') {
        throw ApiError.badRequest(
          `Seus documentos foram rejeitados. Motivo: ${pending.rejectionReason}`,
        )
      }
    }

    throw ApiError.notFound('Nenhum agendamento confirmado encontrado para este CPF')
  }

  const existingCheckin = await CheckIn.findOne({ schedulingId: scheduling._id })
  if (existingCheckin) {
    throw ApiError.conflict('Check-in já realizado para este agendamento')
  }

  const timeWindow = scheduling.timeWindowId as unknown as {
    date: Date
    startTime: string
    endTime: string
  }

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const [startH, startM] = timeWindow.startTime.split(':').map(Number)
  const [endH, endM] = timeWindow.endTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  let checkinStatus: CheckInStatus

  if (currentMinutes < startMinutes - 30) {
    checkinStatus = 'early'
  } else if (currentMinutes > endMinutes) {
    checkinStatus = 'late'
  } else {
    checkinStatus = 'on_time'
  }

  const checkin = await CheckIn.create({
    schedulingId: scheduling._id,
    driverCpf: cleanedCpf,
    checkinTime: now,
    status: checkinStatus,
  })

  scheduling.status = 'checked_in'
  await scheduling.save()

  return {
    checkin,
    scheduling: await scheduling.populate([
      { path: 'companyId', select: 'name' },
      { path: 'timeWindowId', select: 'date startTime endTime' },
    ]),
    message:
      checkinStatus === 'on_time'
        ? '✅ Check-in realizado com sucesso!'
        : checkinStatus === 'early'
          ? '⚠️ Check-in realizado — você chegou antes do horário'
          : '⚠️ Check-in realizado — você chegou atrasado',
  }
}

export async function getCheckinsByCompany(companyId: string) {
  const schedulings = await Scheduling.find({
    companyId,
    status: { $in: ['checked_in', 'completed'] },
  }).select('_id')

  const schedulingIds = schedulings.map(s => s._id)

  return CheckIn.find({ schedulingId: { $in: schedulingIds } })
    .populate({
      path: 'schedulingId',
      select: 'driverName vehiclePlate vehicleType carrierId companyId',
      populate: [
        { path: 'carrierId', select: 'name' },
        { path: 'companyId', select: 'name' },
      ],
    })
    .sort({ checkinTime: -1 })
}
