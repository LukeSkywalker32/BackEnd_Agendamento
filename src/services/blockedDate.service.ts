import { BlockedDate } from "../models/BlockedDate";
import { TimeWindow } from "../models/TimeWindow";
import { ApiError } from "../utils/apiError";

interface CreateBlockedDateData {
   companyId: string;
   date: string;
   reason: string;
}

export async function createBlockedDate(data: CreateBlockedDateData) {
   const blockedDate = new Date(data.date + "T00:00:00.000Z");
   //blockedDate.setHours(0, 0, 0, 0);

   const existing = await BlockedDate.findOne({
      companyId: data.companyId,
      date: blockedDate,
   });

   if (existing) {
      throw ApiError.conflict("Esta data já está bloqueada");
   }

   const activeWindows = await TimeWindow.countDocuments({
      companyId: data.companyId,
      date: blockedDate,
      isActive: true,
      currentCount: { $gt: 0 },
   });

   if (activeWindows > 0) {
      throw ApiError.badRequest(
         "Não é possível bloquear uma data que já possui agendamentos. Cancele os agendamentos primeiro.",
      );
   }

   await TimeWindow.updateMany(
      { companyId: data.companyId, date: blockedDate, isActive: true },
      { isActive: false },
   );

   return BlockedDate.create({
      companyId: data.companyId,
      date: blockedDate,
      reason: data.reason,
   });
}

export async function getBlockedDatesByCompany(companyId: string) {
   return BlockedDate.find({
      companyId,
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
   }).sort({ date: 1 });
}

export async function deleteBlockedDate(id: string, companyId: string) {
   const blocked = await BlockedDate.findOne({ _id: id, companyId });

   if (!blocked) {
      throw ApiError.notFound("Data bloqueada não encontrada");
   }

   await BlockedDate.deleteOne({ _id: id });
}
