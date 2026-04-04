import { Scheduling } from '../models/Scheduling'
import { ApiError } from '../utils/apiError'

interface ValidateDocumentData {
  schedulingId: string
  companyId: string
  status: 'approved' | 'rejected'
  rejectionReason?: string
}

export async function validateDocument(data: ValidateDocumentData) {
  const scheduling = await Scheduling.findOne({
    _id: data.schedulingId,
    companyId: data.companyId,
  })

  if (!scheduling) {
    throw ApiError.notFound('Agendamento não encontrado')
  }

  if (scheduling.documents.length === 0) {
    throw ApiError.badRequest('Nenhum documento enviado para validar')
  }

  if (scheduling.status === 'cancelled') {
    throw ApiError.badRequest('Agendamento cancelado')
  }

  scheduling.documentStatus = data.status

  if (data.status === 'approved') {
    scheduling.status = 'confirmed'
    scheduling.rejectionReason = ''
  } else {
    scheduling.rejectionReason = data.rejectionReason || 'Documento rejeitado'
  }

  return scheduling.save()
}
