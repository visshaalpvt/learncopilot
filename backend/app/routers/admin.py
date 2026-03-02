"""
Admin Dashboard API — Platform management, analytics, user management
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import (User, Progress, Syllabus, TeacherTest, Assignment, 
                        Notification, CommunicationSession, OnboardingProfile)
from app.dependencies import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/platform-stats")
def platform_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get overall platform statistics"""
    total_users = db.query(User).count()
    students = db.query(User).filter(User.role == "student").count()
    teachers = db.query(User).filter(User.role == "teacher").count()
    parents = db.query(User).filter(User.role == "parent").count()
    admins = db.query(User).filter(User.role == "admin").count()
    
    total_syllabi = db.query(Syllabus).count()
    total_tests = db.query(TeacherTest).count()
    total_assignments = db.query(Assignment).count()
    total_progress = db.query(Progress).count()
    completed_topics = db.query(Progress).filter(Progress.is_completed == True).count()
    
    onboarded = db.query(User).filter(User.onboarding_completed == True).count()
    
    return {
        "users": {
            "total": total_users,
            "students": students,
            "teachers": teachers,
            "parents": parents,
            "admins": admins
        },
        "content": {
            "syllabi": total_syllabi,
            "tests": total_tests,
            "assignments": total_assignments
        },
        "engagement": {
            "total_progress_records": total_progress,
            "completed_topics": completed_topics,
            "onboarded_users": onboarded,
            "onboarding_rate": round((onboarded / total_users * 100) if total_users > 0 else 0, 1)
        }
    }


@router.get("/users")
def list_all_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all users with optional role filter"""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    
    users = query.order_by(User.created_at.desc()).all()
    
    return [{
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role,
        "mode": u.mode,
        "onboarding_completed": u.onboarding_completed,
        "xp_points": u.xp_points,
        "study_streak": u.study_streak,
        "created_at": u.created_at.isoformat()
    } for u in users]


@router.post("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    new_role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a user's role"""
    if new_role not in ["student", "teacher", "parent", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = new_role
    db.commit()
    return {"status": "success", "user_id": user_id, "new_role": new_role}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a user"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"status": "success"}


@router.get("/engagement-metrics")
def engagement_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get platform engagement metrics"""
    students = db.query(User).filter(User.role == "student").all()
    
    active_students = len([s for s in students if s.study_streak > 0])
    avg_streak = sum(s.study_streak for s in students) / len(students) if students else 0
    avg_xp = sum(s.xp_points for s in students) / len(students) if students else 0
    
    comm_sessions = db.query(CommunicationSession).count()
    
    return {
        "active_students": active_students,
        "total_students": len(students),
        "activity_rate": round((active_students / len(students) * 100) if students else 0, 1),
        "avg_study_streak": round(avg_streak, 1),
        "avg_xp_points": round(avg_xp, 1),
        "communication_sessions": comm_sessions
    }
