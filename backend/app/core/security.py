from datetime import datetime, timedelta
from hashlib import sha256

from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.schemas.auth import TokenPayload

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
reset_serializer = URLSafeTimedSerializer(settings.SECRET_KEY, salt="password-reset")

PASSWORD_MIN_LENGTH = 5
PASSWORD_MAX_LENGTH = 256


def _normalize_password(password: str) -> str:
    length = len(password)
    if length < PASSWORD_MIN_LENGTH or length > PASSWORD_MAX_LENGTH:
        raise ValueError(
            f"Password must be between {PASSWORD_MIN_LENGTH} and {PASSWORD_MAX_LENGTH} characters."
        )
    return sha256(password.encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    prepared = _normalize_password(plain_password)
    try:
        if pwd_context.verify(prepared, hashed_password):
            return True
    except ValueError:
        pass
    # legacy hashes (without pre-hash) fallback for existing users
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError:
        return False


def get_password_hash(password: str) -> str:
    prepared = _normalize_password(password)
    return pwd_context.hash(prepared)

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
