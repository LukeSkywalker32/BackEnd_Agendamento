import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();

router.use(authMiddleware, roleMiddleware("admin"));

router.get("/users", adminController.listUsers);
router.get("/users/:id", adminController.getUser);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deactivateUser);

router.get("/schedulings", adminController.listAllSchedulings);
router.get("/dashboard", adminController.getDashboard);

export default router;
