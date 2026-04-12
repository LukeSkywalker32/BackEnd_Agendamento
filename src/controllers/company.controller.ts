import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../types";
import * as timeWindowService from "../services/timeWindow.service";
import * as blockedDateService from "../services/blockedDate.service";
import * as schedulingService from "../services/scheduling.service";
import * as documentValidationService from "../services/documentValidation.service";
import * as checkinService from "../services/checkin.service";

export async function createTimeWindow(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const window = await timeWindowService.createTimeWindow({
         companyId: req.user!.userId,
         ...req.body,
      });
      res.status(201).json({ status: "success", data: window });
   } catch (error) {
      next(error);
   }
}

export async function getTimeWindows(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const { date } = req.query;
      const windows = await timeWindowService.getTimeWindowsByCompany(
         req.user!.userId,
         date as string | undefined,
      );
      res.json({ status: "success", data: windows });
   } catch (error) {
      next(error);
   }
}

export async function updateTimeWindow(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const window = await timeWindowService.updateTimeWindow(
         req.params.id as string,
         req.user!.userId,
         req.body,
      );
      res.json({ status: "success", data: window });
   } catch (error) {
      next(error);
   }
}

export async function deleteTimeWindow(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      await timeWindowService.deleteTimeWindow(req.params.id as string, req.user!.userId);
      res.json({ status: "success", message: "Janela removida com sucesso" });
   } catch (error) {
      next(error);
   }
}

export async function createBlockedDate(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const blocked = await blockedDateService.createBlockedDate({
         companyId: req.user!.userId,
         ...req.body,
      });
      res.status(201).json({ status: "success", data: blocked });
   } catch (error) {
      next(error);
   }
}

export async function getBlockedDates(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const dates = await blockedDateService.getBlockedDatesByCompany(req.user!.userId);
      res.json({ status: "success", data: dates });
   } catch (error) {
      next(error);
   }
}

export async function deleteBlockedDate(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      await blockedDateService.deleteBlockedDate(req.params.id as string, req.user!.userId);
      res.json({ status: "success", message: "Data desbloqueada com sucesso" });
   } catch (error) {
      next(error);
   }
}

export async function getSchedulings(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const { status } = req.query;
      const schedulings = await schedulingService.getSchedulingsByCompany(
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

export async function validateDocument(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const scheduling = await documentValidationService.validateDocument({
         schedulingId: req.params.id as string,
         companyId: req.user!.userId,
         status: req.body.status,
         rejectionReason: req.body.rejectionReason,
      });
      res.json({ status: "success", data: scheduling });
   } catch (error) {
      next(error);
   }
}

export async function getCheckins(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const checkins = await checkinService.getCheckinsByCompany(req.user!.userId);
      res.json({ status: "success", data: checkins });
   } catch (error) {
      next(error);
   }
}
