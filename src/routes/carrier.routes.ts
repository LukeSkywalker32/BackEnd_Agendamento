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

// Gerenciamento de usuários
router.patch("/users/:id/deactivate", carrierController.deactivateUser);
router.patch("/users/:id/activate", carrierController.activateUser);

// Agendamentos
router.post(
   "/schedulings",
   uploadDocuments.array("documents", 5),
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
   uploadDocuments.array("documents", 5),
   carrierController.uploadDocuments,
);

export default router;
