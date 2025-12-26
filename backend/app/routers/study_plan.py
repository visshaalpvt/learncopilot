from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, StudyPlan, Progress, DailyMission
from app.dependencies import get_current_user
from datetime import datetime, timedelta
from pydantic import BaseModel
import json

router = APIRouter(prefix="/study-plan", tags=["Study Plan"])

class StudyPlanCreate(BaseModel):
    exam_name: str
    exam_date: str  # ISO format
    topics: list[str]  # List of topic IDs

@router.post("/generate")
def generate_study_plan(
    plan_data: StudyPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a smart study plan based on exam date"""
    exam_date = datetime.fromisoformat(plan_data.exam_date.replace('Z', '+00:00'))
    days_until_exam = (exam_date - datetime.utcnow()).days
    
    if days_until_exam < 0:
        raise HTTPException(status_code=400, detail="Exam date is in the past")
    
    # Get progress for each topic
    topics_schedule = []
    
    # Rule-based scheduling algorithm
    for i, topic_id in enumerate(plan_data.topics):
        progress = db.query(Progress).filter(
            Progress.user_id == current_user.id,
            Progress.topic_id == topic_id
        ).first()
        
        # Determine priority
        if progress:
            if progress.is_confused:
                priority = "HIGH"
                days_needed = 3  # More time for confusing topics
            elif not progress.is_completed:
                priority = "MEDIUM"
                days_needed = 2
            else:
                priority = "LOW"
                days_needed = 1  # Just revision
        else:
            priority = "HIGH"  # Not started yet
            days_needed = 3
        
        # Calculate study date
        topic_index = i % max(1, days_until_exam)
        study_date = datetime.utcnow() + timedelta(days=topic_index)
        
        topics_schedule.append({
            "topic_id": topic_id,
            "topic_name": progress.topic_name if progress else f"Topic {i+1}",
            "priority": priority,
            "study_date": study_date.isoformat(),
            "days_allocated": days_needed,
            "is_completed": progress.is_completed if progress else False,
            "is_confused": progress.is_confused if progress else False
        })
    
    # Save study plan
    study_plan = StudyPlan(
        user_id=current_user.id,
        exam_name=plan_data.exam_name,
        exam_date=exam_date,
        topics_json=json.dumps(topics_schedule)
    )
    
    db.add(study_plan)
    db.commit()
    db.refresh(study_plan)
    
    return {
        "id": study_plan.id,
        "exam_name": plan_data.exam_name,
        "exam_date": exam_date.isoformat(),
        "days_until_exam": days_until_exam,
        "topics_schedule": topics_schedule,
        "message": f"Study plan created for {days_until_exam} days"
    }

@router.get("/current")
def get_current_study_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the most recent study plan"""
    plan = db.query(StudyPlan).filter(
        StudyPlan.user_id == current_user.id,
        StudyPlan.exam_date >= datetime.utcnow()
    ).order_by(StudyPlan.exam_date.asc()).first()
    
    if not plan:
        return {"exists": False, "message": "No active study plan"}
    
    topics_schedule = json.loads(plan.topics_json)
    days_until_exam = (plan.exam_date - datetime.utcnow()).days
    
    return {
        "exists": True,
        "id": plan.id,
        "exam_name": plan.exam_name,
        "exam_date": plan.exam_date.isoformat(),
        "days_until_exam": days_until_exam,
        "topics_schedule": topics_schedule,
        "created_at": plan.created_at.isoformat()
    }

@router.get("/daily-tasks")
def get_daily_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's tasks from study plan"""
    # Get today's missions
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing_missions = db.query(DailyMission).filter(
        DailyMission.user_id == current_user.id,
        DailyMission.date >= today_start
    ).all()
    
    if existing_missions:
        return [{
            "id": m.id,
            "mission_text": m.mission_text,
            "mission_type": m.mission_type,
            "is_completed": m.is_completed
        } for m in existing_missions]
    
    # Generate new missions based on progress
    all_progress = db.query(Progress).filter(
        Progress.user_id == current_user.id
    ).all()
    
    missions = []
    
    # Mission 1: Complete or review a topic
    incomplete_topics = [p for p in all_progress if not p.is_completed]
    if incomplete_topics:
        topic = incomplete_topics[0]
        mission1 = DailyMission(
            user_id=current_user.id,
            mission_text=f"Complete {topic.topic_name}",
            mission_type="theory"
        )
        missions.append(mission1)
    
    # Mission 2: Practice labs
    mission2 = DailyMission(
        user_id=current_user.id,
        mission_text="Complete 2 coding exercises",
        mission_type="practical"
    )
    missions.append(mission2)
    
    # Mission 3: Revision
    old_topics = [p for p in all_progress if p.is_completed and 
                  (datetime.utcnow() - p.last_activity).days >= 7]
    if old_topics:
        topic = old_topics[0]
        mission3 = DailyMission(
            user_id=current_user.id,
            mission_text=f"Revise {topic.topic_name}",
            mission_type="revision"
        )
        missions.append(mission3)
    
    for mission in missions:
        db.add(mission)
    
    db.commit()
    
    return [{
        "id": m.id,
        "mission_text": m.mission_text,
        "mission_type": m.mission_type,
        "is_completed": m.is_completed
    } for m in missions]

@router.post("/complete-mission/{mission_id}")
def complete_mission(
    mission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a daily mission as completed"""
    mission = db.query(DailyMission).filter(
        DailyMission.id == mission_id,
        DailyMission.user_id == current_user.id
    ).first()
    
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    mission.is_completed = True
    db.commit()
    
    return {"message": "Mission completed! +15 XP", "xp_earned": 15}

@router.delete("/{plan_id}")
def delete_study_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a study plan"""
    plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    
    db.delete(plan)
    db.commit()
    
    return {"message": "Study plan deleted successfully"}
