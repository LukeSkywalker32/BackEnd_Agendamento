import mongoose, { type Document, Schema } from "mongoose";
import type { CheckInStatus } from "../types";

export interface ICheckIn extends Document {
   schedulingId: mongoose.Types.ObjectId;
   driverCpf: string;
   checkinTime: Date;
   status: CheckInStatus;
   createdAt: Date;
}

const checkInSchema = new Schema<ICheckIn>(
   {
      schedulingId: {
         type: Schema.Types.ObjectId,
         ref: "Scheduling",
         required: [true, "Agendamento é obrigatório"],
      },
      driverCpf: {
         type: String,
         required: [true, "CPF do motorista é obrigatório"],
         trim: true,
      },
      checkinTime: {
         type: Date,
         required: true,
         default: Date.now,
      },
      status: {
         type: String,
         enum: ["on_time", "late", "early"],
         required: true,
      },
   },
   {
      timestamps: true,
   },
);

checkInSchema.index({ schedulingId: 1 }, { unique: true });
checkInSchema.index({ driverCpf: 1 });

export const CheckIn = mongoose.model<ICheckIn>("CheckIn", checkInSchema);
