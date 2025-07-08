#app/main.py
from fastapi import FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.routers import (
    auth,
    users,
    preferences,
    listing,
    matches,
    chat,
    tokens,
    payments,
    google_oauth, 
    wallet,
    blockchain,
)
from app.core.config import settings

app = FastAPI(title="RentMatch API")

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(UPLOADS_DIR)), name="static")

origins = [
    "http://localhost:3000",
    # production domains, etc.
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SessionMiddleware, secret_key=settings.SESSION_SECRET_KEY)

# Automatically create database tables on startup (for dev)
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(preferences.router)
app.include_router(listing.router)
app.include_router(matches.router)
app.include_router(chat.router)
app.include_router(tokens.router)
app.include_router(payments.router)
app.include_router(google_oauth.router)
app.include_router(wallet.router)
app.include_router(blockchain.router)

@app.get("/health")
def read_health():
    return {"status": "ok"}
