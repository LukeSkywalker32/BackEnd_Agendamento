import { Router } from "express";
import * as companyController from "../controllers/company.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createTimeWindowSchema, updateTimeWindowSchema } from "../schemas/timeWindow.schema";
import { createBlockedDateSchema } from "../schemas/blockedDate.schema";
import { validateDocumentSchema } from "../schemas/document.schema";

const router = Router();

router.use(authMiddleware, roleMiddleware("company"));

// Janelas de horário
router.get("/time-windows", companyController.getTimeWindows);
router.post("/time-windows", validate(createTimeWindowSchema), companyController.createTimeWindow);
router.put(
   "/time-windows/:id",
   validate(updateTimeWindowSchema),
   companyController.updateTimeWindow,
);
router.delete("/time-windows/:id", companyController.deleteTimeWindow);

// Datas bloqueadas
router.get("/blocked-dates", companyController.getBlockedDates);
router.post(
   "/blocked-dates",
   validate(createBlockedDateSchema),
   companyController.createBlockedDate,
);
router.delete("/blocked-dates/:id", companyController.deleteBlockedDate);

// Agendamentos recebidos
router.get("/schedulings", companyController.getSchedulings);
router.get("/schedulings/:id", companyController.getSchedulingDetail);
router.patch(
   "/schedulings/:id/documents",
   validate(validateDocumentSchema),
   companyController.validateDocument,
);

// Check-ins
router.get("/checkins", companyController.getCheckins);

export default router;
