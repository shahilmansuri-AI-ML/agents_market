import hashlib
import secrets
from app.config.security import hash_password, verify_password


def hash_api_key(api_key: str) -> str:
    """Hash an API key using SHA-256."""
    return hashlib.sha256(api_key.encode()).hexdigest()


def generate_api_key(prefix_length: int = 8) -> tuple[str, str, str]:
    """
    Generate a new API key.
    Returns: (full_key, prefix, hash)
    """
    random_part = secrets.token_urlsafe(32)
    prefix = secrets.token_urlsafe(prefix_length)[:prefix_length]
    full_key = f"{prefix}.{random_part}"
    key_hash = hash_api_key(full_key)
    return full_key, prefix, key_hash


def verify_api_key(plain_key: str, key_hash: str) -> bool:
    """Verify an API key against its hash."""
    return hash_api_key(plain_key) == key_hash


def hash_password_util(password: str) -> str:
    """Wrapper for password hashing."""
    return hash_password(password)


def verify_password_util(plain_password: str, hashed_password: str) -> bool:
    """Wrapper for password verification."""
    return verify_password(plain_password, hashed_password)
