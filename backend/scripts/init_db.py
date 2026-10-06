import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from app.core.database import engine, Base
from app.models.patient import Patient, Encounter
from app.models.document import DocumentCategory, Document, DocumentPage
from app.models.audit import AuditLog

def ensure_database_exists():
    """Check if the target database exists; if not, connect to 'postgres' and create it."""
    target_db = engine.url.database
    host = engine.url.host
    port = engine.url.port or 5432

    print(f"Checking if database '{target_db}' exists on {host}:{port}...")

    # Try connecting to postgres administrative database to check/create target database
    admin_url = engine.url.set(database="postgres")
    try:
        admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
        with admin_engine.connect() as conn:
            result = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :dbname"),
                {"dbname": target_db}
            ).scalar()

            if not result:
                print(f"Database '{target_db}' does not exist. Creating database now...")
                conn.execute(text(f'CREATE DATABASE "{target_db}" WITH ENCODING "UTF8"'))
                print(f"Database '{target_db}' created successfully!")
            else:
                print(f"Database '{target_db}' already exists.")
        admin_engine.dispose()
    except Exception as e:
        print(f"Notice: Could not auto-create database via admin db ({e}).")
        print(f"Attempting direct connection to '{target_db}'...")

def init_database():
    ensure_database_exists()
    print(f"Connecting to database: {engine.url.database} on {engine.url.host}:{engine.url.port}...")
    print("Creating all tables if they do not exist...")
    Base.metadata.create_all(bind=engine)
    print("All tables created successfully!")

if __name__ == "__main__":
    init_database()
