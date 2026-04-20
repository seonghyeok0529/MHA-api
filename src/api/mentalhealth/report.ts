import crypto from "crypto";
import { Router } from "express";
import { getMessagesBySessionId } from "../../repositories/messageRepository";
import { getSessionById } from "../../repositories/sessionRepository";
import { generateMentalHealthReport } from "../../services/reportService";
import { MentalHealthReportRequestBody } from "../../types/report";

const router = Router();

router.post("/mentalhealth/report", async (req, res, next) => {
  const requestId = crypto.randomUUID();

  try {
    const body = req.body as MentalHealthReportRequestBody;
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";

    if (!sessionId) {
      return res.status(400).json({
        error: "Invalid request body. 'sessionId' is required."
      });
    }

    const session = await getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({
        error: "Session not found."
      });
    }

    const storedMessages = await getMessagesBySessionId(sessionId);

    if (storedMessages.length === 0) {
      return res.status(400).json({
        error: "No messages found for this session."
      });
    }

    const report = await generateMentalHealthReport(
      storedMessages.map((message) => ({
        role: message.role,
        content: message.content
      }))
    );

    console.info("[mentalHealthReport] report:success", {
      requestId,
      sessionId,
      messageCount: storedMessages.length
    });

    return res.status(200).json(report);
  } catch (error) {
    console.error("[mentalHealthReport] report:error", {
      requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return next(error);
  }
});

export default router;
