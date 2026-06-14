import { NextRequest, NextResponse } from "next/server";
import { parseResumeFile } from "@/lib/parsers/resume-parser";

export const runtime = "nodejs";

// POST /api/parse-resume
// multipart/form-data with field "file" (PDF, DOCX, or TXT)
// Returns: { rawText, sections, formattingMeta }
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided (field 'file')." }, { status: 400 });
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)." }, { status: 413 });
    }

    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Use PDF, DOCX, or TXT.` },
        { status: 415 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsed = await parseResumeFile(buffer, file.type);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("parse-resume error:", err);
    return NextResponse.json(
      { error: "Failed to parse resume.", detail: err?.message },
      { status: 500 }
    );
  }
}
