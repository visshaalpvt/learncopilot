from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User
from app.auth import verify_token, get_password_hash

security = HTTPBearer(auto_error=False)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)):
    def get_or_create_demo_user():
        demo_user = db.query(User).filter(User.email == "demo@learncopilot.ai").first()
        if not demo_user:
            demo_user = User(
                username="Scholar_Path_Demo",
                email="demo@learncopilot.ai",
                hashed_password=get_password_hash("demo"),
                full_name="Demo Student",
                role="student",
                mode="college",
                onboarding_completed=False
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        return demo_user

    if not credentials or not credentials.credentials:
        return get_or_create_demo_user()

    token = credentials.credentials
    
    # Demo mode — bypass auth, use/create a demo user in DB
    if token in ["demo-token", "guest", "null", "undefined"]:
        return get_or_create_demo_user()
    
    payload = verify_token(token)
    if payload is None:
        return get_or_create_demo_user()
        
    email: str = payload.get("sub")
    if email is None:
        return get_or_create_demo_user()
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        return get_or_create_demo_user()
    
    return user
