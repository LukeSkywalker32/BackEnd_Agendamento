import { Router } from "express";
import * as companyController from "../controllers/company.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { uploadDocuments } from "../middlewares/upload.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
   balanceParamsSchema,
   createBalanceSchema,
   updateBalanceSchema,
} from "../schemas/balance.schema";
import { createBlockedDateSchema } from "../schemas/blockedDate.schema";
import { registerCarrierSchema } from "../schemas/carrier-register.schema";
import { validateDocumentSchema } from "../schemas/document.schema";
import {
   createProductSchema,
   productParamsSchema,
   updateProductSchema,
} from "../schemas/product.schema";
import { createTimeWindowSchema, updateTimeWindowSchema } from "../schemas/timeWindow.schema";

const router = Router();

router.use(authMiddleware, roleMiddleware("company"));

/*--PRODUTOS (INSUMOS) */
router.post("/products", validate(createProductSchema), companyController.createProduct);
router.get("/products", companyController.getProducts);
router.put(
   "/products/:id",
   validate(productParamsSchema),
   validate(updateProductSchema),
   companyController.updateProduct,
);
router.delete("/products/:id", validate(productParamsSchema), companyController.deleteProduct);

/* ── SALDOS DIÁRIOS ── */
router.post("/balances", validate(createBalanceSchema), companyController.createBalance);
router.get("/balances", companyController.getBalances);
router.put(
   "/balances/:id",
   validate(balanceParamsSchema),
   validate(updateBalanceSchema),
   companyController.updateBalance,
);
router.delete("/balances/:id", validate(balanceParamsSchema), companyController.deleteBalance);

/* ── TRANSPORTADORAS ── */
router.post("/carriers", validate(registerCarrierSchema), companyController.registerCarrier);
router.get("/carriers", companyController.getCarriers);

/* ── AGENDAMENTOS E VALIDAÇÃO ── */
router.get("/schedulings", companyController.getSchedulings);
router.get("/schedulings/:id", companyController.getSchedulingDetail);
router.patch(
   "/schedulings/:id/documents",
   validate(validateDocumentSchema),
   companyController.validateDocument,
);

/* ── CARREGAMENTO E NF (Faturista) ── */
// Usamos .single("invoice") pois é apenas um PDF de nota fiscal
router.post(
   "/schedulings/:id/load",
   uploadDocuments.single("invoice"),
   companyController.markAsLoaded,
);

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


// Check-ins
router.get("/checkins", companyController.getCheckins);

export default router;
