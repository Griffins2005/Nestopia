import base64
import io
from typing import Tuple

import pyotp
import qrcode

from app.core.config import settings


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def provisioning_uri(secret: str, email: str) -> str:
    return pyotp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name=settings.APP_NAME,
    )


def verify_totp_code(secret: str, code: str) -> bool:
    if not secret or not code:
        return False
    normalized = code.strip().replace(" ", "")
    if not normalized.isdigit() or len(normalized) != 6:
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(normalized, valid_window=1)


def qr_code_data_url(provisioning_url: str) -> str:
    img = qrcode.make(provisioning_url)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"
