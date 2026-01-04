from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Syllabus
from app.schemas import SyllabusCreate, SyllabusResponse
from app.dependencies import get_current_user
import json
import re
import io
from PyPDF2 import PdfReader

router = APIRouter(prefix="/syllabus", tags=["Syllabus"])

def parse_syllabus_content(raw_content: str, subject_name: str):
    """Parse raw syllabus text into structured format using rule-based logic"""
    
    # Simple parser - looks for unit patterns
    units = []
    current_unit = None
    current_topics = []
    
    lines = raw_content.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Detect unit headers (e.g., "Unit 1:", "UNIT I", etc.)
        unit_match = re.match(r'(?:unit|UNIT)\s*[IVX0-9]+[:.\s]*(.*)', line, re.IGNORECASE)
        if unit_match:
            # Save previous unit
            if current_unit:
                units.append({
                    "unit_name": current_unit,
                    "topics": current_topics
                })
            
            current_unit = unit_match.group(0) if unit_match.group(1) else f"Unit {len(units) + 1}"
            current_topics = []
        elif current_unit:
            # This is a topic line
            # Remove bullet points, numbers, etc.
            topic = re.sub(r'^[-•*0-9.)\]]+\s*', '', line)
            if topic:
                current_topics.append({
                    "id": f"topic_{len(units)}_{len(current_topics)}",
                    "name": topic
                })
    
    # Add last unit
    if current_unit:
        units.append({
            "unit_name": current_unit,
            "topics": current_topics
        })
    
    # If no units detected, create a default structure
    if not units:
        topics = [line.strip() for line in lines if line.strip()]
        units = [{
            "unit_name": "Unit 1: " + subject_name,
            "topics": [{"id": f"topic_0_{i}", "name": topic} for i, topic in enumerate(topics)]
        }]
    
    return {
        "subject": subject_name,
        "units": units,
        "total_topics": sum(len(unit["topics"]) for unit in units)
    }

def extract_text_from_pdf(pdf_file: bytes) -> str:
    """Extract text content from a PDF file"""
    try:
        pdf_reader = PdfReader(io.BytesIO(pdf_file))
        text_content = []
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                text_content.append(text)
        return "\n".join(text_content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")

@router.post("/upload", response_model=SyllabusResponse)
def upload_syllabus(
    syllabus_data: SyllabusCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Parse the syllabus
    parsed_data = parse_syllabus_content(syllabus_data.raw_content, syllabus_data.subject_name)
    
    # Save to database
    db_syllabus = Syllabus(
        user_id=current_user.id,
        subject_name=syllabus_data.subject_name,
        raw_content=syllabus_data.raw_content,
        parsed_data=json.dumps(parsed_data)
    )
    
    db.add(db_syllabus)
    db.commit()
    db.refresh(db_syllabus)
    
    return {
        "id": db_syllabus.id,
        "subject_name": db_syllabus.subject_name,
        "parsed_data": parsed_data,
        "created_at": db_syllabus.created_at
    }

@router.post("/upload-pdf", response_model=SyllabusResponse)
def upload_syllabus_pdf(
    subject_name: str = Form(...),
    pdf_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a syllabus as a PDF file"""
    
    # Validate file type
    if not pdf_file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Read and extract text from PDF
    pdf_content = pdf_file.file.read()
    raw_content = extract_text_from_pdf(pdf_content)
    
    if not raw_content.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the PDF. Please ensure the PDF contains readable text.")
    
    # Parse the syllabus
    parsed_data = parse_syllabus_content(raw_content, subject_name)
    
    # Save to database
    db_syllabus = Syllabus(
        user_id=current_user.id,
        subject_name=subject_name,
        raw_content=raw_content,
        parsed_data=json.dumps(parsed_data)
    )
    
    db.add(db_syllabus)
    db.commit()
    db.refresh(db_syllabus)
    
    return {
        "id": db_syllabus.id,
        "subject_name": db_syllabus.subject_name,
        "parsed_data": parsed_data,
        "created_at": db_syllabus.created_at
    }

@router.get("/list")
def list_syllabi(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    syllabi = db.query(Syllabus).filter(Syllabus.user_id == current_user.id).all()
    
    return [{
        "id": s.id,
        "subject_name": s.subject_name,
        "parsed_data": json.loads(s.parsed_data),
        "created_at": s.created_at
    } for s in syllabi]

@router.get("/{syllabus_id}")
def get_syllabus(
    syllabus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    syllabus = db.query(Syllabus).filter(
        Syllabus.id == syllabus_id,
        Syllabus.user_id == current_user.id
    ).first()
    
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    
    return {
        "id": syllabus.id,
        "subject_name": syllabus.subject_name,
        "parsed_data": json.loads(syllabus.parsed_data),
        "created_at": syllabus.created_at
    }
