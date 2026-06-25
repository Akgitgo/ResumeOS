// Shared types across the app

export type SectionKey =
  | "summary"
  | "experience"
  | "projects"
  | "skills"
  | "education"
  | "certifications"
  | "awards"
  | "languages"
  | "others";

export interface ParsedResume {
  rawText: string;
  sections: Record<string, string>;
  formattingMeta: FormattingMeta;
}

export interface FormattingMeta {
  hasImages: boolean;
  hasTables: boolean;
  multiColumn: boolean;
  pageCount: number;
  fonts: string[];
  wordCount: number;
}

export type AtsName =
  | "workday"
  | "taleo"
  | "icims"
  | "greenhouse"
  | "lever"
  | "successfactors";

export interface AtsScoreBreakdown {
  formatting: number;
  keywordMatch: number;
  sectionCompleteness: number;
  experienceQuality: number;
  education: number;
}

export interface AtsScoreResult {
  ats: AtsName;
  score: number; // 0-100
  breakdown: AtsScoreBreakdown;
  suggestions: string[];
}

export interface ScoreInput {
  resumeText: string;
  resumeSections: Record<string, string>;
  formattingMeta: FormattingMeta;
  jdText: string;
}

export interface AiCompletionResult {
  text: string;
  provider: string;
  model: string;
}
