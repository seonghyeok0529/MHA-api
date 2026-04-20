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
  };
};

type GenerateChatInput = {
  messages: ChatMessage[];
  lastUserMessage: string;
  summary?: string;
};

/* =========================
   SYSTEM PROMPT
========================= */
const SYSTEM_PROMPT = [
  "너는 상담사가 아니라, 사용자가 자연스럽게 자신의 이야기를 꺼내도록 돕는 대화 파트너다.",
  "이 대화의 목적은 상담 전에 사용자가 자신의 상태를 편하게 표현하도록 돕는 것이다.",

  "핵심 역할:",
  "- 질문보다 반응(공감, 정리, 확장)을 우선한다.",
  "- 사용자가 말하도록 만드는 것이 목표다.",

  "대화 규칙:",
  "1) 반드시 '반응 → (필요할 때만) 질문' 순서를 따른다.",
  "2) 질문은 전체 응답의 30% 이하로 유지한다.",
  "3) 같은 의미의 질문 반복 금지",
  "4) 이미 말한 내용을 다시 묻지 않는다.",
  "5) 질문이 막히면 질문하지 말고 확장한다.",
  "6) 질문 없이도 대화를 이어갈 수 있어야 한다.",

  "스타일:",
  "- 1~3문장",
  "- 짧고 자연스럽게",
  "- 담담하고 따뜻하게",
  "- 과한 공감 금지",

  "절대 금지:",
  "- 진단",
  "- 판단",
  "- 성향 분석",
  "- 해결책 제안",
  "- 질문만 이어가기",

  "출력:",
  "- 반드시 자연스러운 대화체",
  "- 설명 금지"
].join("\n");

/* =========================
   OPENAI CLIENT
========================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
   SUMMARY FUNCTION
========================= */
export async function summarizeConversation(messages: ChatMessage[]) {
  if (messages.length < 6) return undefined;

  const completion = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: "다음 대화를 감정과 상황 중심으로 3줄 이내로 요약하세요."
      },
      {
        role: "user",
        content: messages
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n")
      }
    ]
  });

  return completion.output_text?.trim();
}

/* =========================
   MAIN CHAT FUNCTION
========================= */
export async function generateChatReply(
  input: GenerateChatInput
): Promise<ChatResponseBody> {
  const { messages, lastUserMessage, summary } = input;

  const cleanedMessages = sanitizeMessages(messages);

  if (cleanedMessages.length === 0) {
    throw new Error("No valid messages.");
  }

  const startedAt = Date.now();

  const completion = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    temperature: 0.7,
    input: [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },

      // 🔥 요약 (memory 역할)
      ...(summary
        ? [
            {
              role: "system",
              content: `지금까지 대화 요약:\n${summary}`
            }
          ]
        : []),

      // 🔥 최근 대화만 유지 (핵심)
      ...cleanedMessages.slice(-6),

      // 🔥 마지막 메시지 강조
      {
        role: "user",
        content: lastUserMessage
      }
    ]
  });

  const reply = completion.output_text?.trim();

  if (!reply) {
    throw new Error("No response generated.");
  }

  const responseTime = Date.now() - startedAt;

  return {
    reply,
    meta: {
      responseTime,
      length: reply.length,
      userMessageLength: lastUserMessage.length,
      messageCount: cleanedMessages.length
    }
  };
}
