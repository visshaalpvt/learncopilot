"""
Teacher Dashboard API — Test creation, student management, analytics
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.database import get_db
from app.models import User, TeacherTest, Assignment, Progress, Notification, Syllabus
from app.dependencies import get_current_user
import json

router = APIRouter(prefix="/teacher", tags=["Teacher"])


def require_teacher(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Teacher access required")
    return current_user


# ── Test Management ──────────────────────────────────────────────

class TestCreate(BaseModel):
    title: str
    subject: str
    description: Optional[str] = None
    questions: List[dict]
    total_marks: int = 100
    duration_minutes: int = 60
    scheduled_date: Optional[str] = None


@router.post("/tests/create")
def create_test(
    data: TestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Create a new test"""
    scheduled = None
    if data.scheduled_date:
        scheduled = datetime.fromisoformat(data.scheduled_date)
    
    test = TeacherTest(
        creator_id=current_user.id,
        title=data.title,
        subject=data.subject,
        description=data.description,
        questions_json=json.dumps(data.questions),
        total_marks=data.total_marks,
        duration_minutes=data.duration_minutes,
        scheduled_date=scheduled,
        is_published=False
    )
    db.add(test)
    db.commit()
    db.refresh(test)
    
    return {"status": "success", "test_id": test.id, "title": test.title}


@router.get("/tests")
def list_tests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """List all tests created by this teacher"""
    tests = db.query(TeacherTest).filter(
        TeacherTest.creator_id == current_user.id
    ).order_by(TeacherTest.created_at.desc()).all()
    
    return [{
        "id": t.id,
        "title": t.title,
        "subject": t.subject,
        "total_marks": t.total_marks,
        "duration_minutes": t.duration_minutes,
        "scheduled_date": t.scheduled_date.isoformat() if t.scheduled_date else None,
        "is_published": t.is_published,
        "question_count": len(json.loads(t.questions_json)) if t.questions_json else 0,
        "created_at": t.created_at.isoformat()
    } for t in tests]


@router.post("/tests/{test_id}/publish")
def publish_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Publish a test and notify students"""
    test = db.query(TeacherTest).filter(
        TeacherTest.id == test_id,
        TeacherTest.creator_id == current_user.id
    ).first()
    
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    test.is_published = True
    
    # Notify all students
    students = db.query(User).filter(User.role == "student").all()
    for student in students:
        notif = Notification(
            user_id=student.id,
            title=f"New Test: {test.title}",
            message=f"A new {test.subject} test has been scheduled by {current_user.full_name or current_user.username}.",
            notification_type="test",
            sender_id=current_user.id,
            link="/app/exam-prep"
        )
        db.add(notif)
    
    # Notify parents too
    parents = db.query(User).filter(User.role == "parent").all()
    for parent in parents:
        notif = Notification(
            user_id=parent.id,
            title=f"Upcoming Test: {test.title}",
            message=f"A {test.subject} test has been scheduled for students.",
            notification_type="test",
            sender_id=current_user.id
        )
        db.add(notif)
    
    db.commit()
    return {"status": "success", "notified_students": len(students), "notified_parents": len(parents)}


# ── Assignment Management ────────────────────────────────────────

class AssignmentCreate(BaseModel):
    title: str
    subject: str
    description: str
    deadline: str
    max_marks: int = 100


@router.post("/assignments/create")
def create_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Create a new assignment"""
    assignment = Assignment(
        creator_id=current_user.id,
        title=data.title,
        subject=data.subject,
        description=data.description,
        deadline=datetime.fromisoformat(data.deadline),
        max_marks=data.max_marks,
        is_published=True
    )
    db.add(assignment)
    
    # Notify students
    students = db.query(User).filter(User.role == "student").all()
    for student in students:
        notif = Notification(
            user_id=student.id,
            title=f"New Assignment: {data.title}",
            message=f"{data.subject} - Due: {data.deadline}",
            notification_type="assignment",
            sender_id=current_user.id
        )
        db.add(notif)
    
    db.commit()
    return {"status": "success", "assignment_id": assignment.id}


