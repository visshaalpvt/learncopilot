"""
==============================================================================
MASTERY TRACKING ROUTER - Knowledge Tracing System
==============================================================================

Implements lightweight mastery model per topic:
- Track accuracy, attempts, time taken
- Update mastery score after each quiz/question
- Spaced revision scheduling using SM-2 algorithm
- Adaptive difficulty based on performance

Author: LearnCopilot Team
==============================================================================
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import math

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, MasteryScore, QuizAttempt, Progress

router = APIRouter(
    prefix="/mastery",
    tags=["Mastery Tracking"],
    dependencies=[Depends(get_current_user)]
)

# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class QuizAttemptCreate(BaseModel):
    topic_id: str
    topic_name: str
    subject: Optional[str] = None
    question_text: str
    question_type: str  # mcq, numerical, conceptual
    difficulty: str  # easy, medium, hard
    user_answer: Optional[str] = None
    correct_answer: str
    is_correct: bool
    time_taken_seconds: int = 0
    source_document: Optional[str] = None
    source_page: Optional[str] = None


class MasteryUpdate(BaseModel):
    topic_id: str
    topic_name: str
    subject: Optional[str] = None
    is_correct: bool
    time_taken_seconds: int = 0


class MasteryResponse(BaseModel):
    topic_id: str
    topic_name: str
    mastery_score: float
    accuracy: float
    total_attempts: int
    current_difficulty: str
    next_review_date: Optional[datetime]
    status: str  # weak, learning, strong, mastered


class TopicMasteryDashboard(BaseModel):
    total_topics: int
    mastered_count: int
    strong_count: int
    learning_count: int
    weak_count: int
    overall_mastery: float
    topics: List[MasteryResponse]
    due_for_review: List[MasteryResponse]
    weak_areas: List[MasteryResponse]


# =============================================================================
# SM-2 SPACED REPETITION ALGORITHM
# =============================================================================

def calculate_sm2(
    ease_factor: float,
    interval: int,
    repetitions: int,
    quality: int  # 0-5 where 3+ is correct
) -> tuple:
    """
    SM-2 Algorithm for spaced repetition.
    
    Args:
        ease_factor: Current ease factor (default 2.5)
        interval: Current interval in days
        repetitions: Consecutive correct answers
        quality: Response quality (0-5)
        
    Returns:
        (new_ease_factor, new_interval, new_repetitions)
    """
    # Quality grades:
    # 0 - Complete blackout
    # 1 - Wrong answer with hint
    # 2 - Wrong answer but remembered after
    # 3 - Correct with difficulty
    # 4 - Correct with hesitation
    # 5 - Perfect response
    
    if quality >= 3:
        # Correct response
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 6
        else:
            new_interval = round(interval * ease_factor)
        
        new_repetitions = repetitions + 1
    else:
        # Incorrect response - reset
        new_interval = 1
        new_repetitions = 0
    
    # Update ease factor
    new_ef = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ef = max(1.3, new_ef)  # Minimum EF is 1.3
    
    return (new_ef, new_interval, new_repetitions)


def get_mastery_status(score: float) -> str:
    """Convert mastery score to status label."""
    if score >= 90:
        return "mastered"
    elif score >= 70:
        return "strong"
    elif score >= 40:
        return "learning"
    else:
        return "weak"


def get_adaptive_difficulty(mastery: MasteryScore) -> str:
    """Determine next question difficulty based on performance."""
    if mastery.consecutive_correct >= 3:
        # Increase difficulty
        if mastery.current_difficulty == "easy":
            return "medium"
        elif mastery.current_difficulty == "medium":
            return "hard"
        return "hard"
    elif mastery.consecutive_incorrect >= 2:
        # Decrease difficulty
        if mastery.current_difficulty == "hard":
            return "medium"
        elif mastery.current_difficulty == "medium":
            return "easy"
        return "easy"
    return mastery.current_difficulty


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/record-attempt", response_model=MasteryResponse)
async def record_quiz_attempt(
    attempt: QuizAttemptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Record a quiz/question attempt and update mastery score.
    
    This is called after each question answered. It:
    1. Records the attempt in quiz_attempts table
    2. Updates the mastery_scores table
    3. Calculates new spaced revision schedule
    4. Returns updated mastery status
    """
    
    # 1. Record the attempt
    quiz_attempt = QuizAttempt(
        user_id=current_user.id,
        topic_id=attempt.topic_id,
        topic_name=attempt.topic_name,
        subject=attempt.subject,
        question_text=attempt.question_text,
        question_type=attempt.question_type,
        difficulty=attempt.difficulty,
        user_answer=attempt.user_answer,
        correct_answer=attempt.correct_answer,
        is_correct=attempt.is_correct,
        time_taken_seconds=attempt.time_taken_seconds,
        source_document=attempt.source_document,
        source_page=attempt.source_page
    )
    db.add(quiz_attempt)
    
    # 2. Get or create mastery record
    mastery = db.query(MasteryScore).filter(
        MasteryScore.user_id == current_user.id,
        MasteryScore.topic_id == attempt.topic_id
    ).first()
    
    if not mastery:
        mastery = MasteryScore(
            user_id=current_user.id,
            topic_id=attempt.topic_id,
            topic_name=attempt.topic_name,
            subject=attempt.subject
        )
        db.add(mastery)
        db.flush()
    
    # 3. Update mastery metrics
    mastery.total_attempts += 1
    mastery.total_time_seconds += attempt.time_taken_seconds
    
    if attempt.is_correct:
        mastery.correct_attempts += 1
        mastery.consecutive_correct += 1
        mastery.consecutive_incorrect = 0
        quality = 4  # Correct response for SM-2
    else:
        mastery.consecutive_incorrect += 1
        mastery.consecutive_correct = 0
        quality = 1  # Incorrect response for SM-2
    
    # Calculate accuracy
    mastery.accuracy = (mastery.correct_attempts / mastery.total_attempts) * 100
    
    # 4. Calculate mastery score (weighted formula)
    # Factors: accuracy (60%), consistency (20%), recency (20%)
    accuracy_component = mastery.accuracy * 0.6
    
    # Consistency bonus for consecutive correct
    consistency_bonus = min(mastery.consecutive_correct * 5, 20)
    
    # Base mastery from attempts (diminishing returns)
    attempt_factor = min(mastery.total_attempts / 10, 1.0) * 20
    
    mastery.mastery_score = min(100, accuracy_component + consistency_bonus + attempt_factor)
    
    # 5. Update spaced revision using SM-2
    new_ef, new_interval, _ = calculate_sm2(
        mastery.ease_factor,
        mastery.review_interval_days,
        mastery.consecutive_correct,
        quality
    )
    
    mastery.ease_factor = new_ef
    mastery.review_interval_days = new_interval
    mastery.last_reviewed = datetime.utcnow()
    mastery.next_review_date = datetime.utcnow() + timedelta(days=new_interval)
    
    # 6. Update adaptive difficulty
    mastery.current_difficulty = get_adaptive_difficulty(mastery)
    
    db.commit()
    db.refresh(mastery)
    
    return MasteryResponse(
        topic_id=mastery.topic_id,
        topic_name=mastery.topic_name,
        mastery_score=round(mastery.mastery_score, 1),
        accuracy=round(mastery.accuracy, 1),
        total_attempts=mastery.total_attempts,
        current_difficulty=mastery.current_difficulty,
        next_review_date=mastery.next_review_date,
        status=get_mastery_status(mastery.mastery_score)
    )


