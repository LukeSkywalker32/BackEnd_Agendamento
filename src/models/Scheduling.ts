import mongoose, { type Document, Schema } from "mongoose";
import type {
   DocumentStatus,
   DocumentType,
   SchedulingDocument,
   SchedulingStatus,
   VehiclePlates,
   VehicleType,
} from "../types";

export interface IScheduling extends Document {
   carrierId: mongoose.Types.ObjectId;
   companyId: mongoose.Types.ObjectId;
   timeWindowId: mongoose.Types.ObjectId;
   productId: mongoose.Types.ObjectId;
   quantity: number;

   driverName: string;
   driverCpf: string;
   driverPhone: string;

   vehiclePlates: VehiclePlates;
   vehicleType: VehicleType;

   cargoDescription: string;
   status: SchedulingStatus;
   documentStatus: DocumentStatus;
   documents: SchedulingDocument[];
   rejectionReason: string;

   invoicePdf?: SchedulingDocument;
   loadedAt?: Date;
   loadedBy?: mongoose.Types.ObjectId;

   createdAt: Date;
   updatedAt: Date;
}

const schedulingDocumentSchema = new Schema<SchedulingDocument>(
   {
      type: {
         type: String,
         enum: ["cnh", "vehicleDoc", "purchaseOrder", "invoice"] as DocumentType[],
         required: true,
      },
      filename: { type: String, required: true },
      originalName: { type: String, required: true },
      path: { type: String, required: true },
      mimetype: { type: String, required: true },
      size: { type: Number, required: true },
      uploadedAt: { type: Date, default: Date.now },
   },
   { _id: false },
);

const vehiclePlatesSchema = new Schema<VehiclePlates>(
   {
      tractor: {
         type: String,
         required: [true, "Placa do cavalo é obrigatória"],
         uppercase: true,
         trim: true,
      },
      trailer1: { type: String, uppercase: true, trim: true },
      trailer2: { type: String, uppercase: true, trim: true },
      trailer3: { type: String, uppercase: true, trim: true },
   },
   { _id: false },
);

const schedulingSchema = new Schema<IScheduling>(
   {
      carrierId: {
         type: Schema.Types.ObjectId,
         ref: "User",
         required: [true, "Transportadora é obrigatória"],
      },
      companyId: {
         type: Schema.Types.ObjectId,
         ref: "User",
         required: [true, "Empresa de insumos é obrigatória"],
      },
      timeWindowId: {
         type: Schema.Types.ObjectId,
         ref: "TimeWindow",
         required: [true, "Janela de horário é obrigatória"],
      },
      productId: {
         type: Schema.Types.ObjectId,
         ref: "Product",
         required: [true, "Produto (insumo)é obrigatório"],
      },
      quantity: {
         type: Number,
         required: [true, "Quantidade do produto é obrigatória"],
         min: [1, "A quantidade deve ser no mínimo 1"],
      },
      driverName: {
         type: String,
         required: [true, "Nome do motorista é obrigatório"],
         trim: true,
      },
      driverCpf: {
         type: String,
         required: [true, "CPF do motorista é obrigatório"],
         trim: true,
      },
      driverPhone: {
         type: String,
         trim: true,
         default: "",
      },
      vehicleType: {
         type: String,
         required: [true, "Placa do veículo é obrigatória"],
         enum: {
            values: ["toco", "truck", "vlc", "carreta", "bitrem", "rodotrem"],
            message: "Tipo de veículo inválido",
         },
      },
      vehiclePlates: {
         type: vehiclePlatesSchema,
         required: [true, "Placas do veículo são obrigatórias"],
      },
      cargoDescription: {
         type: String,
         trim: true,
         default: "",
      },
      status: {
         type: String,
         enum: ["pending", "confirmed", "checked_in", "completed", "loaded", "cancelled"],
         default: "pending",
      },
      documentStatus: {
         type: String,
         enum: ["not_attached", "pending", "approved", "rejected"],
         default: "not_attached",
      },
      documents: {
         type: [schedulingDocumentSchema],
         default: [],
      },
      rejectionReason: {
         type: String,
         trim: true,
         default: "",
      },
   },
   {
      timestamps: true,
   },
);

schedulingSchema.pre("validate", function (next: any) {
   const { vehicleType, vehiclePlates } = this;
   if (!vehiclePlates?.tractor) {
      return next(new Error("Placa do cavalo é obrigatória"));
   }
   if (vehicleType === "carreta" && !vehiclePlates.trailer1) {
      return next(
         new Error("placa do primeiro trailer é obrigatória para veículos do tipo carreta"),
      );
   }
   if (vehicleType === "bitrem" && (!vehiclePlates.trailer1 || !vehiclePlates.trailer2)) {
      return next(new Error("Placas da carreta 1 e 2 são obrigatórias para 'bitrem'"));
   }
   if (
      vehicleType === "rodotrem" &&
      (!vehiclePlates.trailer1 || !vehiclePlates.trailer2 || !vehiclePlates.trailer3)
   ) {
      return next(new Error("Placas das 3 carretas são obrigatórias para 'rodotrem'"));
   }

   next();
});

schedulingSchema.index({ carrierId: 1, status: 1 });
schedulingSchema.index({ companyId: 1, status: 1 });
schedulingSchema.index({ driverCpf: 1 });
schedulingSchema.index({ timeWindowId: 1 });
schedulingSchema.index({ productId: 1 });
schedulingSchema.index({ "vehiclePlates.tractor": 1 });

export const Scheduling = mongoose.model<IScheduling>("Scheduling", schedulingSchema);
