from fastapi import FastAPI, HTTPException, Response, UploadFile, File
from fastapi.responses import JSONResponse
from schema.signup import signUp
from schema.signin import signIn
from schema.profile import userProfie
from schema.prompt import ResumeGenerateRequest, ResumeCompileRequest
from dotenv import load_dotenv
import subprocess
import tempfile
import os
import shutil
import sys

from supabase import create_client
from cryptography.fernet import Fernet
from SMTP.utils import send_otp_email, genrate_otp
from Model.groq_mode import generate_resume_groq

# Load variables from .env
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
FERNET_SECRET_KEY = os.getenv("FERNET_SECRET_KEY")
fernet = Fernet(FERNET_SECRET_KEY.encode())

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

app = FastAPI()

# Resolve pdflatex path — handles Windows (MiKTeX) where it may not be in PATH
if sys.platform == "win32":
    PDFLATEX = r"C:\Users\udayh\AppData\Local\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe"
else:
    PDFLATEX = "pdflatex"

@app.get("/")
def home_page():
    return {"message": "Welcome foundationa Level"}

# SignUp Page API
@app.post("/signup")
def add_users(signUp: signUp):

    encypted_password = fernet.encrypt(signUp.password.encode()).decode()
    user_data = {
        "full_name": signUp.name,
        "email": signUp.email,
        "mobile": signUp.mobile,
        "password_hash": encypted_password
    }
    try:
        response= supabase.table("users").insert(user_data).execute()
        return JSONResponse(status_code=200, content={"message":"User Registered Successfully", "user":signUp.name})
    except Exception as e:
        error_msg = str(e)
        if '23505' in error_msg or 'duplicate key' in error_msg:
            raise HTTPException(status_code=400, detail="The Given Mobile number or email already registered")
        raise HTTPException(status_code=400, detail=f"Registration failed: {error_msg}")


