import json
import os
from pathlib import Path
from typing import Union
from pydantic import field_validator
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
    CORS_ORIGINS: Union[list[str], str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "*"
    ]
    
    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Union[list[str], str]) -> list[str]:
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("[") and v_str.endswith("]"):
                import json
                try:
                    parsed = json.loads(v_str)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except Exception:
                    pass
            return [i.strip() for i in v_str.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(item).strip() for item in v if str(item).strip()]
        return ["*"]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)
