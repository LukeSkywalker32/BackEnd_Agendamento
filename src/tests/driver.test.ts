import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import app from "../app";
import { Scheduling } from "../models/Scheduling";
import { TimeWindow } from "../models/TimeWindow";
import mongoose from "mongoose";

describe("Driver Checkin Endpoints", () => {
   let schedulingId: string;

   beforeEach(async () => {
      const window = await TimeWindow.create({
         companyId: new mongoose.Types.ObjectId(),
         date: new Date(),
         startTime: "08:00",
         endTime: "10:00",
         maxVehicles: 1,
      });

      try {
         const scheduling = await Scheduling.create({
            carrierId: new mongoose.Types.ObjectId(),
            companyId: new mongoose.Types.ObjectId(),
            timeWindowId: window._id,
            productId: new mongoose.Types.ObjectId(),
            quantity: 10,
            driverName: "Motorista Checkin",
            driverCpf: "12345678909", // CPF válido
            vehiclePlates: { tractor: "XXX9999" },
            vehicleType: "toco",
            status: "confirmed", // O check-in só passará se for confirmed
            documentStatus: "approved",
         });
         schedulingId = String(scheduling._id);
      } catch (e) {
         console.error("SCHEDULING CREATE ERROR:", e);
         throw e;
      }
   });

   it("should find schedulings by valid CPF", async () => {
      const res = await request(app).get("/api/driver/schedulings/12345678909");
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].vehiclePlates.tractor).toBe("XXX9999");
   });

   it("should fail with invalid CPF", async () => {
      const res = await request(app).get("/api/driver/schedulings/11111111111");
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/CPF/i);
   });

   it("should perform checkin successfully", async () => {
      const res = await request(app).post("/api/driver/checkin").send({ cpf: "12345678909" });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("checkin");
      expect(res.body.data.message).toContain("Check-in realizado");

      // Tentar de novo deve barrar
      const resDupe = await request(app).post("/api/driver/checkin").send({ cpf: "12345678909" });

      expect(resDupe.status).toBe(404); // Retorna NotFound pois já atualizou para 'checked_in', parando de bater na tag 'confirmed'
   });

   it("should reject checkin if documents are rejected or pending", async () => {
      await Scheduling.findByIdAndUpdate(schedulingId, {
         status: "pending",
         documentStatus: "rejected",
         rejectionReason: "Nota Fiscal Ilegível",
      });

      const res = await request(app).post("/api/driver/checkin").send({ cpf: "12345678909" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Nota Fiscal Ilegível/i);
   });
});
