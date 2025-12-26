from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Achievement, Progress, PomodoroSession
from app.dependencies import get_current_user
from datetime import datetime, timedelta
from typing import List, Dict

router = APIRouter(prefix="/gamification", tags=["Gamification"])

# Badge definitions
BADGES = {
    "first_steps": {
        "name": "First Steps",
        "description": "Complete your first topic",
        "xp": 50,
        "check": lambda db, user: db.query(Progress).filter(
            Progress.user_id == user.id,
            Progress.is_completed == True
        ).count() >= 1
    },
    "night_owl": {
        "name": "Night Owl",
        "description": "Study after 10 PM",
        "xp": 30,
        "check": lambda db, user: db.query(Progress).filter(
            Progress.user_id == user.id,
            func.strftime("%H", Progress.last_activity) >= "22"
        ).count() >= 1
    },
    "early_bird": {
        "name": "Early Bird",
        "description": "Study before 7 AM",
        "xp": 30,
        "check": lambda db, user: db.query(Progress).filter(
            Progress.user_id == user.id,
            func.strftime("%H", Progress.last_activity) < "07"
        ).count() >= 1
    },
    "streak_master": {
        "name": "Streak Master",
        "description": "Maintain a 7-day study streak",
        "xp": 100,
        "check": lambda db, user: user.study_streak >= 7
    },
    "practice_ninja": {
        "name": "Practice Ninja",
        "description": "Submit 10 lab attempts",
        "xp": 75,
        "check": lambda db, user: db.query(func.sum(Progress.labs_attempted)).filter(
            Progress.user_id == user.id
        ).scalar() or 0 >= 10
    },
    "theory_master": {
        "name": "Theory Master",
        "description": "Complete all topics in a unit",
        "xp": 150,
        "check": lambda db, user: db.query(Progress).filter(
            Progress.user_id == user.id,
            Progress.is_completed == True
        ).count() >= 5  # At least 5 topics completed
    },
    "exam_warrior": {
        "name": "Exam Warrior",
        "description": "Use exam prep features",
        "xp": 50,
        "check": lambda db, user: True  # Triggered by visiting exam prep page
    },
    "comeback_king": {
        "name": "Comeback King",
        "description": "Mark a confused topic as completed",
        "xp": 80,
        "check": lambda db, user: db.query(Progress).filter(
            Progress.user_id == user.id,
            Progress.is_confused == False,
            Progress.is_completed == True
        ).count() >= 1
    },
    "focused_learner": {
        "name": "Focused Learner",
        "description": "Complete 5 Pomodoro sessions",
        "xp": 60,
        "check": lambda db, user: db.query(PomodoroSession).filter(
            PomodoroSession.user_id == user.id,
            PomodoroSession.completed == True
        ).count() >= 5
    },
    "knowledge_seeker": {
        "name": "Knowledge Seeker",
        "description": "Learn 20 topics",
        "xp": 200,
        "check": lambda db, user: db.query(Progress).filter(
            Progress.user_id == user.id
        ).count() >= 20
    }
}

