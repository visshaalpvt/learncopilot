from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Progress, QuizAttempt, CommunicationSession, PomodoroSession
from app.dependencies import get_current_user
from datetime import datetime, timedelta
from typing import List, Dict, Any

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
async def get_analytics_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns real statistics for the performance dashboard.
    Calculates metrics from progress, quiz attempts, and sessions.
    """
    
    # 1. Weekly Activity (last 7 days)
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    days = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        days.append(day)
    
    daily_activity = []
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    
    for day in days:
        day_end = day + timedelta(days=1)
        # Topics completed today
        topics_today = db.query(Progress).filter(
            Progress.user_id == current_user.id,
            Progress.last_activity >= day,
            Progress.last_activity < day_end,
            Progress.is_completed == True
        ).count()
        
        # Quizzes taken today
        quizzes_today = db.query(QuizAttempt).filter(
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.created_at >= day,
            QuizAttempt.created_at < day_end
        ).count()
        
        # Approximate minutes spent (Theory 45m/topic + Quiz 10m/quiz + Sessions)
        # We can also track time_spent_minutes if we had it in all models
        # For now, we estimate or use Pomodoro if available
        pomodoros = db.query(PomodoroSession).filter(
            PomodoroSession.user_id == current_user.id,
            PomodoroSession.completed_at >= day,
            PomodoroSession.completed_at < day_end,
            PomodoroSession.completed == True
        ).all()
        
        minutes = sum(p.duration_minutes for p in pomodoros)
        if minutes == 0: # If no pomodoros, estimate from activity
            minutes = (topics_today * 45) + (quizzes_today * 15)
            
        daily_activity.append({
            "day": day_names[day.weekday()],
            "minutes": minutes,
            "topics": topics_today + quizzes_today
        })
        
    # 2. Skill Data (Radar Chart)
    # Theory: Based on completed topics ratio
    all_progress = db.query(Progress).filter(Progress.user_id == current_user.id).all()
    theory_score = (len([p for p in all_progress if p.is_completed]) / len(all_progress) * 100) if all_progress else 0
    
    # Labs: Based on labs_attempted
    labs_total = sum(p.labs_attempted for p in all_progress)
    labs_score = min(labs_total * 10, 100) # Simple scaling
    
    # Quizzes: Average quiz accuracy
    quiz_attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id).all()
    quiz_score = (sum(1 for a in quiz_attempts if a.is_correct) / len(quiz_attempts) * 100) if quiz_attempts else 0
    
    # Consistency: Streak based
    consistency_score = min(current_user.study_streak * 20, 100)
    
    # Recall: Based on flashcards (if we have time) or just overall progress
    recall_score = (theory_score * 0.7 + quiz_score * 0.3)
    
    skill_data = [
        {"subject": "Theory", "A": round(theory_score), "fullMark": 100},
        {"subject": "Labs", "A": round(labs_score), "fullMark": 100},
        {"subject": "Quizzes", "A": round(quiz_score), "fullMark": 100},
        {"subject": "Consistency", "A": round(consistency_score), "fullMark": 100},
        {"subject": "Recall", "A": round(recall_score), "fullMark": 100},
    ]
    
    # 3. Time Distribution (Pie Chart)
    time_spent = {
        "Theory": len([p for p in all_progress if p.is_completed]) * 45,
        "Practical": labs_total * 30,
        "Exam Prep": len(quiz_attempts) * 20
    }
    
    pie_data = [
        {"name": "Theory", "value": time_spent["Theory"]},
        {"name": "Practical", "value": time_spent["Practical"]},
        {"name": "Exam Prep", "value": time_spent["Exam Prep"]},
    ]
    
    # 4. Total Metrics
    total_minutes = sum(time_spent.values())
    total_hours = total_minutes // 60
    
    # 5. Dynamic AI Insight
    from app.rag import llm_manager
    insight_text = "Keep uploading documents to see your personalized growth path!"
    focus_rec = "Upload your syllabus"
    
    if all_progress:
        weak_topics = [p.topic_name for p in all_progress if p.is_confused]
        completed = [p.topic_name for p in all_progress if p.is_completed]
        
        prompt = f"""
        Generate a short, professional AI insight for a student's dashboard.
        
        METRICS:
        - Completed Topics: {len(completed)}
        - Weak Topics: {weak_topics}
        - Total Topics Tracked: {len(all_progress)}
        - Quiz Accuracy: {quiz_score}%
        - Study Streak: {current_user.study_streak} days
        
        Provide:
        1. A concise overview of their progress.
        2. One specific recommendation (e.g., 'Focus on X', 'Try more practical labs for Y').
        
        Format as plain text, max 3 sentences.
        """
        
        try:
            res = await llm_manager.generate(prompt, temperature=0.7)
            insight_text = res.content.strip()
            
            # Extract a focus recommendation for the UI
            rec_prompt = f"Summarize the recommendation from this text in 3-5 words: '{insight_text}'"
            rec_res = await llm_manager.generate(rec_prompt, temperature=0.3)
            focus_rec = rec_res.content.strip().replace('"', '').replace('.', '')
        except:
            insight_text = f"Great progress on {completed[0] if completed else 'your courses'}! Focus on your weak areas to improve your mastery."
            focus_rec = "Review Weak Topics"

    return {
        "dailyActivity": daily_activity,
        "skillData": skill_data,
        "pieData": pie_data,
        "totalMinutes": total_minutes,
        "totalHours": total_hours,
        "studyStreak": current_user.study_streak,
        "topicsCompleted": len([p for p in all_progress if p.is_completed]),
        "totalTopics": len(all_progress),
        "ai_insight": insight_text,
        "focus_recommendation": focus_rec
    }
