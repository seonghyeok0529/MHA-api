import { Router } from "express";
import { generateChatReply } from "../services/chatService";
import { getSessionById, addMessage } from "../store/memoryStore";
import { ChatRequestBody } from "../types/chat";

const router = Router();

router.post("/chat", async (req, res, next) => {
  try {
    const body = req.body as ChatRequestBody;

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

    const session = getSessionById(body.sessionId);

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

    addMessage(body.sessionId, "user", latestUserMessage.content.trim());

    const result = await generateChatReply(body.messages);

    addMessage(body.sessionId, "assistant", result.reply);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

export default router;
