from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Progress
from app.schemas import ProgressUpdate, ProgressResponse, DashboardStats
from app.dependencies import get_current_user
from datetime import datetime

router = APIRouter(prefix="/progress", tags=["Progress"])

@router.post("/update", response_model=ProgressResponse)
def update_progress(
    progress_data: ProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if progress record exists
    existing = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.topic_id == progress_data.topic_id
    ).first()
    
    if existing:
        # Update existing record
        if progress_data.is_completed is not None:
            existing.is_completed = progress_data.is_completed
        if progress_data.is_confused is not None:
            existing.is_confused = progress_data.is_confused
        if progress_data.labs_attempted is not None:
            existing.labs_attempted += progress_data.labs_attempted
        existing.last_activity = datetime.utcnow()
        
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new record
        new_progress = Progress(
            user_id=current_user.id,
            topic_id=progress_data.topic_id,
            topic_name=progress_data.topic_name,
            is_completed=progress_data.is_completed or False,
            is_confused=progress_data.is_confused or False,
            labs_attempted=progress_data.labs_attempted or 0
        )
        
        db.add(new_progress)
        db.commit()
        db.refresh(new_progress)
        return new_progress

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get all progress records
    all_progress = db.query(Progress).filter(Progress.user_id == current_user.id).all()
    
    total_topics = len(all_progress) if all_progress else 0
    completed_topics = len([p for p in all_progress if p.is_completed]) if all_progress else 0
    labs_attempted = sum([p.labs_attempted for p in all_progress]) if all_progress else 0
    
    progress_percentage = (completed_topics / total_topics * 100) if total_topics > 0 else 0
    
    # Get recent activities (last 5)
    recent = sorted(all_progress, key=lambda x: x.last_activity, reverse=True)[:5] if all_progress else []
    
    recent_activities = [{
        "topic_name": p.topic_name,
        "action": "Completed" if p.is_completed else "Marked as confused" if p.is_confused else "Started",
        "timestamp": p.last_activity.isoformat()
    } for p in recent]
    
    return {
        "total_topics": total_topics,
        "completed_topics": completed_topics,
        "labs_attempted": labs_attempted,
        "progress_percentage": round(progress_percentage, 2),
        "recent_activities": recent_activities
    }

@router.get("/all")
def get_all_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress_records = db.query(Progress).filter(
        Progress.user_id == current_user.id
    ).all()
    
    return [{
        "id": p.id,
        "topic_id": p.topic_id,
        "topic_name": p.topic_name,
        "is_completed": p.is_completed,
        "is_confused": p.is_confused,
        "labs_attempted": p.labs_attempted,
        "last_activity": p.last_activity.isoformat()
    } for p in progress_records]

@router.get("/weak-areas")
def get_weak_areas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Topics marked as confused or not completed
    weak_topics = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        (Progress.is_confused == True) | (Progress.is_completed == False)
    ).all()
    
    return [{
        "topic_name": p.topic_name,
        "reason": "Marked as confused" if p.is_confused else "Not yet completed",
        "labs_attempted": p.labs_attempted
    } for p in weak_topics]

@router.get("/topic/{topic_id}")
def get_topic_progress(
    topic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.topic_id == topic_id
    ).first()
    
    if not progress:
        return {
            "topic_id": topic_id,
            "is_completed": False,
            "is_confused": False,
            "labs_attempted": 0
        }
    
    return {
        "topic_id": progress.topic_id,
        "topic_name": progress.topic_name,
        "is_completed": progress.is_completed,
        "is_confused": progress.is_confused,
        "labs_attempted": progress.labs_attempted,
        "last_activity": progress.last_activity.isoformat()
    }
