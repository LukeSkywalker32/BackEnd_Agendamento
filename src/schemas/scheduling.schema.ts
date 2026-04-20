import { z } from "zod";

const plateRegex = /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/i;

const plateField = z
   .string()
   .regex(plateRegex, "Placa invalida(formato ABC123 ou ABC1D23)")
   .transform(val => val.toUpperCase());

const vehicleTypeEnum = z.enum(["toco", "truck", "vlc", "carreta", "bitrem", "rodotrem"], {
   message: "Tipo de veículo inválido",
});

const vehiclePlatesSchema = z.object({
   tractor: plateField,
   trailer1: plateField.optional(),
   trailer2: plateField.optional(),
   trailer3: plateField.optional(),
});

const validatePlatesByType = (data: {
   vehicleType: string;
   vehiclePlates: { trailer1?: string; trailer2?: string; trailer3?: string };
}) => {
   const { vehicleType, vehiclePlates } = data;
   if (vehicleType === "carreta" && !vehiclePlates.trailer1) return false;
   if (vehicleType === "bitrem" && (!vehiclePlates.trailer1 || !vehiclePlates.trailer2))
      return false;
   if (
      vehicleType === "rodotrem" &&
      (!vehiclePlates.trailer1 || !vehiclePlates.trailer2 || !vehiclePlates.trailer3)
   )
      return false;
   return true;
};

export const createSchedulingSchema = z.object({
   body: z
      .object({
         companyId: z.string().min(1, "Empresa de insumos é obrigatória"),
         timeWindowId: z.string().min(1, "Janela de horário é obrigatória"),
         driverName: z.string().min(3, "Nome do motorista deve ter pelo menos 3 caracteres"),
         driverCpf: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
         driverPhone: z.string().optional(),

         vehicleType: vehicleTypeEnum,
         vehiclePlates: vehiclePlatesSchema,

         cargoDescription: z.string().optional(),
      })
      .refine(validatePlatesByType, {
         message: "Placas das carretas incompletas para o tipo de veiculo selecionado",
         path: ["vehiclePlates"],
      }),
});

export const updateSchedulingSchema = z.object({
   body: z
      .object({
         driverName: z.string().min(3).optional(),
         driverCpf: z.string().min(11).max(14).optional(),
         driverPhone: z.string().optional(),
         vehicleType: vehicleTypeEnum.optional(),
         vehiclePlates: vehiclePlatesSchema.optional(),
         cargoDescription: z.string().optional(),
      })
      .refine(
         data => {
            if (!data.vehicleType || !data.vehiclePlates) return true; // update parcial ok
            return validatePlatesByType({
               vehicleType: data.vehicleType,
               vehiclePlates: data.vehiclePlates,
            });
         },
         {
            message: "Placas das carretas incompletas para o tipo de veículo selecionado",
            path: ["vehiclePlates"],
         },
      ),
});

export const schedulingParamsSchema = z.object({
   params: z.object({
      id: z.string().min(1, "ID é obrigatório"),
   }),
});
