import dns from "dns";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

export async function connectDatabase(): Promise<void> {
   try {
      await mongoose.connect(process.env.MONGODB_URI as string);
      console.log("✅ MongoDB Atlas conectado com sucesso");
   } catch (error) {
      console.error("❌ Erro ao conectar no MongoDB:", error);
      process.exit(1);
   }

   mongoose.connection.on("error", error => {
      console.error("❌ Erro na conexão MongoDB:", error);
   });

   mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB desconectado");
   });
}
