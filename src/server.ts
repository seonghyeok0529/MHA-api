import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { initializeDatabase } from "./db";
import chatRoutes from "./routes/chatRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import mentalHealthReportApi from "./api/mentalhealth/report";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", sessionRoutes);
app.use("/api", chatRoutes);
app.use("/api", mentalHealthReportApi);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  const status = message.includes("required") ? 400 : 500;

  res.status(status).json({
    error: message
  });
});

async function startServer() {
  await initializeDatabase();

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to start server: ${message}`);
  process.exit(1);
});
