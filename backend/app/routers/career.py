"""
Career Intelligence Dashboard — Resume builder, ATS scoring, skill gaps, placement readiness
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.models import User, Resume
from app.dependencies import get_current_user
import json

router = APIRouter(prefix="/career", tags=["Career Intelligence"])


class ResumeCreate(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    summary: Optional[str] = None
    education: List[dict] = []
    experience: List[dict] = []
    skills: List[str] = []
    projects: List[dict] = []
    certifications: List[str] = []


@router.post("/resume/save")
def save_resume(
    data: ResumeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save or update resume"""
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    
    if resume:
        resume.full_name = data.full_name
        resume.email = data.email
        resume.phone = data.phone
        resume.summary = data.summary
        resume.education_json = json.dumps(data.education)
        resume.experience_json = json.dumps(data.experience)
        resume.skills_json = json.dumps(data.skills)
        resume.projects_json = json.dumps(data.projects)
        resume.certifications_json = json.dumps(data.certifications)
    else:
        resume = Resume(
            user_id=current_user.id,
            full_name=data.full_name,
            email=data.email,
            phone=data.phone,
            summary=data.summary,
            education_json=json.dumps(data.education),
            experience_json=json.dumps(data.experience),
            skills_json=json.dumps(data.skills),
            projects_json=json.dumps(data.projects),
            certifications_json=json.dumps(data.certifications)
        )
        db.add(resume)
    
    db.commit()
    db.refresh(resume)
    return {"status": "success", "resume_id": resume.id}


@router.get("/resume")
def get_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's resume"""
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    
    if not resume:
        return {"exists": False}
    
    return {
        "exists": True,
        "full_name": resume.full_name,
        "email": resume.email,
        "phone": resume.phone,
        "summary": resume.summary,
        "education": json.loads(resume.education_json) if resume.education_json else [],
        "experience": json.loads(resume.experience_json) if resume.experience_json else [],
        "skills": json.loads(resume.skills_json) if resume.skills_json else [],
        "projects": json.loads(resume.projects_json) if resume.projects_json else [],
        "certifications": json.loads(resume.certifications_json) if resume.certifications_json else [],
        "ats_score": resume.ats_score,
        "placement_readiness": resume.placement_readiness,
        "skill_gaps": json.loads(resume.skill_gaps_json) if resume.skill_gaps_json else []
    }


@router.post("/resume/analyze")
async def analyze_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """AI-powered ATS score and skill gap analysis"""
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found. Save your resume first.")
    
    skills = json.loads(resume.skills_json) if resume.skills_json else []
    experience = json.loads(resume.experience_json) if resume.experience_json else []
    projects = json.loads(resume.projects_json) if resume.projects_json else []
    
    # Calculate ATS score
    ats_score = 30  # Base
    if resume.summary and len(resume.summary) > 50:
        ats_score += 15
    if len(skills) >= 5:
        ats_score += 15
    elif len(skills) >= 3:
        ats_score += 10
    if len(experience) >= 1:
        ats_score += 15
    if len(projects) >= 2:
        ats_score += 15
    if resume.education_json and len(json.loads(resume.education_json)) >= 1:
        ats_score += 10
    
    ats_score = min(ats_score, 100)
    
    # Determine skill gaps
    industry_skills = [
        "Python", "JavaScript", "React", "SQL", "Git",
        "Data Structures", "Algorithms", "Machine Learning",
        "Communication", "Problem Solving", "Teamwork"
    ]
    skill_lower = [s.lower() for s in skills]
    gaps = [s for s in industry_skills if s.lower() not in skill_lower]
    
    # Placement readiness
    readiness = min(ats_score + (len(skills) * 2) + (len(projects) * 5), 100)
    
    # Try AI analysis
    ai_feedback = ""
    try:
        from app.rag.llm_manager import llm_manager
        prompt = f"""Analyze this resume and give 5 specific improvement tips:
Name: {resume.full_name}
Skills: {', '.join(skills)}
Projects: {len(projects)}
Experience: {len(experience)} entries
Summary: {resume.summary or 'None'}

ATS Score: {ats_score}/100
Skill Gaps: {', '.join(gaps[:5])}"""
        
        response = await llm_manager.generate(
            prompt=prompt,
            system_prompt="You are a career counselor and resume expert. Give actionable tips.",
            temperature=0.5
        )
        ai_feedback = response.content
    except Exception:
        ai_feedback = f"Your resume scores {ats_score}/100. Focus on adding more skills and projects to improve your ATS score."
    
    # Update resume
    resume.ats_score = ats_score
    resume.skill_gaps_json = json.dumps(gaps[:10])
    resume.placement_readiness = readiness
    db.commit()
    
    return {
        "ats_score": ats_score,
        "placement_readiness": readiness,
        "skill_gaps": gaps[:10],
        "ai_feedback": ai_feedback,
        "strengths": skills[:5],
        "recommendations": [
            f"Add {gaps[0]} to your skillset" if gaps else "Great skill coverage!",
            "Add more quantifiable achievements in experience",
            "Include 2-3 relevant projects with tech stack",
            f"Your profile is {readiness}% placement-ready"
        ]
    }


@router.get("/interview-tracker")
def interview_tracker(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Track interview preparation progress"""
    from app.models import CommunicationSession
    
    sessions = db.query(CommunicationSession).filter(
        CommunicationSession.user_id == current_user.id,
        CommunicationSession.session_type.in_(["hr_interview", "tech_interview"])
    ).all()
    
    hr_sessions = [s for s in sessions if s.session_type == "hr_interview"]
    tech_sessions = [s for s in sessions if s.session_type == "tech_interview"]
    
    return {
        "hr_interviews": {
            "total": len(hr_sessions),
            "avg_score": round(sum(s.overall_score or 0 for s in hr_sessions) / len(hr_sessions), 1) if hr_sessions else 0
        },
        "tech_interviews": {
            "total": len(tech_sessions),
            "avg_score": round(sum(s.overall_score or 0 for s in tech_sessions) / len(tech_sessions), 1) if tech_sessions else 0
        },
        "total_practice_minutes": sum(s.duration_seconds or 0 for s in sessions) // 60,
        "readiness_level": "advanced" if len(sessions) > 10 else "intermediate" if len(sessions) > 3 else "beginner"
    }
