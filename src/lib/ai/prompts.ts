// Centralized prompt templates. Keep prompts short, structured, and
// instruct the model to output ONLY the requested content (no preamble)
// so responses can be inserted directly into resume fields.

export function rewriteBulletPrompt(opts: {
  originalBullet: string;
  jdKeywords: string[];
  roleContext?: string;
}): string {
  const { originalBullet, jdKeywords, roleContext } = opts;
  return `You are an expert ATS resume writer.
Rewrite the resume bullet below so it aligns with the target job description keywords.
Rules:
- Keep it to ONE line, start with a strong action verb.
- Include a quantifiable result (%, number, time, scale) if plausible - do not invent false numbers, but reframe vague claims with realistic estimates if the original implies scale.
- Naturally weave in 1-3 of the JD keywords below where truthful and relevant.
- Do not fabricate technologies or responsibilities not implied by the original bullet.
- Output ONLY the rewritten bullet text. No quotes, no labels, no explanation.

JD keywords: ${jdKeywords.join(", ")}
${roleContext ? `Role context: ${roleContext}\n` : ""}Original bullet: ${originalBullet}
Rewritten bullet:`;
}

export function rewriteSummaryPrompt(opts: {
  currentSummary: string;
  jdTitle: string;
  jdKeywords: string[];
  topSkills: string[];
}): string {
  const { currentSummary, jdTitle, jdKeywords, topSkills } = opts;
  return `You are an expert ATS resume writer.
Rewrite the professional summary below (2-3 sentences max) to target the role of "${jdTitle}".
Rules:
- 2-3 sentences, no bullet points.
- Naturally include 3-5 of these JD keywords: ${jdKeywords.join(", ")}
- Reflect these candidate skills where true: ${topSkills.join(", ")}
- Confident, professional tone. No first-person pronouns.
- Output ONLY the rewritten summary text.

Current summary: ${currentSummary || "(none provided)"}
Rewritten summary:`;
}

export function suggestionsPrompt(opts: {
  resumeText: string;
  jdText: string;
  scoreReport: string;
}): string {
  const { resumeText, jdText, scoreReport } = opts;
  return `You are an ATS resume auditor.
Given the resume, job description, and per-ATS score report below, list the TOP 5 most impactful, concrete edits the candidate should make.
Rules:
- Output a numbered list, 1-5.
- Each item: max 1 sentence, specific and actionable (not generic advice).
- Reference exact missing keywords or sections where relevant.
- No preamble or closing remarks.

Resume:
${resumeText.slice(0, 4000)}

Job Description:
${jdText.slice(0, 2000)}

Score Report:
${scoreReport}

Top 5 edits:`;
}

export function keywordExtractionPrompt(jdText: string): string {
  return `Extract the 15 most important hard skills, tools, and qualifications from this job description.
Output ONLY a comma-separated list, no numbering, no explanation.

Job Description:
${jdText.slice(0, 3000)}

Keywords:`;
}
