import { Router } from "express";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import companyRoutes from "./company.routes";
import carrierRoutes from "./carrier.routes";
import driverRoutes from "./driver.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/company", companyRoutes);
router.use("/carrier", carrierRoutes);
router.use("/driver", driverRoutes);

export default router;
