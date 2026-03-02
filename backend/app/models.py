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
    role = Column(String, default="student")  # student, teacher, parent, admin
    mode = Column(String, default="college")  # school, college
    onboarding_completed = Column(Boolean, default=False)
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
    notifications = relationship("Notification", back_populates="user", foreign_keys="Notification.user_id")
    onboarding_profile = relationship("OnboardingProfile", back_populates="user", uselist=False)
    teacher_tests = relationship("TeacherTest", back_populates="creator", foreign_keys="TeacherTest.creator_id")
    assignments = relationship("Assignment", back_populates="creator", foreign_keys="Assignment.creator_id")
    resumes = relationship("Resume", back_populates="user")
    communication_sessions = relationship("CommunicationSession", back_populates="user")

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


# ============================================================================
# LEARNING COPILOT - CORE MODELS
# ============================================================================

class MasteryScore(Base):
    """
    Per-topic mastery tracking for Knowledge Tracing.
    Tracks accuracy, attempts, and time to enable spaced revision.
    """
    __tablename__ = "mastery_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic_id = Column(String, index=True)
    topic_name = Column(String)
    subject = Column(String, nullable=True)
    
    # Mastery metrics
    mastery_score = Column(Float, default=0.0)  # 0-100 score
    accuracy = Column(Float, default=0.0)  # Percentage correct
    total_attempts = Column(Integer, default=0)
    correct_attempts = Column(Integer, default=0)
    total_time_seconds = Column(Integer, default=0)
    
    # Spaced revision
    last_reviewed = Column(DateTime, nullable=True)
    next_review_date = Column(DateTime, nullable=True)
    review_interval_days = Column(Integer, default=1)  # SM-2 style interval
    ease_factor = Column(Float, default=2.5)  # SM-2 ease factor
    
    # Difficulty adaptation
    current_difficulty = Column(String, default="medium")  # easy, medium, hard
    consecutive_correct = Column(Integer, default=0)
    consecutive_incorrect = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class StudentProfile(Base):
    """
    Student profile for personalized learning.
    Captures preferences, constraints, and goals.
    """
    __tablename__ = "student_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    # Time constraints
    study_hours_per_week = Column(Float, default=10.0)
    preferred_session_length = Column(Integer, default=45)  # minutes
    
    # Goals
    target_grade = Column(String, nullable=True)  # A, B, C, etc.
    exam_date = Column(DateTime, nullable=True)
    
    # Learning preferences
    learning_style = Column(String, default="balanced")  # visual, practice-heavy, theory, balanced
    theory_practice_ratio = Column(Float, default=0.5)  # 0.0 = all practice, 1.0 = all theory
    
    # Weak/strong areas (JSON arrays)
    weak_topics_json = Column(Text, nullable=True)  # Auto-detected + user-specified
    strong_topics_json = Column(Text, nullable=True)
    
    # Preferences
    notification_enabled = Column(Boolean, default=True)
    daily_reminder_time = Column(String, nullable=True)  # "09:00"
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class QuizAttempt(Base):
    """
    Individual quiz/question attempt for detailed tracking.
    Used for adaptive difficulty and knowledge tracing.
    """
    __tablename__ = "quiz_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic_id = Column(String)
    topic_name = Column(String)
    subject = Column(String, nullable=True)
    
    # Question details
    question_text = Column(Text)
    question_type = Column(String)  # mcq, numerical, conceptual
    difficulty = Column(String)  # easy, medium, hard
    
    # Answer details
    user_answer = Column(Text, nullable=True)
    correct_answer = Column(Text)
    is_correct = Column(Boolean)
    
    # Timing
    time_taken_seconds = Column(Integer, default=0)
    
    # Citation (RAG source)
    source_document = Column(String, nullable=True)
    source_page = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class AgentReflection(Base):
    """
    Agent memory and reflection for continuous improvement.
    Stores weekly reflections and plan adjustments.
    """
    __tablename__ = "agent_reflections"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Reflection period
    week_start = Column(DateTime)
    week_end = Column(DateTime)
    
    # Progress summary
    topics_planned = Column(Integer, default=0)
    topics_completed = Column(Integer, default=0)
    quizzes_taken = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    time_spent_minutes = Column(Integer, default=0)
    
    # Reflection content (JSON)
    what_worked_json = Column(Text, nullable=True)  # List of effective strategies
    what_didnt_work_json = Column(Text, nullable=True)  # List of challenges
    weak_areas_identified = Column(Text, nullable=True)  # JSON array
    
    # Auto-adjustments made
    adjustments_json = Column(Text, nullable=True)  # List of plan changes
    
    # Agent insights
    insight_text = Column(Text, nullable=True)  # Natural language reflection
    recommendation = Column(Text, nullable=True)  # Next week's focus
    
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================================
# EXTENDED PLATFORM MODELS
# ============================================================================

