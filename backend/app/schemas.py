from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str
    full_name: str
    role: Optional[str] = None
    target_roles: List[str] = []
    preferred_language: Optional[str] = None
    career_interests: List[str] = []

class UserCreate(UserBase):
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    target_roles: Optional[List[str]] = None
    preferred_language: Optional[str] = None
    career_interests: Optional[List[str]] = None

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ResumeBase(BaseModel):
    filename: str
    version: int
    skills: List[str]
    created_at: datetime

class ResumeResponse(ResumeBase):
    id: int

    class Config:
        from_attributes = True

class ScenarioEvaluationRequest(BaseModel):
    subject: str
    task: str
    user_code: str
    solution: str

class PracticeSaveRequest(BaseModel):
    score: float

class ChatRequest(BaseModel):
    message: str

class JDMatchRequest(BaseModel):
    jd_text: str
