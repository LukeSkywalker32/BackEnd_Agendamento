import app from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

async function bootstrap() {
   await connectDatabase();

   app.listen(env.PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${env.PORT}`);
      console.log(`📋 Ambiente: ${env.NODE_ENV}`);
      console.log(`🔗 http://localhost:${env.PORT}`);
   });
}
bootstrap().catch(error => {
   console.error("❌ Erro ao iniciar servidor:", error);
   process.exit(1);
});
