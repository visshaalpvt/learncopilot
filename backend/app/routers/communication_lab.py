"""
Communication AI Lab — Interview simulation, speaking practice, fluency scoring
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.models import User, CommunicationSession
from app.dependencies import get_current_user

router = APIRouter(prefix="/communication-lab", tags=["Communication Lab"])


class SessionStart(BaseModel):
    session_type: str  # self_intro, reading, hr_interview, tech_interview, presentation, debate
    mode: str = "school"  # school, college


class SessionSubmit(BaseModel):
    session_id: int
    transcript: str
    duration_seconds: int


class ConversationRequest(BaseModel):
    session_type: str
    user_message: str
    context: Optional[str] = None


@router.post("/start")
def start_session(
    data: SessionStart,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new communication session"""
    session = CommunicationSession(
        user_id=current_user.id,
        session_type=data.session_type,
        mode=data.mode
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Return appropriate prompt based on session type
    prompts = {
        "self_intro": {
            "instruction": "Introduce yourself in 60 seconds. Talk about your name, education, hobbies, and goals.",
            "timer_seconds": 60,
            "tips": ["Start with your name", "Mention your education", "Share 1-2 hobbies", "End with your goal"]
        },
        "reading": {
            "instruction": "Read the following passage aloud clearly and fluently.",
            "passage": "Technology has transformed the way we learn. With artificial intelligence and machine learning, personalized education is now possible at scale. Students can receive tailored content based on their learning pace, strengths, and areas that need improvement. This revolution in education promises to make quality learning accessible to everyone, regardless of their background or location.",
            "timer_seconds": 120
        },
        "hr_interview": {
            "instruction": "You are in an HR interview. The interviewer will ask you questions. Respond professionally.",
            "first_question": "Tell me about yourself and why you're interested in this position.",
            "timer_seconds": 300
        },
        "tech_interview": {
            "instruction": "You are in a technical interview. Answer the questions demonstrating your knowledge.",
            "first_question": "Can you explain the difference between a stack and a queue? When would you use each?",
            "timer_seconds": 300
        },
        "presentation": {
            "instruction": "Give a 3-minute presentation on: 'How AI is changing education'",
            "timer_seconds": 180,
            "tips": ["Start with a hook", "Present 3 key points", "Give examples", "Conclude with impact"]
        },
        "debate": {
            "instruction": "Debate topic: 'AI should replace traditional teaching methods.' You are arguing FOR this position.",
            "timer_seconds": 180
        }
    }
    
    return {
        "session_id": session.id,
        "session_type": data.session_type,
        **prompts.get(data.session_type, {"instruction": "Begin your session.", "timer_seconds": 120})
    }


@router.post("/evaluate")
async def evaluate_session(
    data: SessionSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Evaluate a communication session using AI"""
    session = db.query(CommunicationSession).filter(
        CommunicationSession.id == data.session_id,
        CommunicationSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # AI evaluation
    try:
        from app.rag.llm_manager import llm_manager
        eval_prompt = f"""Evaluate this {session.session_type} communication session.

Transcript: "{data.transcript}"
Duration: {data.duration_seconds} seconds

Score each on 0-100:
1. Fluency (flow, pace, filler words)
2. Confidence (assertiveness, clarity)
3. Grammar (correctness, vocabulary)
4. Content (relevance, structure, depth)

Also provide 3 specific improvement tips.

Format as:
FLUENCY: [score]
CONFIDENCE: [score]
GRAMMAR: [score]
CONTENT: [score]
FEEDBACK: [detailed feedback with tips]"""

        response = await llm_manager.generate(
            prompt=eval_prompt,
            system_prompt="You are an expert communication coach and interview evaluator. Be encouraging but honest.",
            temperature=0.3
        )
        
        content = response.content
        
        # Parse scores
        import re
        fluency = float(re.search(r'FLUENCY:\s*(\d+)', content).group(1)) if re.search(r'FLUENCY:\s*(\d+)', content) else 65
        confidence = float(re.search(r'CONFIDENCE:\s*(\d+)', content).group(1)) if re.search(r'CONFIDENCE:\s*(\d+)', content) else 60
        grammar = float(re.search(r'GRAMMAR:\s*(\d+)', content).group(1)) if re.search(r'GRAMMAR:\s*(\d+)', content) else 70
        content_score = float(re.search(r'CONTENT:\s*(\d+)', content).group(1)) if re.search(r'CONTENT:\s*(\d+)', content) else 65
        
        feedback_match = re.search(r'FEEDBACK:\s*(.*)', content, re.DOTALL)
        feedback = feedback_match.group(1).strip() if feedback_match else content
        
    except Exception:
        # Fallback scoring based on transcript length
        word_count = len(data.transcript.split())
        fluency = min(word_count / 2, 80)
        confidence = min(word_count / 2.5, 75)
        grammar = 70
        content_score = min(word_count / 3, 70)
        feedback = f"Good effort! You spoke {word_count} words. Keep practicing for better fluency and confidence."
    
    overall = round((fluency + confidence + grammar + content_score) / 4, 1)
    
    # Update session
    session.duration_seconds = data.duration_seconds
    session.transcript = data.transcript
    session.fluency_score = fluency
    session.confidence_score = confidence
    session.grammar_score = grammar
    session.content_score = content_score
    session.overall_score = overall
    session.ai_feedback = feedback
    
    db.commit()
    
    return {
        "session_id": session.id,
        "scores": {
            "fluency": fluency,
            "confidence": confidence,
            "grammar": grammar,
            "content": content_score,
            "overall": overall
        },
        "feedback": feedback,
        "word_count": len(data.transcript.split()),
        "duration_seconds": data.duration_seconds
    }


@router.post("/conversation")
async def ai_conversation(
    data: ConversationRequest,
    current_user: User = Depends(get_current_user)
):
    """AI conversation partner for interview practice"""
    role_prompts = {
        "hr_interview": "You are a professional HR interviewer at a top company. Ask follow-up questions based on the candidate's responses. Be professional and realistic.",
        "tech_interview": "You are a senior technical interviewer. Ask coding and system design questions. Provide hints if the candidate is struggling.",
        "debate": "You are a debate opponent. Counter the user's arguments respectfully and ask probing questions.",
        "self_intro": "You are a friendly communication coach. Give brief, encouraging feedback and ask one follow-up question."
    }
    
    system = role_prompts.get(data.session_type, "You are a helpful communication partner.")
    
    try:
        from app.rag.llm_manager import llm_manager
        response = await llm_manager.generate(
            prompt=f"User said: \"{data.user_message}\"\n\n{f'Context: {data.context}' if data.context else ''}",
            system_prompt=system,
            temperature=0.7,
            max_tokens=300
        )
        return {"response": response.content}
    except Exception:
        return {"response": "That's a great point! Can you elaborate on that? I'd like to hear more about your perspective."}


@router.get("/history")
def get_session_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all past communication sessions"""
    sessions = db.query(CommunicationSession).filter(
        CommunicationSession.user_id == current_user.id
    ).order_by(CommunicationSession.created_at.desc()).all()
    
    return [{
        "id": s.id,
        "session_type": s.session_type,
        "mode": s.mode,
        "duration_seconds": s.duration_seconds,
        "scores": {
            "fluency": s.fluency_score,
            "confidence": s.confidence_score,
            "grammar": s.grammar_score,
            "content": s.content_score,
            "overall": s.overall_score
        },
        "feedback": s.ai_feedback,
        "created_at": s.created_at.isoformat()
    } for s in sessions]
