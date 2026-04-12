import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import app from "../app";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import { TimeWindow } from "../models/TimeWindow";
import { BlockedDate } from "../models/BlockedDate";

describe("Company Endpoints", () => {
   let companyToken: string;
   let companyId: string;

   beforeEach(async () => {
      const company = await User.create({
         name: "Agro Company",
         email: "agro@company.com",
         password: "hashed",
         role: "company",
         document: "69335607000100", // válido
      });
      companyId = String(company._id);
      companyToken = jwt.sign(
         { userId: companyId, role: "company" },
         process.env.JWT_SECRET || "test-secret",
      );
   });

   describe("Time Windows", () => {
      it("should create a valid time window", async () => {
         const res = await request(app)
            .post("/api/company/time-windows")
            .set("Authorization", `Bearer ${companyToken}`)
            .send({
               date: "2027-10-10",
               startTime: "08:00",
               endTime: "12:00",
               maxVehicles: 5,
            });

         expect(res.status).toBe(201);
         expect(res.body.data).toHaveProperty("_id");
         expect(res.body.data.startTime).toBe("08:00");
         expect(res.body.data.maxVehicles).toBe(5);
         expect(res.body.data.currentCount).toBe(0);
      });

      it("should fail if startTime is after endTime", async () => {
         const res = await request(app)
            .post("/api/company/time-windows")
            .set("Authorization", `Bearer ${companyToken}`)
            .send({
               date: "2027-10-10",
               startTime: "14:00",
               endTime: "12:00",
               maxVehicles: 5,
            });

         expect(res.status).toBe(400); // Error lançado pelo service
         expect(res.body.message).toMatch(/Horário de início deve ser anterior ao horário de fim/i);
      });
   });

   describe("Blocked Dates", () => {
      it("should block a date and set existing windows to inactive", async () => {
         // Cria uma window válida
         const targetDate = new Date("2027-12-25");
         targetDate.setHours(0, 0, 0, 0);

         await TimeWindow.create({
            companyId,
            date: targetDate,
            startTime: "08:00",
            endTime: "10:00",
            maxVehicles: 3,
            isActive: true,
         });

         const res = await request(app)
            .post("/api/company/blocked-dates")
            .set("Authorization", `Bearer ${companyToken}`)
            .send({
               date: "2027-12-25",
               reason: "Natal",
            });

         expect(res.status).toBe(201);
         expect(res.body.data.reason).toBe("Natal");

         // A janela criada deve ter passado para isActive: false
         const window = await TimeWindow.findOne({ companyId, date: targetDate });
         expect(window?.isActive).toBe(false);
      });
   });
});