@app.post("/signin")
def sign_in(credentials: signIn):
    try:
        if credentials.email:
            response = supabase.table("users").select("*").eq("email", credentials.email).execute()
        else:
            response = supabase.table("users").select("*").eq("mobile", credentials.mobile).execute()
        
        users = response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error")

    if not users or len(users)==0:
        raise HTTPException(status_code=404, detail="User not found. Please Register First")

    user = users[0]
    db_encrypted_password = user.get("password_hash")

    try:
        decrypted_password = fernet.decrypt(db_encrypted_password.encode()).decode()
        if decrypted_password != credentials.password:
            raise HTTPException(
                status_code=401,
                detail="Invalid credentials. Incorrect Password"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error verifying password")
        
    return JSONResponse(status_code=200, content={"message": "Sign In Successful", "id": user.get("id")})


@app.put("/api/users/{user_id}/profile")
async def update_profile(user_id: str, profile_data: userProfie):
    update_data = profile_data.dict(exclude_unset=True)

    if not update_data:
        return JSONResponse(status_code=400, content={"message": "No update data provided"})
    try:
        # Perform the update query using Supabase
        response = supabase.table("users").update(update_data).eq("id", user_id).execute()
        
        # Check if the user was actually found and updated
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {
            "message": "Profile updated successfully", 
            "data": response.data[0]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# ENDPOINT: UPLOAD USER PROFILE PHOTO
# ==========================================
# Purpose: Upload a profile photo to Supabase Storage and save its URL to the user's database record.
# Input: User ID (in URL) and multipart form-data image file.
# Output: Returns success message and the public URL.
@app.post("/api/users/{user_id}/upload-photo")
async def upload_photo_endpoint(user_id: str, file: UploadFile = File(...)):
    try:
        # Validate that it is an image
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are allowed.")
            
        file_bytes = await file.read()
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "png"
        file_path = f"{user_id}/avatar.{file_ext}"

        # 1. Upload to Supabase Storage bucket 'profile-photos'
        # We use upsert so that subsequent uploads overwrite the old photo
        supabase_admin.storage.from_("profile-photos").upload(
            path=file_path,
            file=file_bytes,
            file_options={"x-upsert": "true", "content-type": file.content_type}
        )

        # 2. Get the public URL of the uploaded photo
        public_url = supabase_admin.storage.from_("profile-photos").get_public_url(file_path)

        # 3. Save the public URL to the profile_photo_url column in the users table
        db_response = supabase_admin.table("users").update(
            {"profile_photo_url": public_url}
        ).eq("id", user_id).execute()

        if not db_response.data:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "message": "Profile photo uploaded and saved successfully",
            "profile_photo_url": public_url
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload photo: {str(e)}")


# ==========================================
# ENDPOINT 0: GET RESUME TEMPLATES
# ==========================================
# Purpose: Fetch list of available LaTeX resume template structures from database.
# Output: Returns metadata (id, name, description) of templates.
@app.get("/api/templates")
async def get_templates():
    try:
        response = supabase.table("templates").select("id, name, description").execute()
        return response.data
    except Exception as e:
        # Fallback to returning a default template metadata list if DB is not setup yet
        return [
            {
                "id": "standard_ats",
                "name": "Standard ATS Style",
                "description": "The default clean, single-page professional layout with bold section headings and contact info icons."
            },
            {
                "id": "minimal_clean",
                "name": "Minimal Clean Style",
                "description": "A modern minimalist style with clean bold headings, left-aligned header layout, and generous spacing instead of lines."
            }
        ]


# ==========================================
# ENDPOINT 1: GENERATE LATEX RESUME (Groq AI)
# ==========================================
# Purpose: Call Groq (llama-3.3-70b) to write ATS-friendly LaTeX code tailored
#          to a job description, custom instructions, and a selected layout style.
# Input: User ID (in URL), job description, custom instructions, optional existing LaTeX, and optional template style ID.
# Output: Returns the generated raw LaTeX code as text.
# Flow: Frontend displays this LaTeX in an editor for the user to review/edit or copy to Overleaf.
@app.post("/api/users/{user_id}/generate-resume")
async def build_resume_endpoint(user_id: str, request: ResumeGenerateRequest):
    try:
        latex_result = generate_resume_groq(
            user_id=user_id,
            job_description=request.job_description,
            user_instruction=request.user_instruction,
            context_note=request.context_note,
            existing_latex=request.existing_latex,
            template_id=request.template_id
        )
            
        return {
            "message": "Resume generated successfully",
            "provider_used": "groq",
            "latex_code": latex_result
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ==========================================
# ENDPOINT 2: COMPILE LATEX TO PDF (pdflatex Engine)
# ==========================================
# Purpose: Receives LaTeX code (either directly from AI or modified by the user)
#          and compiles it to a downloadable PDF using pdflatex.
# Input: LaTeX code string.
# Output: Streams/downloads the compiled PDF file (`resume_{user_id}.pdf`).
# Flow: Writes .tex to a temp directory, runs pdflatex twice (for refs), returns PDF bytes.
@app.post("/api/users/{user_id}/compile-pdf")
async def compile_pdf_endpoint(user_id: str, request: ResumeCompileRequest):
    tmp_dir = tempfile.mkdtemp()
    try:
        tex_path = os.path.join(tmp_dir, "resume.tex")
        pdf_path = os.path.join(tmp_dir, "resume.pdf")

        # Write LaTeX source to file
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(request.latex_code)

        # Run pdflatex twice to resolve references/TOC
        for _ in range(2):
            result = subprocess.run(
                [PDFLATEX, "-interaction=nonstopmode", "-enable-installer", "-output-directory", tmp_dir, tex_path],
                capture_output=True,
                text=True,
                timeout=300  # 5 min for first run (MiKTeX downloads missing packages)
            )

        if not os.path.exists(pdf_path):
            log_output = result.stdout + result.stderr
            raise HTTPException(
                status_code=500,
                detail=f"PDF compilation failed. pdflatex log:\n{log_output[-3000:]}"
            )

        with open(pdf_path, "rb") as f:
            pdf_data = f.read()

        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=resume_{user_id}.pdf"}
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF compilation failed: {str(e)}")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
