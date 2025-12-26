from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Progress, Flashcard
from app.dependencies import get_current_user
from datetime import datetime, timedelta

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.get("/what-to-study-next")
def get_study_recommendation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Smart recommendation on what to study next"""
    all_progress = db.query(Progress).filter(
        Progress.user_id == current_user.id
    ).all()
    
    if not all_progress:
        return {
            "recommendation": "Start by uploading your syllabus",
            "reason": "No topics found",
            "action": "Upload Syllabus",
            "priority": "HIGH"
        }
    
    # Priority 1: Confused topics
    confused_topics = [p for p in all_progress if p.is_confused and not p.is_completed]
    if confused_topics:
        topic = confused_topics[0]
        return {
            "recommendation": f"Review {topic.topic_name}",
            "reason": "You marked this as confusing - let's master it!",
            "topic_id": topic.topic_id,
            "topic_name": topic.topic_name,
            "action": "Start Learning",
            "priority": "HIGH",
            "type": "weak_area"
        }
    
    # Priority 2: Old topics needing revision (7+ days)
    old_topics = [p for p in all_progress if p.is_completed and 
                  (datetime.utcnow() - p.last_activity).days >= 7]
    if old_topics:
        topic = sorted(old_topics, key=lambda x: x.last_activity)[0]
        days_ago = (datetime.utcnow() - topic.last_activity).days
        return {
            "recommendation": f"Revise {topic.topic_name}",
            "reason": f"Last studied {days_ago} days ago - time to reinforce!",
            "topic_id": topic.topic_id,
            "topic_name": topic.topic_name,
            "action": "Start Revision",
            "priority": "MEDIUM",
            "type": "revision"
        }
    
    # Priority 3: Incomplete topics
    incomplete = [p for p in all_progress if not p.is_completed]
    if incomplete:
        topic = incomplete[0]
        return {
            "recommendation": f"Continue {topic.topic_name}",
            "reason": "You started this topic - let's finish it!",
            "topic_id": topic.topic_id,
            "topic_name": topic.topic_name,
            "action": "Continue Learning",
            "priority": "MEDIUM",
            "type": "incomplete"
        }
    
    # Priority 4: Practice labs
    low_practice = [p for p in all_progress if p.labs_attempted < 3]
    if low_practice:
        topic = low_practice[0]
        return {
            "recommendation": f"Practice {topic.topic_name}",
            "reason": "Hands-on coding will strengthen your understanding",
            "topic_id": topic.topic_id,
            "topic_name": topic.topic_name,
            "action": "Start Coding",
            "priority": "LOW",
            "type": "practice"
        }
    
    return {
        "recommendation": "Great job! You're doing well",
        "reason": "All topics covered - maintain your streak!",
        "action": "Explore More",
        "priority": "LOW",
        "type": "completed"
    }

@router.get("/predicted-score")
def get_predicted_exam_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculate predicted exam score based on progress"""
    all_progress = db.query(Progress).filter(
        Progress.user_id == current_user.id
    ).all()
    
    if not all_progress:
        return {
            "predicted_score": 0,
            "confidence": "LOW",
            "breakdown": {
                "completion_contribution": 0,
                "practice_contribution": 0,
                "revision_contribution": 0
            }
        }
    
    # Formula: Completion% * 0.4 + Lab Confidence * 0.3 + Revision Frequency * 0.3
    total_topics = len(all_progress)
    completed_topics = len([p for p in all_progress if p.is_completed])
    completion_rate = (completed_topics / total_topics) if total_topics > 0 else 0
    
    # Lab confidence (based on attempts)
    total_labs = sum([p.labs_attempted for p in all_progress])
    lab_confidence = min(1.0, total_labs / (total_topics * 3))  # 3 attempts per topic is ideal
    
    # Revision frequency (topics revised in last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    revised_count = len([p for p in all_progress if p.last_activity >= week_ago])
    revision_rate = (revised_count / total_topics) if total_topics > 0 else 0
    
    # Calculate predicted score (out of 100)
    predicted_score = (completion_rate * 40) + (lab_confidence * 30) + (revision_rate * 30)
    
    # Determine confidence level
    if predicted_score >= 75:
        confidence = "HIGH"
    elif predicted_score >= 50:
        confidence = "MEDIUM"
    else:
        confidence = "LOW"
    
    return {
        "predicted_score": round(predicted_score, 1),
        "confidence": confidence,
        "breakdown": {
            "completion_contribution": round(completion_rate * 40, 1),
            "practice_contribution": round(lab_confidence * 30, 1),
            "revision_contribution": round(revision_rate * 30, 1)
        },
        "total_topics": total_topics,
        "completed_topics": completed_topics,
        "completion_percentage": round(completion_rate * 100, 1)
    }

