import { Router } from "express";
import * as carrierController from "../controllers/carrier.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { uploadDocuments } from "../middlewares/upload.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createSchedulingSchema, updateSchedulingSchema } from "../schemas/scheduling.schema";

const router = Router();

router.use(authMiddleware, roleMiddleware("carrier"));

// Empresas de insumos
router.get("/companies", carrierController.listCompanies);
router.get("/companies/:id/time-windows", carrierController.getCompanyTimeWindows);

router.get("/companies/:id/products", carrierController.listCompanyProducts);

// Agendamentos
router.post(
   "/schedulings",
   uploadDocuments.fields([
      { name: "cnh", maxCount: 1 },
      { name: "vehicleDoc", maxCount: 1 },
      { name: "purchaseOrder", maxCount: 1 },
   ]),
   validate(createSchedulingSchema),
   carrierController.createScheduling,
);

router.get("/schedulings", carrierController.getSchedulings);
router.get("/schedulings/:id", carrierController.getSchedulingDetail);

router.put(
   "/schedulings/:id",
   validate(updateSchedulingSchema),
   carrierController.updateScheduling,
);

router.patch("/schedulings/:id/cancel", carrierController.cancelScheduling);

// Upload de documentos
router.post(
   "/schedulings/:id/documents",
   // Mesma correção: campos nomeados por tipo de documento
   uploadDocuments.fields([
      { name: "cnh", maxCount: 1 },
      { name: "vehicleDoc", maxCount: 1 },
      { name: "purchaseOrder", maxCount: 1 },
   ]),
   carrierController.uploadDocuments,
);

export default router;
