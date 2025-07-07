# app/routers/chat.py
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
from app.schemas import chat as schemas
from app.db import models
from app.db.session import get_db
from app.crud import chat as crud_chat
from app.dependencies import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/chats", tags=["Chat"])

@router.post("/conversations/", response_model=schemas.ConversationOut)
def get_or_create_conversation(
    data: schemas.ConversationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    renter_id = data.renter_id or current_user.id
    convo = crud_chat.get_or_create_conversation(
        db, renter_id=renter_id, landlord_id=data.landlord_id, listing_id=data.listing_id
    )
    return convo

@router.get("/conversations/", response_model=List[schemas.ConversationOut])
def get_conversations(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return crud_chat.get_user_conversations(db, user_id=user.id)

@router.get("/conversations/{conversation_id}/", response_model=schemas.ConversationOut)
def get_conversation(
    conversation_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    convo = crud_chat.get_conversation_by_id(db, conversation_id)
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    # You might want to add a check that the user is part of this conversation!
    return convo

@router.post("/conversations/{conversation_id}/messages/", response_model=schemas.MessageOut)
def send_message(conversation_id: int, message: schemas.MessageCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    convo = crud_chat.get_conversation_by_id(db, conversation_id)
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    msg = crud_chat.create_message(db, conversation_id=conversation_id, sender_id=current_user.id, text=message.text, reply_to_id=message.reply_to_id)
    if not msg.is_approved:
        raise HTTPException(status_code=400, detail="Message flagged by AI moderation. Please rephrase your message.")
    return msg

@router.get("/conversations/{conversation_id}/messages/", response_model=List[schemas.MessageOut])
def get_messages(conversation_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud_chat.get_conversation_messages(db, conversation_id)

@router.patch("/conversations/{conversation_id}/messages/{message_id}/edit/")
def edit_message(conversation_id: int, message_id: int, data: dict = Body(...), db: Session = Depends(get_db), user=Depends(get_current_user)):
    msg = db.query(models.Message).filter_by(id=message_id, conversation_id=conversation_id).first()
    if not msg or msg.sender_id != user.id:
        raise HTTPException(status_code=403, detail="Cannot edit this message")
    from datetime import datetime
    if (datetime.utcnow() - msg.created_at).total_seconds() > 20*60:
        raise HTTPException(status_code=403, detail="Edit window closed")
    msg.text = data.get("text", msg.text)
    msg.edited_at = datetime.utcnow()
    db.commit()
    db.refresh(msg)
    return {"success": True}

@router.patch("/conversations/{conversation_id}/messages/{message_id}/star/")
def star_message(conversation_id: int, message_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    msg = db.query(models.Message).filter_by(id=message_id, conversation_id=conversation_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.starred = not msg.starred
    db.commit()
    return {"success": True, "starred": msg.starred}

@router.delete("/conversations/{conversation_id}/messages/{message_id}/delete/")
def delete_message(conversation_id: int, message_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    msg = db.query(models.Message).filter_by(id=message_id, conversation_id=conversation_id).first()
    if not msg or msg.sender_id != user.id:
        raise HTTPException(status_code=403, detail="Cannot delete this message")
    db.delete(msg)
    db.commit()
    return {"success": True}

@router.post("/conversations/{conversation_id}/typing/")
def user_typing(conversation_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    crud_chat.update_typing_status(db, conversation_id)
    return {"success": True}

@router.get("/conversations/{conversation_id}/messages/", response_model=List[schemas.MessageOut])
def get_messages(conversation_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    msgs = crud_chat.get_conversation_messages(db, conversation_id)
    # Mark as seen
    for m in db.query(models.Message).filter_by(conversation_id=conversation_id).all():
        if m.sender_id != current_user.id and m.seen_at is None:
            m.seen_at = datetime.utcnow()
    db.commit()
    return msgs

@router.patch("/conversations/{conversation_id}/messages/{message_id}/react/")
def react_to_message(conversation_id: int, message_id: int, data: dict = Body(...), db: Session = Depends(get_db), user=Depends(get_current_user)):
    emoji = data.get("emoji")
    if not emoji:
        raise HTTPException(status_code=400, detail="Emoji required")
    msg = crud_chat.add_reaction(db, conversation_id, message_id, user.id, emoji)
    return {"success": True, "reactions": msg.reactions}

@router.get("/conversations/{conversation_id}/feature-status/", response_model=schemas.FeatureStatus)
def feature_status(conversation_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    convo = crud_chat.get_conversation_by_id(db, conversation_id)
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    progress = crud_chat.get_token_progress(db, conversation_id)
    self_tokens = progress.get(current_user.id, 0)
    # Get partner id
    partner_id = convo.landlord_id if current_user.id == convo.renter_id else convo.renter_id
    partner_tokens = progress.get(partner_id, 0)
    can_schedule = self_tokens >= 10 and partner_tokens >= 10
    can_priority = self_tokens >= 20 and partner_tokens >= 20
    unlocks = []
    if can_schedule:
        unlocks.append("schedule_visit")
    if can_priority:
        unlocks.append("priority_match")
    return schemas.FeatureStatus(
        messages_from_renter=self_tokens,
        partner_tokens=partner_tokens,
        can_schedule_visit=can_schedule,
        can_priority_match=can_priority,
        unlockable_features=unlocks,
    )
