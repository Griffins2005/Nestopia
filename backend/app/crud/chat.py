# app/crud/chat.py
from sqlalchemy.orm import Session
from app.db import models
from app.schemas.chat import ConversationOut, UserOut, MessageOut
from app.schemas import chat as schemas
# from openai import OpenAI
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()
# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
# TOXICITY_THRESHOLD = 0.7 

def is_meaningful(text: str) -> bool:
    return len(text.strip()) >= 6

def get_or_create_token_progress(db: Session, conversation_id: int, user_id: int):
    from app.db.models import ConversationToken
    token = db.query(ConversationToken).filter_by(conversation_id=conversation_id, user_id=user_id).first()
    if not token:
        token = ConversationToken(conversation_id=conversation_id, user_id=user_id, tokens=0)
        db.add(token)
        db.commit()
        db.refresh(token)
    return token

def create_message(db: Session, conversation_id: int, sender_id: int, text: str, reply_to_id: int = None):
    is_valid = is_meaningful(text)
    msg = models.Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        text=text,
        is_approved=True, 
        reply_to_id=reply_to_id
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Only count meaningful messages
    if is_valid:
        token_row = get_or_create_token_progress(db, conversation_id, sender_id)
        token_row.tokens += 1
        db.commit()
    return msg

def get_token_progress(db: Session, conversation_id: int):
    # Returns dict: {user_id: token_count, ...}
    from app.db.models import ConversationToken
    token_rows = db.query(ConversationToken).filter_by(conversation_id=conversation_id).all()
    return {t.user_id: t.tokens for t in token_rows}


def get_or_create_conversation(db: Session, renter_id: int, landlord_id: int, listing_id: int):
    convo = db.query(models.Conversation).filter_by(
        renter_id=renter_id, landlord_id=landlord_id, listing_id=listing_id
    ).first()
    if convo:
        return convo
    convo = models.Conversation(
        renter_id=renter_id, landlord_id=landlord_id, listing_id=listing_id
    )
    db.add(convo)
    db.commit()
    db.refresh(convo)
    return convo

def get_conversation_by_id(db: Session, convo_id: int):
    return db.query(models.Conversation).filter_by(id=convo_id).first()


def get_user_conversations(db: Session, user_id: int):
    from app.db.models import Conversation, Listing
    convos = db.query(Conversation).filter(
        (Conversation.renter_id == user_id) | (Conversation.landlord_id == user_id)
    ).order_by(Conversation.created_at.desc()).all()

    results = []
    for convo in convos:
        partner = convo.landlord if convo.renter_id == user_id else convo.renter
        partner_obj = {
            "id": partner.id,
            "name": partner.name or "",
            "email": partner.email or "",
            "profilePicture": partner.profilePicture or "",
            "created_at": partner.created_at,
        }
        out = ConversationOut.from_orm(convo).dict()
        listing = db.query(Listing).filter_by(id=convo.listing_id).first()
        out["property_title"] = listing.title if listing else ""
        out["partner_name"] = partner.name or ""
        out["partner_email"] = partner.email or ""
        out["partner_avatar"] = partner.profilePicture or ""
        out["partner"] = partner_obj
        out["self_user_id"] = user_id

        # Add last message preview & last_time
        last_msg = (
            db.query(models.Message)
            .filter_by(conversation_id=convo.id, is_approved=True)
            .order_by(models.Message.created_at.desc())
            .first()
        )
        out["last_message"] = last_msg.text if last_msg else ""
        out["last_time"] = last_msg.created_at.strftime("%I:%M %p") if last_msg else ""
        out["unread_count"] = 0  # TODO: Replace with real unread logic if needed

        results.append(out)
    return results

def get_conversation_messages(db: Session, conversation_id: int):
    from app.db.models import Message
    msgs = db.query(Message).filter_by(conversation_id=conversation_id, is_approved=True).order_by(Message.created_at).all()
    result = []
    for m in msgs:
        sender = m.sender
        msg_out = MessageOut.from_orm(m).dict()
        # Attach reply context if present
        if m.reply_to_id:
            reply = db.query(Message).filter_by(id=m.reply_to_id).first()
            if reply:
                sender_name = reply.sender.name if reply.sender else ""
                msg_out["reply_to"] = { "id": reply.id,  "text": reply.text, "sender_id": reply.sender_id, "sender_name": sender_name}
        msg_out['sender'] = {
            "id": sender.id,
            "name": sender.name or "",
            "profilePicture": sender.profilePicture or "",
            "created_at": sender.created_at
        }
        result.append(msg_out)
    return result

def update_typing_status(db: Session, conversation_id: int):
    convo = db.query(models.Conversation).filter_by(id=conversation_id).first()
    convo.last_typing_at = datetime.utcnow()
    db.commit()

def add_reaction(db: Session, conversation_id: int, message_id: int, user_id: int, emoji: str):
    msg = db.query(models.Message).filter_by(id=message_id, conversation_id=conversation_id).first()
    if not msg.reactions:
        msg.reactions = []
    # Remove existing emoji for this user (optional)
    msg.reactions = [r for r in msg.reactions if r.get("user_id") != user_id or r.get("emoji") != emoji]
    msg.reactions.append({"user_id": user_id, "emoji": emoji})
    db.commit()
    return msg

def count_renter_messages_in_convo(db: Session, conversation_id: int, renter_id: int):
    return db.query(models.Message).filter_by(conversation_id=conversation_id, sender_id=renter_id, is_approved=True).count()
