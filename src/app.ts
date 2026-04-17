import path from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import routes from "./routes";

const app = express();

// Segurança
app.use(helmet());
app.use(
   cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
   }),
);

// Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
if (env.NODE_ENV !== "test") {
   app.use(morgan("dev"));
}

// Servir arquivos de upload
app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));

// Rotas
app.use("/api", routes);

// Error handler (deve ser o último middleware)
app.use(errorMiddleware);

export default app;
