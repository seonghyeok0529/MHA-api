import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import chatRoutes from "./routes/chatRoutes";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", chatRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  const status = message.includes("required") ? 400 : 500;

  res.status(status).json({
    error: message
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
