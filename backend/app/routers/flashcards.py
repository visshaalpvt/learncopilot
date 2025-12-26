from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Flashcard, Progress
from app.dependencies import get_current_user
from datetime import datetime, timedelta
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/flashcards", tags=["Flashcards"])

class FlashcardCreate(BaseModel):
    topic_id: str
    topic_name: str
    question: str
    answer: str

class FlashcardReview(BaseModel):
    quality: int  # 0-5 rating (SM-2 algorithm)

def calculate_sm2(flashcard: Flashcard, quality: int):
    """
    SM-2 Algorithm Implementation
    quality: 0-5 (0=total blackout, 5=perfect response)
    """
    # Update ease factor
    if quality >= 3:
        # Correct response
        new_ef = flashcard.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        flashcard.ease_factor = max(1.3, new_ef)
        
        # Update repetitions and interval
        flashcard.repetitions += 1
        
        if flashcard.repetitions == 1:
            flashcard.interval = 1
        elif flashcard.repetitions == 2:
            flashcard.interval = 6
        else:
            flashcard.interval = int(flashcard.interval * flashcard.ease_factor)
    else:
        # Incorrect response - reset
        flashcard.repetitions = 0
        flashcard.interval = 1
    
    # Set next review date
    flashcard.next_review_date = datetime.utcnow() + timedelta(days=flashcard.interval)
    flashcard.last_reviewed = datetime.utcnow()

@router.post("/create")
def create_flashcard(
    flashcard_data: FlashcardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new flashcard"""
    flashcard = Flashcard(
        user_id=current_user.id,
        topic_id=flashcard_data.topic_id,
        topic_name=flashcard_data.topic_name,
        question=flashcard_data.question,
        answer=flashcard_data.answer
    )
    
    db.add(flashcard)
    db.commit()
    db.refresh(flashcard)
    
    return {
        "id": flashcard.id,
        "message": "Flashcard created successfully"
    }

@router.post("/auto-generate/{topic_id}")
def auto_generate_flashcards(
    topic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Auto-generate flashcards for a topic (rule-based)"""
    # Check if topic exists in progress
    progress = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.topic_id == topic_id
    ).first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Check if flashcards already exist
    existing = db.query(Flashcard).filter(
        Flashcard.user_id == current_user.id,
        Flashcard.topic_id == topic_id
    ).count()
    
    if existing > 0:
        return {"message": "Flashcards already generated for this topic", "count": existing}
    
    # Rule-based flashcard generation
    topic_name = progress.topic_name
    flashcard_templates = [
        {
            "question": f"What is {topic_name}?",
            "answer": f"{topic_name} is a fundamental concept in computer science that involves..."
        },
        {
            "question": f"What are the key features of {topic_name}?",
            "answer": f"Key features include: 1) Core principle, 2) Key application, 3) Important property"
        },
        {
            "question": f"How is {topic_name} used in real-world applications?",
            "answer": f"{topic_name} is commonly used in software development, data processing, and system design."
        },
        {
            "question": f"What are common mistakes when working with {topic_name}?",
            "answer": "Common mistakes include: Not understanding the fundamentals, improper implementation, and ignoring edge cases."
        },
        {
            "question": f"Compare {topic_name} with similar concepts",
            "answer": f"{topic_name} differs from similar concepts in terms of efficiency, use case, and implementation."
        }
    ]
    
    created_count = 0
    for template in flashcard_templates:
        flashcard = Flashcard(
            user_id=current_user.id,
            topic_id=topic_id,
            topic_name=topic_name,
            question=template["question"],
            answer=template["answer"]
        )
        db.add(flashcard)
        created_count += 1
    
    db.commit()
    
    return {
        "message": f"Generated {created_count} flashcards for {topic_name}",
        "count": created_count
    }

@router.get("/due-today")
def get_due_flashcards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get flashcards due for review today"""
    now = datetime.utcnow()
    
    due_cards = db.query(Flashcard).filter(
        Flashcard.user_id == current_user.id,
        Flashcard.next_review_date <= now
    ).all()
    
    return [{
        "id": card.id,
        "topic_id": card.topic_id,
        "topic_name": card.topic_name,
        "question": card.question,
        "answer": card.answer,
        "repetitions": card.repetitions,
        "next_review_date": card.next_review_date.isoformat()
    } for card in due_cards]

@router.post("/review/{flashcard_id}")
def review_flashcard(
    flashcard_id: int,
    review: FlashcardReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Review a flashcard and update SM-2 algorithm"""
    flashcard = db.query(Flashcard).filter(
        Flashcard.id == flashcard_id,
        Flashcard.user_id == current_user.id
    ).first()
    
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    # Validate quality (0-5)
    if review.quality < 0 or review.quality > 5:
        raise HTTPException(status_code=400, detail="Quality must be between 0 and 5")
    
    # Apply SM-2 algorithm
    calculate_sm2(flashcard, review.quality)
    
    db.commit()
    db.refresh(flashcard)
    
    return {
        "message": "Review recorded",
        "next_review_date": flashcard.next_review_date.isoformat(),
        "interval_days": flashcard.interval,
        "repetitions": flashcard.repetitions,
        "ease_factor": flashcard.ease_factor
    }

@router.get("/all")
def get_all_flashcards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all flashcards for the user"""
    flashcards = db.query(Flashcard).filter(
        Flashcard.user_id == current_user.id
    ).all()
    
    return [{
        "id": card.id,
        "topic_id": card.topic_id,
        "topic_name": card.topic_name,
        "question": card.question,
        "answer": card.answer,
        "repetitions": card.repetitions,
        "interval": card.interval,
        "next_review_date": card.next_review_date.isoformat(),
        "last_reviewed": card.last_reviewed.isoformat() if card.last_reviewed else None
    } for card in flashcards]

@router.get("/stats")
def get_flashcard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get flashcard statistics"""
    all_cards = db.query(Flashcard).filter(
        Flashcard.user_id == current_user.id
    ).all()
    
    now = datetime.utcnow()
    due_today = len([c for c in all_cards if c.next_review_date <= now])
    mastered = len([c for c in all_cards if c.repetitions >= 3])
    learning = len([c for c in all_cards if c.repetitions < 3])
    
    return {
        "total_cards": len(all_cards),
        "due_today": due_today,
        "mastered": mastered,
        "learning": learning
    }

@router.delete("/{flashcard_id}")
def delete_flashcard(
    flashcard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a flashcard"""
    flashcard = db.query(Flashcard).filter(
        Flashcard.id == flashcard_id,
        Flashcard.user_id == current_user.id
    ).first()
    
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    db.delete(flashcard)
    db.commit()
    
    return {"message": "Flashcard deleted successfully"}