class OnboardingProfile(Base):
    """AI Discovery Onboarding — stores wizard responses and generated AI profile"""
    __tablename__ = "onboarding_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    # Wizard responses
    study_hours_daily = Column(Float, default=2.0)
    weak_subjects = Column(Text, nullable=True)  # JSON array
    learning_style = Column(String, default="visual")  # visual, auditory, reading, kinesthetic
    confidence_level = Column(String, default="medium")  # low, medium, high
    goal = Column(String, default="pass")  # pass, good_grades, master, placement
    preferred_language = Column(String, default="english")
    
    # AI-generated profile
    ai_confidence_score = Column(Float, default=50.0)  # 0-100
    ai_learning_speed = Column(String, default="moderate")  # slow, moderate, fast
    ai_weak_subject_map = Column(Text, nullable=True)  # JSON
    ai_recommended_plan = Column(Text, nullable=True)  # JSON
    ai_tutor_tone = Column(String, default="encouraging")  # encouraging, strict, casual, formal
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="onboarding_profile")


class Notification(Base):
    """Platform notification system"""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    title = Column(String)
    message = Column(Text)
    notification_type = Column(String, default="info")  # info, warning, success, test, assignment, reminder
    is_read = Column(Boolean, default=False)
    link = Column(String, nullable=True)  # Optional navigation link
    sender_id = Column(Integer, nullable=True)  # Who sent it (teacher, system, etc.)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="notifications", foreign_keys=[user_id])


class TeacherTest(Base):
    """Tests created by teachers"""
    __tablename__ = "teacher_tests"
    
    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"))
    
    title = Column(String)
    subject = Column(String)
    description = Column(Text, nullable=True)
    questions_json = Column(Text)  # JSON array of questions
    total_marks = Column(Integer, default=100)
    duration_minutes = Column(Integer, default=60)
    scheduled_date = Column(DateTime, nullable=True)
    is_published = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    creator = relationship("User", back_populates="teacher_tests", foreign_keys=[creator_id])


class Assignment(Base):
    """Homework and assignments created by teachers"""
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"))
    
    title = Column(String)
    subject = Column(String)
    description = Column(Text)
    deadline = Column(DateTime)
    max_marks = Column(Integer, default=100)
    submission_type = Column(String, default="text")  # text, file, code
    is_published = Column(Boolean, default=False)
    submissions_json = Column(Text, nullable=True)  # JSON of student submissions
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    creator = relationship("User", back_populates="assignments", foreign_keys=[creator_id])


class Resume(Base):
    """Career Intelligence — Student resumes"""
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    full_name = Column(String)
    email = Column(String)
    phone = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    education_json = Column(Text, nullable=True)  # JSON array
    experience_json = Column(Text, nullable=True)  # JSON array
    skills_json = Column(Text, nullable=True)  # JSON array
    projects_json = Column(Text, nullable=True)  # JSON array
    certifications_json = Column(Text, nullable=True)  # JSON array
    
    ats_score = Column(Float, nullable=True)  # AI-generated ATS score
    skill_gaps_json = Column(Text, nullable=True)  # AI-detected skill gaps
    placement_readiness = Column(Float, nullable=True)  # 0-100 score
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="resumes")


class CommunicationSession(Base):
    """Communication AI Lab — session tracking"""
    __tablename__ = "communication_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    session_type = Column(String)  # self_intro, reading, hr_interview, tech_interview, presentation, debate
    mode = Column(String, default="school")  # school, college
    duration_seconds = Column(Integer, default=0)
    
    # Scoring
    fluency_score = Column(Float, nullable=True)  # 0-100
    confidence_score = Column(Float, nullable=True)  # 0-100
    grammar_score = Column(Float, nullable=True)  # 0-100
    content_score = Column(Float, nullable=True)  # 0-100
    overall_score = Column(Float, nullable=True)  # 0-100
    
    ai_feedback = Column(Text, nullable=True)
    transcript = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="communication_sessions")


class ParentStudentLink(Base):
    """Link between parent and student accounts"""
    __tablename__ = "parent_student_links"
    
    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