@router.get("/dashboard", response_model=TopicMasteryDashboard)
async def get_mastery_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive mastery dashboard.
    
    Returns:
    - Overall statistics
    - Per-topic mastery breakdown
    - Topics due for review
    - Weak areas that need attention
    """
    
    masteries = db.query(MasteryScore).filter(
        MasteryScore.user_id == current_user.id
    ).all()
    
    topics = []
    mastered = 0
    strong = 0
    learning = 0
    weak = 0
    due_for_review = []
    weak_areas = []
    
    now = datetime.utcnow()
    
    for m in masteries:
        status = get_mastery_status(m.mastery_score)
        
        topic_response = MasteryResponse(
            topic_id=m.topic_id,
            topic_name=m.topic_name,
            mastery_score=round(m.mastery_score, 1),
            accuracy=round(m.accuracy, 1),
            total_attempts=m.total_attempts,
            current_difficulty=m.current_difficulty,
            next_review_date=m.next_review_date,
            status=status
        )
        
        topics.append(topic_response)
        
        # Count by status
        if status == "mastered":
            mastered += 1
        elif status == "strong":
            strong += 1
        elif status == "learning":
            learning += 1
        else:
            weak += 1
            weak_areas.append(topic_response)
        
        # Check if due for review
        if m.next_review_date and m.next_review_date <= now:
            due_for_review.append(topic_response)
    
    total = len(topics)
    overall_mastery = sum(t.mastery_score for t in topics) / total if total > 0 else 0
    
    return TopicMasteryDashboard(
        total_topics=total,
        mastered_count=mastered,
        strong_count=strong,
        learning_count=learning,
        weak_count=weak,
        overall_mastery=round(overall_mastery, 1),
        topics=sorted(topics, key=lambda x: x.mastery_score, reverse=True),
        due_for_review=due_for_review[:5],  # Top 5 due
        weak_areas=weak_areas[:5]  # Top 5 weak
    )


@router.get("/topic/{topic_id}")
async def get_topic_mastery(
    topic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed mastery for a specific topic."""
    
    mastery = db.query(MasteryScore).filter(
        MasteryScore.user_id == current_user.id,
        MasteryScore.topic_id == topic_id
    ).first()
    
    if not mastery:
        return {
            "topic_id": topic_id,
            "mastery_score": 0,
            "accuracy": 0,
            "total_attempts": 0,
            "current_difficulty": "medium",
            "status": "not_started",
            "message": "No attempts recorded for this topic yet"
        }
    
    # Get recent attempts
    recent_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.topic_id == topic_id
    ).order_by(QuizAttempt.created_at.desc()).limit(10).all()
    
    return {
        "topic_id": mastery.topic_id,
        "topic_name": mastery.topic_name,
        "mastery_score": round(mastery.mastery_score, 1),
        "accuracy": round(mastery.accuracy, 1),
        "total_attempts": mastery.total_attempts,
        "correct_attempts": mastery.correct_attempts,
        "total_time_seconds": mastery.total_time_seconds,
        "average_time_per_question": round(mastery.total_time_seconds / mastery.total_attempts, 1) if mastery.total_attempts > 0 else 0,
        "current_difficulty": mastery.current_difficulty,
        "next_review_date": mastery.next_review_date,
        "status": get_mastery_status(mastery.mastery_score),
        "consecutive_correct": mastery.consecutive_correct,
        "recent_attempts": [
            {
                "question_type": a.question_type,
                "difficulty": a.difficulty,
                "is_correct": a.is_correct,
                "time_taken_seconds": a.time_taken_seconds,
                "created_at": a.created_at
            }
            for a in recent_attempts
        ]
    }


