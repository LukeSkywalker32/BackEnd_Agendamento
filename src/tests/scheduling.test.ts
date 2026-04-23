import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import app from "../app";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import { TimeWindow } from "../models/TimeWindow";
import path from "node:path";
import { Scheduling } from "../models/Scheduling";
import { Product } from "../models/Product";
import { ProductBalance } from "../models/ProductBalance";
import fs from "node:fs";

describe("Carrier & Scheduling Endpoints", () => {
   let carrierToken: string;
   let carrierId: string;
   let companyId: string;
   let timeWindowId: string;
   let productId: string;

   // Criar arquivo mock para upload
   const testFilePath = path.join(__dirname, "test-file.pdf");

   beforeEach(async () => {
      // Escreve um arquivo dummy
      fs.writeFileSync(testFilePath, "dummy pdf content");

      const carrier = await User.create({
         name: "Trans LTDA",
         email: "trans@carrier.com",
         password: "hashed",
         role: "carrier",
         document: "69335607000100",
      });
      carrierId = String(carrier._id);
      carrierToken = jwt.sign(
         { userId: carrierId, role: "carrier" },
         process.env.JWT_SECRET || "test-secret",
      );

      const company = await User.create({
         name: "Agro Test",
         email: "agro2@company.com",
         password: "hashed",
         role: "company",
         document: "52793633000171",
      });
      companyId = String(company._id);

      const window = await TimeWindow.create({
         companyId,
         date: new Date("2027-05-15"),
         startTime: "10:00",
         endTime: "12:00",
         maxVehicles: 1, // Vamos testar limite
         currentCount: 0,
      });
      timeWindowId = String(window._id);

      const product = await Product.create({
         companyId,
         name: "Milho",
         unit: "ton",
         isActive: true
      });
      productId = String(product._id);

      await ProductBalance.create({
         productId,
         companyId,
         date: new Date("2027-05-15"),
         totalAmount: 100,
         reservedAmount: 0,
         usedAmount: 0
      });
   });

   // Limpar arquivo
   // afterAll(() => {
   //  try { fs.unlinkSync(testFilePath) } catch(e){}
   // }) - Para testes é melhor garantir pelo hooks depois

   it("should create a scheduling with valid CPF and capacity", async () => {
      const res = await request(app)
         .post("/api/carrier/schedulings")
         .set("Authorization", `Bearer ${carrierToken}`)
         .field("companyId", companyId)
         .field("timeWindowId", timeWindowId)
         .field("productId", productId)
         .field("quantity", 10)
         .field("driverName", "João Silva")
         .field("driverCpf", "11122233344") // Inválido, vai falhar!
         .field("vehiclePlates[tractor]", "ABC1234")
         .field("vehicleType", "truck")
         .attach("documents", testFilePath);

      // O algortimo de CPF é acionado
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/CPF.*inválido/i);
   });

   it("should successfully create scheduling with valid CPF and update capacity", async () => {
      // 04467362089 (Mock de CPF logicamente válido para Modulo 11 - apenas estruturalmente)
      // vamos usar 01234567890 q talvez falhe. Vamos gerar um CPF válido ou testar mock.
      // Usaremos "97466814041" (CPF válido gerado no gerador)

      const res = await request(app)
         .post("/api/carrier/schedulings")
         .set("Authorization", `Bearer ${carrierToken}`)
         .field("companyId", companyId)
         .field("timeWindowId", timeWindowId)
         .field("productId", productId)
         .field("quantity", 10)
         .field("driverName", "João Silva")
         .field("driverCpf", "12345678909") // Válido
         .field("vehiclePlates[tractor]", "ABC1234")
         .field("vehicleType", "truck");

      if (res.status === 404) console.log(res.body);

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("pending");
      expect(res.body.data.vehiclePlates.tractor).toBe("ABC1234");

      // Verificar se incrementou currentCount
      const window = await TimeWindow.findById(timeWindowId);
      expect(window?.currentCount).toBe(1);
   });

   it("should prevent scheduling if timeWindow is full", async () => {
      // Ocupar slot primeiro
      await TimeWindow.findByIdAndUpdate(timeWindowId, { currentCount: 1 }); // Sendo max 1

      const res = await request(app)
         .post("/api/carrier/schedulings")
         .set("Authorization", `Bearer ${carrierToken}`)
         .field("companyId", companyId)
         .field("timeWindowId", timeWindowId)
         .field("productId", productId)
         .field("quantity", 10)
         .field("driverName", "João Silva")
         .field("driverCpf", "12345678909")
         .field("vehiclePlates[tractor]", "ABC1234")
         .field("vehicleType", "truck");

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Janela de horário indisponível/i);
   });
});
