import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "Yanhee e-Scan DMS API"
    APP_VERSION: str = "3.1.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    BASE_DIR: Path = BASE_DIR
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://admin:it240@10.200.120.33:5434/yanhee_escan_db"
    )
    
    # Vendor Integration API Security
    VENDOR_API_KEY: str = os.getenv("VENDOR_API_KEY", "yanhee-dms-vendor-sec-key-2026")
    
    # Storage
    STORAGE_DIR: Path = BASE_DIR / "storage" / "documents"
    THUMBNAILS_DIR: Path = BASE_DIR / "storage" / "thumbnails"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "*"
    ]
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)
