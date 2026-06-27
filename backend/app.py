from fastapi import FastAPI, HTTPException, Response, UploadFile, File, Header
from fastapi.responses import JSONResponse
from schema.signup import signUp
from schema.signin import signIn
from schema.profile import userProfie
from schema.prompt import ResumeGenerateRequest, ResumeCompileRequest
from schema.auth import SendOTPRequest, ForgotPasswordRequest, ResetPasswordRequest, VerifyOTPRequest
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
import jwt
import datetime

# Load variables from .env
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
FERNET_SECRET_KEY = os.getenv("FERNET_SECRET_KEY")
fernet = Fernet(FERNET_SECRET_KEY.encode())

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

JWT_SECRET = os.getenv("FERNET_SECRET_KEY")
JWT_ALGORITHM = "HS256"

def create_jwt_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_session(user_id: str, authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Session expired or invalid. Please login again."
        )
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        token_user_id = payload.get("user_id")
        if not token_user_id:
            raise HTTPException(status_code=401, detail="Invalid session token.")
        if token_user_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to this resource.")
        return token_user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session has expired. Please login again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Session token is invalid.")

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Resolve pdflatex path — handles Windows (MiKTeX) where it may not be in PATH
if sys.platform == "win32":
    PDFLATEX = r"C:\Users\udayh\AppData\Local\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe"
else:
    PDFLATEX = "pdflatex"

@app.get("/")
def home_page():
    return {"message": "Welcome foundationa Level"}

@app.post("/api/auth/send-otp")
def send_otp(req: SendOTPRequest):
    if req.email:
        res = supabase.table("users").select("id").eq("email", req.email).execute()
        if res.data:
            raise HTTPException(status_code=400, detail="The Given email already registered")

    otp = genrate_otp()
    # Create token that expires in 5 minutes
    payload = {
        "otp": otp,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    }

    payload["email"] = req.email
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    subject = "Your Verification Code"
    success = send_otp_email(req.email, subject, otp)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP email")
    return JSONResponse(status_code=200, content={"message": "OTP sent successfully", "otp_token": token})

@app.post("/api/auth/verify-otp")
def verify_otp(req: VerifyOTPRequest):
    try:
        payload = jwt.decode(req.otp_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="OTP has expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid OTP token.")

    if payload.get("otp") != req.otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP.")

    return JSONResponse(status_code=200, content={"message": "OTP Verified Successfully", "verified": True})

@app.post("/api/auth/forgot-password-otp")
def forgot_password_otp(req: ForgotPasswordRequest):
    # Check if user exists
    response = supabase.table("users").select("id").eq("email", req.email).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User with this email not found")

    otp = genrate_otp()
    payload = {
        "email": req.email,
        "otp": otp,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    subject = "Password Reset Code"
    success = send_otp_email(req.email, subject, otp)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP email")
    
    return JSONResponse(status_code=200, content={"message": "OTP sent successfully", "otp_token": token})

@app.post("/api/auth/reset-password")
def reset_password(req: ResetPasswordRequest):
    try:
        payload = jwt.decode(req.otp_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid OTP token.")

    if payload.get("otp") != req.otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP.")

    email = payload.get("email")
    encrypted_password = fernet.encrypt(req.new_password.encode()).decode()

    try:
        response = supabase.table("users").update({"password_hash": encrypted_password}).eq("email", email).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        return JSONResponse(status_code=200, content={"message": "Password updated successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# SignUp Page API
@app.post("/signup")
def add_users(signUp: signUp):
    # Check for duplicates early
    res_email = supabase.table("users").select("id").eq("email", signUp.email).execute()
    if res_email.data:
        raise HTTPException(status_code=400, detail="User already exists with this Email")
        
    res_mobile = supabase.table("users").select("id").eq("mobile", signUp.mobile).execute()
    if res_mobile.data:
        raise HTTPException(status_code=400, detail="User already exists with this Mobile Number")

    # Verify Email OTP
    try:
        email_payload = jwt.decode(signUp.email_otp_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Email OTP has expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid Email OTP token.")
        
    if email_payload.get("email") != signUp.email:
        raise HTTPException(status_code=400, detail="Email mismatch in OTP verification.")
        
    if email_payload.get("otp") != signUp.email_otp:
        raise HTTPException(status_code=400, detail="Incorrect Email OTP.")

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
        
    token = create_jwt_token(user.get("id"))
    return JSONResponse(
        status_code=200,
        content={
            "message": "Sign In Successful",
            "id": user.get("id"),
            "token": token,
            "user": {
                "full_name": user.get("full_name"),
                "email": user.get("email"),
                "mobile": user.get("mobile"),
                "profile_photo_url": user.get("profile_photo_url")
            }
        }
    )



@app.get("/api/users/{user_id}/profile")
async def get_profile(user_id: str, authorization: str = Header(None)):
    verify_session(user_id, authorization)
    try:
        response = supabase_admin.table("users").select("*").eq("id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        return response.data[0]
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/users/{user_id}/profile")
async def update_profile(user_id: str, profile_data: userProfie, authorization: str = Header(None)):
    verify_session(user_id, authorization)
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


@app.post("/api/users/{user_id}/upload-photo")
async def upload_photo_endpoint(user_id: str, file: UploadFile = File(...), authorization: str = Header(None)):
    verify_session(user_id, authorization)
    try:
        # Validate that it is an image
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are allowed.")
            
        file_bytes = await file.read()
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "png"
        file_path = f"{user_id}/avatar.{file_ext}"

        # Delete any existing files in the user's storage folder to prevent duplicates/orphans
        try:
            old_files = supabase_admin.storage.from_("profile-photos").list(path=user_id)
            if old_files:
                old_file_names = [f"{user_id}/{f['name']}" for f in old_files if f.get('name') != '.emptyFolderPlaceholder']
                if old_file_names:
                    supabase_admin.storage.from_("profile-photos").remove(old_file_names)
        except Exception as e:
            print(f"Failed to clear old avatar files: {str(e)}")

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


@app.post("/api/users/{user_id}/generate-resume")
async def build_resume_endpoint(user_id: str, request: ResumeGenerateRequest, authorization: str = Header(None)):
    verify_session(user_id, authorization)
    try:
        result = generate_resume_groq(
            user_id=user_id,
            job_description=request.job_description,
            user_instruction=request.user_instruction,
            context_note=request.context_note,
            existing_latex=request.existing_latex,
            template_id=request.template_id,
            messages=request.messages
        )
            
        return {
            "message": result.get("message", "Resume generated successfully"),
            "provider_used": "groq",
            "latex_code": result.get("latex_code", "")
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/users/{user_id}/compile-pdf")
async def compile_pdf_endpoint(user_id: str, request: ResumeCompileRequest, authorization: str = Header(None)):
    verify_session(user_id, authorization)
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
