# ATS Resume Tailor — Setup Guide

Full-stack app: paste resume + job description → get scores against 6 ATS
platforms (Workday, Taleo, iCIMS, Greenhouse, Lever, SuccessFactors) → AI
rewrites bullets/summary to close gaps. $0 to run (free-tier AI + Supabase).

---

## 1. Stack

- **Next.js 14** (App Router, TypeScript) — frontend + API routes
- **Supabase** (Postgres + Auth) — user profiles, resumes, scores
- **Tailwind CSS** — styling
- **AI provider chain** — Gemini (free) → Groq (free) → local Ollama (free) → Claude (paid, optional)
- **pdf-parse / mammoth** — resume file parsing (PDF/DOCX)

---

## 2. Local Setup

```bash
cd ats-resume-app
npm install
cp .env.example .env.local
```

### 2.1 Supabase

1. Create a free project at https://supabase.com (region `ap-south-1` for low latency from India, matches your CreatorOS setup).
2. Go to **SQL Editor** → paste the entire contents of `supabase/schema.sql` → Run.
   - This creates all tables, RLS policies, and an auto-profile-creation trigger.
3. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose to client)
4. Enable **Google OAuth** under Authentication → Providers (you already have this flow from CreatorOS — same client ID/secret can be reused if you want, just add this app's redirect URL).

### 2.2 AI Providers (pick at least one — order matters in `AI_PROVIDER_CHAIN`)

| Provider | Cost | Setup |
|---|---|---|
| **Gemini** | Free, 14,400 req/day | Get key at https://aistudio.google.com/app/apikey → `GEMINI_API_KEY` |
| **Groq** | Free, fast | Get key at https://console.groq.com/keys → `GROQ_API_KEY` |
| **Ollama** | Free, local, offline | `ollama pull llama3` then run `ollama serve` (default `http://localhost:11434`) |
| **Claude** | Paid | `ANTHROPIC_API_KEY` from console.anthropic.com |

The app tries each provider in `AI_PROVIDER_CHAIN` order and silently falls
back if one fails or has no key. If **all** fail, the rewrite endpoint
returns a 503 with a clear message instead of crashing — the scoring engine
still works with zero AI configured (it's pure TS, no API calls).

### 2.3 Run

```bash
npm run dev
```

Visit `http://localhost:3000` → `/dashboard`.

---

## 3. Project Structure

```
ats-resume-app/
├── supabase/
│   └── schema.sql            # full DB schema + RLS, run once in Supabase SQL editor
├── src/
│   ├── app/
│   │   ├── page.tsx           # landing page
│   │   ├── dashboard/page.tsx # main tool: upload, score, AI rewrite
│   │   └── api/
│   │       ├── parse-resume/  # POST: file (PDF/DOCX/TXT) -> text + sections + formatting flags
│   │       ├── score/         # POST: resumeText + jdText -> per-ATS scores
│   │       └── rewrite/       # POST: bullet/summary/suggestions -> AI rewrite
│   └── lib/
│       ├── types.ts           # shared TS types
│       ├── ats/
│       │   ├── profiles.ts    # 6 ATS configs (weights, match strictness, required sections)
│       │   ├── keywords.ts    # keyword extraction, stemming, fuzzy matching
│       │   └── scorer.ts       # core scoring engine - runs client AND server side
│       ├── ai/
│       │   ├── providers.ts   # Gemini/Groq/Ollama/Claude fallback chain
│       │   └── prompts.ts     # all LLM prompt templates, centralized
│       ├── parsers/
│       │   └── resume-parser.ts # PDF/DOCX -> text, section split, formatting analysis
│       └── supabase/
│           ├── client.ts      # browser client
│           └── server.ts      # server client + service-role client
```

---

## 4. How Scoring Works (`lib/ats/scorer.ts`)

For each of the 6 ATS, we compute 5 weighted sub-scores (0-100):

1. **Formatting** — penalizes images, tables, multi-column layout, non-standard fonts. Penalty size differs per ATS (Taleo penalizes hardest, iCIMS most lenient).
2. **Keyword Match** — extracts top 40 keywords/phrases from the JD (unigrams + bigrams + trigrams, stopwords removed), then checks presence in the resume:
   - `exact` mode (Taleo): literal string match only
   - `semantic` mode (iCIMS, Greenhouse, Lever): exact OR stemmed/fuzzy match
   - `hybrid` mode (Workday, SuccessFactors): exact = full credit, fuzzy = 60% credit
3. **Section Completeness** — checks for required sections per ATS (e.g. Taleo requires Summary; Greenhouse/Lever don't).
4. **Experience Quality** — counts action verbs (Led, Built, Optimized...) and quantifiable metrics (%, $, numbers).
5. **Education** — checks for a recognizable degree + institution.

Each ATS profile (`lib/ats/profiles.ts`) has its own **weights** for these 5
factors and is **versioned** (`version: "2025-01"`). When ATS vendors change
behavior, add a new profile version rather than mutating the old one — this
keeps historical `resume_scores` rows interpretable.

---

## 5. Reverse-Engineered Failure Modes & Mitigations

This is the "make it not break later" section.

| Risk | Mitigation already built in |
|---|---|
| **AI provider key expires / free quota hit** | `providers.ts` auto-falls-back through the chain. Scoring engine has zero AI dependency, so the core product still works with $0 / no keys. |
| **No AI configured at all** | `/api/rewrite` returns 503 with a clear message + `attempts` log instead of a silent failure or crash. UI shows "AI rewrite unavailable" rather than breaking. |
| **ATS vendors change parsing rules** | Profiles are versioned objects in `profiles.ts`. Add `workday-2026-01` as a new entry instead of editing in place; old `resume_scores` rows stay valid against their recorded version. |
| **Large/garbage file uploads** | `/api/parse-resume` enforces 10MB max + MIME allowlist (PDF/DOCX/TXT only). |
| **PDF parsing fails on weird PDFs** | `parsePdfBuffer` wraps `pdf-parse`; if it throws, the route returns a clean 500 with `detail` — frontend can prompt user to paste text manually instead (textarea is always available as fallback). |
| **AI hallucinates fake metrics/skills** | Prompts (`prompts.ts`) explicitly instruct "do not fabricate technologies/responsibilities not implied by the original" and request output-only (no preamble) so it's easy to validate. |
| **Keyword stuffing gets flagged** | We use semantic/fuzzy matching for most ATS profiles (only Taleo is strict-exact, matching its real-world behavior), and prompts explicitly forbid keyword stuffing. |
| **Multi-column/2-column resumes parse oddly** | `analyzeFormatting` heuristic flags high short-line ratios as `multiColumn`, which all ATS profiles penalize — surfaces the problem to the user before they submit. |
| **RLS misconfiguration / data leaks** | Every table has `profile_id = auth.uid()` RLS policy from day one (in `schema.sql`), not bolted on later. Service-role client is isolated in `createServiceClient()` and documented as server-only. |
| **Schema needs new fields later (e.g. new section types)** | `resumes.content` and `resumes.sections` are `jsonb` — new section types don't require migrations. Structured tables (experiences, projects, etc.) cover the stable, queryable data. |
| **Slow LLM calls block UI** | Scoring (the core, instant-feedback feature) is pure TypeScript — runs in <50ms, no network call. AI rewrite is a separate, optional, async action per-bullet. |
| **Cost creep if Claude/paid API used** | `ANTHROPIC_API_KEY` is last in the default chain — only used if Gemini/Groq/Ollama all fail, so accidental high-volume billing is unlikely. |

---

## 6. Roadmap (next steps, in priority order)

1. **Auth wiring** — Google OAuth via Supabase (reuse pattern from CreatorOS), gate `/dashboard` behind session check.
2. **Profile builder UI** — forms for Experiences/Projects/Skills/etc. (tables already exist in `schema.sql`).
3. **Resume assembly** — pick sections + items per JD, save as a `resumes` row, persist `resume_scores`.
4. **PDF export** — render final resume to clean, ATS-safe PDF (single column, standard fonts — `pdf` skill / `react-pdf`).
5. **Section-by-section AI rewrite** — wire `/api/rewrite` summary + bullet modes into the profile builder, store `ai_provider_logs`.
6. **JD keyword caching** — store `parsed_keywords` on `job_descriptions` so re-scoring doesn't re-extract.

---

## 7. Deploy

```bash
# Vercel (same as CreatorOS)
vercel --prod
```

Set all `.env.local` vars in Vercel project settings. Ollama won't be
reachable from Vercel (it's local-only) — in production, `AI_PROVIDER_CHAIN`
should rely on Gemini/Groq/Claude. Keep `ollama` in the chain for local dev;
it's automatically skipped (no key/unreachable) in prod.
