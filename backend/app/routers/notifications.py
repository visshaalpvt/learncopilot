"""
Notification System — Real-time notifications with polling
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.database import get_db
from app.models import User, Notification
from app.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    notification_type: str = "info"
    link: Optional[str] = None


@router.get("/")
def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all notifications for current user"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    
    return [{
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "type": n.notification_type,
        "is_read": n.is_read,
        "link": n.link,
        "created_at": n.created_at.isoformat()
    } for n in notifications]


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications"""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"count": count}


@router.post("/mark-read/{notification_id}")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read"""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    db.commit()
    return {"status": "success"}


@router.post("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "success"}


@router.post("/send")
def send_notification(
    data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a notification (for teachers/admins)"""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers and admins can send notifications")
    
    notif = Notification(
        user_id=data.user_id,
        title=data.title,
        message=data.message,
        notification_type=data.notification_type,
        link=data.link,
        sender_id=current_user.id
    )
    db.add(notif)
    db.commit()
    return {"status": "success", "id": notif.id}


@router.post("/broadcast")
def broadcast_notification(
    title: str,
    message: str,
    notification_type: str = "info",
    role_filter: str = "student",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Broadcast notification to all users of a specific role"""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers and admins can broadcast")
    
    users = db.query(User).filter(User.role == role_filter).all()
    
    for user in users:
        notif = Notification(
            user_id=user.id,
            title=title,
            message=message,
            notification_type=notification_type,
            sender_id=current_user.id
        )
        db.add(notif)
    
    db.commit()
    return {"status": "success", "recipients": len(users)}
