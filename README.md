# ResumeOS

ResumeOS is an AI-powered ATS resume builder application that helps candidates craft ATS-friendly resumes optimized for their desired job descriptions.

## Architecture

This project is built using a modern full-stack architecture:

- **Frontend:** Next.js (React), Tailwind CSS, TypeScript
- **Backend:** FastAPI (Python)
- **Database/Auth:** Supabase

## Prerequisites

Before running the project locally, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (3.9+)
- A LaTeX distribution (e.g., [MiKTeX](https://miktex.org/) on Windows or `texlive` on Linux) to compile PDFs on the backend.

## Getting Started

### 1. Backend Setup

Navigate to the backend directory, set up your virtual environment, and install dependencies:

```bash
cd backend
python -m venv venv
source venv/Scripts/activate # On Windows
pip install -r requirements.txt
```

Set up your `.env` file in the `backend/` directory with the necessary API keys and configurations (e.g., Supabase credentials, Groq API keys).

Start the FastAPI server:

```bash
uvicorn app:app --reload
```
The API will be accessible at `http://localhost:8000`.

### 2. Frontend Setup

Open a new terminal, navigate to the frontend directory, and install dependencies:

```bash
cd frontend
npm install
```

Set up your `.env.local` file in the `frontend/` directory with the required environment variables.

Start the Next.js development server:

```bash
npm run dev
```
The frontend will be accessible at `http://localhost:3000`.

## Tech Stack Overview

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- Lucide React (Icons)
- Supabase SSR

### Backend
- FastAPI
- Uvicorn
- LaTeX (`pdflatex` integration)
- Groq AI (LLM integration)
