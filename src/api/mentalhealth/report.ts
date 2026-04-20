import crypto from "crypto";
import { Router } from "express";
import { getMessagesBySessionId } from "../../repositories/messageRepository";
import {
  getCachedMentalHealthReport,
  saveMentalHealthReport
} from "../../repositories/mentalHealthReportRepository";
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

    const messageDigest = crypto
      .createHash("sha256")
      .update(
        storedMessages
          .map((message) => `${message.messageId}:${message.role}:${message.content}`)
          .join("\n")
      )
      .digest("hex");

    const cachedReport = await getCachedMentalHealthReport(sessionId);

    if (
      cachedReport &&
      cachedReport.messageDigest === messageDigest &&
      cachedReport.messageCount === storedMessages.length
    ) {
      console.info("[mentalHealthReport] report:cache_hit", {
        requestId,
        sessionId,
        messageCount: storedMessages.length
      });

      return res.status(200).json(cachedReport.report);
    }

    const report = await generateMentalHealthReport(
      storedMessages.map((message) => ({
        role: message.role,
        content: message.content
      }))
    );

    await saveMentalHealthReport(sessionId, messageDigest, storedMessages.length, report);

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
