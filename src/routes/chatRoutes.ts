import crypto from "crypto";
import { Router } from "express";
import { withTransaction } from "../db";
import { generateChatReply } from "../services/chatService";
import { addMessage } from "../repositories/messageRepository";
import { getSessionById } from "../repositories/sessionRepository";
import { saveMetric } from "../repositories/metricRepository";
import { ChatRequestBody } from "../types/chat";

const router = Router();

router.post("/chat", async (req, res, next) => {
  const requestId = crypto.randomUUID();

  try {
    const body = req.body as ChatRequestBody;
    console.info("[chatRoutes] /chat request:start", {
      requestId,
      sessionId: body?.sessionId,
      messageCount: Array.isArray(body?.messages) ? body.messages.length : 0
    });

    if (!body || typeof body.sessionId !== "string" || !body.sessionId.trim()) {
      return res.status(400).json({
        error: "Invalid request body. 'sessionId' is required."
      });
    }

    if (!Array.isArray(body.messages)) {
      return res.status(400).json({
        error: "Invalid request body. 'messages' array is required."
      });
    }

    const session = await getSessionById(body.sessionId);
    console.info("[chatRoutes] /chat session:lookup", {
      requestId,
      sessionId: body.sessionId,
      found: Boolean(session),
      status: session?.status
    });

    if (!session) {
      return res.status(404).json({
        error: "Session not found."
      });
    }

    if (session.status === "ended") {
      return res.status(400).json({
        error: "Session has already ended."
      });
    }

    const latestUserMessage = [...body.messages]
      .reverse()
      .find((message) => message.role === "user" && typeof message.content === "string" && message.content.trim());

    if (!latestUserMessage) {
      return res.status(400).json({
        error: "At least one valid user message is required."
      });
    }

    await addMessage(body.sessionId, "user", latestUserMessage.content.trim());
    console.info("[chatRoutes] /chat persisted:user-message", {
      requestId,
      sessionId: body.sessionId
    });

    const result = await generateChatReply(body.messages);
    console.info("[chatRoutes] /chat llm:reply-generated", {
      requestId,
      sessionId: body.sessionId,
      replyLength: result.reply.length
    });

    await withTransaction(async (client) => {
      await addMessage(body.sessionId, "assistant", result.reply, client);
      await saveMetric(body.sessionId, result.meta, client);
    });
    console.info("[chatRoutes] /chat persisted:assistant-and-metric", {
      requestId,
      sessionId: body.sessionId
    });

    console.info("[chatRoutes] /chat request:success", {
      requestId,
      sessionId: body.sessionId
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("[chatRoutes] /chat request:error", {
      requestId,
      error: error instanceof Error ? error.message : String(error)
    });
    return next(error);
  }
});

export default router;
