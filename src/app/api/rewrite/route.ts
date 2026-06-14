import { NextRequest, NextResponse } from "next/server";
import { generateCompletion } from "@/lib/ai/providers";
import {
  rewriteBulletPrompt,
  rewriteSummaryPrompt,
  suggestionsPrompt,
} from "@/lib/ai/prompts";
import { extractKeywords } from "@/lib/ats/scorer";

export const runtime = "nodejs";

type RewriteMode = "bullet" | "summary" | "suggestions";

// POST /api/rewrite
// body shapes by `mode`:
//  - bullet:      { mode: "bullet", originalBullet, jdText, roleContext? }
//  - summary:     { mode: "summary", currentSummary, jdTitle, jdText, topSkills? }
//  - suggestions: { mode: "suggestions", resumeText, jdText, scoreReport }
//
// Returns: { text, provider, model } on success.
// If ALL providers in the chain fail (e.g. no keys configured AND no local
// Ollama running), returns 503 with `attempts` so the UI can show a clear
// "AI rewriting unavailable - configure a provider" message instead of
// silently breaking.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode: RewriteMode = body.mode;

    let prompt: string;

    switch (mode) {
      case "bullet": {
        if (!body.originalBullet || !body.jdText) {
          return NextResponse.json(
            { error: "'originalBullet' and 'jdText' are required for mode=bullet." },
            { status: 400 }
          );
        }
        const jdKeywords = extractKeywords(body.jdText, 20);
        prompt = rewriteBulletPrompt({
          originalBullet: body.originalBullet,
          jdKeywords,
          roleContext: body.roleContext,
        });
        break;
      }
      case "summary": {
        if (!body.jdText) {
          return NextResponse.json(
            { error: "'jdText' is required for mode=summary." },
            { status: 400 }
          );
        }
        const jdKeywords = extractKeywords(body.jdText, 20);
        prompt = rewriteSummaryPrompt({
          currentSummary: body.currentSummary || "",
          jdTitle: body.jdTitle || "the target role",
          jdKeywords,
          topSkills: body.topSkills || [],
        });
        break;
      }
      case "suggestions": {
        if (!body.resumeText || !body.jdText || !body.scoreReport) {
          return NextResponse.json(
            { error: "'resumeText', 'jdText', and 'scoreReport' are required for mode=suggestions." },
            { status: 400 }
          );
        }
        prompt = suggestionsPrompt({
          resumeText: body.resumeText,
          jdText: body.jdText,
          scoreReport: typeof body.scoreReport === "string" ? body.scoreReport : JSON.stringify(body.scoreReport),
        });
        break;
      }
      default:
        return NextResponse.json(
          { error: "Invalid 'mode'. Use 'bullet', 'summary', or 'suggestions'." },
          { status: 400 }
        );
    }

    const { result, attempts } = await generateCompletion(prompt);

    if (!result) {
      return NextResponse.json(
        {
          error:
            "All AI providers unavailable. Configure at least one of GEMINI_API_KEY, GROQ_API_KEY, ANTHROPIC_API_KEY, or run a local Ollama server.",
          attempts,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ ...result, attempts });
  } catch (err: any) {
    console.error("rewrite error:", err);
    return NextResponse.json(
      { error: "Failed to generate rewrite.", detail: err?.message },
      { status: 500 }
    );
  }
}
