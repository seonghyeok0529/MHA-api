import { Router } from "express";
import {
  createSession,
  endSession,
  getSessionById
} from "../repositories/sessionRepository";
import { getMessagesBySessionId } from "../repositories/messageRepository";

const router = Router();

router.post("/session", async (_req, res, next) => {
  try {
    const session = await createSession();

    return res.status(201).json({
      sessionId: session.sessionId
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/session/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({
        error: "Session not found."
      });
    }

    const messages = await getMessagesBySessionId(sessionId);

    return res.status(200).json({
      session,
      messages
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/session/:sessionId/end", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await endSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: "Session not found."
      });
    }

    return res.status(200).json({
      sessionId: session.sessionId,
      status: session.status,
      endedAt: session.endedAt
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
