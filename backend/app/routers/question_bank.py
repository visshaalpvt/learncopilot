from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import random
from datetime import datetime
from app.dependencies import get_current_user
from app.models import User

router = APIRouter(
    prefix="/question-bank",
    tags=["Question Bank Generator"],
    dependencies=[Depends(get_current_user)]
)

# =============================================================================
# DATA MODELS
# =============================================================================

class QuestionRequest(BaseModel):
    course_name: str
    num_questions: int = 20
    include_bloom: bool = True
    include_outcomes: bool = True

class QuestionItem(BaseModel):
    id: int
    question: str
    type: str  # MCQ, Short Answer, Long Answer
    bloom_level: str  # Remember, Understand, Apply, Analyze, Evaluate, Create
    course_outcome: str  # CO1, CO2, etc.
    difficulty: str  # Easy, Medium, Hard
    marks: int
    answer_key: str

class AuditReport(BaseModel):
    total_questions: int
    bloom_coverage: Dict[str, float]
    outcome_coverage: Dict[str, float]
    difficulty_balance: Dict[str, float]
    issues: List[str]
    score: int  # 0-100

class QuestionBankResponse(BaseModel):
    questions: List[QuestionItem]
    audit_report: AuditReport
    generator_status: str
    auditor_status: str

# =============================================================================
# SIMULATED KNOWLEDGE BASE
# =============================================================================

BLOOM_VERBS = {
    "Remember": ["Define", "List", "Recall", "Identify", "Name"],
    "Understand": ["Explain", "Describe", "Summarize", "Interpret", "Contrast"],
    "Apply": ["Calculate", "Solve", "Demonstrate", "Implement", "Use"],
    "Analyze": ["Analyze", "Differentiate", "Compare", "Categorize", "Examine"],
    "Evaluate": ["Evaluate", "Critique", "Justify", "Assess", "Review"],
    "Create": ["Design", "Construct", "Formulate", "Develop", "Propose"]
}

TOPICS_DB = {
    "Data Structures": [
        "Linked Lists", "Stacks", "Queues", "Binary Trees", "Graphs", "Hashing", "Heaps"
    ],
    "Algorithms": [
        "Sorting", "Searching", "Dynamic Programming", "Greedy Algorithms", "Backtracking"
    ],
    "Database": [
        "Normalization", "SQL", "Transactions", "Indexing", "ACID Properties", "NoSQL"
    ],
    "Operating Systems": [
        "Process Scheduling", "Deadlocks", "Memory Management", "File Systems", "Virtualization"
    ]
}

# =============================================================================
# AGENT LOGIC
# =============================================================================

def generate_question(pk: int, topic: str, bloom: str, co: str) -> QuestionItem:
    """Simulates the Generator Agent creating a single question"""
    verb = random.choice(BLOOM_VERBS[bloom])
    
    # Determine type and marks based on Bloom level
    if bloom in ["Remember", "Understand"]:
        q_type = random.choice(["MCQ", "Short Answer"])
        marks = random.choice([1, 2, 5])
        difficulty = "Easy"
    elif bloom in ["Apply", "Analyze"]:
        q_type = random.choice(["Short Answer", "Problem Solving"])
        marks = random.choice([5, 10])
        difficulty = "Medium"
    else:
        q_type = random.choice(["Long Answer", "Design Problem"])
        marks = random.choice([10, 15])
        difficulty = "Hard"
        
    question_text = f"{verb} the concepts of {topic}."
    if q_type == "MCQ":
        question_text = f"Which of the following best describes {topic}? (MCQ)"
    elif q_type == "Design Problem":
        question_text = f"{verb} a system that utilizes {topic} to solve..."
        
    return QuestionItem(
        id=pk,
        question=question_text,
        type=q_type,
        bloom_level=bloom,
        course_outcome=co,
        difficulty=difficulty,
        marks=marks,
        answer_key=f"Key concepts to include for {topic}..."
    )

def audit_question_bank(questions: List[QuestionItem]) -> AuditReport:
    """Simulates the Auditor Agent critiquing the bank"""
    total = len(questions)
    if total == 0:
        return AuditReport(total_questions=0, bloom_coverage={}, outcome_coverage={}, difficulty_balance={}, issues=[], score=0)
        
    # Calculate distributions
    bloom_counts = {}
    difficulty_counts = {}
    
    for q in questions:
        bloom_counts[q.bloom_level] = bloom_counts.get(q.bloom_level, 0) + 1
        difficulty_counts[q.difficulty] = difficulty_counts.get(q.difficulty, 0) + 1
        
    bloom_coverage = {k: round(v/total * 100, 1) for k, v in bloom_counts.items()}
    difficulty_balance = {k: round(v/total * 100, 1) for k, v in difficulty_counts.items()}
    
    # Identify issues
    issues = []
    
    # Check Higher Order Thinking Skills (HOTS)
    hots_count = bloom_counts.get("Analyze", 0) + bloom_counts.get("Evaluate", 0) + bloom_counts.get("Create", 0)
    if hots_count / total < 0.3:
        issues.append("Insufficient Higher Order Thinking (HOTS) questions. Target > 30%.")
        
    # Check difficulty balance
    if difficulty_balance.get("Hard", 0) > 40:
        issues.append("Too many difficult questions. Adjust balance.")
        
    if difficulty_balance.get("Easy", 0) < 20:
        issues.append("Insufficient easy questions for baseline assessment.")
        
    score = 100 - (len(issues) * 10)
    
    return AuditReport(
        total_questions=total,
        bloom_coverage=bloom_coverage,
        outcome_coverage={"CO1": 20.0, "CO2": 30.0, "CO3": 25.0, "CO4": 25.0}, # Mocked for simplicity
        difficulty_balance=difficulty_balance,
        issues=issues,
        score=max(0, score)
    )

# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/generate", response_model=QuestionBankResponse)
async def generate_questions(request: QuestionRequest):
    """
    Dual-Agent System:
    1. Generator Agent creates questions
    2. Auditor Agent critiques and reports
    """
    
    # 1. GENERATOR AGENT ACTION
    questions = []
    topics = TOPICS_DB.get(request.course_name, TOPICS_DB["Data Structures"]) # Default to DS if not found
    
    for i in range(request.num_questions):
        topic = random.choice(topics)
        bloom = random.choice(list(BLOOM_VERBS.keys()))
        co = random.choice(["CO1", "CO2", "CO3", "CO4", "CO5"])
        
        q = generate_question(i+1, topic, bloom, co)
        questions.append(q)
        
    # 2. AUDITOR AGENT ACTION
    audit = audit_question_bank(questions)
    
    # Simulating the iterative refinement process
    if audit.score < 80:
        generator_status = "Generated initial draft. Improvements needed."
        auditor_status = "Critique provided. Flagged distribution issues."
    else:
        generator_status = "Generated optimal question set."
        auditor_status = "Approved. Alignment targets met."
        
    return {
        "questions": questions,
        "audit_report": audit,
        "generator_status": generator_status,
        "auditor_status": auditor_status
    }

@router.get("/get-courses")
async def get_courses():
    return {"courses": list(TOPICS_DB.keys())}
