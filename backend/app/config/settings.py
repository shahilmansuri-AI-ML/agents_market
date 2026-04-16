from pydantic_settings import BaseSettings
from typing import Optional, List, Union
from pydantic import field_validator


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Agents Market"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str
    
    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # OTP
    OTP_EXPIRATION_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 5
    
    # Email (disabled for development)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    SMTP_FROM_NAME: str = "Agents Market"
    
    # Security
    PASSWORD_MIN_LENGTH: int = 8
    API_KEY_PREFIX_LENGTH: int = 8

    # GROQ Provider
    GROQ_API_KEY: Optional[str] = None
    GROQ_API_URL: str = "https://api.groq.com/v1"
    GROQ_DEFAULT_MODEL: str = "groq-1.0"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000"]
    
    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            # If it's a string, split by comma or return as single-item list
            if ',' in v:
                return [origin.strip() for origin in v.split(',')]
            return [v.strip()]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
