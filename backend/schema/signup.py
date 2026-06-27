from pydantic import BaseModel, Field, computed_field, EmailStr, field_validator
from typing import Annotated, Optional, Literal
import re

class signUp(BaseModel):
    name: Annotated[str, Field(..., description="The Name of the Users", example="Arya Kulkarni")]
    email: Annotated[EmailStr, Field(..., description="The Email of the User", example="temp@gmai.com")]
    mobile: Annotated[str, Field(..., description="The Mobile Number of the User", example="1234567890", pattern=r"^\d{10}$")]
    password: str = Field(..., description="The Password of the User", min_length=8, max_length=15)
    email_otp: str = Field(..., description="The OTP sent to the user's email")
    email_otp_token: str = Field(..., description="The JWT token for email OTP")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        # Pydantic v2 uses Rust's regex engine which does not support look-arounds.
        # We validate it using Python's standard 're' module.
        pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$"
        if not re.match(pattern, v):
            raise ValueError(
                "Password must contain at least one lowercase letter, one uppercase letter, "
                "one digit, and one special character (@$!%*?&)."
            )
        return v