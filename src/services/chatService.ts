import OpenAI from "openai";

/* =========================
   TYPES
========================= */
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatResponseBody = {
  reply: string;
  meta: {
    responseTime: number;
    length: number;
    userMessageLength: number;
    messageCount: number;
    userType: string;
    stage: string;
  };
};

/* =========================
   OPENAI
========================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* =========================
   BASE SYSTEM PROMPT
========================= */
const SYSTEM_PROMPT = `
너는 상담사가 아니라 사용자가 자연스럽게 자신의 이야기를 꺼내도록 돕는 대화 파트너다.

목표:
- 사용자가 편하게 말하도록 만드는 것
- 질문보다 반응(공감, 정리, 확장)을 우선

규칙:
- 반드시 반응 → 질문 순서
- 질문 비율 최소화
- 같은 질문 반복 금지
- 이미 말한 내용 재질문 금지
- 질문 없이도 대화 유지 가능해야 함

스타일:
- 1~3문장
- 자연스럽고 담백하게
- 과한 공감 금지

금지:
- 진단
- 판단
- 해결책 제안
- 성향 분석
- 질문만 이어가기
`;

/* =========================
   UTILS
========================= */
function sanitizeMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .filter((m) => m && typeof m.content === "string")
    .map((m) => ({
      role: m.role,
      content: m.content.trim()
    }))
    .filter((m) => m.content.length > 0);
}

/* =========================
   USER TYPE DETECTION
========================= */
function detectUserType(messages: ChatMessage[]): "low" | "medium" | "high" {
  const userMessages = messages.filter((m) => m.role === "user");

  if (userMessages.length === 0) return "medium";

  const avgLength =
    userMessages.reduce((acc, m) => acc + m.content.length, 0) /
    userMessages.length;

  if (avgLength < 20) return "low";
  if (avgLength < 60) return "medium";
  return "high";
}

/* =========================
   STAGE DETECTION
========================= */
function detectStage(messages: ChatMessage[]): "rapport" | "explore" | "deep" {
  const userCount = messages.filter((m) => m.role === "user").length;

  if (userCount < 3) return "rapport";
  if (userCount < 8) return "explore";
  return "deep";
}

/* =========================
   DYNAMIC PROMPT
========================= */
function buildDynamicPrompt(userType: string) {
  if (userType === "low") {
    return `
사용자가 말을 적게 하는 상태다.
- 질문을 줄이고 반응 중심
- 부담 없는 짧은 질문만 허용
`;
  }

  if (userType === "high") {
    return `
사용자가 충분히 이야기하고 있다.
- 내용을 정리하고 구조화
- 필요할 때만 질문
`;
  }

  return `
균형 있는 대화를 유지한다.
`;
}

/* =========================
   STAGE PROMPT
========================= */
function getStagePrompt(stage: string) {
  if (stage === "rapport") {
    return `
- 가볍고 편한 대화
- 깊은 질문 금지
`;
  }

  if (stage === "explore") {
    return `
- 감정과 상황을 자연스럽게 탐색
`;
  }

  return `
- 핵심 감정과 패턴 정리
`;
}

/* =========================
   SUMMARY
========================= */
export async function summarizeConversation(messages: ChatMessage[]) {
  if (messages.length < 6) return undefined;

  const completion = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: "다음 대화를 감정과 상황 중심으로 짧게 요약하세요."
      },
      {
        role: "user",
        content: messages.map((m) => `${m.role}: ${m.content}`).join("\n")
      }
    ]
  });

  return completion.output_text?.trim();
}

/* =========================
   MAIN FUNCTION
========================= */
export async function generateSmartReply(
  messages: ChatMessage[],
  summary?: string
): Promise<ChatResponseBody> {
  const cleanedMessages = sanitizeMessages(messages);

  if (cleanedMessages.length === 0) {
    throw new Error("No valid messages");
  }

  const lastUserMessage =
    cleanedMessages.filter((m) => m.role === "user").pop()?.content || "";

  const userType = detectUserType(cleanedMessages);
  const stage = detectStage(cleanedMessages);

  const dynamicPrompt = buildDynamicPrompt(userType);
  const stagePrompt = getStagePrompt(stage);

  const startedAt = Date.now();

  const completion = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    temperature: 0.7,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: dynamicPrompt },
      { role: "system", content: stagePrompt },

      ...(summary
        ? [{ role: "system", content: `대화 요약:\n${summary}` }]
        : []),

      ...cleanedMessages.slice(-6),

      { role: "user", content: lastUserMessage }
    ]
  });

  const reply = completion.output_text?.trim();

  if (!reply) {
    throw new Error("No response generated");
  }

  const responseTime = Date.now() - startedAt;

  return {
    reply,
    meta: {
      responseTime,
      length: reply.length,
      userMessageLength: lastUserMessage.length,
      messageCount: cleanedMessages.length,
      userType,
      stage
    }
  };
}
