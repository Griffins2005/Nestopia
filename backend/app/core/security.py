from datetime import datetime, timedelta
from hashlib import sha256

import bcrypt
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from jose import JWTError, jwt

from app.core.config import settings
from app.schemas.auth import TokenPayload

reset_serializer = URLSafeTimedSerializer(settings.SECRET_KEY, salt="password-reset")

PASSWORD_MIN_LENGTH = 5
PASSWORD_MAX_LENGTH = 256
BCRYPT_ROUNDS = 12


def _validate_password_length(password: str) -> None:
    length = len(password)
    if length < PASSWORD_MIN_LENGTH or length > PASSWORD_MAX_LENGTH:
        raise ValueError(
            f"Password must be between {PASSWORD_MIN_LENGTH} and {PASSWORD_MAX_LENGTH} characters."
        )


def _digest_for_bcrypt(password: str) -> bytes:
    """SHA-256 digest keeps bcrypt input under the 72-byte limit for any password length."""
    _validate_password_length(password)
    return sha256(password.encode("utf-8")).digest()


def _legacy_plain_for_bcrypt(password: str) -> bytes:
    _validate_password_length(password)
    return password.encode("utf-8")[:72]


def verify_password(plain_password: str, hashed_password) -> bool:
    if not plain_password or not hashed_password:
        return False

    hashed = hashed_password.encode("utf-8")

    # Current scheme: bcrypt(SHA-256 digest bytes)
    try:
        if bcrypt.checkpw(_digest_for_bcrypt(plain_password), hashed):
            return True
    except (ValueError, TypeError):
        pass

    # Previous scheme: bcrypt(SHA-256 hexdigest string) via passlib
    try:
        hex_digest = sha256(plain_password.encode("utf-8")).hexdigest().encode("utf-8")
        if bcrypt.checkpw(hex_digest, hashed):
            return True
    except (ValueError, TypeError):
        pass

    # Legacy: bcrypt(plain password), truncated to bcrypt's 72-byte limit
    try:
        return bcrypt.checkpw(_legacy_plain_for_bcrypt(plain_password), hashed)
    except (ValueError, TypeError):
        return False


def get_password_hash(password: str) -> str:
    digest = _digest_for_bcrypt(password)
    return bcrypt.hashpw(digest, bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode("utf-8")


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("user_id")
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise JWTError()
        return TokenPayload(user_id=user_id, role=role)
    except JWTError:
        raise


def create_mfa_challenge_token(user_id: int, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=5)
    to_encode = {"user_id": user_id, "role": role, "mfa": True, "exp": expire}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_mfa_challenge_token(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if not payload.get("mfa"):
            raise JWTError()
        user_id: int = payload.get("user_id")
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise JWTError()
        return TokenPayload(user_id=user_id, role=role)
    except JWTError:
        raise


def generate_password_reset_token(user_id: int, role: str) -> str:
    return reset_serializer.dumps({"user_id": user_id, "role": role})


def decode_password_reset_token(token: str) -> TokenPayload:
    try:
        data = reset_serializer.loads(
            token, max_age=settings.PASSWORD_RESET_TOKEN_MINUTES * 60
        )
        user_id = data.get("user_id")
        role = data.get("role")
        if user_id is None or role is None:
            raise BadSignature("Missing payload")
        return TokenPayload(user_id=user_id, role=role)
    except SignatureExpired as exc:
        raise ValueError("expired") from exc
    except BadSignature as exc:
        raise ValueError("invalid") from exc