@router.get("/assignments")
def list_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """List all assignments"""
    assignments = db.query(Assignment).filter(
        Assignment.creator_id == current_user.id
    ).order_by(Assignment.created_at.desc()).all()
    
    return [{
        "id": a.id,
        "title": a.title,
        "subject": a.subject,
        "description": a.description,
        "deadline": a.deadline.isoformat() if a.deadline else None,
        "max_marks": a.max_marks,
        "submissions": len(json.loads(a.submissions_json)) if a.submissions_json else 0,
        "created_at": a.created_at.isoformat()
    } for a in assignments]


# ── Student Analytics ────────────────────────────────────────────

@router.get("/students")
def list_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Get all students with their progress"""
    students = db.query(User).filter(User.role == "student").all()
    
    result = []
    for s in students:
        progress = db.query(Progress).filter(Progress.user_id == s.id).all()
        completed = len([p for p in progress if p.is_completed])
        confused = len([p for p in progress if p.is_confused])
        total = len(progress)
        
        result.append({
            "id": s.id,
            "username": s.username,
            "full_name": s.full_name,
            "email": s.email,
            "total_topics": total,
            "completed": completed,
            "confused": confused,
            "progress_pct": round((completed / total * 100) if total > 0 else 0, 1),
            "xp_points": s.xp_points,
            "study_streak": s.study_streak,
            "is_weak": confused > completed
        })
    
    return result


@router.get("/class-analytics")
def class_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Get overall class performance analytics"""
    students = db.query(User).filter(User.role == "student").all()
    all_progress = db.query(Progress).all()
    
    total_students = len(students)
    total_topics = len(set(p.topic_id for p in all_progress))
    avg_completion = 0
    weak_students = 0
    
    if total_students > 0:
        completions = []
        for s in students:
            sp = [p for p in all_progress if p.user_id == s.id]
            completed = len([p for p in sp if p.is_completed])
            total = len(sp)
            pct = (completed / total * 100) if total > 0 else 0
            completions.append(pct)
            if pct < 30:
                weak_students += 1
        avg_completion = sum(completions) / len(completions) if completions else 0
    
    return {
        "total_students": total_students,
        "total_topics": total_topics,
        "avg_completion": round(avg_completion, 1),
        "weak_students": weak_students,
        "total_tests": db.query(TeacherTest).filter(TeacherTest.creator_id == current_user.id).count(),
        "total_assignments": db.query(Assignment).filter(Assignment.creator_id == current_user.id).count()
    }


@router.post("/generate-lesson-plan")
async def generate_lesson_plan(
    subject: str,
    topic: str,
    duration_minutes: int = 45,
    current_user: User = Depends(require_teacher)
):
    """AI-generated lesson plan"""
    try:
        from app.rag.llm_manager import llm_manager
        response = await llm_manager.generate(
            prompt=f"Create a detailed {duration_minutes}-minute lesson plan for teaching '{topic}' in {subject}. Include: objectives, introduction (5 min), main content with activities, assessment, and homework.",
            system_prompt="You are an experienced education consultant. Create structured, practical lesson plans.",
            temperature=0.7
        )
        return {"lesson_plan": response.content, "subject": subject, "topic": topic}
    except Exception:
        return {
            "lesson_plan": f"## Lesson Plan: {topic}\n\n**Subject:** {subject}\n**Duration:** {duration_minutes} minutes\n\n### Objectives\n- Understand core concepts of {topic}\n- Apply knowledge through practice\n\n### Activities\n1. Introduction (5 min)\n2. Concept explanation (15 min)\n3. Interactive exercise (15 min)\n4. Q&A and assessment (10 min)\n\n### Homework\n- Practice problems on {topic}",
            "subject": subject,
            "topic": topic
        }
