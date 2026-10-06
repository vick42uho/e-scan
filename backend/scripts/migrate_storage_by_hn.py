"""
Migration Script: Reorganize Document Storage by Patient HN
Yanhee e-Scan DMS

Usage:
  python -m scripts.migrate_storage_by_hn --dry-run   # Preview changes without modifying files or database
  python -m scripts.migrate_storage_by_hn             # Perform actual file move and database update
"""

import sys
import shutil
import argparse
from pathlib import Path
from sqlalchemy.orm import Session

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.storage import hn_folder, resolve_storage_path
from app.models.document import Document, DocumentPage

def migrate(dry_run: bool = False):
    print("=" * 70)
    print(f"[START] Starting Storage Migration by Patient HN ({'DRY-RUN MODE' if dry_run else 'LIVE MIGRATION'})")
    print(f"[PATH] Storage Root: {settings.STORAGE_DIR}")
    print("=" * 70)

    db: Session = SessionLocal()
    try:
        pages = (
            db.query(DocumentPage)
            .join(Document, DocumentPage.document_id == Document.id)
            .all()
        )
        print(f"Found {len(pages)} document page record(s) in database.\n")

        transferred_root_files = set()
        already_migrated_count = 0
        migrated_count = 0
        missing_count = 0
        error_count = 0

        for page in pages:
            doc = page.document
            if not doc or not doc.hn:
                print(f"[WARN] Page {page.id} (Doc: {page.document_id}): Missing HN! Skipping.")
                continue

            target_folder = hn_folder(doc.hn)
            desired_rel_path = f"{target_folder}/{page.file_name}"
            target_abs_path = settings.STORAGE_DIR / target_folder / page.file_name

            # Check if page is already migrated
            if page.file_path == desired_rel_path and target_abs_path.exists():
                already_migrated_count += 1
                continue

            # Resolve actual current file
            current_abs_path = resolve_storage_path(page.file_path, page.file_name)
            if not current_abs_path or not current_abs_path.exists():
                print(f"[MISSING] File not found on disk for Page {page.id} (Name: {page.file_name}, Stored: {page.file_path})")
                missing_count += 1
                continue

            # If file already at target location but DB not updated
            if current_abs_path.resolve() == target_abs_path.resolve():
                print(f"[DB SYNC] File already in {target_folder}/, updating DB relative path: {page.file_name}")
                if not dry_run:
                    page.file_path = desired_rel_path
                migrated_count += 1
                continue

            # Need to move/copy file
            print(f"[PLAN] [{'DRY-RUN' if dry_run else 'TRANSFER'}] {current_abs_path.name}")
            print(f"   From: {current_abs_path}")
            print(f"   To:   {target_abs_path}")
            print(f"   DB:   {page.file_path} -> {desired_rel_path}")

            if not dry_run:
                try:
                    target_abs_path.parent.mkdir(parents=True, exist_ok=True)
                    if not target_abs_path.exists():
                        shutil.copy2(str(current_abs_path), str(target_abs_path))
                    page.file_path = desired_rel_path
                    migrated_count += 1
                    if current_abs_path.parent.resolve() == settings.STORAGE_DIR.resolve():
                        transferred_root_files.add(current_abs_path)
                except Exception as err:
                    print(f"   [ERROR] transferring file: {err}")
                    error_count += 1
            else:
                migrated_count += 1

        if not dry_run:
            db.commit()
            print("\n[SUCCESS] Database changes committed successfully!")
            # Clean up root files that are now safely inside HN folders
            removed_from_root = 0
            for rf in transferred_root_files:
                try:
                    if rf.is_file() and rf.name != ".gitkeep":
                        rf.unlink()
                        removed_from_root += 1
                except Exception as del_err:
                    print(f"   [WARN] Could not remove source file from root: {del_err}")
            print(f"[CLEANUP] Safely removed {removed_from_root} original file(s) from root storage.")
        else:
            print("\n[NOTICE] DRY-RUN complete. No files were moved, database was NOT modified.")

        print("\n" + "=" * 70)
        print("MIGRATION SUMMARY:")
        print(f"   - Total page records:     {len(pages)}")
        print(f"   - Already organized:      {already_migrated_count}")
        print(f"   - Migrated / Updated:     {migrated_count}")
        print(f"   - Missing files:          {missing_count}")
        print(f"   - Errors:                 {error_count}")
        print("=" * 70)

        # Check for unmanaged orphan files at root
        root_files = [f for f in settings.STORAGE_DIR.iterdir() if f.is_file() and f.name != ".gitkeep"]
        if root_files:
            print(f"\n[INFO] Notice: {len(root_files)} file(s) remain in root storage folder (not linked to DB or skipped):")
            for rf in root_files[:10]:
                print(f"   - {rf.name}")
            if len(root_files) > 10:
                print(f"   ... and {len(root_files) - 10} more.")

    except Exception as e:
        db.rollback()
        print(f"\n[FAILED] Migration failed with exception: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate storage documents to patient HN directories")
    parser.add_argument("--dry-run", action="store_true", help="Perform preview run without moving files or updating DB")
    args = parser.parse_args()
    migrate(dry_run=args.dry_run)
