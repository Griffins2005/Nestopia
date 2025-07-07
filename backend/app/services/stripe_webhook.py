import stripe
from fastapi import Request, HTTPException
from app.core.config import settings
from app.db.session import SessionLocal
from app.db.models import Token

stripe.api_key = settings.STRIPE_SECRET_KEY

async def handle_stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        metadata = intent.get("metadata", {})
        user_id = int(metadata.get("user_id", 0))
        package = metadata.get("package", "0_tokens")
        try:
            token_amount = int(package.split("_")[0])
        except ValueError:
            token_amount = 0

        db = SessionLocal()
        try:
            token_row = db.query(Token).filter(Token.user_id == user_id).first()
            if token_row:
                token_row.balance += token_amount
                db.commit()
        finally:
            db.close()

    return {"status": "success"}
