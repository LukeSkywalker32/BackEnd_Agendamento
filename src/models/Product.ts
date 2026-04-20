import mongoose, { type Document, Schema } from "mongoose";

export type ProductUnit = "kg" | "ton" | "sacas" | "litros" | "m3";
export interface IProduct extends Document {
   companyId: mongoose.Types.ObjectId;
   name: string;
   unit: ProductUnit;
   description?: string;
   isActive: boolean;
   createdAt: Date;
   updatedAt: Date;
}

const productSchema: Schema = new Schema<IProduct>(
   {
      companyId: {
         type: Schema.Types.ObjectId,
         ref: "User",
         required: [true, "Empresa é obrigatória"],
      },
      name: {
         type: String,
         required: [true, "Nome é obrigatório"],
         trim: true,
         minlength: [3, "Nome deve conter no mínimo 3 caracteres"],
         maxlength: [100, "Nome deve conter no máximo 100 caracteres"],
      },
      unit: {
         type: String,
         required: [true, "Unidade de medida é obrigatória"],
         enum: {
            values: ["kg", "ton", "sacas", "litros", "m3"],
            message: "Unidade inválida. Use: kg, ton, sacas, litros ou m3",
         },
      },
      description: {
         type: String,
         trim: true,
         maxlength: [500, "Descrição deve conter no máximo 500 caracteres"],
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

//Busca rápida de produtos ativos por empresa
productSchema.index({ companyId: 1, isActive: 1 });
//impede duplicidade de nome dentro da mesma empresa
productSchema.index(
   {
      companyId: 1,
      name: 1,
   },
   {
      unique: true,
      collation: { locale: "pt", strength: 2 }, // strength:2 ignora diferenças de maiúsculas e minúsculas e acentos
   },
);

export const Product = mongoose.model<IProduct>("Product", productSchema);
