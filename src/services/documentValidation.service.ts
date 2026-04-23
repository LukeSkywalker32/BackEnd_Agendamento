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

   if (scheduling.documentStatus !== "pending") {
      throw ApiError.badRequest("Documentos não estão pendentes de análise.");
   }

   if (data.status === "approved") {
      scheduling.documentStatus = "approved";
      scheduling.rejectionReason = "";

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
