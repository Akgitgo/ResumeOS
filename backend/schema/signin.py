from pydantic import BaseModel, Field, model_validator, EmailStr
from typing import Optional

class signIn(BaseModel):
    email: Optional[EmailStr] = None
    mobile: Optional[str] = Field(
        default=None,
        pattern=r"^\d{10}$",
        description="10 digit of mobile number",
        examples=["9876543210"]
    )
    password: str = Field(..., description="The User's Password")

    @model_validator(mode="after")
    def check_identifier(self):
        if not self.email and not self.mobile:
            raise ValueError("At least one of 'email' or 'mobile' must be provided")
        return self