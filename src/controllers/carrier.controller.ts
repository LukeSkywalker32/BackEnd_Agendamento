import type { NextFunction, Response } from "express";
import { User } from "../models/User";
import * as schedulingService from "../services/scheduling.service";
import * as timeWindowService from "../services/timeWindow.service";
import type { AuthRequest } from "../types";
import { ApiError } from "../utils/apiError";

export async function listCompanies(_req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const companies = await User.find({ role: "company", isActive: true }).select(
         "name document phone",
      );
      res.json({ status: "success", data: companies });
   } catch (error) {
      next(error);
   }
}

export async function getCompanyTimeWindows(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const { date } = req.query;
      const windows = await timeWindowService.getAvailableTimeWindows(
         req.params.id as string,
         date as string | undefined,
      );
      res.json({ status: "success", data: windows });
   } catch (error) {
      next(error);
   }
}

export async function createScheduling(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const scheduling = await schedulingService.createScheduling(
         {
            carrierId: req.user!.userId,
            ...req.body,
         },
         req.files as { [fieldname: string]: Express.Multer.File[] },
      );
      res.status(201).json({ status: "success", data: scheduling });
   } catch (error) {
      next(error);
   }
}

export async function getSchedulings(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const { status } = req.query;
      const schedulings = await schedulingService.getSchedulingsByCarrier(
         req.user!.userId,
         status as string | undefined,
      );
      res.json({ status: "success", data: schedulings });
   } catch (error) {
      next(error);
   }
}

export async function getSchedulingDetail(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const scheduling = await schedulingService.getSchedulingById(req.params.id as string);
      res.json({ status: "success", data: scheduling });
   } catch (error) {
      next(error);
   }
}

export async function updateScheduling(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const scheduling = await schedulingService.updateScheduling(
         req.params.id as string,
         req.user!.userId,
         req.body,
      );
      res.json({ status: "success", data: scheduling });
   } catch (error) {
      next(error);
   }
}

export async function cancelScheduling(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const scheduling = await schedulingService.cancelScheduling(
         req.params.id as string,
         req.user!.userId,
      );
      res.json({ status: "success", data: scheduling, message: "Agendamento cancelado" });
   } catch (error) {
      next(error);
   }
}

export async function uploadDocuments(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (!files || Object.keys(files).length === 0) {
         res.status(400).json({ status: "error", message: "Nenhum arquivo enviado" });
         return;
      }

      const scheduling = await schedulingService.uploadDocuments(
         req.params.id as string,
         req.user!.userId,
         files,
      );
      res.json({ status: "success", data: scheduling });
   } catch (error) {
      next(error);
   }
}
