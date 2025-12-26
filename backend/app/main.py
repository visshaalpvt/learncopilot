from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import (
    auth, syllabus, theory, practical, progress,
    gamification, flashcards, pomodoro, notes,
    study_plan, recommendations
)
import os
from dotenv import load_dotenv

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Personalized Learning Copilot API",
    description="Backend API for personalized learning platform with gamification and spaced repetition",
    version="2.0.0"
)

# CORS configuration - permissive for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=False,  # Must be False when origins is ["*"]
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(syllabus.router)
app.include_router(theory.router)
app.include_router(practical.router)
app.include_router(progress.router)
app.include_router(gamification.router)
app.include_router(flashcards.router)
app.include_router(pomodoro.router)
app.include_router(notes.router)
app.include_router(study_plan.router)
app.include_router(recommendations.router)

@app.get("/")
def root():
    return {
        "message": "Personalized Learning Copilot API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
