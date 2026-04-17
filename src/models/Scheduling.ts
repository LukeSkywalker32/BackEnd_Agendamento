import mongoose, { type Document, Schema } from "mongoose";
import type { DocumentStatus, SchedulingDocument, SchedulingStatus } from "../types";

export interface IScheduling extends Document {
   carrierId: mongoose.Types.ObjectId;
   companyId: mongoose.Types.ObjectId;
   timeWindowId: mongoose.Types.ObjectId;
   driverName: string;
   driverCpf: string;
   driverPhone: string;
   vehiclePlate: string;
   vehicleType: string;
   cargoDescription: string;
   status: SchedulingStatus;
   documentStatus: DocumentStatus;
   documents: SchedulingDocument[];
   rejectionReason: string;
   createdAt: Date;
   updatedAt: Date;
}

const schedulingDocumentSchema = new Schema<SchedulingDocument>(
   {
      filename: { type: String, required: true },
      originalName: { type: String, required: true },
      path: { type: String, required: true },
      mimetype: { type: String, required: true },
      size: { type: Number, required: true },
      uploadedAt: { type: Date, default: Date.now },
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
      vehiclePlate: {
         type: String,
         required: [true, "Placa do veículo é obrigatória"],
         uppercase: true,
         trim: true,
      },
      vehicleType: {
         type: String,
         required: [true, "Tipo do veículo é obrigatório"],
         trim: true,
      },
      cargoDescription: {
         type: String,
         trim: true,
         default: "",
      },
      status: {
         type: String,
         enum: ["pending", "confirmed", "checked_in", "completed", "cancelled"],
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

schedulingSchema.index({ carrierId: 1, status: 1 });
schedulingSchema.index({ companyId: 1, status: 1 });
schedulingSchema.index({ driverCpf: 1 });
schedulingSchema.index({ timeWindowId: 1 });
schedulingSchema.index({ vehiclePlate: 1 });

export const Scheduling = mongoose.model<IScheduling>("Scheduling", schedulingSchema);
