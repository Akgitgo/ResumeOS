import {
  AtsName,
  AtsScoreResult,
  ScoreInput,
  AtsScoreBreakdown,
} from "../types";
import { ATS_PROFILES, ALL_ATS_NAMES, AtsProfile } from "./profiles";
import {
  extractKeywords,
  isKeywordPresent,
  ACTION_VERBS,
  METRIC_REGEX,
  tokenize,
} from "./keywords";

const REQUIRED_SECTION_LABELS: Record<string, string[]> = {
  experience: ["experience", "work experience", "employment"],
  education: ["education", "academic"],
  skills: ["skills", "technical skills", "core competencies"],
  summary: ["summary", "objective", "profile"],
};

function detectSections(resumeText: string): Set<string> {
  const lower = resumeText.toLowerCase();
  const found = new Set<string>();
  for (const [key, labels] of Object.entries(REQUIRED_SECTION_LABELS)) {
    if (labels.some((l) => lower.includes(l))) found.add(key);
  }
  return found;
}

function scoreFormatting(profile: AtsProfile, meta: ScoreInput["formattingMeta"]): {
  score: number;
  notes: string[];
} {
  let score = 100;
  const notes: string[] = [];
  const p = profile.formattingPenalties;

  if (meta.hasImages) {
    score -= p.images;
    notes.push(`Remove images/photos - ${profile.label} cannot parse them.`);
  }
  if (meta.hasTables) {
    score -= p.tables;
    notes.push(`Avoid tables - ${profile.label} often misreads table content.`);
  }
  if (meta.multiColumn) {
    score -= p.multiColumn;
    notes.push(`Use a single-column layout - multi-column resumes confuse ${profile.label}'s parser.`);
  }
  const nonStandard = meta.fonts.some(
    (f) => !/(arial|calibri|times|georgia|helvetica|garamond|cambria)/i.test(f)
  );
  if (nonStandard) {
    score -= p.nonStandardFonts;
    notes.push("Use a standard font (Arial, Calibri, Times New Roman, Georgia).");
  }

  return { score: Math.max(0, score), notes };
}

function scoreKeywords(
  profile: AtsProfile,
  resumeText: string,
  jdKeywords: string[]
): { score: number; notes: string[]; missing: string[] } {
  let exactCount = 0;
  let fuzzyCount = 0;
  const missing: string[] = [];

  for (const kw of jdKeywords) {
    const result = isKeywordPresent(kw, resumeText, profile.matchType);
    if (result === "exact") exactCount++;
    else if (result === "fuzzy") fuzzyCount++;
    else missing.push(kw);
  }

  const total = jdKeywords.length || 1;
  let weighted: number;
  if (profile.matchType === "exact") {
    weighted = exactCount / total;
  } else if (profile.matchType === "hybrid") {
    weighted = (exactCount + fuzzyCount * 0.6) / total;
  } else {
    // semantic: exact and fuzzy nearly equivalent
    weighted = (exactCount + fuzzyCount * 0.85) / total;
  }

  const score = Math.round(Math.min(1, weighted) * 100);
  const notes: string[] = [];
  if (missing.length > 0) {
    notes.push(
      `Add these JD keywords (missing for ${profile.label}): ${missing
        .slice(0, 8)
        .join(", ")}${missing.length > 8 ? ", ..." : ""}`
    );
  }
  return { score, notes, missing };
}

function scoreSections(profile: AtsProfile, resumeText: string): {
  score: number;
  notes: string[];
} {
  const found = detectSections(resumeText);
  const required = profile.requiredSections;
  const missing = required.filter((r) => !found.has(r));
  const score = Math.round(((required.length - missing.length) / required.length) * 100);
  const notes = missing.map((m) => `Add a clearly labeled "${m}" section.`);
  return { score, notes };
}

function scoreExperienceQuality(resumeText: string): { score: number; notes: string[] } {
  const lower = resumeText.toLowerCase();
  const tokens = tokenize(resumeText);
  const verbHits = ACTION_VERBS.filter((v) => tokens.includes(v)).length;
  const metricMatches = (resumeText.match(METRIC_REGEX) || []).length;

  // Heuristic scoring: cap contributions so a single metric doesn't max it out
  const verbScore = Math.min(60, verbHits * 8);
  const metricScore = Math.min(40, metricMatches * 10);
  const score = Math.min(100, verbScore + metricScore);

  const notes: string[] = [];
  if (verbHits < 3) {
    notes.push("Start more bullets with strong action verbs (Led, Built, Optimized, Drove...).");
  }
  if (metricMatches < 2) {
    notes.push("Add quantifiable results (%, $, time saved, users, scale) to bullets.");
  }
  return { score, notes };
}

function scoreEducation(resumeText: string): { score: number; notes: string[] } {
  const lower = resumeText.toLowerCase();
  const hasDegree = /(b\.?tech|bachelor|b\.?sc|b\.?e\.?|master|m\.?tech|mba|phd|diploma)/i.test(
    lower
  );
  const hasInstitution = /(university|institute|college|school)/i.test(lower);
  let score = 0;
  const notes: string[] = [];
  if (hasDegree) score += 60;
  else notes.push('Add a clear degree title (e.g. "B.Tech in Electronics").');
  if (hasInstitution) score += 40;
  else notes.push("Add your institution/university name.");
  return { score, notes };
}

export function scoreAgainstAts(input: ScoreInput, atsName: AtsName): AtsScoreResult {
  const profile = ATS_PROFILES[atsName];
  const jdKeywords = extractKeywords(input.jdText, 40);

  const fmt = scoreFormatting(profile, input.formattingMeta);
  const kw = scoreKeywords(profile, input.resumeText, jdKeywords);
  const sec = scoreSections(profile, input.resumeText);
  const exp = scoreExperienceQuality(input.resumeText);
  const edu = scoreEducation(input.resumeText);

  const breakdown: AtsScoreBreakdown = {
    formatting: fmt.score,
    keywordMatch: kw.score,
    sectionCompleteness: sec.score,
    experienceQuality: exp.score,
    education: edu.score,
  };

  const w = profile.weights;
  const total =
    breakdown.formatting * w.formatting +
    breakdown.keywordMatch * w.keywordMatch +
    breakdown.sectionCompleteness * w.sectionCompleteness +
    breakdown.experienceQuality * w.experienceQuality +
    breakdown.education * w.education;

  const suggestions = [
    ...fmt.notes,
    ...kw.notes,
    ...sec.notes,
    ...exp.notes,
    ...edu.notes,
  ];

  return {
    ats: atsName,
    score: Math.round(total),
    breakdown,
    suggestions,
  };
}

export function scoreAgainstAllAts(input: ScoreInput): AtsScoreResult[] {
  return ALL_ATS_NAMES.map((name) => scoreAgainstAts(input, name));
}

export function overallScore(results: AtsScoreResult[]): number {
  if (results.length === 0) return 0;
  const sum = results.reduce((acc, r) => acc + r.score, 0);
  return Math.round(sum / results.length);
}

export { extractKeywords };
