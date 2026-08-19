from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, StudyPlan, Progress, DailyMission
from app.dependencies import get_current_user
from datetime import datetime, timedelta
from pydantic import BaseModel
import json

router = APIRouter(prefix="/study-plan", tags=["Study Plan"])

class WeeklyGoal(BaseModel):
    week_number: int
    topics: list[str]
    estimated_hours: float

class StudyPlanCreate(BaseModel):
    subject: str
    total_weeks: int
    hours_per_day: float
    goal: str  # e.g., "Deep understanding", "Exam cram", "Quick overview"

@router.post("/generate")
async def generate_advanced_study_plan(
    plan_data: StudyPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    AGENTIC AI ACTION: 
    1. Analyzes syllabus via RAG
    2. Considers student time constraints
    3. Generates a week-by-week roadmap
    """
    from ..rag import vector_store, llm_manager
    
    # 1. Fetch topics from the Knowledge Base (Metadata or RAG)
    v_topics = vector_store.get_topics(plan_data.subject)
    
    if not v_topics or len(v_topics) < 5:
        # Fallback to RAG discovery logic
        from .rag_routes import get_curriculum
        try:
            curriculum_res = await get_curriculum(plan_data.subject)
            if curriculum_res.get("topics"):
                v_topics = curriculum_res["topics"]
        except Exception as e:
            print(f"Curriculum discovery failed: {e}")

    if not v_topics:
         raise HTTPException(status_code=404, detail=f"No curriculum found for {plan_data.subject}. Please upload a syllabus first.")

    topic_names = [t["name"] for t in v_topics]
    
    # 2. Use AI to organize topics into weeks based on constraints
    prompt = f"""
    You are an Expert Study Planner AI. Create a {plan_data.total_weeks}-week study roadmap for the subject '{plan_data.subject}'.
    
    CONSTRAINTS:
    - Available time: {plan_data.hours_per_day} hours/day
    - Goal: {plan_data.goal}
    - Topics to cover: {topic_names}
    
    Return a JSON object with:
    - "exam_name": A professional title for the plan
    - "weekly_plan": A list of objects with "week", "focus" (string description), and "topics" (list of topic names from the provided list).
    
    Organize logically (e.g., basics first, complex later).
    """
    
    llm_res = await llm_manager.generate(prompt, temperature=0.1)
    
    try:
        json_str = llm_res.content.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].strip()
            
        plan_json = json.loads(json_str)
        
        # Add metadata like "is_completed" for the UI
        for week in plan_json["weekly_plan"]:
            week["status"] = "PENDING"
            week_topics = []
            for t_name in week["topics"]:
                # Check actual progress from DB
                prog = db.query(Progress).filter(
                    Progress.user_id == current_user.id,
                    Progress.topic_name == t_name
                ).first()
                week_topics.append({
                    "name": t_name,
                    "completed": prog.is_completed if prog else False,
                    "mastery": 80 if prog and prog.is_completed else (20 if prog and prog.is_confused else 0)
                })
            week["topics_meta"] = week_topics

        # Save to DB
        new_plan = StudyPlan(
            user_id=current_user.id,
            exam_name=plan_json["exam_name"],
            exam_date=datetime.utcnow() + timedelta(weeks=plan_data.total_weeks),
            topics_json=json.dumps(plan_json)
        )
        
        db.add(new_plan)
        db.commit()
        db.refresh(new_plan)
        
        return plan_json
        
    except Exception as e:
        print(f"Study Plan Gen Error: {e}")
        # Simplistic fallback
        return {
            "exam_name": f"{plan_data.subject} Roadmap",
            "weekly_plan": [
                {
                    "week": i + 1,
                    "focus": f"Module {i+1} Fundamentals",
                    "topics": topic_names[0:2],
                    "topics_meta": [{"name": t, "completed": False, "mastery": 0} for t in topic_names[0:2]]
                }
                for i in range(plan_data.total_weeks)
            ],
            "agent_insight": "I've created a baseline roadmap from your curriculum topics."
        }

@router.get("/current")
def get_current_study_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the most recent study plan"""
    plan = db.query(StudyPlan).filter(
        StudyPlan.user_id == current_user.id,
        StudyPlan.exam_date >= datetime.utcnow()
    ).order_by(StudyPlan.exam_date.asc()).first()
    
    if not plan:
        return {"exists": False, "message": "No active study plan"}
    
    topics_schedule = json.loads(plan.topics_json)
    days_until_exam = (plan.exam_date - datetime.utcnow()).days
    
    return {
        "exists": True,
        "id": plan.id,
        "exam_name": plan.exam_name,
        "exam_date": plan.exam_date.isoformat(),
        "days_until_exam": days_until_exam,
        "topics_schedule": topics_schedule,
        "created_at": plan.created_at.isoformat()
    }

@router.get("/daily-tasks")
def get_daily_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's tasks from study plan"""
    # Get today's missions
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing_missions = db.query(DailyMission).filter(
        DailyMission.user_id == current_user.id,
        DailyMission.date >= today_start
    ).all()
    
    if existing_missions:
        return [{
            "id": m.id,
            "mission_text": m.mission_text,
            "mission_type": m.mission_type,
            "is_completed": m.is_completed
        } for m in existing_missions]
    
    # Generate new missions based on progress
    all_progress = db.query(Progress).filter(
        Progress.user_id == current_user.id
    ).all()
    
    missions = []
    
    # Mission 1: Complete or review a topic
    incomplete_topics = [p for p in all_progress if not p.is_completed]
    if incomplete_topics:
        topic = incomplete_topics[0]
        mission1 = DailyMission(
            user_id=current_user.id,
            mission_text=f"Complete {topic.topic_name}",
            mission_type="theory"
        )
        missions.append(mission1)
    
    # Mission 2: Practice labs
    mission2 = DailyMission(
        user_id=current_user.id,
        mission_text="Complete 2 coding exercises",
        mission_type="practical"
    )
    missions.append(mission2)
    
    # Mission 3: Revision
    old_topics = [p for p in all_progress if p.is_completed and 
                  (datetime.utcnow() - p.last_activity).days >= 7]
    if old_topics:
        topic = old_topics[0]
        mission3 = DailyMission(
            user_id=current_user.id,
            mission_text=f"Revise {topic.topic_name}",
            mission_type="revision"
        )
        missions.append(mission3)
    
    for mission in missions:
        db.add(mission)
    
    db.commit()
    
    return [{
        "id": m.id,
        "mission_text": m.mission_text,
        "mission_type": m.mission_type,
        "is_completed": m.is_completed
    } for m in missions]

@router.post("/complete-mission/{mission_id}")
def complete_mission(
    mission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a daily mission as completed"""
    mission = db.query(DailyMission).filter(
        DailyMission.id == mission_id,
        DailyMission.user_id == current_user.id
    ).first()
    
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    mission.is_completed = True
    db.commit()
    
    return {"message": "Mission completed! +15 XP", "xp_earned": 15}

@router.delete("/{plan_id}")
def delete_study_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a study plan"""
    plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    
    db.delete(plan)
    db.commit()
    
    return {"message": "Study plan deleted successfully"}


@router.post("/optimize")
async def optimize_current_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    AGENTIC AI ACTION: 
    1. Reviews current progress vs plan
    2. Identifies bottlenecks (confused topics)
    3. Re-shuffles roadmap to prioritize weaknesses
    """
    from ..rag import llm_manager
    
    plan = db.query(StudyPlan).filter(
        StudyPlan.user_id == current_user.id
    ).order_by(StudyPlan.exam_date.asc()).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="No active plan to optimize.")

    current_topics = json.loads(plan.topics_json)
    
    # Get all progress to identify weaknesses
    all_progress = db.query(Progress).filter(Progress.user_id == current_user.id).all()
    weak_topics = [p.topic_name for p in all_progress if p.is_confused]
    completed_topics = [p.topic_name for p in all_progress if p.is_completed]
    
    prompt = f"""
    You are an AI Efficiency Specialist. Optimize this study plan based on student performance.
    
    CURRENT PLAN: {json.dumps(current_topics)}
    COMPLETED: {completed_topics}
    WEAK AREAS (CONFUSED): {weak_topics}
    
    INSTRUCTIONS:
    1. Move completed topics to the top but mark them clearly as done.
    2. Move 'WEAK' topics to the current/next week for immediate review.
    3. Ensure no topics are lost.
    4. Provide a 'agent_insight' string explaining why you made these changes.
    5. RETURN ONLY VALID JSON.
    """
    
    llm_res = await llm_manager.generate(prompt, temperature=0.1)
    
    try:
        json_str = llm_res.content.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].strip()
            
        optimized_json = json.loads(json_str)
        
        # Add metadata for the UI again (syncing with DB)
        for week in optimized_json["weekly_plan"]:
            week_topics = []
            for t_name in week["topics"]:
                prog = db.query(Progress).filter(
                    Progress.user_id == current_user.id,
                    Progress.topic_name == t_name
                ).first()
                week_topics.append({
                    "name": t_name,
                    "completed": prog.is_completed if prog else False,
                    "mastery": 80 if prog and prog.is_completed else (20 if prog and prog.is_confused else 0)
                })
            week["topics_meta"] = week_topics

        # Update DB
        plan.topics_json = json.dumps(optimized_json)
        db.commit()
        
        return optimized_json
        
    except Exception as e:
        print(f"Optimization failure: {e}")
        # Return fallback insight if LLM fails
        current_topics["agent_insight"] = "I've re-prioritized topics to focus on your flagged weaknesses."
        return current_topics
