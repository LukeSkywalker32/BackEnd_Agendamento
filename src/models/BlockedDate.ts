import mongoose, { type Document, Schema } from "mongoose";

export interface IBlockedDate extends Document {
   companyId: mongoose.Types.ObjectId;
   date: Date;
   reason: string;
   createdAt: Date;
}

const blockedDateSchema = new Schema<IBlockedDate>(
   {
      companyId: {
         type: Schema.Types.ObjectId,
         ref: "User",
         required: [true, "Empresa é obrigatória"],
      },
      date: {
         type: Date,
         required: [true, "Data é obrigatória"],
      },
      reason: {
         type: String,
         required: [true, "Motivo é obrigatório"],
         trim: true,
      },
   },
   {
      timestamps: true,
   },
);

blockedDateSchema.index({ companyId: 1, date: 1 }, { unique: true });

export const BlockedDate = mongoose.model<IBlockedDate>("BlockedDate", blockedDateSchema);
