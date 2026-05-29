import re

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 256


def validate_password_strength(password: str) -> None:
    if len(password) < PASSWORD_MIN_LENGTH:
        raise ValueError(f"Password must be at least {PASSWORD_MIN_LENGTH} characters.")
    if len(password) > PASSWORD_MAX_LENGTH:
        raise ValueError(f"Password must be at most {PASSWORD_MAX_LENGTH} characters.")
    if not re.search(r"[a-z]", password):
        raise ValueError("Include at least one lowercase letter.")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Include at least one uppercase letter.")
    if not re.search(r"\d", password):
        raise ValueError("Include at least one number.")
    if not re.search(r"[^\w\s]", password):
        raise ValueError("Include at least one symbol (e.g. !@#$%).")
