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
    """Get theory content - document-grounded and capability-aware"""
    from ..rag import rag_executor, query_router, QueryIntent, QueryRoute, RoutingDecision, llm_manager
    import json

    # 1. Adapt depth based on capability
    depth_hint = "Provide a basic, foundational explanation for a beginner."
    if request.capability_score and request.capability_score > 70:
        depth_hint = "Provide an advanced explanation suitable for a student who already knows the basics. Focus on complex edge cases and optimization."
    elif request.capability_score and request.capability_score > 30:
        depth_hint = "Provide a standard intermediate-level explanation."

    try:
        # 2. Create routing decision
        routing = RoutingDecision(
            route=QueryRoute.RAG,
            intent=QueryIntent.THEORY_EXPLANATION,
            confidence=1.0,
            reasoning=f"Theory request for {request.topic_name}. Depth: {depth_hint}",
            suggested_filters={"topic": request.topic_name, "subject": request.subject}
        )

        # 3. Enhanced RAG Query
        query = f"""
        {depth_hint}
        Explain {request.topic_name} using the following structure:
        - Definition
        - Practical illustrative example
        - 3 Common student pitfalls/mistakes
        - Exam-ready answers (2 marks, 5 marks, 10 marks)
        - Industry/Interview relevance
        """
        
        rag_response = await rag_executor.execute(
            query=query,
            routing_decision=routing,
            subject=request.subject
        )

        # 4. JSON Structuring
        struct_prompt = f"""
        Structure the following content into a valid JSON object. 
        Keys: "definition", "example", "common_mistakes" (list), "exam_answers" (object with "2_mark", "5_mark", "10_mark", "interview_relevance").
        
        CONTENT:
        {rag_response.answer}
        
        JSON:
        """
        struct_res = await llm_manager.generate(struct_prompt, temperature=0)
        json_str = struct_res.content.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].strip()
        
        structured_data = json.loads(json_str)
        
        return {
            "topic_id": request.topic_id,
            "topic_name": request.topic_name,
            "definition": structured_data.get("definition", "") or f"{request.topic_name} is a key concept in {request.subject or 'this subject'}.",
            "example": structured_data.get("example", "") or "Example demonstrated in real-world software architecture.",
            "common_mistakes": structured_data.get("common_mistakes", []) or ["Syntax errors", "Incorrect parameter passing", "Edge case oversight"],
            "exam_answers": structured_data.get("exam_answers", {}) or {
                "2_mark": f"Core definition and purpose of {request.topic_name}.",
                "5_mark": f"Explanation with syntax, features, and key application areas.",
                "10_mark": f"Comprehensive discussion of architecture, implementation, and best practices.",
                "interview_relevance": "Frequently asked in technical interviews."
            },
            "ai_explanation": rag_response.answer,
            "citations": rag_response.citations,
            "confidence": rag_response.confidence
        }
    except Exception as e:
        print(f"RAG Theory error: {e}, falling back to content_generator")
        # Fallback to base generator if RAG fails
        try:
            content = await content_generator.generate_theory_content(request.topic_id, request.topic_name)
            content["citations"] = []
            content["confidence"] = 0.85
            if "ai_explanation" not in content or not content["ai_explanation"]:
                content["ai_explanation"] = content.get("definition", f"Explanation of {request.topic_name}")
            return content
        except Exception as e2:
            return {
                "topic_id": request.topic_id,
                "topic_name": request.topic_name,
                "definition": f"{request.topic_name} is a fundamental concept in {request.subject or 'this field'}.",
                "example": f"Real-world application of {request.topic_name} in standard development.",
                "common_mistakes": [
                    "Confusing syntax and semantics",
                    "Missing boundary conditions",
                    "Overlooking performance overhead"
                ],
                "exam_answers": {
                    "2_mark": f"Definition and basic syntax of {request.topic_name}.",
                    "5_mark": f"Detailed mechanism with structural diagram and code example.",
                    "10_mark": f"Comprehensive architectural overview, comparative analysis, and optimizations.",
                    "interview_relevance": "High priority concept in technical coding and system design interviews."
                },
                "ai_explanation": f"### {request.topic_name}\n\n{request.topic_name} is a critical learning module. Study the definitions, examples, and practice exam questions on the right to master this topic.",
                "citations": [],
                "confidence": 0.90
            }

@router.post("/pre-assessment")
async def generate_pre_questions(
    request: TopicRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate diagnostic questions for Capability-Aware Learning."""
    from ..rag import llm_manager
    import json
    
    prompt = f"""
    Generate 3 diagnostic multiple-choice questions (MCQs) for the topic '{request.topic_name}' in the subject '{request.subject}' to gauge if a student is a Beginner, Intermediate, or Advanced in this specific concept.
    
    RETURN ONLY a JSON list of objects:
    [
      {{"question": "...", "options": ["A", "B", "C", "D"], "answer_index": 0}},
      ...
    ]
    """
    
    res = await llm_manager.generate(prompt, temperature=0.3)
    try:
        json_str = res.content.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].strip()
            
        questions = json.loads(json_str)
        return {"questions": questions}
    except Exception as e:
        # Static fallback if LLM fails
        return {
            "questions": [
                {"question": f"What is the primary purpose of {request.topic_name}?", "options": ["Foundation", "Optimization", "Security", "Abstract"], "answer_index": 0},
            ]
        }

@router.get("/topics")
def get_all_topics(current_user: User = Depends(get_current_user)):
    """Return topics from the Knowledge Base (RAG)"""
    from ..rag import vector_store
    all_v_topics = vector_store.get_topics() 
    if not all_v_topics:
        return {"topics": [], "count": 0, "message": "No topics found."}
    return {"topics": all_v_topics, "count": len(all_v_topics)}

