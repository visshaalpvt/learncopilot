from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Gamification fields
    xp_points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    study_streak = Column(Integer, default=0)
    last_study_date = Column(DateTime, nullable=True)
    
    syllabi = relationship("Syllabus", back_populates="user")
    progress_records = relationship("Progress", back_populates="user")
    achievements = relationship("Achievement", back_populates="user")
    flashcards = relationship("Flashcard", back_populates="user")
    pomodoro_sessions = relationship("PomodoroSession", back_populates="user")
    notes = relationship("Note", back_populates="user")
    study_plans = relationship("StudyPlan", back_populates="user")
    daily_missions = relationship("DailyMission", back_populates="user")

class Syllabus(Base):
    __tablename__ = "syllabi"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject_name = Column(String)
    raw_content = Column(Text)
    parsed_data = Column(Text)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="syllabi")

class Progress(Base):
    __tablename__ = "progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic_id = Column(String)
    topic_name = Column(String)
    is_completed = Column(Boolean, default=False)
    is_confused = Column(Boolean, default=False)
    labs_attempted = Column(Integer, default=0)
    last_activity = Column(DateTime, default=datetime.utcnow)
    time_spent_minutes = Column(Integer, default=0)  # Track time spent
    
    user = relationship("User", back_populates="progress_records")

class Achievement(Base):
    """Gamification: Badges and achievements"""
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    badge_id = Column(String)  # e.g., "first_steps", "night_owl"
    badge_name = Column(String)
    description = Column(String)
    earned_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="achievements")

class Flashcard(Base):
    """Spaced Repetition System (SM-2 Algorithm)"""
    __tablename__ = "flashcards"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic_id = Column(String)
    topic_name = Column(String)
    question = Column(Text)
    answer = Column(Text)
    
    # SM-2 Algorithm fields
    ease_factor = Column(Float, default=2.5)  # Starting EF
    interval = Column(Integer, default=1)  # Days until next review
    repetitions = Column(Integer, default=0)  # Consecutive correct answers
    next_review_date = Column(DateTime, default=datetime.utcnow)
    last_reviewed = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="flashcards")

class PomodoroSession(Base):
    """Focus Mode & Pomodoro Tracking"""
    __tablename__ = "pomodoro_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic_id = Column(String, nullable=True)
    topic_name = Column(String, nullable=True)
    duration_minutes = Column(Integer, default=25)
    completed = Column(Boolean, default=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="pomodoro_sessions")

class Note(Base):
    """Note-taking system per topic"""
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic_id = Column(String)
    topic_name = Column(String)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="notes")

class StudyPlan(Base):
    """Smart study plan generator"""
    __tablename__ = "study_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exam_name = Column(String)
    exam_date = Column(DateTime)
    topics_json = Column(Text)  # JSON array of topics with dates
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="study_plans")

class DailyMission(Base):
    """Daily missions for engagement"""
    __tablename__ = "daily_missions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    mission_text = Column(String)
    mission_type = Column(String)  # "theory", "practical", "revision"
    is_completed = Column(Boolean, default=False)
    date = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="daily_missions")
