import { Router } from "express";
import { generateChatReply } from "../services/chatService";
import { ChatRequestBody } from "../types/chat";

const router = Router();

router.post("/chat", async (req, res, next) => {
  try {
    const body = req.body as ChatRequestBody;

    if (!body || !Array.isArray(body.messages)) {
      return res.status(400).json({
        error: "Invalid request body. 'messages' array is required."
      });
    }

    const result = await generateChatReply(body.messages);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

export default router;
