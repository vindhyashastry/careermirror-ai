from sqlalchemy import Column, Integer, String, ForeignKey, Float, JSON, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    
    # Profile Information
    role = Column(String) # student / graduate / professional
    target_roles = Column(JSON, default=[]) # e.g. ["Backend", "Frontend"]
    preferred_language = Column(String)
    career_interests = Column(JSON, default=[])
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resumes = relationship("Resume", back_populates="owner")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    filename = Column(String)
    file_type = Column(String)        # "pdf" or "docx"
    version = Column(Integer, default=1)
    raw_text = Column(Text)

    # ── Flat skill list (normalized, deduped) ──
    skills = Column(JSON)             # ["Python", "Docker", ...]

    # ── Categorized skills ──
    skill_languages = Column(JSON)    # ["Python", "SQL", ...]
    skill_frameworks = Column(JSON)   # ["React", "FastAPI", ...]
    skill_tools = Column(JSON)        # ["Docker", "Git", ...]

    # ── Structured sections ──
    contact_info = Column(JSON)       # {emails, phones, linkedin, github}
    education = Column(JSON)          # [{degree, institutions, years}]
    experience = Column(JSON)         # [{text, years}]
    projects = Column(JSON)           # [{name, description, technologies}]
    certifications = Column(JSON)     # [{name, year}]
    sections_detected = Column(JSON)  # list of section names found

    # ── Full structured JSON (all of the above merged) ──
    extracted_data = Column(JSON)

    # ── Semantic embedding for similarity matching (384-dim as JSON array) ──
    embedding = Column(JSON)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="resumes")
    readiness_scores = relationship("ReadinessScore", back_populates="resume")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # e.g., "Backend Engineer"
    skill_graph = Column(JSON)  # Required skills and weights

class ReadinessScore(Base):
    __tablename__ = "readiness_scores"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    role_id = Column(Integer, ForeignKey("roles.id"))
    score = Column(Float)
    practice_score = Column(Float, default=0.0)
    gap_analysis = Column(JSON)
    authenticity_score = Column(Float)
    ai_strategy = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resume = relationship("Resume", back_populates="readiness_scores")

class PracticeHistory(Base):
    __tablename__ = "practice_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    session_data = Column(JSON)  # Questions and answers
    score = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ATSScore(Base):
    __tablename__ = "ats_scores"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    job_description = Column(Text)
    score = Column(Float)
    feedback = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_title = Column(String)
    company = Column(String)
    location = Column(String)
    url = Column(String)
    similarity_score = Column(Float)
    is_recommended = Column(Integer, default=0) # 1 if recommended based on readiness
    created_at = Column(DateTime(timezone=True), server_default=func.now())