@router.get("/learning-patterns")
def get_learning_patterns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze learning patterns (best time to study, etc.)"""
    all_progress = db.query(Progress).filter(
        Progress.user_id == current_user.id
    ).all()
    
    if not all_progress:
        return {
            "best_time": "Not enough data",
            "most_productive_day": "Not enough data",
            "average_session_duration": 0
        }
    
    # Analyze study times
    hour_counts = {}
    for progress in all_progress:
        hour = progress.last_activity.hour
        hour_counts[hour] = hour_counts.get(hour, 0) + 1
    
    best_hour = max(hour_counts, key=hour_counts.get) if hour_counts else 12
    
    if best_hour < 6:
        best_time = "Late Night (After Midnight)"
    elif best_hour < 12:
        best_time = "Morning"
    elif best_hour < 18:
        best_time = "Afternoon"
    else:
        best_time = "Evening"
    
    # Analyze days of week
    day_counts = {}
    for progress in all_progress:
        day = progress.last_activity.strftime("%A")
        day_counts[day] = day_counts.get(day, 0) + 1
    
    most_productive_day = max(day_counts, key=day_counts.get) if day_counts else "Monday"
    
    # Calculate average time spent
    avg_time = sum([p.time_spent_minutes for p in all_progress]) / len(all_progress) if all_progress else 0
    
    return {
        "best_time": best_time,
        "best_hour": best_hour,
        "most_productive_day": most_productive_day,
        "average_session_minutes": round(avg_time, 1),
        "total_study_sessions": len(all_progress),
        "insights": [
            f"You're most productive during {best_time}",
            f"{most_productive_day} is your best day for learning",
            f"Average study session: {round(avg_time, 0)} minutes"
        ]
    }

@router.get("/flashcard-reminder")
def get_flashcard_reminder(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get flashcard review reminder"""
    due_cards = db.query(Flashcard).filter(
        Flashcard.user_id == current_user.id,
        Flashcard.next_review_date <= datetime.utcnow()
    ).count()
    
    if due_cards == 0:
        return {
            "has_due_cards": False,
            "message": "No flashcards due today. Great job!",
            "due_count": 0
        }
    
    return {
        "has_due_cards": True,
        "message": f"You have {due_cards} flashcard{'s' if due_cards != 1 else ''} due for review",
        "due_count": due_cards,
        "priority": "HIGH" if due_cards > 10 else "MEDIUM"
    }

@router.get("/smart-insights")
def get_smart_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get personalized AI-like insights"""
    all_progress = db.query(Progress).filter(
        Progress.user_id == current_user.id
    ).all()
    
    insights = []
    
    # Insight 1: Progress-based
    total = len(all_progress) if all_progress else 0
    completed = len([p for p in all_progress if p.is_completed])
    
    if total > 0:
        percentage = (completed / total) * 100
        if percentage >= 80:
            insights.append(f"🎉 Amazing! You've completed {percentage:.0f}% of your topics!")
        elif percentage >= 50:
            insights.append(f"💪 Great progress! {percentage:.0f}% complete. Keep going!")
        else:
            insights.append(f"📚 You're {percentage:.0f}% through. Let's pick up the pace!")
    
    # Insight 2: Streak-based
    if current_user.study_streak >= 7:
        insights.append(f"🔥 Incredible {current_user.study_streak}-day streak! You're unstoppable!")
    elif current_user.study_streak >= 3:
        insights.append(f"⭐ {current_user.study_streak}-day streak going! Don't break it!")
    
    # Insight 3: Weak areas
    confused = [p for p in all_progress if p.is_confused]
    if confused:
        insights.append(f"⚠️ {len(confused)} topic{'s need' if len(confused) != 1 else ' needs'} your attention. Let's tackle them!")
    
    # Insight 4: Practice recommendation
    low_practice = [p for p in all_progress if p.labs_attempted < 2]
    if len(low_practice) > 5:
        insights.append("💻 More hands-on practice will boost your confidence!")
    
    return {
        "insights": insights if insights else ["Start learning to see personalized insights!"],
        "motivation": "Every topic you master brings you closer to your goals! 🚀"
    }
