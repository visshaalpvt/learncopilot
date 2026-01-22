from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth Schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    
    class Config:
        from_attributes = True

# Syllabus Schemas
class SyllabusCreate(BaseModel):
    subject_name: str
    raw_content: str

class SyllabusResponse(BaseModel):
    id: int
    subject_name: str
    parsed_data: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Theory Schemas
class TopicRequest(BaseModel):
    topic_id: str
    topic_name: str

class TheoryResponse(BaseModel):
    topic_id: str
    topic_name: str
    definition: str
    example: str
    common_mistakes: List[str]
    exam_answers: Dict[str, Any]
    ai_explanation: Optional[str] = None
    citations: Optional[List[Dict[str, Any]]] = []
    confidence: Optional[float] = 1.0

# Practical Schemas
class CodeAnalysisRequest(BaseModel):
    code: str
    language: str

class CodeAnalysisResponse(BaseModel):
    has_error: bool
    error_type: Optional[str]
    explanation: Optional[str]
    hint: Optional[str]
    suggested_fix: Optional[str]
    viva_questions: List[str]

# Progress Schemas
class ProgressUpdate(BaseModel):
    topic_id: str
    topic_name: str
    is_completed: Optional[bool] = None
    is_confused: Optional[bool] = None
    labs_attempted: Optional[int] = None

class ProgressResponse(BaseModel):
    id: int
    topic_id: str
    topic_name: str
    is_completed: bool
    is_confused: bool
    labs_attempted: int
    last_activity: datetime
    
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_topics: int
    completed_topics: int
    labs_attempted: int
    progress_percentage: float
    recent_activities: List[Dict[str, Any]]
