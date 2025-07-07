# app/routers/payments.py
# from fastapi import APIRouter, Request, HTTPException, status, Depends
# from stripe import Webhook, WebhookSignature, stripe

# from app.schemas.payment import CreatePaymentIntentRequest, PaymentIntentResponse
# from app.dependencies import get_db
# from app.core.config import settings
# from app.crud.token import get_token_balance
# from sqlalchemy.orm import Session
# import json

# stripe.api_key = settings.STRIPE_SECRET_KEY

# router = APIRouter(prefix="/api/payments", tags=["payments"])

# @router.post("/create-payment-intent", response_model=PaymentIntentResponse)
# def create_payment_intent(request: CreatePaymentIntentRequest):
#     try:
#         intent = stripe.PaymentIntent.create(
#             amount=request.amount,
#             currency=request.currency,
#             metadata=request.metadata,
#         )
#         return {"clientSecret": intent.client_secret}
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))


# @router.post("/webhook")
# async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
#     payload = await request.body()
#     sig_header = request.headers.get("stripe-signature")
#     try:
#         event = Webhook.construct_event(
#             payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
#         )
#     except WebhookSignature.SigVerificationError:
#         raise HTTPException(status_code=400, detail="Invalid signature")

#     if event["type"] == "payment_intent.succeeded":
#         intent = event["data"]["object"]
#         metadata = intent.get("metadata", {})
#         user_id = int(metadata.get("user_id", 0))
#         package = metadata.get("package", "")
#         # Determine token amount from package string. For example: "100_tokens"
#         try:
#             token_amount = int(package.split("_")[0])
#         except:
#             token_amount = 0

#         # Credit tokens off-chain
#         from app.crud.token import get_token_balance, spend_tokens
#         from app.crud.user import get_user_by_id

#         # Fetch user, update token balance
#         user = get_user_by_id(db, user_id)
#         if user:
#             token_row = db.query(get_token_balance).filter().first()  # placeholder
#             # Instead, write a small inline:
#             from app.db.models import Token
#             token_obj = db.query(Token).filter(Token.user_id == user_id).first()
#             if token_obj:
#                 token_obj.balance += token_amount
#                 db.commit()
#     return {"status": "success"}

from fastapi import APIRouter, Depends, HTTPException, Request
from app.dependencies import get_current_user, get_db
import requests

router = APIRouter(prefix="/api/payments", tags=["payments"])

@router.post("/initiate")
def initiate_payment(user = Depends(get_current_user)):
    # Initiate a 402pay payment (sandbox mode, pseudo code)
    payload = {
        "user_id": user.id,
        "amount": 50,  # or as required
        "description": "Rental application fee or deposit"
    }
    response = requests.post("https://api.402pay.com/initiate", json=payload)
    if response.status_code != 200:
        raise HTTPException(502, "402pay payment failed")
    return response.json()
