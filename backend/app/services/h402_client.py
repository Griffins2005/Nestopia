from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings
from app.schemas.payment import PaymentInitiateRequest, PaymentRequirement


class H402IntegrationError(Exception):
    """Raised when the facilitator cannot verify or settle a payment."""


def _quantize_amount(value: Decimal, decimals: int) -> Decimal:
    quantizer = Decimal("1") / (Decimal(10) ** decimals)
    return value.quantize(quantizer, rounding=ROUND_HALF_UP)


def build_payment_requirements(
    payload: PaymentInitiateRequest,
    *,
    payment: Optional[Any] = None,
) -> PaymentRequirement:
    """
    Construct the payment requirement document expected by the h402 client.
    """
    if not settings.H402_ENABLED:
        raise H402IntegrationError("h402 integration disabled via settings")

    if payload.token_amount_override is not None:
        stablecoin_amount = Decimal(str(payload.token_amount_override))
    else:
        # Convert smallest fiat unit (cents) into a dollar amount and reuse for the stablecoin.
        stablecoin_amount = Decimal(payload.amount) / Decimal("100")

    stablecoin_amount = _quantize_amount(
        stablecoin_amount, settings.H402_TOKEN_DECIMALS
    )

    resource_url = settings.H402_RESOURCE_BASE
    if not resource_url and payment is not None:
        resource_url = f"{settings.FRONTEND_URL.rstrip('/')}/payments/{payment.id}"

    extra: Dict[str, Any] = {
        "chainName": settings.H402_CHAIN_NAME,
    }
    if settings.H402_RPC_URL:
        extra["chainRpcUrl"] = settings.H402_RPC_URL

    requirement = PaymentRequirement(
        namespace=settings.H402_NAMESPACE,
        scheme="exact",
        networkId=settings.H402_NETWORK_ID,
        tokenAddress=settings.H402_TOKEN_ADDRESS,
        tokenSymbol=settings.H402_TOKEN_SYMBOL,
        tokenDecimals=settings.H402_TOKEN_DECIMALS,
        amountRequired=float(stablecoin_amount),
        amountRequiredFormat=settings.H402_AMOUNT_FORMAT,
        payToAddress=settings.H402_PAY_TO_ADDRESS,
        description=payload.description,
        resource=resource_url,
        extra=extra,
    )

    return requirement


def verify_payment_header(
    payment_header: str,
    requirement: PaymentRequirement,
) -> Dict[str, Any]:
    """
    Relay the signed payment header to the facilitator for chain verification.
    """
    if not settings.H402_ENABLED:
        raise H402IntegrationError("h402 integration disabled via settings")

    payload = {
        "payload": payment_header,
        "paymentRequirements": requirement.dict(exclude_none=True),
    }

    try:
        response = httpx.post(
            f"{settings.H402_FACILITATOR_URL.rstrip('/')}/verify",
            json=payload,
            timeout=30,
        )
    except httpx.HTTPError as exc:
        raise H402IntegrationError(f"Failed to contact facilitator: {exc}") from exc

    try:
        data = response.json()
    except ValueError as exc:
        raise H402IntegrationError("Facilitator returned malformed JSON") from exc

    if not response.is_success:
        message = data.get("error") or "Facilitator rejected payment"
        raise H402IntegrationError(message)

    if not data.get("isValid"):
        reason = data.get("invalidReason") or data.get("errorMessage") or "invalid_payment"
        raise H402IntegrationError(f"Payment invalid: {reason}")

    return data

