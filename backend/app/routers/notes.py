from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Note
from app.dependencies import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/notes", tags=["Notes"])

class NoteCreate(BaseModel):
    topic_id: str
    topic_name: str
    content: str

class NoteUpdate(BaseModel):
    content: str

@router.post("/create")
def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new note"""
    note = Note(
        user_id=current_user.id,
        topic_id=note_data.topic_id,
        topic_name=note_data.topic_name,
        content=note_data.content
    )
    
    db.add(note)
    db.commit()
    db.refresh(note)
    
    return {
        "id": note.id,
        "message": "Note created successfully"
    }

@router.get("/topic/{topic_id}")
def get_note_by_topic(
    topic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get note for a specific topic"""
    note = db.query(Note).filter(
        Note.user_id == current_user.id,
        Note.topic_id == topic_id
    ).first()
    
    if not note:
        return {"exists": False, "content": ""}
    
    return {
        "exists": True,
        "id": note.id,
        "topic_id": note.topic_id,
        "topic_name": note.topic_name,
        "content": note.content,
        "created_at": note.created_at.isoformat(),
        "updated_at": note.updated_at.isoformat()
    }

@router.put("/update/{note_id}")
def update_note(
    note_id: int,
    note_update: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing note"""
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    note.content = note_update.content
    db.commit()
    
    return {"message": "Note updated successfully"}

@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a note"""
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    
    return {"message": "Note deleted successfully"}

@router.get("/all")
def get_all_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all notes for the user"""
    notes = db.query(Note).filter(
        Note.user_id == current_user.id
    ).order_by(Note.updated_at.desc()).all()
    
    return [{
        "id": note.id,
        "topic_id": note.topic_id,
        "topic_name": note.topic_name,
        "content": note.content[:100] + "..." if len(note.content) > 100 else note.content,
        "created_at": note.created_at.isoformat(),
        "updated_at": note.updated_at.isoformat()
    } for note in notes]

@router.get("/search")
def search_notes(
    query: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search notes by content"""
    notes = db.query(Note).filter(
        Note.user_id == current_user.id,
        Note.content.like(f"%{query}%")
    ).all()
    
    return [{
        "id": note.id,
        "topic_name": note.topic_name,
        "content": note.content,
        "updated_at": note.updated_at.isoformat()
    } for note in notes]
