from pydantic import BaseModel, EmailStr

from typing import Optional

class SendOTPRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    otp: str
    otp_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    otp: str
    otp_token: str
    new_password: str
