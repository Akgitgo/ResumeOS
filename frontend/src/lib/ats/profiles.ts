// ATS profile configuration.
// Versioned so that as ATS vendors change parsing/ranking behaviour we can
// add a new version block without breaking historical scores.
//
// matchType:
//   "exact"    -> keyword must appear verbatim (case-insensitive) in resume
//   "semantic" -> keyword OR a close fuzzy/synonym variant counts
//   "hybrid"   -> exact match scores full points, fuzzy match scores partial
//
// weights must sum to 1.0

import { AtsName, AtsScoreBreakdown } from "../types";

export interface AtsProfile {
  name: AtsName;
  label: string;
  version: string;
  matchType: "exact" | "semantic" | "hybrid";
  weights: AtsScoreBreakdown;
  formattingPenalties: {
    images: number;
    tables: number;
    multiColumn: number;
    nonStandardFonts: number;
  };
  requiredSections: string[];
}

export const ATS_PROFILES: Record<AtsName, AtsProfile> = {
  workday: {
    name: "workday",
    label: "Workday",
    version: "2025-01",
    matchType: "hybrid",
    weights: {
      formatting: 0.2,
      keywordMatch: 0.35,
      sectionCompleteness: 0.2,
      experienceQuality: 0.15,
      education: 0.1,
    },
    formattingPenalties: {
      images: 15,
      tables: 20,
      multiColumn: 15,
      nonStandardFonts: 5,
    },
    requiredSections: ["experience", "education", "skills"],
  },
  taleo: {
    name: "taleo",
    label: "Oracle Taleo",
    version: "2025-01",
    matchType: "exact", // strictest - exact literal keywords required
    weights: {
      formatting: 0.25,
      keywordMatch: 0.4,
      sectionCompleteness: 0.15,
      experienceQuality: 0.1,
      education: 0.1,
    },
    formattingPenalties: {
      images: 25,
      tables: 25,
      multiColumn: 20,
      nonStandardFonts: 10,
    },
    requiredSections: ["experience", "education", "skills", "summary"],
  },
  icims: {
    name: "icims",
    label: "iCIMS",
    version: "2025-01",
    matchType: "semantic", // tolerates synonyms / fuzzy variants
    weights: {
      formatting: 0.15,
      keywordMatch: 0.3,
      sectionCompleteness: 0.2,
      experienceQuality: 0.2,
      education: 0.15,
    },
    formattingPenalties: {
      images: 10,
      tables: 10,
      multiColumn: 10,
      nonStandardFonts: 5,
    },
    requiredSections: ["experience", "education"],
  },
  greenhouse: {
    name: "greenhouse",
    label: "Greenhouse",
    version: "2025-01",
    matchType: "semantic",
    weights: {
      formatting: 0.15,
      keywordMatch: 0.3,
      sectionCompleteness: 0.2,
      experienceQuality: 0.25,
      education: 0.1,
    },
    formattingPenalties: {
      images: 10,
      tables: 10,
      multiColumn: 5,
      nonStandardFonts: 5,
    },
    requiredSections: ["experience", "skills"],
  },
  lever: {
    name: "lever",
    label: "Lever",
    version: "2025-01",
    matchType: "semantic",
    weights: {
      formatting: 0.15,
      keywordMatch: 0.3,
      sectionCompleteness: 0.2,
      experienceQuality: 0.25,
      education: 0.1,
    },
    formattingPenalties: {
      images: 10,
      tables: 10,
      multiColumn: 5,
      nonStandardFonts: 5,
    },
    requiredSections: ["experience", "skills"],
  },
  successfactors: {
    name: "successfactors",
    label: "SAP SuccessFactors",
    version: "2025-01",
    matchType: "hybrid",
    weights: {
      formatting: 0.25,
      keywordMatch: 0.35,
      sectionCompleteness: 0.15,
      experienceQuality: 0.1,
      education: 0.15,
    },
    formattingPenalties: {
      images: 20,
      tables: 25,
      multiColumn: 20,
      nonStandardFonts: 10,
    },
    requiredSections: ["experience", "education", "skills"],
  },
};

export const ALL_ATS_NAMES: AtsName[] = Object.keys(ATS_PROFILES) as AtsName[];
