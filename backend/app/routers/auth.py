from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserResponse
from app.auth import get_password_hash
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RoleUpdate(BaseModel):
    role: Optional[str] = None
    mode: Optional[str] = None


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if user exists
        existing_user = db.query(User).filter(
            (User.username == user.username) | (User.email == user.email)
        ).first()
        
        if existing_user:
            # If user already exists, just return it (for syncing with Firebase)
            return existing_user
        
        # Create new user
        hashed_password = get_password_hash(user.password)
        db_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            full_name=user.full_name,
            role=user.role or "student",
            mode=user.mode or "college"
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration sync failed: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/update-role", response_model=UserResponse)
def update_role(
    data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user's role or mode"""
    if data.role and data.role in ["student", "teacher", "parent", "admin"]:
        current_user.role = data.role
    if data.mode and data.mode in ["school", "college"]:
        current_user.mode = data.mode
    db.commit()
    db.refresh(current_user)
    return current_user