def calculate_level(xp: int) -> int:
    """Calculate level from XP (100 XP per level)"""
    return max(1, (xp // 100) + 1)

def award_xp(db: Session, user: User, xp_amount: int):
    """Award XP and update level"""
    user.xp_points += xp_amount
    user.level = calculate_level(user.xp_points)
    db.commit()

def check_and_award_badges(db: Session, user: User):
    """Check all badges and award new ones"""
    awarded_badges = []
    
    # Get already earned badges
    earned_badge_ids = {a.badge_id for a in user.achievements}
    
    for badge_id, badge_info in BADGES.items():
        if badge_id not in earned_badge_ids:
            # Check if user qualifies for this badge
            if badge_info["check"](db, user):
                # Award badge
                new_achievement = Achievement(
                    user_id=user.id,
                    badge_id=badge_id,
                    badge_name=badge_info["name"],
                    description=badge_info["description"]
                )
                db.add(new_achievement)
                
                # Award XP
                award_xp(db, user, badge_info["xp"])
                
                awarded_badges.append({
                    "badge_id": badge_id,
                    "badge_name": badge_info["name"],
                    "description": badge_info["description"],
                    "xp": badge_info["xp"]
                })
    
    db.commit()
    return awarded_badges

@router.get("/stats")
def get_gamification_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's gamification stats"""
    achievements_count = len(current_user.achievements)
    total_badges = len(BADGES)
    
    xp_to_next_level = ((current_user.level) * 100) - current_user.xp_points
    
    return {
        "xp_points": current_user.xp_points,
        "level": current_user.level,
        "study_streak": current_user.study_streak,
        "achievements_count": achievements_count,
        "total_badges": total_badges,
        "xp_to_next_level": xp_to_next_level,
        "level_progress_percentage": ((current_user.xp_points % 100) / 100) * 100
    }

@router.get("/achievements")
def get_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all achievements (earned and locked)"""
    earned_badge_ids = {a.badge_id for a in current_user.achievements}
    
    all_badges = []
    for badge_id, badge_info in BADGES.items():
        earned = badge_id in earned_badge_ids
        earned_date = None
        
        if earned:
            achievement = next((a for a in current_user.achievements if a.badge_id == badge_id), None)
            earned_date = achievement.earned_at.isoformat() if achievement else None
        
        all_badges.append({
            "badge_id": badge_id,
            "badge_name": badge_info["name"],
            "description": badge_info["description"],
            "xp": badge_info["xp"],
            "earned": earned,
            "earned_at": earned_date
        })
    
    return all_badges

@router.post("/check-badges")
def check_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check and award new badges"""
    new_badges = check_and_award_badges(db, current_user)
    
    return {
        "new_badges": new_badges,
        "total_xp": current_user.xp_points,
        "current_level": current_user.level
    }

@router.post("/award-xp/{xp_amount}")
def award_xp_endpoint(
    xp_amount: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually award XP (called by other endpoints)"""
    old_level = current_user.level
    award_xp(db, current_user, xp_amount)
    new_level = current_user.level
    
    level_up = new_level > old_level
    
    return {
        "xp_awarded": xp_amount,
        "total_xp": current_user.xp_points,
        "current_level": current_user.level,
        "level_up": level_up
    }

@router.post("/update-streak")
def update_study_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update study streak (called daily on first activity)"""
    today = datetime.utcnow().date()
    
    if current_user.last_study_date:
        last_study = current_user.last_study_date.date()
        days_diff = (today - last_study).days
        
        if days_diff == 0:
            # Already studied today
            return {"streak": current_user.study_streak}
        elif days_diff == 1:
            # Consecutive day
            current_user.study_streak += 1
        else:
            # Streak broken
            current_user.study_streak = 1
    else:
        # First time
        current_user.study_streak = 1
    
    current_user.last_study_date = datetime.utcnow()
    db.commit()
    
    return {"streak": current_user.study_streak}

@router.get("/leaderboard")
def get_personal_leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get personal leaderboard (user vs their best)"""
    # Get this week's progress
    week_ago = datetime.utcnow() - timedelta(days=7)
    this_week_topics = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.last_activity >= week_ago,
        Progress.is_completed == True
    ).count()
    
    # Calculate best week (all-time)
    all_progress = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.is_completed == True
    ).all()
    
    # Simple best week calculation
    best_week = max(this_week_topics, 5)  # Assume 5 as default best
    
    return {
        "this_week": {
            "topics_completed": this_week_topics,
            "xp_earned": this_week_topics * 10
        },
        "best_week": {
            "topics_completed": best_week,
            "xp_earned": best_week * 10
        },
        "monthly_achievements": len([a for a in current_user.achievements if 
                                    (datetime.utcnow() - a.earned_at).days <= 30])
    }
