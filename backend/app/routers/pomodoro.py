from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, PomodoroSession, Progress
from app.dependencies import get_current_user
from datetime import datetime, timedelta
from pydantic import BaseModel

router = APIRouter(prefix="/pomodoro", tags=["Pomodoro"])

class PomodoroStart(BaseModel):
    topic_id: str | None = None
    topic_name: str | None = None
    duration_minutes: int = 25

@router.post("/start")
def start_pomodoro(
    session_data: PomodoroStart,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new Pomodoro session"""
    session = PomodoroSession(
        user_id=current_user.id,
        topic_id=session_data.topic_id,
        topic_name=session_data.topic_name,
        duration_minutes=session_data.duration_minutes
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {
        "session_id": session.id,
        "duration_minutes": session.duration_minutes,
        "started_at": session.started_at.isoformat(),
        "message": "Pomodoro session started"
    }

@router.post("/complete/{session_id}")
def complete_pomodoro(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Complete a Pomodoro session"""
    session = db.query(PomodoroSession).filter(
        PomodoroSession.id == session_id,
        PomodoroSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.completed = True
    session.completed_at = datetime.utcnow()
    
    # Update time spent if topic is specified
    if session.topic_id:
        progress = db.query(Progress).filter(
            Progress.user_id == current_user.id,
            Progress.topic_id == session.topic_id
        ).first()
        
        if progress:
            progress.time_spent_minutes += session.duration_minutes
    
    db.commit()
    
    return {
        "message": "Pomodoro session completed!",
        "duration_minutes": session.duration_minutes,
        "time_spent": ((session.completed_at - session.started_at).total_seconds() / 60)
    }

@router.get("/stats")
def get_pomodoro_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get Pomodoro statistics"""
    all_sessions = db.query(PomodoroSession).filter(
        PomodoroSession.user_id == current_user.id
    ).all()
    
    total_sessions = len(all_sessions)
    completed_sessions = len([s for s in all_sessions if s.completed])
    total_focus_time = sum([s.duration_minutes for s in all_sessions if s.completed])
    
    # Today's sessions
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_sessions = len([s for s in all_sessions if s.started_at >= today_start and s.completed])
    
    # This week's sessions
    week_start = datetime.utcnow() - timedelta(days=7)
    week_sessions = len([s for s in all_sessions if s.started_at >= week_start and s.completed])
    
    return {
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "total_focus_minutes": total_focus_time,
        "today_sessions": today_sessions,
        "this_week_sessions": week_sessions,
        "completion_rate": (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0
    }

@router.get("/recent")
def get_recent_sessions(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent Pomodoro sessions"""
    sessions = db.query(PomodoroSession).filter(
        PomodoroSession.user_id == current_user.id
    ).order_by(PomodoroSession.started_at.desc()).limit(limit).all()
    
    return [{
        "id": s.id,
        "topic_name": s.topic_name or "General Study",
        "duration_minutes": s.duration_minutes,
        "completed": s.completed,
        "started_at": s.started_at.isoformat(),
        "completed_at": s.completed_at.isoformat() if s.completed_at else None
    } for s in sessions]

@router.get("/daily-goal")
def check_daily_goal(
    goal: int = 4,  # Default goal: 4 pomodoros per day
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check daily Pomodoro goal progress"""
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    today_completed = db.query(PomodoroSession).filter(
        PomodoroSession.user_id == current_user.id,
        PomodoroSession.started_at >= today_start,
        PomodoroSession.completed == True
    ).count()
    
    return {
        "goal": goal,
        "completed": today_completed,
        "remaining": max(0, goal - today_completed),
        "percentage": min(100, (today_completed / goal * 100)),
        "achieved": today_completed >= goal
    }
