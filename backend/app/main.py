from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import os
import shutil

from .database import engine, Base, get_db
from .services.resume_parser import ResumeParser
from .services.skill_engine import SkillEngine
from .services.llm_service import LLMService
from .services.job_service import JobService
from . import models, schemas, auth
from .services.email_service import EmailService
import re

# email_service = EmailService() # Removed OTP functionality

def validate_password(password: str):
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    return True, ""

# Initialize database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CareerMirror AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex="https://careermirror-ai(-.*)?\\.vercel\\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
parser = ResumeParser()
skill_engine = SkillEngine()
llm_service = LLMService()
job_service = JobService()

@app.get("/")
def read_root():
    return {"message": "Welcome to CareerMirror AI API"}

# Removed OTP/Reset endpoints

@app.post("/register")
def register(user: schemas.UserCreate, response: Response, db: Session = Depends(get_db)):
    # Validate password strength
    is_valid, error_msg = validate_password(user.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
        
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Removed OTP verification

    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role,
        target_roles=user.target_roles,
        preferred_language=user.preferred_language,
        career_interests=user.career_interests
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.email})
    response.set_cookie(key="access_token", value=access_token, httponly=True, samesite="lax")
    return {"access_token": access_token, "token_type": "bearer", "user": {
        "id": new_user.id, "email": new_user.email, "full_name": new_user.full_name,
        "role": new_user.role, "target_roles": new_user.target_roles or [],
        "preferred_language": new_user.preferred_language, "career_interests": new_user.career_interests or []
    }}

