import { ProductBalance } from "../models/ProductBalance";
import { Scheduling } from "../models/Scheduling";
import { TimeWindow } from "../models/TimeWindow";
import { ApiError } from "../utils/apiError";

interface ValidateDocumentData {
   schedulingId: string;
   companyId: string;
   status: "approved" | "rejected";
   rejectionReason?: string;
}

export async function validateDocument(data: ValidateDocumentData) {
   const scheduling = await Scheduling.findOne({
      _id: data.schedulingId,
      companyId: data.companyId,
   });

   if (!scheduling) {
      throw ApiError.notFound("Agendamento não encontrado");
   }
   // verificando se o documento foi aprovado antes, se nao foi nao pode aprovar
   if (scheduling.documentStatus !== "pending") {
      throw ApiError.badRequest("Documentos não estão pendentes de análise.");
   }
   if (scheduling.status === "cancelled") {
      throw ApiError.badRequest("Não é possível validar documentos de um agendamento cancelado");
   }

   if (data.status === "approved") {
      scheduling.documentStatus = "approved";
      scheduling.status = "confirmed";
      scheduling.rejectionReason = "";

      // Atualiza saldo: move de "reservado" para "utilizado"
      const timeWindow = await TimeWindow.findById(scheduling.timeWindowId);
      if (timeWindow) {
         await ProductBalance.updateOne(
            {
               productId: scheduling.productId,
               companyId: scheduling.companyId,
               date: timeWindow.date,
               reservedAmount: { $gte: scheduling.quantity },
            },
            {
               $inc: {
                  reservedAmount: -scheduling.quantity,
                  usedAmount: scheduling.quantity,
               },
            },
         );
      }
   } else {
      scheduling.documentStatus = "rejected";
      scheduling.rejectionReason = data.rejectionReason || "Documento rejeitado";
   }
   return scheduling.save();
}
