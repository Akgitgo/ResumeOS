import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-6">
      <h1 className="text-4xl font-bold">ATS Resume Tailor</h1>
      <p className="max-w-xl text-slate-400">
        Paste a job description, upload your resume, and get instant scores
        against Workday, Taleo, iCIMS, Greenhouse, Lever, and SuccessFactors —
        plus AI-rewritten bullets that close the gap.
      </p>
      <Link
        href="/dashboard"
        className="px-6 py-3 rounded-lg bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition"
      >
        Open Dashboard
      </Link>
    </main>
  );
}
