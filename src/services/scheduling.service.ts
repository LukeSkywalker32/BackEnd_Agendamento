import { BlockedDate } from "../models/BlockedDate";
import { Scheduling } from "../models/Scheduling";
import { TimeWindow } from "../models/TimeWindow";
import { User } from "../models/User";
import type { SchedulingDocument } from "../types";
import { ApiError } from "../utils/apiError";
import { cleanCPF, isValidCPF } from "../utils/cpf";

interface CreateSchedulingData {
   carrierId: string;
   companyId: string;
   timeWindowId: string;
   driverName: string;
   driverCpf: string;
   driverPhone?: string;
   vehiclePlate: string;
   vehicleType: string;
   cargoDescription?: string;
}

interface UpdateSchedulingData {
   driverName?: string;
   driverCpf?: string;
   driverPhone?: string;
   vehiclePlate?: string;
   vehicleType?: string;
   cargoDescription?: string;
}

export async function createScheduling(data: CreateSchedulingData, files?: Express.Multer.File[]) {
   const cpf = cleanCPF(data.driverCpf);
   if (!isValidCPF(cpf)) {
      throw ApiError.badRequest("CPF do motorista inválido");
   }
   data.driverCpf = cpf;

   const company = await User.findOne({ _id: data.companyId, role: "company", isActive: true });
   if (!company) {
      throw ApiError.notFound("Empresa de insumos não encontrada");
   }

   const timeWindow = await TimeWindow.findOne({
      _id: data.timeWindowId,
      companyId: data.companyId,
      isActive: true,
   });

   if (!timeWindow) {
      throw ApiError.notFound("Janela de horário não encontrada");
   }

   const blocked = await BlockedDate.findOne({
      companyId: data.companyId,
      date: timeWindow.date,
   });

   if (blocked) {
      throw ApiError.badRequest(`Data bloqueada: ${blocked.reason}`);
   }

   const documents: SchedulingDocument[] = (files || []).map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
   }));

   // Reservar vaga atomicamente — protege contra race condition
   const windowReserved = await TimeWindow.findOneAndUpdate(
      {
         _id: data.timeWindowId,
         isActive: true,
         $expr: { $lt: ["$currentCount", "$maxVehicles"] },
      },
      { $inc: { currentCount: 1 } },
   );

   if (!windowReserved) {
      throw ApiError.badRequest("Janela de horário lotada. Escolha outro horário.");
   }

   try {
      const scheduling = await Scheduling.create({
         ...data,
         documents,
         documentStatus: documents.length > 0 ? "pending" : "not_attached",
      });

      return scheduling.populate([
         { path: "companyId", select: "name document" },
         { path: "timeWindowId", select: "date startTime endTime" },
      ]);
   } catch (err) {
      // Rollback do contador se a criação do agendamento falhar
      await TimeWindow.updateOne({ _id: data.timeWindowId }, { $inc: { currentCount: -1 } });
      throw err;
   }
}

export async function getSchedulingsByCarrier(carrierId: string, status?: string) {
   const query: Record<string, unknown> = { carrierId };
   if (status) {
      query.status = status;
   }

   return Scheduling.find(query)
      .populate("companyId", "name document")
      .populate("timeWindowId", "date startTime endTime")
      .sort({ createdAt: -1 });
}

export async function getSchedulingsByCompany(companyId: string, status?: string) {
   const query: Record<string, unknown> = { companyId };
   if (status) {
      query.status = status;
   }

   return Scheduling.find(query)
      .populate("carrierId", "name document")
      .populate("timeWindowId", "date startTime endTime")
      .sort({ createdAt: -1 });
}

export async function getSchedulingById(id: string) {
   const scheduling = await Scheduling.findById(id)
      .populate("carrierId", "name document phone")
      .populate("companyId", "name document phone")
      .populate("timeWindowId", "date startTime endTime maxVehicles currentCount");

   if (!scheduling) {
      throw ApiError.notFound("Agendamento não encontrado");
   }

   return scheduling;
}

export async function updateScheduling(id: string, carrierId: string, data: UpdateSchedulingData) {
   const scheduling = await Scheduling.findOne({ _id: id, carrierId });

   if (!scheduling) {
      throw ApiError.notFound("Agendamento não encontrado");
   }

   if (["checked_in", "completed", "cancelled"].includes(scheduling.status)) {
      throw ApiError.badRequest("Não é possível editar um agendamento com este status");
   }

   if (data.driverCpf) {
      const cpf = cleanCPF(data.driverCpf);
      if (!isValidCPF(cpf)) {
         throw ApiError.badRequest("CPF do motorista inválido");
      }
      data.driverCpf = cpf;
   }

   Object.assign(scheduling, data);
   return scheduling.save();
}

export async function cancelScheduling(id: string, carrierId: string) {
   const scheduling = await Scheduling.findOne({ _id: id, carrierId });

   if (!scheduling) {
      throw ApiError.notFound("Agendamento não encontrado");
   }

   if (["checked_in", "completed", "cancelled"].includes(scheduling.status)) {
      throw ApiError.badRequest("Não é possível cancelar um agendamento com este status");
   }

   scheduling.status = "cancelled";
   await scheduling.save();

   await TimeWindow.updateOne(
      { _id: scheduling.timeWindowId, currentCount: { $gt: 0 } },
      { $inc: { currentCount: -1 } },
   );

   return scheduling;
}

export async function uploadSchedulingDocuments(
   id: string,
   carrierId: string,
   files: Express.Multer.File[],
) {
   const scheduling = await Scheduling.findOne({ _id: id, carrierId });

   if (!scheduling) {
      throw ApiError.notFound("Agendamento não encontrado");
   }

   if (["cancelled", "completed"].includes(scheduling.status)) {
      throw ApiError.badRequest("Não é possível enviar documentos para este agendamento");
   }

   const newDocuments: SchedulingDocument[] = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
   }));

   scheduling.documents.push(...newDocuments);
   scheduling.documentStatus = "pending";
   return scheduling.save();
}

export async function getAllSchedulings(status?: string) {
   const query: Record<string, unknown> = {};
   if (status) {
      query.status = status;
   }

   return Scheduling.find(query)
      .populate("carrierId", "name document")
      .populate("companyId", "name document")
      .populate("timeWindowId", "date startTime endTime")
      .sort({ createdAt: -1 });
}
