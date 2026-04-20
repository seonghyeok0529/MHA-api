export interface ReportMessage {
  role: "user" | "assistant";
  content: string;
}

export interface MentalHealthReport {
  summary: string;
  emotionalFlow: string[];
  keyStatements: string[];
  concerns: string[];
  relationships: string[];
  notesForCounselor: string;
}

export interface MentalHealthReportRequestBody {
  sessionId: string;
}
