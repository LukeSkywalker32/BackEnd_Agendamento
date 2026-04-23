import type { NextFunction, Response } from "express";
import { User } from "../models/User";
import * as authService from "../services/auth.service";
import * as balanceService from "../services/balance.service";
import * as blockedDateService from "../services/blockedDate.service";
import * as checkinService from "../services/checkin.service";
import * as documentValidationService from "../services/documentValidation.service";
import * as productService from "../services/product.service";
import * as schedulingService from "../services/scheduling.service";
import * as timeWindowService from "../services/timeWindow.service";
import type { AuthRequest } from "../types";
import { ApiError } from "../utils/apiError";

export async function createProduct(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const product = await productService.createProduct({
         companyId: req.user!.userId,
         ...req.body,
      });
      res.status(201).json({ status: "success", data: product });
   } catch (error) {
      next(error);
   }
}
export async function getProducts(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const products = await productService.getProductsByCompany(req.user!.userId);
      res.json({ status: "success", data: products });
   } catch (error) {
      next(error);
   }
}
export async function updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const product = await productService.updateProduct(
         req.params.id as string,
         req.user!.userId,
         req.body,
      );
      res.json({ status: "success", data: product });
   } catch (error) {
      next(error);
   }
}
export async function deleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      await productService.deleteProduct(req.params.id as string, req.user!.userId);
      res.json({
         status: "success",
         message: "Insumo desativado com sucesso",
      });
   } catch (error) {
      next(error);
   }
}
/* ════════════════════════════════════════════
   SALDOS DIÁRIOS
   ════════════════════════════════════════════ */

export async function createBalance(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const balance = await balanceService.createBalance({
         companyId: req.user!.userId,
         ...req.body,
      });
      res.status(201).json({ status: "success", data: balance });
   } catch (error) {
      next(error);
   }
}

export async function getBalances(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const { date, productId } = req.query;
      const balances = await balanceService.getBalancesByCompany(req.user!.userId, {
         date: date as string,
         productId: productId as string,
      });
      res.json({ status: "success", data: balances });
   } catch (error) {
      next(error);
   }
}

export async function updateBalance(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const balance = await balanceService.updateBalance(
         req.params.id as string,
         req.user!.userId,
         req.body,
      );
      res.json({ status: "success", data: balance });
   } catch (error) {
      next(error);
   }
}

export async function deleteBalance(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      await balanceService.deleteBalance(req.params.id as string, req.user!.userId);
      res.json({ status: "success", message: "Saldo removido com sucesso" });
   } catch (error) {
      next(error);
   }
}

/* ════════════════════════════════════════════
   TRANSPORTADORAS (CADASTRO PELA EMPRESA)
   ════════════════════════════════════════════ */

export async function registerCarrier(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      // Forçamos o role para "carrier" por segurança
      const userData = { ...req.body, role: "carrier" as const };
      const user = await authService.register(userData);
      res.status(201).json({ status: "success", data: user });
   } catch (error) {
      next(error);
   }
}

export async function getCarriers(_req: AuthRequest, res: Response, next: NextFunction) {
   try {
      const carriers = await User.find({ role: "carrier", isActive: true })
         .select("name email document phone")
         .sort({ name: 1 });
      res.json({ status: "success", data: carriers });
   } catch (error) {
      next(error);
   }
}

/* ════════════════════════════════════════════
   CARREGAMENTO E NOTA FISCAL
   ════════════════════════════════════════════ */

export async function markAsLoaded(req: AuthRequest, res: Response, next: NextFunction) {
   try {
      if (!req.file) {
         throw ApiError.badRequest("Arquivo da Nota Fiscal (PDF) é obrigatório");
      }

      const scheduling = await schedulingService.markAsLoaded(
         req.params.id as string,
         req.user!.userId,
         req.user!.userId,
         req.file,
      );

      res.json({
         status: "success",
         message: "Carregamento confirmado e NF enviada",
         data: scheduling,
      });
   } catch (error) {
      next(error);
   }
}

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
         ...req.body,
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
