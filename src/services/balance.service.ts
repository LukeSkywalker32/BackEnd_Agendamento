import { Product } from "../models/Product";
import { ProductBalance } from "../models/ProductBalance";
import { Scheduling } from "../models/Scheduling";
import { ApiError } from "../utils/apiError";

interface CreateBalanceData {
   companyId: string;
   productId: string;
   date: string;
   totalAmount: number;
}

interface UpdateBalanceData {
   totalAmount?: number;
}

/**
 * Normaliza a data para UTC 00:00:00 — evita bug de timezone (Brasil UTC-3).
 */
function normalizeDate(dateStr: string): Date {
   const d = new Date(`${dateStr}T00:00:00.000Z`);
   if (Number.isNaN(d.getTime())) {
      throw ApiError.badRequest("Data inválida");
   }
   return d;
}

/**
 * Cria saldo diário para um produto.
 * O índice unique (productId + date) impede duplicidade.
 */
export async function createBalance(data: CreateBalanceData) {
   // Verifica se o produto existe e pertence à empresa
   const product = await Product.findOne({
      _id: data.productId,
      companyId: data.companyId,
      isActive: true,
   });
   if (!product) {
      throw ApiError.notFound("Insumo não encontrado ou inativo");
   }

   const date = normalizeDate(data.date);

   try {
      return await ProductBalance.create({
         productId: data.productId,
         companyId: data.companyId,
         date,
         totalAmount: data.totalAmount,
      });
   } catch (error: any) {
      if (error.code === 11000) {
         throw ApiError.badRequest("Já existe um saldo cadastrado para este insumo nesta data");
      }
      throw error;
   }
}

/**
 * Lista saldos da empresa, com filtros opcionais por data e produto.
 */
export async function getBalancesByCompany(
   companyId: string,
   filters?: { date?: string; productId?: string },
) {
   const query: Record<string, unknown> = { companyId };

   if (filters?.date) {
      query.date = normalizeDate(filters.date);
   }
   if (filters?.productId) {
      query.productId = filters.productId;
   }

   return ProductBalance.find(query)
      .populate("productId", "name unit")
      .sort({ date: 1, productId: 1 });
}

/**
 * Busca um saldo por ID, garantindo que pertence à empresa.
 */
export async function getBalanceById(id: string, companyId: string) {
   const balance = await ProductBalance.findOne({ _id: id, companyId }).populate(
      "productId",
      "name unit",
   );
   if (!balance) {
      throw ApiError.notFound("Saldo não encontrado");
   }
   return balance;
}

/**
 * Atualiza o totalAmount de um saldo.
 * REGRA CRÍTICA: o novo total não pode ser menor que (reserved + used),
 * senão teríamos saldo negativo.
 */
export async function updateBalance(id: string, companyId: string, data: UpdateBalanceData) {
   const balance = await ProductBalance.findOne({ _id: id, companyId });
   if (!balance) {
      throw ApiError.notFound("Saldo não encontrado");
   }

   if (data.totalAmount !== undefined) {
      const minAllowed = balance.reservedAmount + balance.usedAmount;
      if (data.totalAmount < minAllowed) {
         throw ApiError.badRequest(
            `Quantidade total não pode ser menor que ${minAllowed} (${balance.reservedAmount} reservado + ${balance.usedAmount} utilizado)`,
         );
      }
      balance.totalAmount = data.totalAmount;
   }

   return balance.save();
}

/**
 * Remove um saldo diário.
 * Só permite se não houver reservas ou uso (reservedAmount === 0 && usedAmount === 0).
 */
export async function deleteBalance(id: string, companyId: string) {
   const balance = await ProductBalance.findOne({ _id: id, companyId });
   if (!balance) {
      throw ApiError.notFound("Saldo não encontrado");
   }

   if (balance.reservedAmount > 0 || balance.usedAmount > 0) {
      throw ApiError.badRequest(
         "Não é possível remover: existem reservas ou uso vinculados a este saldo",
      );
   }

   await balance.deleteOne();
   return { message: "Saldo removido com sucesso" };
}
