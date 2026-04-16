import random
import time
from datetime import datetime, timedelta
from app.config.settings import settings

# In-memory storage for development (replaces Redis)
otp_store = {}
attempts_store = {}


def generate_otp() -> str:
    """Generate a 6-digit OTP."""
    return str(random.randint(100000, 999999))


def store_otp(email: str, otp: str) -> None:
    """Store OTP in memory with expiration."""
    expiry_time = datetime.now() + timedelta(minutes=settings.OTP_EXPIRATION_MINUTES)
    otp_store[email] = {
        "otp": otp,
        "expires_at": expiry_time
    }
    attempts_store[email] = 0


def verify_otp(email: str, otp: str) -> bool:
    """Verify OTP and check attempts."""
    # Check attempts
    attempts = attempts_store.get(email, 0)
    if attempts >= settings.OTP_MAX_ATTEMPTS:
        return False
    
    # Check if OTP exists and not expired
    stored_data = otp_store.get(email)
    if not stored_data:
        return False
    
    if datetime.now() > stored_data["expires_at"]:
        # Clean up expired OTP
        otp_store.pop(email, None)
        attempts_store.pop(email, None)
        return False
    
    # Increment attempts
    attempts_store[email] = attempts + 1
    
    # Verify OTP
    if stored_data["otp"] == otp:
        # Clean up on success
        otp_store.pop(email, None)
        attempts_store.pop(email, None)
        return True
    
    return False


def delete_otp(email: str) -> None:
    """Delete OTP from memory."""
    otp_store.pop(email, None)
    attempts_store.pop(email, None)
