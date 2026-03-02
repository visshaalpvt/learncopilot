"""
Parent Dashboard API — Child progress monitoring
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User, Progress, ParentStudentLink, Notification, TeacherTest, OnboardingProfile
from app.dependencies import get_current_user
import json

router = APIRouter(prefix="/parent", tags=["Parent"])


def require_parent(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["parent", "admin"]:
        raise HTTPException(status_code=403, detail="Parent access required")
    return current_user


@router.post("/link-child")
def link_child(
    student_email: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Link a student account to this parent"""
    student = db.query(User).filter(User.email == student_email, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    existing = db.query(ParentStudentLink).filter(
        ParentStudentLink.parent_id == current_user.id,
        ParentStudentLink.student_id == student.id
    ).first()
    
    if existing:
        return {"status": "already_linked", "student_name": student.full_name}
    
    link = ParentStudentLink(
        parent_id=current_user.id,
        student_id=student.id,
        is_verified=True
    )
    db.add(link)
    db.commit()
    return {"status": "success", "student_name": student.full_name or student.username}


@router.get("/children")
def get_children(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Get all linked children"""
    links = db.query(ParentStudentLink).filter(
        ParentStudentLink.parent_id == current_user.id
    ).all()
    
    children = []
    for link in links:
        student = db.query(User).filter(User.id == link.student_id).first()
        if student:
            progress = db.query(Progress).filter(Progress.user_id == student.id).all()
            completed = len([p for p in progress if p.is_completed])
            confused = len([p for p in progress if p.is_confused])
            total = len(progress)
            
            children.append({
                "id": student.id,
                "name": student.full_name or student.username,
                "email": student.email,
                "total_topics": total,
                "completed": completed,
                "confused": confused,
                "progress_pct": round((completed / total * 100) if total > 0 else 0, 1),
                "xp_points": student.xp_points,
                "study_streak": student.study_streak,
                "last_study": student.last_study_date.isoformat() if student.last_study_date else None
            })
    
    return children


@router.get("/child/{student_id}/dashboard")
def get_child_dashboard(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Get detailed dashboard for a specific child"""
    # Verify parent-child link
    link = db.query(ParentStudentLink).filter(
        ParentStudentLink.parent_id == current_user.id,
        ParentStudentLink.student_id == student_id
    ).first()
    
    if not link:
        raise HTTPException(status_code=403, detail="Not authorized to view this student")
    
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    progress = db.query(Progress).filter(Progress.user_id == student_id).all()
    completed = len([p for p in progress if p.is_completed])
    confused_topics = [p.topic_name for p in progress if p.is_confused]
    total = len(progress)
    
    # Get onboarding profile if exists
    profile = db.query(OnboardingProfile).filter(OnboardingProfile.user_id == student_id).first()
    
    # Get upcoming tests
    upcoming_tests = db.query(TeacherTest).filter(
        TeacherTest.is_published == True,
        TeacherTest.scheduled_date != None
    ).all()
    
    return {
        "student": {
            "name": student.full_name or student.username,
            "email": student.email,
            "study_streak": student.study_streak,
            "xp_points": student.xp_points,
            "level": student.level
        },
        "progress": {
            "total_topics": total,
            "completed": completed,
            "confused": len(confused_topics),
            "progress_pct": round((completed / total * 100) if total > 0 else 0, 1),
            "weak_subjects": confused_topics[:5]
        },
        "ai_profile": {
            "confidence_score": profile.ai_confidence_score if profile else 50,
            "learning_speed": profile.ai_learning_speed if profile else "moderate",
            "study_hours": profile.study_hours_daily if profile else 0
        },
        "upcoming_tests": [{
            "title": t.title,
            "subject": t.subject,
            "date": t.scheduled_date.isoformat() if t.scheduled_date else None
        } for t in upcoming_tests[:5]],
        "ai_summary": f"{student.full_name or student.username} has completed {completed}/{total} topics with {student.study_streak} day study streak. {'Focus needed on: ' + ', '.join(confused_topics[:3]) if confused_topics else 'Great progress!'}"
    }


@router.get("/messages")
def get_parent_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Get notifications/messages for parent"""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()
    
    return [{
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "type": n.notification_type,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat()
    } for n in notifications]
