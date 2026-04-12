import mongoose, { type Document, Schema } from "mongoose";
import type { UserRole } from "../types";

export interface IUser extends Document {
   name: string;
   email: string;
   password: string;
   role: UserRole;
   document: string;
   phone: string;
   isActive: boolean;
   createdAt: Date;
   updatedAt: Date;
}

const userSchema = new Schema<IUser>(
   {
      name: {
         type: String,
         required: [true, "Nome é obrigatório"],
         trim: true,
         minlength: [3, "Nome deve ter pelo menos 3 caracteres"],
      },
      email: {
         type: String,
         required: [true, "E-mail é obrigatório"],
         unique: true,
         lowercase: true,
         trim: true,
      },
      password: {
         type: String,
         required: [true, "Senha é obrigatória"],
         minlength: [6, "Senha deve ter pelo menos 6 caracteres"],
         select: false,
      },
      role: {
         type: String,
         enum: ["admin", "company", "carrier"],
         required: [true, "Role é obrigatória"],
      },
      document: {
         type: String,
         required: [true, "CNPJ é obrigatório"],
         trim: true,
      },
      phone: {
         type: String,
         trim: true,
         default: "",
      },
      isActive: {
         type: Boolean,
         default: true,
      },
   },
   {
      timestamps: true,
   },
);

userSchema.index({ document: 1 });
userSchema.index({ role: 1 });

export const User = mongoose.model<IUser>("User", userSchema);
