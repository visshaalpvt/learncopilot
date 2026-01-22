from fastapi import APIRouter, Depends
from app.models import User
from app.schemas import TopicRequest, TheoryResponse
from app.dependencies import get_current_user
from app.content_generator import content_generator

router = APIRouter(prefix="/theory", tags=["Theory Mode"])

@router.post("/get-content", response_model=TheoryResponse)
async def get_theory_topic(
    request: TopicRequest,
    current_user: User = Depends(get_current_user)
):
    """Get theory content - document-grounded via RAG"""
    from ..rag import rag_executor, query_router, query_rag, QueryIntent, QueryRoute, RoutingDecision
    import json

    # Create a specialized routing decision for theory
    routing = RoutingDecision(
        route=QueryRoute.RAG,
        intent=QueryIntent.THEORY_EXPLANATION,
        confidence=1.0,
        reasoning="User requested theory mode content.",
        suggested_filters={"topic": request.topic_name}
    )

    # Execute RAG
    # We ask for a structured response to fit our schema
    query = f"Provide a detailed academic explanation of {request.topic_name}. Include a core definition, a practical example, 3 common mistakes students make, and exam-style answers for 2 marks, 5 marks, and 10 marks. Also mention its interview relevance."
    
    rag_response = await rag_executor.execute(
        query=query,
        routing_decision=routing
    )

    # If RAG has context, we parse it into our structure
    # If not, we fall back to content_generator or use the RAG answer as definition
    if rag_response.citations:
        # Use LLM to structure the RAG response into our JSON schema
        from ..rag import llm_manager
        struct_prompt = f"""
        Structure the following academic content into a valid JSON object with these keys: 
        "definition", "example", "common_mistakes" (list), and "exam_answers" (object with keys "2_mark", "5_mark", "10_mark", "interview_relevance").
        
        CONTENT:
        {rag_response.answer}
        
        JSON:
        """
        struct_res = await llm_manager.generate(struct_prompt, temperature=0)
        try:
            # Simple cleaning for JSON
            json_str = struct_res.content.strip()
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0].strip()
            
            structured_data = json.loads(json_str)
            
            return {
                "topic_id": request.topic_id,
                "topic_name": request.topic_name,
                "definition": structured_data.get("definition", ""),
                "example": structured_data.get("example", ""),
                "common_mistakes": structured_data.get("common_mistakes", []),
                "exam_answers": structured_data.get("exam_answers", {}),
                "ai_explanation": rag_response.answer,
                "citations": rag_response.citations,
                "confidence": rag_response.confidence
            }
        except:
            # Fallback if JSON parsing fails
            pass

    # Final Fallback to content_generator
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

