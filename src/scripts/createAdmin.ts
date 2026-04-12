import bcrypt from "bcrypt";
import dns from "dns";
import mongoose from "mongoose";
import { env } from "../config/env";
import { User } from "../models/User";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

async function main() {
   console.log("🔄 Conectando ao MongoDB...");
   await mongoose.connect(env.MONGODB_URI);

   const existingAdmin = await User.findOne({ email: "admin@sata.com.br" });
   if (existingAdmin) {
      console.log("⚠️ Usuário admin já existe no banco de dados.");
      await mongoose.disconnect();
      return;
   }

   const password = await bcrypt.hash("Admin@123", 10);

   await User.create({
      name: "Admin SATA",
      email: "admin@sata.com.br",
      password,
      role: "admin",
      document: "00000000000",
      phone: "00000000000",
      isActive: true,
   });

   console.log("Usuário admin criado com sucesso!");
   await mongoose.disconnect();
}

main().catch(console.error);
