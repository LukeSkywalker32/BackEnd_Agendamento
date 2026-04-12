import type { NextFunction, Request, Response } from "express";
import { User } from "../models/User";
import { Scheduling } from "../models/Scheduling";
import { CheckIn } from "../models/CheckIn";
import * as schedulingService from "../services/scheduling.service";
import { ApiError } from "../utils/apiError";

export async function listUsers(req: Request, res: Response, next: NextFunction) {
   try {
      const { role, isActive } = req.query;
      const query: Record<string, unknown> = {};
      if (role) query.role = role;
      if (isActive !== undefined) query.isActive = isActive === "true";

      const users = await User.find(query).select("-password").sort({ createdAt: -1 });
      res.json({ status: "success", data: users });
   } catch (error) {
      next(error);
   }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
   try {
      const user = await User.findById(req.params.id).select("-password");
      if (!user) {
         throw ApiError.notFound("Usuário não encontrado");
      }
      res.json({ status: "success", data: user });
   } catch (error) {
      next(error);
   }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
   try {
      const { password, role, ...updateData } = req.body;
      const user = await User.findByIdAndUpdate(req.params.id, updateData, {
         new: true,
         runValidators: true,
      }).select("-password");

      if (!user) {
         throw ApiError.notFound("Usuário não encontrado");
      }
      res.json({ status: "success", data: user });
   } catch (error) {
      next(error);
   }
}

export async function deactivateUser(req: Request, res: Response, next: NextFunction) {
   try {
      const user = await User.findByIdAndUpdate(
         req.params.id,
         { isActive: false },
         { new: true },
      ).select("-password");

      if (!user) {
         throw ApiError.notFound("Usuário não encontrado");
      }
      res.json({ status: "success", data: user, message: "Usuário desativado" });
   } catch (error) {
      next(error);
   }
}

export async function listAllSchedulings(req: Request, res: Response, next: NextFunction) {
   try {
      const { status } = req.query;
      const schedulings = await schedulingService.getAllSchedulings(status as string | undefined);
      res.json({ status: "success", data: schedulings });
   } catch (error) {
      next(error);
   }
}

export async function getDashboard(_req: Request, res: Response, next: NextFunction) {
   try {
      const [
         totalUsers,
         totalCompanies,
         totalCarriers,
         totalSchedulings,
         pendingSchedulings,
         confirmedSchedulings,
         totalCheckins,
      ] = await Promise.all([
         User.countDocuments({ isActive: true }),
         User.countDocuments({ role: "company", isActive: true }),
         User.countDocuments({ role: "carrier", isActive: true }),
         Scheduling.countDocuments(),
         Scheduling.countDocuments({ status: "pending" }),
         Scheduling.countDocuments({ status: "confirmed" }),
         CheckIn.countDocuments(),
      ]);

      res.json({
         status: "success",
         data: {
            totalUsers,
            totalCompanies,
            totalCarriers,
            totalSchedulings,
            pendingSchedulings,
            confirmedSchedulings,
            totalCheckins,
         },
      });
   } catch (error) {
      next(error);
   }
}
