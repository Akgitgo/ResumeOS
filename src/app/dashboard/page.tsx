"use client";

import { useState } from "react";
import { ATS_PROFILES } from "@/lib/ats/profiles";

interface AtsScoreResult {
  ats: string;
  score: number;
  breakdown: Record<string, number>;
  suggestions: string[];
}

export default function Dashboard() {
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [overall, setOverall] = useState<number | null>(null);
  const [results, setResults] = useState<AtsScoreResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // AI rewrite state
  const [bulletInput, setBulletInput] = useState("");
  const [rewritten, setRewritten] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      setResumeText(data.rawText);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
  }

  async function handleScore() {
    setError(null);
    if (!resumeText.trim() || !jdText.trim()) {
      setError("Add both your resume text and the job description first.");
      return;
    }
    setScoring(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jdText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scoring failed");
      setOverall(data.overall);
      setResults(data.results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setScoring(false);
    }
  }

  async function handleRewrite() {
    setError(null);
    setAiNote(null);
    if (!bulletInput.trim() || !jdText.trim()) {
      setError("Add a bullet to rewrite and make sure the JD is filled in.");
      return;
    }
    setRewriting(true);
    setRewritten("");
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "bullet", originalBullet: bulletInput, jdText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiNote(data.error || "AI rewrite unavailable.");
        return;
      }
      setRewritten(data.text);
      setAiNote(`via ${data.provider} (${data.model})`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRewriting(false);
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-5xl mx-auto flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold">ATS Resume Tailor</h1>
        <p className="text-slate-400">
          Paste your resume + the job description, then score against {Object.keys(ATS_PROFILES).length} ATS platforms.
        </p>
      </header>

      {error && (
        <div className="bg-red-950 border border-red-700 text-red-200 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <section className="grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Your Resume</label>
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileUpload}
            className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-emerald-500 file:text-slate-900 file:font-medium"
          />
          {parsing && <p className="text-sm text-slate-400">Parsing file...</p>}
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Or paste your resume text here..."
            className="h-64 rounded-lg bg-slate-900 border border-slate-700 p-3 text-sm font-mono"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold">Job Description</label>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the target job description here..."
            className="h-72 mt-7 rounded-lg bg-slate-900 border border-slate-700 p-3 text-sm font-mono"
          />
        </div>
      </section>

      <button
        onClick={handleScore}
        disabled={scoring}
        className="self-start px-6 py-3 rounded-lg bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition disabled:opacity-50"
      >
        {scoring ? "Scoring..." : "Score Against All ATS"}
      </button>

      {overall !== null && (
        <section className="flex flex-col gap-4">
          <div className="text-2xl font-bold">
            Overall ATS Score: <span className="text-emerald-400">{overall}%</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r) => (
              <div key={r.ats} className="rounded-lg border border-slate-700 bg-slate-900 p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{ATS_PROFILES[r.ats as keyof typeof ATS_PROFILES]?.label || r.ats}</h3>
                  <span className="text-xl font-bold text-emerald-400">{r.score}%</span>
                </div>
                <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                  {r.suggestions.length === 0 && <li>No issues found.</li>}
                  {r.suggestions.slice(0, 3).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2 border-t border-slate-800 pt-6">
        <h2 className="text-xl font-semibold">AI Bullet Rewriter</h2>
        <p className="text-sm text-slate-400">
          Paste one resume bullet. The AI rewrites it using JD keywords (requires at least one AI provider configured in .env).
        </p>
        <textarea
          value={bulletInput}
          onChange={(e) => setBulletInput(e.target.value)}
          placeholder="e.g. Led team project to build internal dashboard"
          className="h-20 rounded-lg bg-slate-900 border border-slate-700 p-3 text-sm font-mono"
        />
        <button
          onClick={handleRewrite}
          disabled={rewriting}
          className="self-start px-5 py-2 rounded-lg bg-sky-500 text-slate-900 font-semibold hover:bg-sky-400 transition disabled:opacity-50"
        >
          {rewriting ? "Rewriting..." : "Rewrite with AI"}
        </button>
        {rewritten && (
          <div className="rounded-lg bg-slate-900 border border-slate-700 p-3 text-sm">
            {rewritten}
          </div>
        )}
        {aiNote && <p className="text-xs text-slate-500">{aiNote}</p>}
      </section>
    </main>
  );
}
