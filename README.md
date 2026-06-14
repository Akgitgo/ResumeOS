# ATS Resume Tailor 🚀

An advanced, full-stack application designed to parse resumes, score them against **6 major Applicant Tracking Systems (ATS)**, and leverage an AI provider fallback chain to rewrite resume bullet points and summaries to optimize for ATS compliance.

---

## 🌟 Features

*   **Comprehensive ATS Scoring**: Evaluates resumes against 6 major platforms:
    *   Workday
    *   Taleo
    *   iCIMS
    *   Greenhouse
    *   Lever
    *   SuccessFactors
*   **Dual Parsing Methods**: Supports direct PDF/DOCX file uploads and parsing (via `pdf-parse` and `mammoth`) as well as direct text pasting.
*   **Weighted Scoring Metrics**: Computes scores based on formatting, keyword match (exact, semantic, and hybrid), section completeness, experience quality (quantifiable metrics and action verbs), and education criteria.
*   **Robust AI Rewrite Engine**: Centralized prompt templates to optimize bullet points, professional summaries, and keywords.
*   **Fail-safe AI Provider Chain**: Seamlessly cascades through **Gemini** ➡️ **Groq** ➡️ **Local Ollama** ➡️ **Claude** depending on key availability and quotas.
*   **Secure Database Architecture**: Powered by Supabase (PostgreSQL) with Row-Level Security (RLS) policies implemented from day one.

---

## 🛠️ Tech Stack

*   **Framework**: Next.js 14 (App Router, TypeScript)
*   **Database & Auth**: Supabase (Postgres & Google OAuth)
*   **Styling**: Tailwind CSS
*   **File Parsing**: `pdf-parse` & `mammoth`
*   **AI Integration**: Google Gemini, Groq, Ollama, and Anthropic Claude

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have Node.js installed on your local machine.

### 2. Installation
Clone or navigate to the repository directory and run:
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env.local
```
Configure the following variables in `.env.local`:
*   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
*   `SUPABASE_SERVICE_ROLE_KEY`
*   Your chosen AI API keys (e.g., `GEMINI_API_KEY`, `GROQ_API_KEY`, etc.)

### 4. Database Initialization
Paste and run the SQL code in `supabase/schema.sql` inside the **SQL Editor** of your Supabase project.

### 5. Running the Frontend
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 6. Backend Setup (FastAPI)
The python backend handles database logic and authentication.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate      # For Windows
   # source venv/bin/activate   # For macOS/Linux
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your `.env` file in the `backend/` folder:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   FERNET_SECRET_KEY=your_generated_fernet_key
   ```
5. Start the backend server:
   ```bash
   uvicorn app:app --reload
   ```

---

## 📁 Project Structure

```text
ats-resume-app/
├── supabase/
│   └── schema.sql            # Database schema & RLS configuration
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── dashboard/page.tsx # Upload, score, and AI rewrite dashboard
│   │   └── api/
│   │       ├── parse-resume/  # Resume text extraction & formatting analysis
│   │       ├── score/         # Scans resume against ATS criteria
│   │       └── rewrite/       # AI-driven content optimizer
│   └── lib/
│       ├── types.ts           # Shared TypeScript interfaces
│       ├── ats/               # Keyword matching & ATS scoring profiles
│       ├── ai/                # AI fallback chain and prompts
│       ├── parsers/           # File parser library
│       └── supabase/          # Supabase client configurations
```

---

## 🛡️ Reverse-Engineered Failure Mitigations

*   **Zero AI Scoring Dependency**: The core scoring engine runs locally in TypeScript without external network requests, ensuring instant calculations.
*   **Flexible Cascading AI**: If an AI key fails or hits a rate limit, the API automatically falls back to the next available provider.
*   **ATS Rule Versioning**: Changing vendor logic is handled by adding versioned profiles (e.g., `workday-2026-01`) rather than mutating existing profiles.
*   **Formatting Penalties**: Automatically detects problematic formats (like multi-column layouts, tables, and non-standard fonts) and alerts the user.

---

## 📄 License
This project is private and proprietary.
