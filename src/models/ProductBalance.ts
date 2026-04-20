import mongoose, { type Document, Schema } from "mongoose";

export interface IProductBalance extends Document {
   productId: mongoose.Types.ObjectId;
   companyId: mongoose.Types.ObjectId;
   date: Date;
   totalAmount: number;
   reservedAmount: number;
   usedAmount: number;
   availableAmount: number; // Virtual
   createdAt: Date;
   updatedAt: Date;
}

const productBalanceSchema = new Schema<IProductBalance>(
   {
      productId: {
         type: Schema.Types.ObjectId,
         ref: "Product",
         required: [true, "Produto é obrigatório"],
      },
      companyId: {
         type: Schema.Types.ObjectId,
         ref: "User",
         required: [true, "Empresa é obrigatória"],
      },
      date: {
         type: Date,
         required: [true, "Data é obrigatória"],
      },
      totalAmount: {
         type: Number,
         required: [true, "Quantidade total é obrigatória"],
         min: [0, "Quantidade total não pode ser negativa"],
      },
      reservedAmount: {
         type: Number,
         default: 0,
         min: [0, "Quantidade reservada não pode ser negativa"],
      },
      usedAmount: {
         type: Number,
         default: 0,
         min: [0, "Quantidade utilizada não pode ser negativa"],
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   },
);

//Virtual: saldo disponivel = total - reservado - utilizado
productBalanceSchema.virtual("availableAmount").get(function (this: IProductBalance) {
   return this.totalAmount - this.reservedAmount - this.usedAmount;
});
//consulta mais comum: saldos de empresa em uma data
productBalanceSchema.index({ companyId: 1, date: 1 });
//impede duplicidade: o produto so pode ter um saldo por dia
productBalanceSchema.index({ productId: 1, date: 1 }, { unique: true });

export const ProductBalance = mongoose.model<IProductBalance>(
   "ProductBalance",
   productBalanceSchema,
);
