import { Router } from "express";
import { createSession, endSession, getMessagesBySessionId, getSessionById } from "../store/memoryStore";

const router = Router();

router.post("/session", (_req, res) => {
  const session = createSession();

  return res.status(201).json({
    sessionId: session.sessionId
  });
});

router.get("/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const session = getSessionById(sessionId);

  if (!session) {
    return res.status(404).json({
      error: "Session not found."
    });
  }

  const messages = getMessagesBySessionId(sessionId);

  return res.status(200).json({
    session,
    messages
  });
});

router.post("/session/:sessionId/end", (req, res) => {
  const { sessionId } = req.params;
  const session = endSession(sessionId);

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
});

export default router;
