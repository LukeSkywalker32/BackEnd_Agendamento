import { Product } from "../models/Product";
import { ProductBalance } from "../models/ProductBalance";
import { Scheduling } from "../models/Scheduling";
import { TimeWindow } from "../models/TimeWindow";
import { User } from "../models/User";
import type { DocumentType, SchedulingDocument, VehiclePlates, VehicleType } from "../types";
import { ApiError } from "../utils/apiError";
import { cleanCPF, isValidCPF } from "../utils/cpf";

/* ════════════════════════════════════════════
   INTERFACES
   ════════════════════════════════════════════ */

interface CreateSchedulingData {
   carrierId: string;
   companyId: string;
   timeWindowId: string;
   productId: string;
   quantity: number;
   driverName: string;
   driverCpf: string;
   driverPhone?: string;
   vehicleType: VehicleType;
   vehiclePlates: VehiclePlates;
   cargoDescription?: string;
}

interface UpdateSchedulingData {
   driverName?: string;
   driverCpf?: string;
   driverPhone?: string;
   vehicleType?: VehicleType;
   vehiclePlates?: VehiclePlates;
   cargoDescription?: string;
}

/* ════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════ */

/**
 * Monta o objeto SchedulingDocument a partir de um Multer file.
 */
function buildDocumentObject(file: Express.Multer.File, type: DocumentType): SchedulingDocument {
   return {
      type,
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
   };
}

/**
 * Obtém a data da TimeWindow para buscar o saldo do dia correto.
 */
async function getTimeWindowDate(timeWindowId: string): Promise<Date> {
   const tw = await TimeWindow.findById(timeWindowId);
   if (!tw) throw ApiError.notFound("Janela de horário não encontrada");
   return tw.date;
}

/* ════════════════════════════════════════════
   CREATE — com reserva atômica de saldo
   ════════════════════════════════════════════ */

export async function createScheduling(
   data: CreateSchedulingData,
   files?: {
      cnh?: Express.Multer.File[];
      vehicleDoc?: Express.Multer.File[];
      purchaseOrder?: Express.Multer.File[];
   },
) {
   // 1. Validar CPF
   const cpf = cleanCPF(data.driverCpf);
   if (!isValidCPF(cpf)) {
      throw ApiError.badRequest("CPF do motorista inválido");
   }
   data.driverCpf = cpf;

   // 2. Validar empresa
   const company = await User.findOne({ _id: data.companyId, role: "company", isActive: true });
   if (!company) {
      throw ApiError.notFound("Empresa de insumos não encontrada");
   }

   // 3. Validar produto (ativo e pertence à empresa)
   const product = await Product.findOne({
      _id: data.productId,
      companyId: data.companyId,
      isActive: true,
   });
   if (!product) {
      throw ApiError.notFound("Insumo não encontrado ou indisponível");
   }

   // 4. Validar janela de horário (ativa e com vaga)
   const timeWindow = await TimeWindow.findOneAndUpdate(
      {
         _id: data.timeWindowId,
         companyId: data.companyId,
         isActive: true,
         $expr: { $lt: ["$currentCount", "$maxVehicles"] },
      },
      { $inc: { currentCount: 1 } },
      { new: true },
   );
   if (!timeWindow) {
      throw ApiError.badRequest("Janela de horário indisponível ou sem vagas");
   }

   // 5. Reservar saldo ATOMICAMENTE
   //    Busca o balance do produto na data da janela e tenta reservar.
   //    A condição $gte garante que só reserva se houver saldo suficiente.
   const balanceDate = timeWindow.date;
   const reserveResult = await ProductBalance.findOneAndUpdate(
      {
         productId: data.productId,
         companyId: data.companyId,
         date: balanceDate,
         $expr: {
            $gte: [
               { $subtract: ["$totalAmount", { $add: ["$reservedAmount", "$usedAmount"] }] },
               data.quantity,
            ],
         },
      },
      { $inc: { reservedAmount: data.quantity } },
      { new: true },
   );

   if (!reserveResult) {
      // Desfaz o incremento da janela (rollback manual)
      await TimeWindow.updateOne({ _id: data.timeWindowId }, { $inc: { currentCount: -1 } });
      throw ApiError.badRequest(
         "Saldo insuficiente para este insumo. Entre em contato com a empresa.",
      );
   }

   // 6. Montar documentos
   const documents: SchedulingDocument[] = [];
   if (files?.cnh?.[0]) {
      documents.push(buildDocumentObject(files.cnh[0], "cnh"));
   }
   if (files?.vehicleDoc?.[0]) {
      documents.push(buildDocumentObject(files.vehicleDoc[0], "vehicleDoc"));
   }
   if (files?.purchaseOrder?.[0]) {
      documents.push(buildDocumentObject(files.purchaseOrder[0], "purchaseOrder"));
   }

   // 7. Criar agendamento
   try {
      const scheduling = await Scheduling.create({
         carrierId: data.carrierId,
         companyId: data.companyId,
         timeWindowId: data.timeWindowId,
         productId: data.productId,
         quantity: data.quantity,
         driverName: data.driverName,
         driverCpf: data.driverCpf,
         driverPhone: data.driverPhone || "",
         vehicleType: data.vehicleType,
         vehiclePlates: data.vehiclePlates,
         cargoDescription: data.cargoDescription || "",
         status: "pending",
         documentStatus: documents.length === 3 ? "pending" : "not_attached",
         documents,
      });

      return scheduling.populate([
         { path: "companyId", select: "name document" },
         { path: "timeWindowId", select: "date startTime endTime" },
         { path: "productId", select: "name unit" },
      ]);
   } catch (error) {
      // Rollback: desfaz reserva de saldo e vaga da janela
      await ProductBalance.updateOne(
         { productId: data.productId, companyId: data.companyId, date: balanceDate },
         { $inc: { reservedAmount: -data.quantity } },
      );
      await TimeWindow.updateOne({ _id: data.timeWindowId }, { $inc: { currentCount: -1 } });
      throw error;
   }
}

