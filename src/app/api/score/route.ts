import { NextRequest, NextResponse } from "next/server";
import { scoreAgainstAllAts, overallScore } from "@/lib/ats/scorer";
import { ScoreInput } from "@/lib/types";

export const runtime = "nodejs";

// POST /api/score
// body: { resumeText: string, resumeSections?: object, formattingMeta?: object, jdText: string }
// Returns: { overall, results: AtsScoreResult[] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.resumeText || !body?.jdText) {
      return NextResponse.json(
        { error: "Both 'resumeText' and 'jdText' are required." },
        { status: 400 }
      );
    }

    const input: ScoreInput = {
      resumeText: body.resumeText,
      resumeSections: body.resumeSections || {},
      jdText: body.jdText,
      formattingMeta: body.formattingMeta || {
        hasImages: false,
        hasTables: false,
        multiColumn: false,
        pageCount: 1,
        fonts: [],
        wordCount: body.resumeText.split(/\s+/).length,
      },
    };

    const results = scoreAgainstAllAts(input);
    const overall = overallScore(results);

    return NextResponse.json({ overall, results });
  } catch (err: any) {
    console.error("score error:", err);
    return NextResponse.json(
      { error: "Failed to score resume.", detail: err?.message },
      { status: 500 }
    );
  }
}
