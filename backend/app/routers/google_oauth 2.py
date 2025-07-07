from fastapi import APIRouter, HTTPException, Request
from authlib.integrations.starlette_client import OAuth
from starlette.responses import RedirectResponse
from starlette.requests import Request as StarletteRequest
from app.core.config import settings
from app.db.session import SessionLocal
from app.crud.user import get_user_by_email, create_user
from app.core.security import create_access_token
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["google-oauth"])

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

@router.get("/api/auth/google/login")
async def login_via_google(request: StarletteRequest):
    # Optional role query
    role = request.query_params.get("role", "renter")
    redirect_uri = str(request.url_for("auth_google_callback")) + f"?role={role}"
    try:
        return await oauth.google.authorize_redirect(request, redirect_uri)
    except Exception as e:
        logger.error("Error in authorize_redirect: %s", e)
        raise HTTPException(500, "Failed to initiate Google OAuth login.")

@router.get("/api/auth/google/callback")
async def auth_google_callback(request: StarletteRequest):
    role = request.query_params.get("role", "renter")
    try:
        token = await oauth.google.authorize_access_token(request)
        if token.get("id_token"):
            userinfo = await oauth.google.parse_id_token(request, token)
        else:
            resp = await oauth.google.get("userinfo", token=token)
            userinfo = resp.json()
    except Exception as e:
        logger.error("Error fetching user info: %s", e)
        raise HTTPException(400, "OAuth error")

    email = userinfo.get("email")
    if not email:
        logger.error("No email from Google: %s", userinfo)
        raise HTTPException(400, "No email returned by Google.")

    db = SessionLocal()
    user = get_user_by_email(db, email)
    if not user:
        try:
            user = create_user(
                db,
                email=email,
                password=None,
                role=role,
                oauth_provider="google"
            )
        except Exception as e:
            logger.error("Error creating user: %s", e)
            raise HTTPException(500, "User creation failed.")

    jwt_token = create_access_token({"user_id": user.id, "role": user.role})
    return RedirectResponse(f"{settings.FRONTEND_URL}/oauth-callback?token={jwt_token}")
