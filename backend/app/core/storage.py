import re
from pathlib import Path
from typing import Optional, Tuple
from app.core.config import settings

# Characters not allowed in folder names
_SAFE_FOLDER_CHARS = re.compile(r"[^A-Za-z0-9_\-]")

def hn_folder(hn: str) -> str:
    """
    Sanitizes patient HN to prevent path traversal (e.g., ../ or special chars)
    and returns a clean, safe folder name.
    """
    clean = _SAFE_FOLDER_CHARS.sub("_", (hn or "").strip())
    return clean if clean else "_unknown"

def build_storage_path(hn: str, filename: str) -> Tuple[Path, str]:
    """
    Constructs the target path for a document file inside the patient's HN directory.
    
    Returns:
        (abs_path, rel_path):
        - abs_path: Full Path object on filesystem (for writing/reading)
        - rel_path: Relative POSIX-style path 'HN/filename.ext' (to store in database)
    """
    folder = hn_folder(hn)
    rel_path = f"{folder}/{filename}"
    abs_path = settings.STORAGE_DIR / folder / filename
    
    # Ensure patient directory exists
    abs_path.parent.mkdir(parents=True, exist_ok=True)
    return abs_path, rel_path

def resolve_storage_path(stored_path: Optional[str], file_name: Optional[str] = None) -> Optional[Path]:
    """
    Resolves the actual file on disk. Supports:
    1. New relative path (e.g. '000000002/file.jpg')
    2. Legacy absolute path (e.g. 'D:\\...\\storage\\documents\\file.jpg')
    3. Legacy root fallback (e.g. settings.STORAGE_DIR / file_name)
    """
    candidates = []
    
    if stored_path:
        p = Path(stored_path)
        if p.is_absolute():
            candidates.append(p)
        else:
            candidates.append(settings.STORAGE_DIR / p)
            
    if file_name:
        candidates.append(settings.STORAGE_DIR / file_name)
        
    for cand in candidates:
        try:
            if cand.is_file():
                return cand
        except Exception:
            pass
            
    return None