@app.post("/login")
def login(response: Response, login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Removed OTP verification
    
    access_token = auth.create_access_token(data={"sub": user.email})
    response.set_cookie(key="access_token", value=access_token, httponly=True, samesite="lax")
    return {"access_token": access_token, "token_type": "bearer", "user": {
        "id": user.id, "email": user.email, "full_name": user.full_name,
        "role": user.role, "target_roles": user.target_roles or [],
        "preferred_language": user.preferred_language, "career_interests": user.career_interests or []
    }}

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Successfully logged out"}

@app.get("/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.put("/me", response_model=schemas.User)
def update_me(user_update: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if user_update.full_name is not None: current_user.full_name = user_update.full_name
    if user_update.role is not None: current_user.role = user_update.role
    if user_update.target_roles is not None: current_user.target_roles = user_update.target_roles
    if user_update.preferred_language is not None: current_user.preferred_language = user_update.preferred_language
    if user_update.career_interests is not None: current_user.career_interests = user_update.career_interests
    db.commit()
    db.refresh(current_user)
    return current_user

@app.get("/my-resumes", response_model=list[schemas.ResumeResponse])
def get_my_resumes(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return current_user.resumes

@app.get("/dashboard-data")
def get_dashboard_data(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    last_resume = (
        db.query(models.Resume)
        .filter(models.Resume.user_id == current_user.id)
        .order_by(models.Resume.created_at.desc())
        .first()
    )
    if not last_resume:
        return {"has_resume": False}
    
    # Find general readiness (Fallback)
    score = (
        db.query(models.ReadinessScore)
        .filter(models.ReadinessScore.resume_id == last_resume.id)
        .order_by(models.ReadinessScore.created_at.desc())
        .first()
    )

    # Find latest JD match (Precision Dashboard)
    latest_jd = (
        db.query(models.ATSScore)
        .filter(models.ATSScore.resume_id == last_resume.id)
        .order_by(models.ATSScore.created_at.desc())
        .first()
    )
    
    return {
        "has_resume": True,
        "resume_id": last_resume.id,
        "filename": last_resume.filename,
        "skills": last_resume.skills,
        "score": latest_jd.score if latest_jd else (score.score if score else 0),
        "authenticity_score": latest_jd.authenticity_score if latest_jd else (score.authenticity_score if score else 0),
        "gap_analysis": {"gaps": latest_jd.gaps} if latest_jd else (score.gap_analysis if score else {"gaps": []}),
        "ai_strategy": latest_jd.feedback if latest_jd else (score.ai_strategy if score else "Focus on core tech fundamentals to improve readiness."),
        "jd_text": latest_jd.job_description if latest_jd else None
    }

@app.get("/market-heatmap")
async def get_market_heatmap(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    last_resume = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).order_by(models.Resume.created_at.desc()).first()
    user_skills = last_resume.skills if last_resume else []
    data = await llm_service.generate_market_heatmap(user_skills)
    return data

@app.post("/upload-resume")
async def upload_resume(request: Request, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # ── Auth (optional — allow anonymous for now) ──
    user = None
    try:
        user = await auth.get_current_user(request, db)
    except Exception:
        pass

    # ── Validate file type ──
    fname = file.filename or ""
    ext = fname.rsplit(".", 1)[-1].lower() if "." in fname else ""
    if ext not in ("pdf", "doc", "docx"):
        raise HTTPException(status_code=400, detail="Only PDF and DOC/DOCX files are supported.")

    # ── Save to temp file ──
    temp_path = f"temp_{fname}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # ── Full parser pipeline ──
        # 1. Fast Extraction (Regex-based)
        raw_text, data = parser.parse(temp_path)
        
        # 2. AI-Powered Supplemental Extraction (Finds JWT, OAuth, etc.)
        try:
            ai_skills = await llm_service.extract_skills_from_text(raw_text)
            if ai_skills:
                # Combine and deduplicate
                combined = list(set(data.get("skills", []) + ai_skills))
                data["skills"] = combined
        except Exception as e:
            print(f"⚠️ AI Skill Extraction skipped: {e}")

        # ── Enhance skill extraction with AI (catches niche skills not in taxonomy) ──
        try:
            ai_skills = await llm_service.extract_skills_from_text(raw_text)
            if ai_skills:
                data["skills"] = list(set(data.get("skills", []) + ai_skills))
        except Exception as e:
            print(f"AI skill extraction failed: {e}")

        # ── Version management ──
        version = 1
        if user:
            last_resume = (
                db.query(models.Resume)
                .filter(models.Resume.user_id == user.id)
                .order_by(models.Resume.version.desc())
                .first()
            )
            if last_resume:
                version = last_resume.version + 1

        # ── Store all fields in DB ──
        skill_cats = data.get("skill_categories", {})
        db_resume = models.Resume(
            user_id=user.id if user else None,
            filename=fname,
            file_type=ext,
            version=version,
            raw_text=raw_text,
            skills=data.get("skills", []),
            skill_languages=skill_cats.get("languages", []),
            skill_frameworks=skill_cats.get("frameworks", []),
            skill_tools=skill_cats.get("tools", []),
            contact_info=data.get("contact", {}),
            education=data.get("education", []),
            experience=data.get("experience", []),
            projects=data.get("projects", []),
            certifications=data.get("certifications", []),
            sections_detected=data.get("sections_detected", []),
            embedding=data.get("embedding", []),
            extracted_data=data,
        )
        db.add(db_resume)
        db.commit()
        db.refresh(db_resume)
        
        result = await run_analysis(user, db_resume, db)
        return {
            "resume_id": db_resume.id,
            "skills": data.get("skills", []),
            **result,
            "redirect_url": "/dashboard"
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

async def run_analysis(user: models.User, db_resume: models.Resume, db: Session):
    """Core logic to calculate readiness, authenticity and strategy with DB caching."""
    # ── Role-Based Skill Requirements Caching ──
    # We combine target roles into a single key for caching
    target_roles = user.target_roles if user else []
    role_key = ", ".join(sorted(target_roles)) if target_roles else "General Technical"
    
    # Check if this role configuration already exists in our knowledge base
    db_role = db.query(models.Role).filter(models.Role.name == role_key).first()
    
    if db_role:
        expected_skills = db_role.skill_graph
    else:
        # Generate new requirements and cache them forever
        if target_roles:
            expected_skills = await llm_service.generate_expected_skills(target_roles)
        else:
            expected_skills = {"Python": 5, "FastAPI": 4, "PostgreSQL": 4, "Docker": 3, "Git": 3, "AWS": 3}
            
        # Cache in DB for next time (deterministic for all users)
        new_role = models.Role(name=role_key, skill_graph=expected_skills)
        db.add(new_role)
        db.commit()

    # Calculate scores (using cached requirements)
    readiness, gaps = skill_engine.calculate_readiness(db_resume.skills, expected_skills)
    
    # Enhanced Authenticity
    base_auth = skill_engine.calculate_authenticity_score(db_resume.raw_text)
    ai_auth_data = await llm_service.audit_authenticity(db_resume.raw_text)
    ai_auth_score = ai_auth_data.get("score", 75)
    auth_score = (base_auth * 0.4) + (ai_auth_score * 0.6)
    
    # Generate dynamic AI Strategy
    ai_strategy = await llm_service.generate_strategy(readiness, gaps, [])
    
    # Save ReadinessScore
    db_score = models.ReadinessScore(
        resume_id=db_resume.id,
        score=readiness,
        gap_analysis={"gaps": gaps},
        authenticity_score=round(auth_score, 1),
        ai_strategy=ai_strategy
    )
    db.add(db_score)
    db.commit()
    return {
        "resume_id": db_resume.id,
        "skills": db_resume.skills,
        "readiness_score": readiness,
        "gaps": gaps,
        "authenticity_score": round(auth_score, 1),
        "ai_strategy": ai_strategy
    }

@app.post("/reanalyze-resume")
async def reanalyze_resume(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    last_resume = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).order_by(models.Resume.created_at.desc()).first()
    if not last_resume:
        raise HTTPException(status_code=404, detail="No resume found to reanalyze")
    
    result = await run_analysis(current_user, last_resume, db)
    return result

@app.post("/match-jd")
async def match_job_description(request: schemas.JDMatchRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    last_resume = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).order_by(models.Resume.created_at.desc()).first()
    if not last_resume:
        raise HTTPException(status_code=404, detail="Please upload a resume first.")
    
    # Extract requirements specifically from this JD
    expected_skills = await llm_service.extract_requirements_from_jd(request.jd_text)
    
    if not expected_skills:
        raise HTTPException(status_code=400, detail="Could not extract skills from the provided Job Description.")

    # Calculate scores based on the JD
    readiness, gaps = skill_engine.calculate_readiness(last_resume.skills, expected_skills)
    
    # Enhanced Authenticity
    base_auth = skill_engine.calculate_authenticity_score(last_resume.raw_text)
    ai_auth_data = await llm_service.audit_authenticity(last_resume.raw_text)
    ai_auth_score = ai_auth_data.get("score", 75)
    auth_score = (base_auth * 0.4) + (ai_auth_score * 0.6)
    
    # AI Strategy for this JD
    ai_strategy = await llm_service.generate_strategy(readiness, gaps, [])
    
    # Save the ATS score record
    db_ats = models.ATSScore(
        resume_id=last_resume.id,
        job_description=request.jd_text,
        score=readiness,
        authenticity_score=round(auth_score, 1),
        gaps=gaps,
        feedback=ai_strategy
    )
    db.add(db_ats)
    db.commit()
    
    return {
        "readiness_score": readiness,
        "gaps": gaps,
        "authenticity_score": round(auth_score, 1),
        "ai_strategy": ai_strategy,
        "matched_requirements": expected_skills
    }

@app.get("/arena/questions")
async def get_arena_questions(subject: str, difficulty: str = "easy", count: int = 5, exclude: str = ""):
    exclude_list = [t.strip() for t in exclude.split("|") if t.strip()]
    questions = await llm_service.generate_mcqs(subject, difficulty, count, exclude_list)
    return questions

@app.get("/arena/scenarios")
async def get_arena_scenarios(subject: str, count: int = 1):
    scenarios = await llm_service.generate_scenarios(subject, count)
    return scenarios

@app.post("/arena/evaluate")
async def evaluate_arena_scenario(request: schemas.ScenarioEvaluationRequest):
    result = await llm_service.evaluate_scenario(
        request.subject, 
        request.task, 
        request.user_code, 
        request.solution
    )
    return result

@app.get("/practice-questions")
async def get_practice(role: str, weak_skills: str, difficulty: str = "intermediate"):
    skills_list = weak_skills.split(",")
    questions = await llm_service.generate_questions(role, skills_list, difficulty)
    return questions

@app.get("/match-jobs")
async def match_jobs(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Get user to see target roles
    user = db.query(models.User).filter(models.User.id == resume.user_id).first()
    search_query = user.target_roles[0] if user and user.target_roles else "Software Engineer"
    
    await job_service.fetch_remote_jobs(query=search_query)
    matches = job_service.match_jobs(resume.raw_text, user_skills=resume.skills)
    return matches

@app.post("/practice/save")
async def save_practice_result(
    request: schemas.PracticeSaveRequest, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    last_resume = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).order_by(models.Resume.created_at.desc()).first()
    if last_resume:
        rs = db.query(models.ReadinessScore).filter(models.ReadinessScore.resume_id == last_resume.id).order_by(models.ReadinessScore.created_at.desc()).first()
        if rs:
            rs.practice_score = request.score
            # We normalize the practice score to 100 for the average
            # Assuming max points was roughly 25 (15 MCQ avg + 3 scenario * weight)
            # But let's just assume the score passed is already normalized or we do it here.
            # For simplicity, if they get 25 points, that's 100%.
            normalized_practice = min(100, (request.score / 25) * 100)
            
            # Weighted average: 70% Resume, 30% Practice
            # We only update if it's better or just overwrite? Let's overwrite for now.
            rs.score = (rs.score * 0.7) + (normalized_practice * 0.3)
            db.commit()
            return {"message": "Practice score saved", "new_overall_score": rs.score}
    
    return {"message": "Score saved to history (no resume found)"}

from .services.assistant_service import AssistantService
from fastapi.responses import FileResponse
import os

assistant_service = AssistantService()

@app.post("/assistant/chat")
async def assistant_chat(request: schemas.ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    last_resume = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).order_by(models.Resume.created_at.desc()).first()
    resume_data = last_resume.extracted_data if last_resume else {}
    
    # Detect if message is a GitHub link
    if "github.com/" in request.message:
        feedback = await assistant_service.analyze_github(request.message)
        return {"reply": feedback, "type": "github_feedback"}
        
    result = await assistant_service.chat(request.message, resume_data, current_user.role)
    return result

@app.get("/assistant/ats-report")
async def get_ats_report(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    last_resume = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).order_by(models.Resume.created_at.desc()).first()
    if not last_resume:
        raise HTTPException(status_code=404, detail="No resume found to analyze")
        
    report_path = assistant_service.generate_ats_report(current_user.full_name, last_resume.extracted_data, current_user.role)
    
    return FileResponse(
        path=report_path,
        filename=f"ATS_Report_{current_user.full_name.replace(' ', '_')}.pdf",
        media_type="application/pdf"
    )

@app.get("/analytics/market-heatmap")
async def get_market_heatmap(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    last_resume = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).order_by(models.Resume.created_at.desc()).first()
    if not last_resume:
        # Return generic data if no resume
        return await llm_service.generate_market_heatmap([])
        
    extracted_data = last_resume.extracted_data or {}
    skills = extracted_data.get("skills", [])
    if isinstance(skills, dict): # Handle cases where skills might be a dict of scores
        skills = list(skills.keys())
        
    heatmap_data = await llm_service.generate_market_heatmap(skills)
    return heatmap_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

