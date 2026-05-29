from datetime import timedelta

from typing import Optional

from fastapi import Request, Response

from app.core.config import settings


def set_auth_cookie(response: Response, token: str) -> None:
    max_age = int(timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES).total_seconds())
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=max_age,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.AUTH_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )


def extract_access_token(request: Request) -> Optional[str]:
    token = request.cookies.get(settings.AUTH_COOKIE_NAME)
    if token and token not in ("undefined", "null"):
        return token

    auth = request.headers.get("Authorization") or request.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        bearer = auth.split(" ", 1)[1].strip()
        if bearer and bearer not in ("undefined", "null"):
            return bearer
    return None
