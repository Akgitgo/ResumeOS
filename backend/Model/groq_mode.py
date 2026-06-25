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
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0in, label={}]}
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


def generate_resume_groq(user_id: str, job_description: str, user_instruction: str = None, context_note: str = None, existing_latex: str = None, template_id: str = None) -> str:

    # FIX CIRCULAR IMPORT: Import supabase INSIDE the function
    from app import supabase

    try:
        user_response = supabase.table("users").select("*").eq("id", user_id).execute()
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not Found")
        user_data = user_response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server Error: {str(e)}")

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    # Guard: treat missing, blank, or placeholder existing_latex as "generate fresh"
    is_valid_existing = existing_latex and len(existing_latex.strip()) > 100

    # Resolve style template to use for fresh generation
    latex_template_to_use = LATEX_TEMPLATE
    if template_id and not is_valid_existing:
        try:
            temp_response = supabase.table("templates").select("latex_code").eq("id", template_id).execute()
            if temp_response.data and len(temp_response.data) > 0:
                latex_template_to_use = temp_response.data[0]["latex_code"]
        except Exception as e:
            # Fallback silently or log/print if needed
            print(f"Error fetching template '{template_id}' from Supabase (falling back): {e}")

    profile_photo_url = user_data.get("profile_photo_url")

    if is_valid_existing:
        prompt = f"""
You are an expert LaTeX resume writer. The user wants to modify their existing resume.

EXISTING LATEX CODE:
{existing_latex}

{f'PROFILE PHOTO URL: {profile_photo_url}{chr(10)}' if profile_photo_url else ''}
{f'ADDITIONAL CONTEXT ABOUT THE USER:{chr(10)}{context_note}{chr(10)}' if context_note else ''}
USER INSTRUCTIONS (MUST FOLLOW EXACTLY):
{user_instruction or 'Improve clarity and ATS-friendliness. Keep the same structure.'}

RULES:
- Output ONLY raw, valid, compilable LaTeX. Do NOT wrap in markdown fences.
- Start exactly with \documentclass.
- Preserve the exact same template structure, custom commands (\resumeSubheadingWithLinks, \resumeItemListStart, etc.), and section order UNLESS the user explicitly asks to change it.
- Ensure it compiles on Overleaf. Do NOT use fontspec or setmainfont.
- ESCAPE ALL SPECIAL LATEX CHARACTERS in user data and text. You MUST escape &, %, $, #, _, {{, and }} with a backslash (e.g., \% or \&). Failure to do so will crash the compiler.
- PHOTO RULE: A profile photo URL is available at: {profile_photo_url}. If this URL is null/empty, OR if the existing LaTeX code does not contain a placeholder/layout for a profile photo, OR if the user did not explicitly ask in the instructions to add/include a profile photo, do NOT add a profile photo or the graphicx package. If you are instructed to add a photo, use the graphicx package and render it via \includegraphics, but only if the URL is valid and the user explicitly requests it.
"""
    else:
        prompt = f"""
You are an expert LaTeX resume writer specializing in ATS-friendly, Overleaf-compatible resumes.

YOUR TASK:
Generate a complete, compilable LaTeX resume by filling the REFERENCE TEMPLATE below with the USER DATA provided.
Tailor all content to the JOB DESCRIPTION. Follow the USER INSTRUCTIONS exactly.

REFERENCE TEMPLATE — COPY THIS STRUCTURE EXACTLY (same \\documentclass, same packages, same custom commands, same section order):
{latex_template_to_use}


==== STRICT RULES (violating ANY rule is WRONG) ====
1. Output ONLY raw LaTeX. NO markdown fences (no ```latex, no ```). Start with \\documentclass[letterpaper,11pt]{{article}}.
2. Use EXACTLY these packages and NO others: latexsym, fullpage (with [empty]), titlesec, enumitem, hyperref (with [hidelinks]), fancyhdr, tabularx, fontawesome5, babel (with [english]), and glyphtounicode via \\input{{glyphtounicode}} (Note: graphicx is allowed ONLY if adding a profile photo as per the PHOTO RULE).
3. FORBIDDEN packages — do NOT use: fontspec, setmainfont, xcolor, geometry, tikz, multicol, array.
4. Keep EXACTLY the same custom commands defined in the template: \\resumeItem, \\resumeSubheadingWithLinks (6 args), \\resumeItemListStart, \\resumeItemListEnd, \\resumeSubHeadingListStart, \\resumeSubHeadingListEnd.
5. Icons: use \\faGithub, \\faLinkedin, \\faEnvelope, \\faPhone, \\faCode, \\faGlobe from fontawesome5.
6. All links via \\href{{URL}}{{text}}. No raw URLs visible in text.
7. ATS-safe — no \\includegraphics (except for the profile photo if permitted by the PHOTO RULE), no image-based text.
8. Default section order: Summary → Skills → Experience → Projects → Certifications → Achievements → Education. Change ONLY if the USER INSTRUCTIONS explicitly say so.
9. Fill REAL user data. If a field is missing in user data, omit that section silently. NO placeholders like [NAME] or [YOUR COMPANY].
10. ESCAPE ALL SPECIAL LATEX CHARACTERS. You MUST escape &, %, $, #, _, {{, and }} with a backslash (e.g., \\% or \\&). Failure to do so will crash the compiler.
11. Use em-dash as --- (three hyphens), never paste Unicode em-dash (—) character directly.
12. PHOTO RULE: The user's profile photo URL is: {profile_photo_url}. If this URL is null/empty, OR if the selected template does not have a design/placeholder for a photo, OR if the user has not explicitly requested to include/add a profile photo in their instructions, do NOT add any photo or compile commands for a photo, and do not use the graphicx package. Only include a photo (via graphicx and \\includegraphics) if the URL is provided, the template layout supports it, and the user explicitly requested it.

USER DATA (from profile):
{user_data}

JOB DESCRIPTION (tailor resume keywords to match this):
{job_description if job_description else 'No job description provided. Generate a general professional resume.'}

{f'EXTRA CONTEXT (important background, apply this knowledge when writing):{chr(10)}{context_note}{chr(10)}' if context_note else ''}
USER INSTRUCTIONS (follow these exactly — they override defaults):
{user_instruction or 'Make it a clean 1-page professional resume.'}

Generate the full resume LaTeX code now. Remember: start with \\documentclass, end with \\end{{document}}.
"""


    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
        )

        latex_code = chat_completion.choices[0].message.content.strip()

        # Strip any accidental markdown fences
        if latex_code.startswith("```"):
            lines = latex_code.split('\n')
            if lines[0].startswith("```latex") or lines[0].startswith("```"):
                latex_code = '\n'.join(lines[1:])
            if latex_code.endswith("```"):
                latex_code = latex_code[:-3].strip()

        return latex_code
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating LaTeX resume with Groq: {str(e)}")