/* ════════════════════════════════════════════
   READ
   ════════════════════════════════════════════ */

export async function getSchedulingsByCarrier(carrierId: string, status?: string) {
   const query: Record<string, unknown> = { carrierId };
   if (status) query.status = status;

   return Scheduling.find(query)
      .populate("companyId", "name document")
      .populate("timeWindowId", "date startTime endTime")
      .populate("productId", "name unit")
      .sort({ createdAt: -1 });
}

export async function getSchedulingsByCompany(companyId: string, status?: string) {
   const query: Record<string, unknown> = { companyId };
   if (status) query.status = status;

   return Scheduling.find(query)
      .populate("carrierId", "name document")
      .populate("timeWindowId", "date startTime endTime")
      .populate("productId", "name unit")
      .sort({ createdAt: -1 });
}

export async function getSchedulingById(id: string) {
   const scheduling = await Scheduling.findById(id)
      .populate("companyId", "name document phone")
      .populate("carrierId", "name document phone")
      .populate("timeWindowId", "date startTime endTime")
      .populate("productId", "name unit");

   if (!scheduling) {
      throw ApiError.notFound("Agendamento não encontrado");
   }
   return scheduling;
}

export async function getAllSchedulings(status?: string) {
   const query: Record<string, unknown> = {};
   if (status) query.status = status;

   return Scheduling.find(query)
      .populate("companyId", "name document")
      .populate("carrierId", "name document")
      .populate("timeWindowId", "date startTime endTime")
      .populate("productId", "name unit")
      .sort({ createdAt: -1 });
}

/* ════════════════════════════════════════════
   UPDATE — só dados do motorista/veículo (carrier)
   ════════════════════════════════════════════ */

