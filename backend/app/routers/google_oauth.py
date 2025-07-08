#app/routers/google_oauth.py
from fastapi import APIRouter, HTTPException, Request
from authlib.integrations.starlette_client import OAuth
from starlette.responses import RedirectResponse
from app.core.config import settings
from app.db.session import SessionLocal
from app.crud import user as crud_user
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
async def login_via_google(request: Request):
    role = request.query_params.get("role", "renter")
    redirect_uri = str(request.url_for("auth_google_callback"))
    # Use 'state' to pass role, as recommended by OAuth
    return await oauth.google.authorize_redirect(request, redirect_uri, state=role)

@router.get("/api/auth/google/callback")
async def auth_google_callback(request: Request):
    state = request.query_params.get("state", "renter")
    role = state
    try:
        token = await oauth.google.authorize_access_token(request)
        userinfo = None
        try:
            if token.get("id_token"):
                userinfo = await oauth.google.parse_id_token(request, token)
        except Exception as e:
            logger.warning(f"Failed to parse id_token: {e}")
        if not userinfo:
            # Use the absolute Google userinfo URL to avoid protocol error!
            resp = await oauth.google.get(
                "https://openidconnect.googleapis.com/v1/userinfo", token=token
            )
            userinfo = resp.json()
        logger.info(f"Google userinfo: {userinfo}")
    except Exception as e:
        logger.error("Error fetching user info: %s", e)
        raise HTTPException(400, "OAuth error")

    email = userinfo.get("email")
    if not email:
        logger.error("No email from Google: %s", userinfo)
        raise HTTPException(400, "No email returned by Google.")

    db = SessionLocal()
    result = crud_user.create_google_user(db, email, role)
    if result == "email_only":
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=email_only")
    user = result if hasattr(result, "id") else result
    jwt_token = create_access_token({"user_id": user.id, "role": user.role})
    return RedirectResponse(f"{settings.FRONTEND_URL}/oauth-callback?token={jwt_token}")