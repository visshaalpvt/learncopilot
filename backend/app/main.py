"""
==============================================================================
LEARNCOPILOT - PERSONALIZED LEARNING PLATFORM
==============================================================================

Main Application Entry Point
----------------------------
This module initializes the FastAPI application, configures middleware,
and registers all API routers for the Learning Copilot platform.

Architecture Overview:
---------------------
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Application                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌───────────────────┐  │
│  │  Auth   │  │ Syllabus │  │ Theory  │  │    Edu Agents     │  │
│  └────┬────┘  └────┬─────┘  └────┬────┘  │ (Autonomous AI)   │  │
│       │            │             │       └─────────┬─────────┘  │
│       └────────────┴──────┬──────┴─────────────────┘            │
│                           ▼                                      │
│                   ┌──────────────┐                              │
│                   │   Database   │                              │
│                   │   (SQLite)   │                              │
│                   └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘

Key Features:
- 🎓 Personalized learning paths with AI-powered recommendations
- 🤖 5 Autonomous Education AI Agents for proactive learning support
- 📚 Theory and Practical modes with adaptive content
- 📊 Real-time progress tracking and weakness analysis
- 🎮 Gamification with XP points and achievements
- 📝 Spaced repetition flashcards and Pomodoro timer

Author: LearnCopilot Team
Version: 2.0.0
License: MIT
Hackathon: LLM at Scale - Sri Manakula Vinayagar Engineering College
==============================================================================
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import (
    auth, syllabus, theory, practical, progress,
    gamification, flashcards, pomodoro, notes,
    study_plan, recommendations, edu_agents, question_bank
)
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# =============================================================================
# DATABASE INITIALIZATION
# =============================================================================
# Create all database tables based on SQLAlchemy models
# This ensures the database schema is always up-to-date on startup
Base.metadata.create_all(bind=engine)

# =============================================================================
# FASTAPI APPLICATION INSTANCE
# =============================================================================
app = FastAPI(
    title="Personalized Learning Copilot API",
    description="""
    ## 🎓 LearnCopilot - AI-Powered Personalized Learning Platform
    
    An intelligent learning platform designed to help students master their courses
    efficiently through adaptive learning paths and autonomous AI agents.
    
    ### Key Features:
    - **Adaptive Learning Paths**: AI adjusts content based on performance
    - **5 Autonomous Education Agents**: Proactive AI assistants
    - **Theory & Practical Modes**: Separate environments for learning
    - **Real-time Progress Tracking**: Identify weak areas instantly
    - **Gamification**: XP points, streaks, and achievements
    
    ### API Documentation:
    - `/docs` - Swagger UI (Interactive API docs)
    - `/redoc` - ReDoc (Alternative documentation)
    """,
    version="2.0.0",
    contact={
        "name": "LearnCopilot Team",
        "email": "support@learncopilot.com"
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT"
    }
)

# =============================================================================
# CORS MIDDLEWARE CONFIGURATION
# =============================================================================
# Cross-Origin Resource Sharing (CORS) allows the frontend (React) to 
# communicate with this backend API from a different origin/port.
# 
# Security Note: In production, replace "*" with specific allowed origins
# Example: allow_origins=["https://learncopilot.vercel.app"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=False,  # Must be False when origins is ["*"]
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers including Authorization
    expose_headers=["*"],  # Expose all headers to the frontend
)

# =============================================================================
# API ROUTER REGISTRATION
# =============================================================================
# Each router handles a specific domain of the application.
# Routers are organized by feature for modularity and maintainability.

# Authentication & Authorization
app.include_router(auth.router)           # /auth - Login, Register, JWT tokens

# Core Learning Features
app.include_router(syllabus.router)       # /syllabus - PDF upload, parsing
app.include_router(theory.router)         # /theory - Conceptual learning content
app.include_router(practical.router)      # /practical - Code analysis, labs
app.include_router(progress.router)       # /progress - Track completion, weak areas

# Engagement & Productivity
app.include_router(gamification.router)   # /gamification - XP, badges, streaks
app.include_router(flashcards.router)     # /flashcards - Spaced repetition cards
app.include_router(pomodoro.router)       # /pomodoro - Focus timer sessions
app.include_router(notes.router)          # /notes - User notes management

# AI-Powered Features
app.include_router(study_plan.router)     # /study-plan - Personalized study plans
app.include_router(recommendations.router)# /recommendations - AI suggestions
app.include_router(edu_agents.router)     # /edu-agents - 5 Autonomous AI Agents
app.include_router(question_bank.router)  # /question-bank - Generator & Auditor

# =============================================================================
# ROOT ENDPOINTS
# =============================================================================

@app.get("/", tags=["Health"])
def root():
    """
    Root endpoint - Returns API status and basic information.
    
    This endpoint is used to verify the API is running and provides
    quick access to documentation links.
    
    Returns:
        dict: API status information including version and docs URL
    """
    return {
        "message": "🎓 Personalized Learning Copilot API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc",
        "features": [
            "Adaptive Learning Paths",
            "5 Autonomous Education AI Agents",
            "Theory & Practical Modes",
            "PDF Syllabus Upload",
            "Real-time Progress Tracking",
            "Gamification System"
        ]
    }


@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    
    Used by deployment platforms (Render, Vercel, etc.) to verify
    the application is running correctly.
    
    Returns:
        dict: Health status of the application
    """
    return {
        "status": "healthy",
        "database": "connected",
        "version": "2.0.0"
    }


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================
if __name__ == "__main__":
    """
    Run the application directly using: python -m app.main
    
    For development, use: uvicorn app.main:app --reload --port 8000
    For production, use: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    """
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=True  # Enable auto-reload for development
    )
