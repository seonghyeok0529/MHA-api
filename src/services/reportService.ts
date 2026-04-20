import OpenAI from "openai";
import { MentalHealthReport, ReportMessage } from "../types/report";

export const MENTAL_HEALTH_REPORT_PROMPT = [
  "You are a conversation structuring assistant for a mental health pre-counseling workflow.",
  "Your task is ONLY to structure what was explicitly said in the conversation.",
  "",
  "Hard rules:",
  "1) Do NOT diagnose.",
  "2) Do NOT label any mental disorder or condition.",
  "3) Do NOT infer hidden meaning beyond user words.",
  "4) Do NOT provide treatment advice.",
  "5) Keep language neutral, factual, and concise.",
  "",
  "Output requirements:",
  "- Return valid JSON only.",
  "- Use this exact shape:",
  "{",
  '  \"summary\": string,',
  '  \"emotionalFlow\": string[],',
  '  \"keyStatements\": string[],',
  '  \"concerns\": string[],',
  '  \"relationships\": string[],',
  '  \"notesForCounselor\": string',
  "}",
  "",
  "Field guidance:",
  "- summary: 3-5 sentences summarizing key user-described experiences.",
  "- emotionalFlow: chronological emotional states explicitly stated by the user.",
  "- keyStatements: short direct points the user repeatedly or strongly emphasized.",
  "- concerns: repeated worries or stressors the user explicitly mentioned.",
  "- relationships: people/groups and relationship context explicitly mentioned.",
  "- notesForCounselor: practical conversation handoff notes using only explicit user statements; no diagnosis.",
  "",
  "If data is missing for a list field, return an empty array.",
  "If data is missing for a string field, return an empty string."
].join("\n");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const REQUIRED_REPORT_KEYS: Array<keyof MentalHealthReport> = [
  "summary",
  "emotionalFlow",
  "keyStatements",
  "concerns",
  "relationships",
  "notesForCounselor"
];

function extractJson(content: string): string {
  const trimmed = content.trim();

  if (!trimmed) {
    throw new Error("Report model returned empty content.");
  }

  if (trimmed.startsWith("```")) {
    const cleaned = trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    if (cleaned) {
      return cleaned;
    }
  }

  return trimmed;
}

function sanitizeReportValue(value: unknown): MentalHealthReport {
  if (!value || typeof value !== "object") {
    throw new Error("Report output is not a JSON object.");
  }

  const source = value as Partial<Record<keyof MentalHealthReport, unknown>>;

  for (const key of REQUIRED_REPORT_KEYS) {
    if (!(key in source)) {
      throw new Error(`Report output missing key: ${key}.`);
    }
  }

  const toStringArray = (input: unknown): string[] => {
    if (!Array.isArray(input)) {
      throw new Error("Report output has invalid array fields.");
    }

    return input
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const toStringValue = (input: unknown, field: string): string => {
    if (typeof input !== "string") {
      throw new Error(`Report output field '${field}' must be a string.`);
    }

    return input.trim();
  };

  return {
    summary: toStringValue(source.summary, "summary"),
    emotionalFlow: toStringArray(source.emotionalFlow),
    keyStatements: toStringArray(source.keyStatements),
    concerns: toStringArray(source.concerns),
    relationships: toStringArray(source.relationships),
    notesForCounselor: toStringValue(source.notesForCounselor, "notesForCounselor")
  };
}

function sanitizeMessages(messages: ReportMessage[]): ReportMessage[] {
  return messages
    .filter((message) => message && typeof message.content === "string")
    .map((message) => ({
      role: message.role,
      content: message.content.trim()
    }))
    .filter((message) => message.content.length > 0);
}

export async function generateMentalHealthReport(
  messages: ReportMessage[]
): Promise<MentalHealthReport> {
  const cleanedMessages = sanitizeMessages(messages);

  if (cleanedMessages.length === 0) {
    throw new Error("At least one valid message is required to generate a report.");
  }

  const completion = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      { role: "system", content: MENTAL_HEALTH_REPORT_PROMPT },
      ...cleanedMessages.map((message) => ({
        role: message.role,
        content: message.content
      }))
    ],
    temperature: 0.2
  });

  const outputText = completion.output_text;
  const jsonPayload = extractJson(outputText || "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonPayload);
  } catch {
    throw new Error("Report model returned invalid JSON.");
  }

  return sanitizeReportValue(parsed);
}
