from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ResumeGenerateRequest(BaseModel):
    job_description: str = Field(
        default="",
        description="The target job description to tailor the resume towards"
    )
    user_instruction: Optional[str] = Field(
        default=None,
        description=(
            "Free-form user layout/structural instructions. "
            "E.g. 'Keep it to 1 page', 'Move Education to page 2', "
            "'Emphasize Python and React', 'Remove the Achievements section'"
        )
    )
    context_note: Optional[str] = Field(
        default=None,
        description=(
            "Extra context not in the user profile. "
            "E.g. 'I am applying for a senior role', 'I have a 2-year gap, downplay dates', "
            "'I recently got promoted to Tech Lead'"
        )
    )
    existing_latex: Optional[str] = Field(
        default=None,
        description="Existing LaTeX code to modify instead of generating from scratch"
    )
    template_id: Optional[str] = Field(
        default=None,
        description="The ID of the template style to use for generating a fresh resume"
    )
    messages: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Optional chat messages history for conversational interactive modifications"
    )


class ResumeCompileRequest(BaseModel):
    latex_code: str = Field(..., description="The LaTeX code to compile into a PDF")

