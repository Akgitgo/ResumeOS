from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.responses import JSONResponse
from schema.signup import signUp
from dotenv import load_dotenv
from supabase import create_client
from cryptography.fernet import Fernet

import os

# Load variables from .env
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
FERNET_SECRET_KEY = os.getenv("FERNET_SECRET_KEY")
fernet = Fernet(FERNET_SECRET_KEY.encode())

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


app = FastAPI()
    

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