from fastapi import APIRouter, Depends
from app.models import User
from app.schemas import TopicRequest, TheoryResponse
from app.dependencies import get_current_user
from app.content_generator import content_generator

router = APIRouter(prefix="/theory", tags=["Theory Mode"])

@router.post("/get-content", response_model=TheoryResponse)
def get_theory_topic(
    request: TopicRequest,
    current_user: User = Depends(get_current_user)
):
    """Get theory content - dynamically generated"""
    content = content_generator.generate_theory_content(
        request.topic_id, 
        request.topic_name
    )
    
    return {
        "topic_id": content["topic_id"],
        "topic_name": content["topic_name"],
        "definition": content["definition"],
        "example": content["example"],
        "common_mistakes": content["common_mistakes"],
        "exam_answers": content["exam_answers"]
    }

@router.get("/topics")
def get_all_topics(current_user: User = Depends(get_current_user)):
    """Return suggested topics (can be expanded based on syllabus)"""
    suggested_topics = [
        "Data Structures",
        "Algorithms",
        "Object Oriented Programming",
        "Database Management",
        "Operating Systems",
        "Computer Networks",
        "Software Engineering",
        "Web Development",
        "Machine Learning Basics",
        "Cloud Computing"
    ]
    
    return {
        "topics": suggested_topics,
        "count": len(suggested_topics),
        "message": "These are suggested topics. Content is generated dynamically for ANY topic you study!"
    }

