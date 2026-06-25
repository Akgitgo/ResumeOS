import { ParsedResume, FormattingMeta } from "../types";

const SECTION_HEADERS: Record<string, RegExp> = {
  summary: /\b(summary|objective|profile)\b/i,
  experience: /\b(experience|employment|work history)\b/i,
  projects: /\b(projects?)\b/i,
  skills: /\b(skills|technical skills|core competencies)\b/i,
  education: /\b(education|academics?)\b/i,
  certifications: /\b(certifications?|licenses?)\b/i,
  awards: /\b(awards?|honors?|achievements?)\b/i,
  languages: /\b(languages?)\b/i,
  others: /\b(volunteer|publications?|hobbies|interests|extracurriculars?)\b/i,
};

// Splits raw resume text into sections based on heading lines (short lines
// that match a known section keyword). Anything before the first detected
// heading is treated as "summary" / header block.
export function splitIntoSections(rawText: string): Record<string, string> {
  const lines = rawText.split(/\r?\n/);
  const sections: Record<string, string> = {};
  let currentKey = "header";
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length > 0) {
      sections[currentKey] = ((sections[currentKey] || "") + "\n" + buffer.join("\n")).trim();
    }
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const isShort = trimmed.length > 0 && trimmed.length < 40;
    let matchedKey: string | null = null;

    if (isShort) {
      for (const [key, regex] of Object.entries(SECTION_HEADERS)) {
        if (regex.test(trimmed)) {
          matchedKey = key;
          break;
        }
      }
    }

    if (matchedKey) {
      flush();
      currentKey = matchedKey;
    } else {
      buffer.push(line);
    }
  }
  flush();

  return sections;
}

// Heuristic formatting analysis from raw PDF text + basic structural signals.
// For a true production system, pdf-parse's `info`/`metadata` plus a layout
// library (e.g. pdf2json) would give richer signals - this keeps it
// dependency-light while still catching the most common ATS killers.
function analyzeFormatting(rawText: string, pageCount: number): FormattingMeta {
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;

  // Many short consecutive lines with large gaps often indicate a
  // multi-column layout that pdf-parse linearizes oddly.
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const shortLineRatio =
    lines.filter((l) => l.trim().length < 25).length / Math.max(1, lines.length);
  const multiColumn = shortLineRatio > 0.55 && lines.length > 30;

  return {
    hasImages: false, // requires binary inspection - set true upstream if detected
    hasTables: false, // requires layout inspection - set true upstream if detected
    multiColumn,
    pageCount,
    fonts: [], // populated upstream if font metadata is available
    wordCount,
  };
}

export async function parsePdfBuffer(buffer: Buffer): Promise<ParsedResume> {
  // Lazy import: pdf-parse touches the filesystem on import in some
  // environments, so only load it when actually needed (server-side route).
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);

  const rawText = data.text || "";
  const sections = splitIntoSections(rawText);
  const formattingMeta = analyzeFormatting(rawText, data.numpages || 1);

  return { rawText, sections, formattingMeta };
}

export async function parseDocxBuffer(buffer: Buffer): Promise<ParsedResume> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });

  const rawText = result.value || "";
  const sections = splitIntoSections(rawText);
  const formattingMeta = analyzeFormatting(rawText, 1);

  // mammoth's extractRawText drops images/tables silently - if the original
  // had embedded images, convertToHtml would show <img> tags. We do a cheap
  // second pass to detect that signal.
  try {
    const html = await mammoth.convertToHtml({ buffer });
    formattingMeta.hasImages = /<img/i.test(html.value);
    formattingMeta.hasTables = /<table/i.test(html.value);
  } catch {
    // non-fatal - keep defaults
  }

  return { rawText, sections, formattingMeta };
}

export async function parseResumeFile(
  buffer: Buffer,
  mimeType: string
): Promise<ParsedResume> {
  if (mimeType === "application/pdf") {
    return parsePdfBuffer(buffer);
  }
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return parseDocxBuffer(buffer);
  }
  if (mimeType === "text/plain") {
    const rawText = buffer.toString("utf-8");
    return {
      rawText,
      sections: splitIntoSections(rawText),
      formattingMeta: analyzeFormatting(rawText, 1),
    };
  }
  throw new Error(`Unsupported file type: ${mimeType}`);
}