@router.get("/recommended-difficulty/{topic_id}")
async def get_recommended_difficulty(
    topic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get recommended question difficulty for a topic.
    Used by quiz generator for adaptive difficulty.
    """
    
    mastery = db.query(MasteryScore).filter(
        MasteryScore.user_id == current_user.id,
        MasteryScore.topic_id == topic_id
    ).first()
    
    if not mastery:
        return {
            "topic_id": topic_id,
            "recommended_difficulty": "medium",
            "reason": "First attempt - starting with medium difficulty"
        }
    
    difficulty = get_adaptive_difficulty(mastery)
    
    reasons = {
        "easy": f"Struggling with this topic (accuracy: {round(mastery.accuracy, 1)}%). Starting with easier questions.",
        "medium": f"Progressing well (accuracy: {round(mastery.accuracy, 1)}%). Maintaining medium difficulty.",
        "hard": f"Strong performance (accuracy: {round(mastery.accuracy, 1)}%). Challenging with harder questions."
    }
    
    return {
        "topic_id": topic_id,
        "recommended_difficulty": difficulty,
        "mastery_score": round(mastery.mastery_score, 1),
        "accuracy": round(mastery.accuracy, 1),
        "reason": reasons[difficulty]
    }


@router.get("/revision-queue")
async def get_revision_queue(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get topics due for spaced revision.
    Ordered by urgency (most overdue first).
    """
    
    now = datetime.utcnow()
    
    due_topics = db.query(MasteryScore).filter(
        MasteryScore.user_id == current_user.id,
        MasteryScore.next_review_date <= now
    ).order_by(MasteryScore.next_review_date.asc()).limit(limit).all()
    
    return {
        "count": len(due_topics),
        "topics": [
            {
                "topic_id": m.topic_id,
                "topic_name": m.topic_name,
                "mastery_score": round(m.mastery_score, 1),
                "last_reviewed": m.last_reviewed,
                "due_date": m.next_review_date,
                "days_overdue": (now - m.next_review_date).days if m.next_review_date else 0,
                "status": get_mastery_status(m.mastery_score)
            }
            for m in due_topics
        ]
    }


@router.post("/reset-topic/{topic_id}")
async def reset_topic_mastery(
    topic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reset mastery for a specific topic (start fresh)."""
    
    mastery = db.query(MasteryScore).filter(
        MasteryScore.user_id == current_user.id,
        MasteryScore.topic_id == topic_id
    ).first()
    
    if mastery:
        mastery.mastery_score = 0
        mastery.accuracy = 0
        mastery.total_attempts = 0
        mastery.correct_attempts = 0
        mastery.total_time_seconds = 0
        mastery.consecutive_correct = 0
        mastery.consecutive_incorrect = 0
        mastery.current_difficulty = "medium"
        mastery.ease_factor = 2.5
        mastery.review_interval_days = 1
        mastery.next_review_date = None
        mastery.last_reviewed = None
        
        db.commit()
        
        return {"message": f"Mastery reset for topic: {topic_id}", "success": True}
    
    return {"message": "Topic not found", "success": False}
