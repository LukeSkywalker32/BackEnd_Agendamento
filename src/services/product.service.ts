import { string } from "zod";
import { Product } from "../models/Product";
import { ProductBalance } from "../models/ProductBalance";
import { Scheduling } from "../models/Scheduling";
import { ApiError } from "../utils/apiError";

interface CreateProductData {
   companyId: string;
   name: string;
   unit: string;
   description?: string;
}

interface UpdateProductData {
   name?: string;
   unit?: string;
   description?: string;
   isActive?: boolean;
}

/**Cria um novo insumo para empresa */
export async function createProduct(data: CreateProductData) {
   try {
      return await Product.create(data);
   } catch (error: any) {
      if (error.code === 11000) {
         throw ApiError.badRequest("Já existe um produto com o mesmo nome");
      }
      throw error;
   }
}

/**Busca insumos ativos de uma empresa */
export async function getProductsByCompany(companyId: string, activeOnly = false) {
   const query: Record<string, unknown> = { companyId };
   if (activeOnly) {
      query.isActive = true;
   }
   return Product.find(query).sort({ name: 1 });
}

/**Busca insumo por ID */
export async function getProductById(id: string, companyId: string) {
   const product = await Product.findOne({ _id: id, companyId });
   if (!product) {
      throw ApiError.notFound("Produto não encontrado");
   }
   return product;
}

//Atualiza um insumo
export async function updateProduct(id: string, companyId: string, data: UpdateProductData) {
   const product = await Product.findOne({ _id: id, companyId });
   if (!product) {
      throw ApiError.notFound("Produto não encontrado");
   }
   try {
      Object.assign(product, data);
      return await product.save();
   } catch (error: any) {
      if (error.code === 11000) {
         throw ApiError.badRequest("Já existe um produto com o mesmo nome");
      }
      throw error;
   }
}

export async function deleteProduct(id: string, companyId: string) {
   const product = await Product.findOne({ _id: id, companyId });
   if (!product) {
      throw ApiError.notFound("Produto não encontrado");
   }

   //Verifica se tem argumentos ativos para esse produto
   const activeSchedulings = await Scheduling.countDocuments({
      productId: id,
      status: { $in: ["pending", "confirmed", "checked_in"] },
   });
   if (activeSchedulings > 0) {
      throw ApiError.badRequest(
         `Não é possível desativar: Existem ${activeSchedulings} agendamentos ativos para este produto`,
      );
   }

   //Desativa o produto
   product.isActive = false;
   await product.save();
}
