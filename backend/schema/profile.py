from pydantic import BaseModel, Field, model_validator, EmailStr
from typing import Optional, List, Dict, Any

class userProfie(BaseModel):
    profile_links: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        json_schema_extra={
            "example": [
                {"platform": "LinkedIn", "url": "https://linkedin.com/in/udayhese"},
                {"platform": "GitHub", "url": "https://github.com/udayhese96"},
                {"platform": "Portfolio", "url": "https://udayhese.dev"},
                {"platform": "LeetCode", "url": "https://leetcode.com/u/udayhese"}
            ]
        }
    )
    experience: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        json_schema_extra={
            "example": [
                {
                    "company": "RAAM Group",
                    "role": "Software Developer Intern",
                    "location": "Hyderabad, India",
                    "start_date": "2025-06-03",
                    "end_date": "2025-11-05",
                    "description": [
                        "Developed AI-powered web applications using FastAPI and Supabase",
                        "Integrated WhatsApp Business APIs for customer communication",
                        "Built automated lead management and reporting solutions"
                    ]
                }
            ]
        }
    )
    education: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        json_schema_extra={
            "example": [
                {
                    "degree": "Bachelor of Technology",
                    "specialization": "Computer Science and Engineering (Artificial Intelligence)",
                    "institution": "Vishwakarma Institute of Information Technology",
                    "location": "Pune, India",
                    "cgpa": 8.7,
                    "start_year": 2022,
                    "end_year": 2026
                }
            ]
        }
    )
    achievements: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        json_schema_extra={
            "example": [
                {
                    "title": "Research Paper Presenter",
                    "organization": "MRCN 2024",
                    "year": 2024,
                    "description": "Presented research paper on Deep Ensemble Learning for Cardiovascular Disease Prediction"
                },
                {
                    "title": "Hackathon Finalist",
                    "organization": "National AI Innovation Challenge",
                    "year": 2025,
                    "description": "Selected among top teams for AI-powered traffic management solution"
                }
            ]
        }
    )
    research_papers: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        json_schema_extra={
            "example": [
                {
                    "title": "Deep Ensemble Learning for Cardiovascular Disease Prediction",
                    "conference": "MRCN 2024",
                    "status": "Published",
                    "authors": ["Uday Hese", "Nimish Marathe"],
                    "year": 2024,
                    "paper_link": "https://doi.org/10.1234/mrcn2024.336"
                }
            ]
        }
    )
    certifications: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        json_schema_extra={
            "example": [
                {
                    "name": "AWS Cloud Practitioner",
                    "issuer": "Amazon Web Services",
                    "issue_date": "2025-02-15",
                    "credential_id": "AWS-CP-123456",
                    "credential_url": "https://aws.amazon.com/verification/AWS-CP-123456"
                },
                {
                    "name": "Machine Learning Specialization",
                    "issuer": "Coursera",
                    "issue_date": "2024-09-10",
                    "credential_id": "MLS-987654",
                    "credential_url": "https://coursera.org/verify/MLS-987654"
                }
            ]
        }
    )
    languages: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        json_schema_extra={
            "example": [
                {"language": "English", "proficiency": "Professional"},
                {"language": "Hindi", "proficiency": "Native"},
                {"language": "Marathi", "proficiency": "Native"}
            ]
        }
    )
    skills: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        json_schema_extra={
            "example": [
                {
                    "category": "Programming Languages",
                    "items": ["Python", "Java", "JavaScript", "SQL"]
                },
                {
                    "category": "Frameworks",
                    "items": ["FastAPI", "Flask", "LangChain", "Bootstrap"]
                },
                {
                    "category": "Databases",
                    "items": ["Supabase", "PostgreSQL", "MongoDB", "ChromaDB"]
                },
                {
                    "category": "AI & ML",
                    "items": ["YOLOv10", "OpenCV", "Scikit-Learn", "TensorFlow", "Ollama"]
                }
            ]
        }
    )
    projects: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        json_schema_extra={
            "example": [
                {
                    "title": "AI Admission Enquiry System",
                    "role": "Full Stack AI Developer",
                    "description": "Automated admission enquiry handling using AI agents and WhatsApp integration.",
                    "technologies": ["FastAPI", "Supabase", "WhatsApp Business API", "OpenAI"],
                    "github_url": "https://github.com/udayhese96/ai-admission-enquiry-system",
                    "live_url": "https://admission-ai.udayhese.dev",
                    "start_date": "2025-01-10",
                    "end_date": "2025-03-20"
                },
                {
                    "title": "Smart AI Traffic Management System",
                    "role": "Machine Learning Engineer",
                    "description": "Traffic optimization using YOLOv10, emergency vehicle prioritization and adaptive signal timing.",
                    "technologies": ["YOLOv10", "OpenCV", "Python", "Roboflow"],
                    "github_url": "https://github.com/udayhese96/smart-traffic-management",
                    "live_url": "https://traffic-ai.udayhese.dev",
                    "start_date": "2024-08-15",
                    "end_date": "2025-01-25"
                },
                {
                    "title": "AI Resume Builder",
                    "role": "AI Application Developer",
                    "description": "ATS-friendly resume generation using Ollama, LaTeX and FastAPI.",
                    "technologies": ["FastAPI", "Ollama", "Qwen3", "LaTeX", "Supabase"],
                    "github_url": "https://github.com/udayhese96/ai-resume-builder",
                    "live_url": "https://resume-ai.udayhese.dev",
                    "start_date": "2025-05-01",
                    "end_date": None
                }
            ]
        }
    )
    profile_photo_url: Optional[str] = Field(
        default=None,
        description="Public/signed URL to the user's profile photo stored in Supabase Storage."
    )