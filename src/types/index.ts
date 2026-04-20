import type { Request } from "express";
export type UserRole = "admin" | "company" | "carrier";
export type SchedulingStatus =
   | "pending"
   | "confirmed"
   | "checked_in"
   | "loaded"
   | "completed"
   | "cancelled";
export type DocumentStatus = "not_attached" | "pending" | "approved" | "rejected";
export type CheckInStatus = "on_time" | "late" | "early";
export type VehicleType = "toco" | "truck" | "vlc" | "carreta" | "bitrem" | "rodotrem";
export type DocumentType = "cnh" | "vehicleDoc" | "purchaseOrder" | "invoice";

export interface JwtPayload {
   userId: string;
   role: UserRole;
}

export interface AuthRequest extends Request {
   user?: JwtPayload;
}

export interface SchedulingDocument {
   type: DocumentType;
   filename: string;
   originalName: string;
   path: string;
   mimetype: string;
   size: number;
   uploadedAt: Date;
}

export interface VehiclePlates {
   tractor: string;
   trailer1?: string;
   trailer2?: string;
   trailer3?: string;
}

export interface PaginationQuery {
   page?: number;
   limit?: number;
}

export interface PaginatedResponse<T> {
   data: T[];
   pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
   };
}
