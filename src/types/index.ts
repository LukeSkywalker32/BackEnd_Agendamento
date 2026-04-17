import type { Request } from "express";
export type UserRole = "admin" | "company" | "carrier";
export type SchedulingStatus = "pending" | "confirmed" | "checked_in" | "completed" | "cancelled";
export type DocumentStatus = "not_attached" | "pending" | "approved" | "rejected";
export type CheckInStatus = "on_time" | "late" | "early";

export interface JwtPayload {
   userId: string;
   role: UserRole;
}

export interface AuthRequest extends Request {
   user?: JwtPayload;
}

export interface SchedulingDocument {
   filename: string;
   originalName: string;
   path: string;
   mimetype: string;
   size: number;
   uploadedAt: Date;
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
