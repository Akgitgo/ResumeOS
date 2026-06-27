from fastapi import HTTPException
import os
from groq import Groq

# ─────────────────────────────────────────────
# REFERENCE TEMPLATE (Uday Hese style)
# Used as the structural / stylistic baseline for ALL generated resumes.
# ─────────────────────────────────────────────
LATEX_TEMPLATE = r"""
%-------------------------
% Resume in Latex
%------------------------
\documentclass[letterpaper,11pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage{tabularx}
\usepackage{fontawesome5}
\usepackage[english]{babel}
\input{glyphtounicode}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

\addtolength{\oddsidemargin}{-0.6in}
\addtolength{\textwidth}{1.2in}
\addtolength{\topmargin}{-0.8in}
\addtolength{\textheight}{1.4in}

\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

\titleformat{\section}{
  \vspace{-12pt}\scshape\raggedright\large\bfseries
}{}{0em}{}[\titlerule \vspace{-7pt}]

\pdfgentounicode=1

%-------------------------
% Custom Commands
%-------------------------
\newcommand{\resumeItem}[1]{\item {\small #1}}

\newcommand{\resumeSubheadingWithLinks}[6]{
  \item
  \begin{tabular*}{1.0\textwidth}{l@{\extracolsep{\fill}}r}
    \textbf{#1} & \textbf{\small #2} \\
    \textit{\small #3} & \textit{\small #4 \quad #5 \quad #6}
  \end{tabular*}\vspace{-8pt}
}

\newcommand{\resumeItemListStart}{\begin{itemize}[itemsep=0pt, topsep=3pt]}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-8pt}}
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0in, label={}] }
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}\vspace{-8pt}}

\begin{document}

%-------------------------
% HEADER
%-------------------------
\begin{center}
\begin{minipage}{\textwidth}
\centering
{\Huge \scshape [FULL NAME]} \\ \vspace{2pt}
\textbf{\Large \scshape [TITLE1] $|$ [TITLE2] $|$ [TITLE3]} \\ \vspace{5pt}
\footnotesize
\faPhone\ [PHONE] \hspace{8pt} $|$ \hspace{8pt}
\faEnvelope\ [EMAIL] \hspace{8pt} $|$ \hspace{8pt}
\faGithub\ \href{[GITHUB_URL]}{GitHub} \hspace{8pt} $|$ \hspace{8pt}
\faCode\ \href{[LEETCODE_URL]}{LeetCode} \hspace{8pt} $|$ \hspace{8pt}
\raisebox{-0.2ex}{\faLinkedin}\ \href{[LINKEDIN_URL]}{LinkedIn} \hspace{8pt} $|$ \hspace{8pt}
\faGlobe\ \href{[PORTFOLIO_URL]}{Portfolio}
\end{minipage}
\end{center}

%-------------------------
% SUMMARY
%-------------------------
\section{Summary}
[SUMMARY TEXT]

%-------------------------
% SKILLS
%-------------------------
\section{Skills}
\textbf{Programming:} [LANGUAGES] \\
\textbf{Web \& Frameworks:} [FRAMEWORKS] \\
\textbf{AI \& Data:} [AI_TOOLS] \\
\textbf{Cloud \& DevOps:} [CLOUD_DEVOPS] \\
\textbf{Databases \& Tools:} [DATABASES]

%-------------------------
% EXPERIENCE
%-------------------------
\section{Experience}
\resumeSubHeadingListStart

\resumeSubheadingWithLinks
{[COMPANY]}
{[DATE RANGE]}
{[ROLE]}
{[LOCATION]}
{\href{[GITHUB_LINK1]}{\faGithub\ [PROJECT1]}}
{\href{[GITHUB_LINK2]}{\faGithub\ [PROJECT2]}}

\resumeItemListStart
\resumeItem{[BULLET 1]}
\resumeItem{[BULLET 2]}
\resumeItemListEnd

\resumeSubHeadingListEnd

%-------------------------
% PROJECTS
%-------------------------
\section{Projects}
\resumeSubHeadingListStart

\resumeSubheadingWithLinks
{[PROJECT NAME]}
{[DATE]}
{[TECH STACK]}
{}
{\href{[GITHUB_URL]}{\faGithub}}
{}

\resumeItemListStart
\resumeItem{[PROJECT BULLET 1]}
\resumeItem{[PROJECT BULLET 2]}
\resumeItemListEnd

\vspace{-6pt}

\resumeSubHeadingListEnd

%-------------------------
% CERTIFICATIONS
%-------------------------
\section{Certifications}
\begin{itemize}[leftmargin=*, itemsep=0pt, topsep=3pt]
    \item \href{[CERT_URL]}{[CERT NAME] — [ISSUER] ([DATE])}
\end{itemize}

%-------------------------
% ACHIEVEMENTS
%-------------------------
\section{Achievements}
\begin{itemize}[itemsep=0pt, topsep=3pt]
\item [ACHIEVEMENT]
\end{itemize}

%-------------------------
% EDUCATION
%-------------------------
\section{Education}
\resumeSubHeadingListStart
\resumeSubheadingWithLinks
{[INSTITUTION]}
{[YEARS]}
{[DEGREE]}
{[CGPA / GPA]}
{}
{}
\resumeSubHeadingListEnd

\end{document}
"""

