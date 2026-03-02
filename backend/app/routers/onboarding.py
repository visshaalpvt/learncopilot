"""
AI Discovery Onboarding Engine
Captures student profile and generates AI learning profile
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.models import User, OnboardingProfile
from app.dependencies import get_current_user
import json

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


class OnboardingRequest(BaseModel):
    study_hours_daily: float = 2.0
    weak_subjects: List[str] = []
    learning_style: str = "visual"
    confidence_level: str = "medium"
    goal: str = "pass"
    preferred_language: str = "english"


class OnboardingResponse(BaseModel):
    ai_confidence_score: float
    ai_learning_speed: str
    ai_weak_subject_map: dict
    ai_tutor_tone: str
    ai_recommended_plan: dict


@router.post("/submit", response_model=OnboardingResponse)
def submit_onboarding(
    data: OnboardingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit onboarding wizard answers and generate AI profile"""
    
    # Calculate AI confidence score based on inputs
    confidence_map = {"low": 25.0, "medium": 55.0, "high": 80.0}
    base_confidence = confidence_map.get(data.confidence_level, 50.0)
    
    # Adjust based on study hours
    study_bonus = min(data.study_hours_daily * 5, 20)
    ai_confidence = min(base_confidence + study_bonus, 100.0)
    
    # Determine learning speed
    if data.study_hours_daily >= 4:
        learning_speed = "fast"
    elif data.study_hours_daily >= 2:
        learning_speed = "moderate"
    else:
        learning_speed = "slow"
    
    # Generate weak subject map
    weak_map = {}
    for subj in data.weak_subjects:
        weak_map[subj] = {
            "priority": "high",
            "recommended_hours": round(data.study_hours_daily * 0.4, 1),
            "strategy": "focused_practice"
        }
    
    # Determine AI tutor tone based on confidence
    tone_map = {
        "low": "encouraging",
        "medium": "balanced",
        "high": "challenging"
    }
    ai_tone = tone_map.get(data.confidence_level, "encouraging")
    
    # Generate recommended plan
    recommended_plan = {
        "daily_theory_minutes": int(data.study_hours_daily * 60 * 0.4),
        "daily_practice_minutes": int(data.study_hours_daily * 60 * 0.35),
        "daily_revision_minutes": int(data.study_hours_daily * 60 * 0.25),
        "focus_areas": data.weak_subjects[:3],
        "style": data.learning_style,
        "goal": data.goal
    }
    
    # Upsert onboarding profile
    profile = db.query(OnboardingProfile).filter(
        OnboardingProfile.user_id == current_user.id
    ).first()
    
    if profile:
        profile.study_hours_daily = data.study_hours_daily
        profile.weak_subjects = json.dumps(data.weak_subjects)
        profile.learning_style = data.learning_style
        profile.confidence_level = data.confidence_level
        profile.goal = data.goal
        profile.preferred_language = data.preferred_language
        profile.ai_confidence_score = ai_confidence
        profile.ai_learning_speed = learning_speed
        profile.ai_weak_subject_map = json.dumps(weak_map)
        profile.ai_recommended_plan = json.dumps(recommended_plan)
        profile.ai_tutor_tone = ai_tone
    else:
        profile = OnboardingProfile(
            user_id=current_user.id,
            study_hours_daily=data.study_hours_daily,
            weak_subjects=json.dumps(data.weak_subjects),
            learning_style=data.learning_style,
            confidence_level=data.confidence_level,
            goal=data.goal,
            preferred_language=data.preferred_language,
            ai_confidence_score=ai_confidence,
            ai_learning_speed=learning_speed,
            ai_weak_subject_map=json.dumps(weak_map),
            ai_recommended_plan=json.dumps(recommended_plan),
            ai_tutor_tone=ai_tone
        )
        db.add(profile)
    
    # Mark onboarding as complete
    current_user.onboarding_completed = True
    db.commit()
    
    return OnboardingResponse(
        ai_confidence_score=ai_confidence,
        ai_learning_speed=learning_speed,
        ai_weak_subject_map=weak_map,
        ai_tutor_tone=ai_tone,
        ai_recommended_plan=recommended_plan
    )


@router.get("/profile")
def get_onboarding_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the user's onboarding profile"""
    profile = db.query(OnboardingProfile).filter(
        OnboardingProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        return {"completed": False}
    
    return {
        "completed": True,
        "study_hours_daily": profile.study_hours_daily,
        "weak_subjects": json.loads(profile.weak_subjects) if profile.weak_subjects else [],
        "learning_style": profile.learning_style,
        "confidence_level": profile.confidence_level,
        "goal": profile.goal,
        "ai_confidence_score": profile.ai_confidence_score,
        "ai_learning_speed": profile.ai_learning_speed,
        "ai_weak_subject_map": json.loads(profile.ai_weak_subject_map) if profile.ai_weak_subject_map else {},
        "ai_tutor_tone": profile.ai_tutor_tone,
        "ai_recommended_plan": json.loads(profile.ai_recommended_plan) if profile.ai_recommended_plan else {}
    }
