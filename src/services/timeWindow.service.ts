import { BlockedDate } from "../models/BlockedDate";
import { TimeWindow } from "../models/TimeWindow";
import { ApiError } from "../utils/apiError";

interface CreateTimeWindowData {
   companyId: string;
   date: string;
   startTime: string;
   endTime: string;
   maxVehicles: number;
}

interface UpdateTimeWindowData {
   startTime?: string;
   endTime?: string;
   maxVehicles?: number;
   isActive?: boolean;
}

export async function createTimeWindow(data: CreateTimeWindowData) {
   const windowDate = new Date(data.date + "T00:00:00.000Z");
   //windowDate.setHours(0, 0, 0, 0);

   const blocked = await BlockedDate.findOne({
      companyId: data.companyId,
      date: windowDate,
   });

   if (blocked) {
      throw ApiError.badRequest(`Data bloqueada: ${blocked.reason}`);
   }

   const existing = await TimeWindow.findOne({
      companyId: data.companyId,
      date: windowDate,
      startTime: data.startTime,
      endTime: data.endTime,
      isActive: true,
   });

   if (existing) {
      throw ApiError.conflict("Já existe uma janela de horário com esses dados");
   }

   const [startH, startM] = data.startTime.split(":").map(Number);
   const [endH, endM] = data.endTime.split(":").map(Number);

   if (startH * 60 + startM >= endH * 60 + endM) {
      throw ApiError.badRequest("Horário de início deve ser anterior ao horário de fim");
   }

   return TimeWindow.create({
      ...data,
      date: windowDate,
   });
}

export async function getTimeWindowsByCompany(companyId: string, dateFilter?: string) {
   const query: Record<string, unknown> = { companyId, isActive: true };

   if (dateFilter) {
      const date = new Date(dateFilter + "T00:00:00.000Z");
      //date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: date, $lt: nextDay };
   } else {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      query.date = { $gte: today };
   }

   return TimeWindow.find(query).sort({ date: 1, startTime: 1 });
}

export async function getAvailableTimeWindows(companyId: string, dateFilter?: string) {
   const windows = await getTimeWindowsByCompany(companyId, dateFilter);
   return windows.filter(w => w.currentCount < w.maxVehicles);
}

export async function updateTimeWindow(id: string, companyId: string, data: UpdateTimeWindowData) {
   const window = await TimeWindow.findOne({ _id: id, companyId });

   if (!window) {
      throw ApiError.notFound("Janela de horário não encontrada");
   }

   if (data.maxVehicles !== undefined && data.maxVehicles < window.currentCount) {
      throw ApiError.badRequest(
         `Limite não pode ser menor que a quantidade atual de agendamentos (${window.currentCount})`,
      );
   }

   Object.assign(window, data);
   return window.save();
}

export async function deleteTimeWindow(id: string, companyId: string) {
   const window = await TimeWindow.findOne({ _id: id, companyId });

   if (!window) {
      throw ApiError.notFound("Janela de horário não encontrada");
   }

   if (window.currentCount > 0) {
      throw ApiError.badRequest("Não é possível remover uma janela com agendamentos ativos");
   }

   await TimeWindow.deleteOne({ _id: id });
}