import json

# ─────────────────────────────────────────────
# CONTEXT MANAGEMENT STRATEGY
# ─────────────────────────────────────────────
# The current LaTeX code IS the ground truth / memory.
# Every change already made is baked into it.
# We only need the last N messages of chat for recent context.
CHAT_WINDOW_SIZE = 6  # Keep last 6 messages (3 user + 3 AI turns)

def generate_resume_groq(user_id: str, job_description: str, user_instruction: str = None, context_note: str = None, existing_latex: str = None, template_id: str = None, messages: list = None) -> dict:

    # FIX CIRCULAR IMPORT: Import supabase INSIDE the function
    from app import supabase

    try:
        user_response = supabase.table("users").select("*").eq("id", user_id).execute()
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not Found")
        user_data = user_response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server Error: {str(e)}")

    # Cache Groq client (avoid re-instantiating on every call)
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    profile_photo_url = user_data.get("profile_photo_url")

    # ── SYSTEM PROMPT ──────────────────────────────────────────────────────────
    # Instructs the model: respond with raw text and code blocks
    system_prompt = f"""You are an expert LaTeX resume writer specializing in ATS-friendly, Overleaf-compatible resumes.
Your job is to generate and precisely modify a user's LaTeX resume code based on their requests.

RESPONSE FORMAT (CRITICAL):
You MUST respond in the following format:
1. A short, friendly reply (1-3 sentences) describing what you changed.
2. The FULL, COMPLETE, compilable LaTeX code for the resume wrapped inside a ```latex and ``` code block.

Example response:
I have successfully tailored your resume for the backend engineer position, focusing on Python and FastAPI.
```latex
\\documentclass[letterpaper,11pt]{{article}}
% ... rest of the code ...
\\end{{document}}
```

LATEX RULES (violations will crash the compiler - follow strictly):
- The LaTeX code MUST start exactly with \\documentclass[letterpaper,11pt]{{article}} and end with \\end{{document}}.
- Allowed packages ONLY: latexsym, fullpage ([empty]), titlesec, enumitem, hyperref ([hidelinks]), fancyhdr, tabularx, fontawesome5, babel ([english]), glyphtounicode (via \\input{{glyphtounicode}}).
- Forbidden packages: fontspec, setmainfont, xcolor, geometry, tikz, multicol, array.
- Always escape special LaTeX characters in text content: & → \\&, % → \\%, $ → \\$, # → \\#, _ → \\_
- Preserve all custom commands: \\resumeItem, \\resumeSubheadingWithLinks (6 args), \\resumeItemListStart, \\resumeItemListEnd, \\resumeSubHeadingListStart, \\resumeSubHeadingListEnd.
- PHOTO RULE: Profile photo URL = {profile_photo_url or 'None'}. Only include photo (via graphicx + \\includegraphics) if URL is non-empty AND user explicitly requested it.

MODIFICATION RULE (for follow-up turns):
When modifying an existing resume, make SURGICAL edits — only change the parts the user asked about.
Preserve all other sections exactly as they are in the provided current LaTeX code.
"""

    is_first_turn = (not existing_latex or not existing_latex.strip()) or (not messages or len(messages) == 0)

    if is_first_turn:
        # ── FIRST TURN: Generate from profile data + template ─────────────────
        latex_template_to_use = LATEX_TEMPLATE
        if template_id:
            try:
                temp_response = supabase.table("templates").select("latex_code").eq("id", template_id).execute()
                if temp_response.data and len(temp_response.data) > 0:
                    latex_template_to_use = temp_response.data[0]["latex_code"]
            except Exception as e:
                print(f"Error fetching template '{template_id}': {e}")

        initial_prompt = f"""Generate a complete LaTeX resume using the user's profile data and the provided template structure.

=== USER PROFILE DATA ===
{user_data}

=== TEMPLATE STRUCTURE TO FOLLOW ===
{latex_template_to_use}

=== TARGET JOB DESCRIPTION (optimize resume keywords for this role) ===
{job_description if job_description else 'None provided — generate a general professional resume.'}

=== USER CUSTOM INSTRUCTIONS ===
{user_instruction or 'Generate a clean, 1-page ATS-friendly professional resume.'}
"""
        if context_note:
            initial_prompt += f"\n=== ADDITIONAL CONTEXT NOTES ===\n{context_note}"

        groq_messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": initial_prompt}
        ]

    else:
        # ── FOLLOW-UP TURNS: Sliding window context + LaTeX as ground truth ───
        groq_messages = [{"role": "system", "content": system_prompt}]

        # Pinned context block (job description + profile — always present)
        pinned_context = f"""=== PINNED CONTEXT (always relevant) ===
User Profile: {user_data}
Target Job Description: {job_description or 'None'}"""
        if context_note:
            pinned_context += f"\nAdditional Context Notes: {context_note}"
        groq_messages.append({"role": "system", "content": pinned_context})

        # Sliding window: use only the last CHAT_WINDOW_SIZE messages
        recent_history = messages[-(CHAT_WINDOW_SIZE + 1):-1] if len(messages) > 1 else []
        for msg in recent_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ("user", "assistant"):
                groq_messages.append({"role": role, "content": content})

        # Inject current LaTeX code as ground truth state
        if existing_latex:
            groq_messages.append({
                "role": "system",
                "content": (
                    "=== CURRENT RESUME LaTeX CODE (this is the authoritative current state) ===\n"
                    "Edit ONLY the parts the user requests. Return the FULL modified LaTeX.\n\n"
                    f"{existing_latex}"
                )
            })

        # The current user request (latest message from the client)
        current_request = messages[-1].get("content", "") if messages else user_instruction or ""
        if current_request:
            groq_messages.append({"role": "user", "content": current_request})

    try:
        chat_completion = client.chat.completions.create(
            messages=groq_messages,
            model="llama-3.3-70b-versatile",
            temperature=0.3,   # Lower temp → more precise edits, less hallucination
        )

        response_content = chat_completion.choices[0].message.content.strip()
        
        # Parse the message and LaTeX code using regex
        import re
        code_match = re.search(r"```latex(.*?)```", response_content, re.DOTALL)
        latex_code = ""
        if code_match:
            latex_code = code_match.group(1).strip()
        else:
            # Fallback to matching documentclass to end{document}
            doc_match = re.search(r"(\\documentclass.*\\end\{document\})", response_content, re.DOTALL)
            if doc_match:
                latex_code = doc_match.group(1).strip()
        
        # The message is whatever is before the code block
        message = response_content.split("```latex")[0].strip() if "```latex" in response_content else "Resume updated."
        
        if not latex_code:
            raise ValueError("No LaTeX code blocks found in model response.")

        return {
            "message": message,
            "latex_code": latex_code
        }

    except Exception as e:
        # Last resort: return existing code unchanged so user isn't left with nothing
        return {
            "message": f"There was a formatting issue with the AI response: {str(e)}. Please try again.",
            "latex_code": existing_latex or ""
        }

