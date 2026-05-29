#app/routers/google_oauth.py
from fastapi import APIRouter, Request
from authlib.integrations.starlette_client import OAuth
from starlette.responses import RedirectResponse
from app.core.config import settings
from app.db.session import SessionLocal
from app.crud import user as crud_user
from app.core.security import create_access_token
import logging
from urllib.parse import urlencode

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

def redirect_to_login(error: str, message: str, role: str = "renter"):
    params = urlencode({"error": error, "message": message, "role": role})
    return RedirectResponse(f"{settings.FRONTEND_URL}/login?{params}")

@router.get("/api/auth/google/login")
async def login_via_google(request: Request):
    role = request.query_params.get("role", "renter")
    redirect_uri = settings.GOOGLE_REDIRECT_URI or f"{settings.FRONTEND_URL}/api/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri, state=role)

@router.get("/api/auth/google/callback")
async def auth_google_callback(request: Request):
    state = request.query_params.get("state", "renter")
    role = state

    oauth_error = request.query_params.get("error")
    if oauth_error:
        return redirect_to_login(
            "google_cancelled",
            "Google sign-in was canceled. You can try again or use email and password.",
            role,
        )

    try:
        token = await oauth.google.authorize_access_token(request)
        userinfo = None

        try:
            resp = await oauth.google.get(
                "https://openidconnect.googleapis.com/v1/userinfo", token=token
            )
            userinfo = resp.json()
        except Exception as e:
            logger.warning("Failed to fetch Google userinfo endpoint: %s", e)

        if not userinfo:
            try:
                userinfo = await oauth.google.parse_id_token(request, token)
            except Exception as e:
                logger.warning("Failed to parse Google id_token: %s", e)

        if not userinfo:
            raise ValueError("No Google profile returned.")

        logger.info(f"Google userinfo: {userinfo}")
    except Exception as e:
        logger.error("Error fetching user info: %s", e)
        return redirect_to_login(
            "google_failed",
            "We couldn’t finish Google sign-in. Please try again.",
            role,
        )

    email = userinfo.get("email")
    display_name = userinfo.get("name") or userinfo.get("given_name")
    if not email:
        logger.error("No email from Google: %s", userinfo)
        return redirect_to_login(
            "google_no_email",
            "Google did not share an email address. Try another Google account or use email and password.",
            role,
        )

    db = SessionLocal()
    try:
        result = crud_user.create_google_user(db, email, role, name=display_name)
        if result == "email_only":
            return redirect_to_login(
                "email_only",
                "This account uses email and password. Please log in with your email credentials.",
                role,
            )
        user = result if hasattr(result, "id") else result
        jwt_token = create_access_token({"user_id": user.id, "role": user.role})
        response = RedirectResponse(f"{settings.FRONTEND_URL}/oauth-callback")
        from app.core.cookies import set_auth_cookie
        set_auth_cookie(response, jwt_token)
        return response
    finally:
        db.close()