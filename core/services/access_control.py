from dataclasses import dataclass
from datetime import timedelta

from django.utils import timezone
from django.db import models as dj_models

from core.models import (
    VerificationState,
    UserVerification,
    TokenAccount,
    UserAccess,
)










# -----------------------------
# Decision object (frozen)
# -----------------------------

@dataclass(frozen=True)
class AccessDecision:
    allowed: bool
    reason: str
    grace: bool = False


# -----------------------------
# Canonical reason codes
# -----------------------------

AUTH_REQUIRED = "AUTH_REQUIRED"
VERIFICATION_MISSING = "VERIFICATION_MISSING"
USER_RESTRICTED = "USER_RESTRICTED"
USER_NOT_VERIFIED = "USER_NOT_VERIFIED"
NO_ACTIVE_ACCESS = "NO_ACTIVE_ACCESS"
ACCESS_VALID = "ACCESS_VALID"
ACCESS_IN_GRACE = "ACCESS_IN_GRACE"
ACCESS_EXPIRED_REQUIRES_RENEWAL = "ACCESS_EXPIRED_REQUIRES_RENEWAL"



# -----------------------------
# Permission Gate (authoritative)
# -----------------------------

def can_user_participate(user) -> AccessDecision:
    """
    Single source of truth for participation eligibility.
    No mutations. No DB writes. Deterministic.
    """

    # --- 0. Auth ---
    if not getattr(user, "is_authenticated", False):
        return AccessDecision(False, AUTH_REQUIRED)


    # --- 1. Verification ---
    try:
        verification = user.verification
    except AttributeError:
        return AccessDecision(False, VERIFICATION_MISSING)

    if verification.state == VerificationState.RESTRICTED:
        return AccessDecision(False, USER_RESTRICTED)

    if verification.state != VerificationState.VERIFIED:
        return AccessDecision(False, USER_NOT_VERIFIED)
    # NOTE:
    # Access is currently evaluated per-user.
    # Bulk / institution-level access aggregation MUST
    # resolve into UserAccess rows before reaching this gate.

    # --- 2. Access selection (most permissive first) ---
    access = (
        UserAccess.objects
        .filter(user=user, is_active=True)
        .order_by(
            dj_models.F("expires_at").desc(nulls_first=True)
        )
        .first()
    )

    if not access:
        return AccessDecision(False, NO_ACTIVE_ACCESS)

    now = timezone.now()

    # --- 3. Lifetime access ---
    if access.expires_at is None:
        return AccessDecision(True, ACCESS_VALID)

    # --- 4. Active access ---
    if access.expires_at >= now:
        return AccessDecision(True, ACCESS_VALID)

    # --- 5. Grace window (1 day) ---
    if now <= access.expires_at + timedelta(days=1):
        return AccessDecision(True, ACCESS_IN_GRACE, grace=True)

    # --- 6. Expired: requires renewal ---
    return AccessDecision(False, ACCESS_EXPIRED_REQUIRES_RENEWAL)

     


# ----------------------------------------
# Decision object
# ----------------------------------------

@dataclass(frozen=True)
class AccessDecision:
    allowed: bool
    reason: str
    grace: bool = False


# ----------------------------------------
# Canonical reason codes
# ----------------------------------------

AUTH_REQUIRED = "AUTH_REQUIRED"
VERIFICATION_MISSING = "VERIFICATION_MISSING"
USER_RESTRICTED = "USER_RESTRICTED"
USER_NOT_VERIFIED = "USER_NOT_VERIFIED"

NO_TOKEN_ACCOUNT = "NO_TOKEN_ACCOUNT"
INSUFFICIENT_TOKENS = "INSUFFICIENT_TOKENS"

ACCESS_VALID = "ACCESS_VALID"


# ----------------------------------------
# Permission Gate (authoritative)
# ----------------------------------------

def can_user_participate(user) -> AccessDecision:
    """
    Single source of truth for participation eligibility.

    - No DB writes
    - No side effects
    - Deterministic
    """

    # --- 0. Auth ---
    if not getattr(user, "is_authenticated", False):
        return AccessDecision(False, AUTH_REQUIRED)

    # --- 1. Verification ---
    try:
        verification = user.verification
    except UserVerification.DoesNotExist:
        return AccessDecision(False, VERIFICATION_MISSING)

    if verification.state == VerificationState.RESTRICTED:
        return AccessDecision(False, USER_RESTRICTED)

    if verification.state != VerificationState.VERIFIED:
        return AccessDecision(False, USER_NOT_VERIFIED)

    # --- 2. Token Account ---
    try:
        token_account = user.token_account
    except TokenAccount.DoesNotExist:
        return AccessDecision(False, NO_TOKEN_ACCOUNT)

    if token_account.available_tokens <= 0:
        return AccessDecision(False, INSUFFICIENT_TOKENS)

    return AccessDecision(True, ACCESS_VALID)

