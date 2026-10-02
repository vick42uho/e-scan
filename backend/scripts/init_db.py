import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import engine, Base
from app.models.patient import Patient, Encounter
from app.models.document import DocumentCategory, Document, DocumentPage
from app.models.audit import AuditLog

def init_database():
    print(f"Connecting to database: {engine.url.database} on {engine.url.host}...")
    print("Creating all tables if they do not exist...")
    Base.metadata.create_all(bind=engine)
    print("All tables created successfully!")

if __name__ == "__main__":
    init_database()