export async function updateScheduling(id: string, carrierId: string, data: UpdateSchedulingData) {
   const scheduling = await Scheduling.findOne({ _id: id, carrierId });
   if (!scheduling) {
      throw ApiError.notFound("Agendamento não encontrado");
   }

   if (["checked_in", "loaded", "completed", "cancelled"].includes(scheduling.status)) {
      throw ApiError.badRequest("Não é possível editar um agendamento com este status");
   }

   // Validar CPF se estiver sendo atualizado
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

/* ════════════════════════════════════════════
   CANCEL — com devolução atômica de saldo
   ════════════════════════════════════════════ */

export async function cancelScheduling(id: string, carrierId: string) {
   const scheduling = await Scheduling.findOne({ _id: id, carrierId });
   if (!scheduling) {
      throw ApiError.notFound("Agendamento não encontrado");
   }

   if (["checked_in", "loaded", "completed", "cancelled"].includes(scheduling.status)) {
      throw ApiError.badRequest("Não é possível cancelar um agendamento com este status");
   }

   const wasPending = scheduling.status === "pending";
   const wasConfirmed = scheduling.status === "confirmed";

   scheduling.status = "cancelled";
   await scheduling.save();

   // Devolver vaga da janela
   await TimeWindow.updateOne(
      { _id: scheduling.timeWindowId, currentCount: { $gt: 0 } },
      { $inc: { currentCount: -1 } },
   );

   // Devolver saldo
   const twDate = await getTimeWindowDate(scheduling.timeWindowId.toString());

   if (wasPending) {
      // Estava reservado → devolver do reservedAmount
      await ProductBalance.updateOne(
         {
            productId: scheduling.productId,
            companyId: scheduling.companyId,
            date: twDate,
            reservedAmount: { $gte: scheduling.quantity },
         },
         { $inc: { reservedAmount: -scheduling.quantity } },
      );
   } else if (wasConfirmed) {
      // Já tinha sido aprovado → devolver do usedAmount
      await ProductBalance.updateOne(
         {
            productId: scheduling.productId,
            companyId: scheduling.companyId,
            date: twDate,
            usedAmount: { $gte: scheduling.quantity },
         },
         { $inc: { usedAmount: -scheduling.quantity } },
      );
   }

   return scheduling;
}

/* ════════════════════════════════════════════
   UPLOAD DOCUMENTS — reenvio pela transportadora
   ════════════════════════════════════════════ */

export async function uploadDocuments(
   id: string,
   carrierId: string,
   files: {
      cnh?: Express.Multer.File[];
      vehicleDoc?: Express.Multer.File[];
      purchaseOrder?: Express.Multer.File[];
   },
) {
   const scheduling = await Scheduling.findOne({ _id: id, carrierId });
   if (!scheduling) {
      throw ApiError.notFound("Agendamento não encontrado");
   }

   if (scheduling.status === "cancelled") {
      throw ApiError.badRequest("Agendamento cancelado");
   }

   const newDocs: SchedulingDocument[] = [];
   if (files.cnh?.[0]) newDocs.push(buildDocumentObject(files.cnh[0], "cnh"));
   if (files.vehicleDoc?.[0]) newDocs.push(buildDocumentObject(files.vehicleDoc[0], "vehicleDoc"));
   if (files.purchaseOrder?.[0])
      newDocs.push(buildDocumentObject(files.purchaseOrder[0], "purchaseOrder"));

   if (newDocs.length === 0) {
      throw ApiError.badRequest("Nenhum documento enviado");
   }

   // Substitui documentos do mesmo tipo, mantém os outros
   for (const newDoc of newDocs) {
      const existingIndex = scheduling.documents.findIndex(d => d.type === newDoc.type);
      if (existingIndex >= 0) {
         scheduling.documents[existingIndex] = newDoc;
      } else {
         scheduling.documents.push(newDoc);
      }
   }

   // Se agora tem os 3 documentos, muda status para pendente de análise
   const hasAllDocs =
      scheduling.documents.some(d => d.type === "cnh") &&
      scheduling.documents.some(d => d.type === "vehicleDoc") &&
      scheduling.documents.some(d => d.type === "purchaseOrder");

   if (hasAllDocs) {
      scheduling.documentStatus = "pending";
      scheduling.rejectionReason = "";
   }

   return scheduling.save();
}

/* ════════════════════════════════════════════
   MARK AS LOADED — faturista confirma carregamento + NF
   ════════════════════════════════════════════ */

export async function markAsLoaded(
   schedulingId: string,
   companyId: string,
   userId: string,
   invoiceFile: Express.Multer.File,
) {
   const scheduling = await Scheduling.findOne({ _id: schedulingId, companyId });
   if (!scheduling) {
      throw ApiError.notFound("Agendamento não encontrado");
   }

   if (scheduling.status !== "checked_in") {
      throw ApiError.badRequest(
         "Só é possível marcar como carregado agendamentos com check-in realizado",
      );
   }

   scheduling.status = "loaded";
   scheduling.loadedAt = new Date();
   scheduling.loadedBy = userId as any;
   scheduling.invoicePdf = buildDocumentObject(invoiceFile, "invoice");

   return scheduling.save();
}
