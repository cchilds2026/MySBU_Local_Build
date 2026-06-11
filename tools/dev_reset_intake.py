#!/usr/bin/env python
"""Reset local ASA workflow data and seed one current-user student.

This script is intentionally development-only. It deletes workflow/prototype rows
from the local ASA schema so an intake can be simulated from a clean state.
It does not run automatically and requires explicit confirmation unless --yes is
provided.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
API_DIR = ROOT / "api"
sys.path.insert(0, str(API_DIR))

from db import get_connection  # noqa: E402
from settings import MOCK_CURRENT_USER  # noqa: E402

CONFIRMATION_PHRASE = "RESET_LOCAL_ASA"

WORKFLOW_TABLES: list[tuple[str, str]] = [
    ("asa", "exam_request_staff_action"),
    ("asa", "exam_request_faculty_response"),
    ("asa", "exam_request"),
    ("asa", "uploaded_exam"),
    ("asa", "faculty_exam_preference"),
    ("asa", "accommodation_letter"),
    ("asa", "accommodation_item"),
    ("asa", "accommodation_profile"),
    ("asa", "documentation_record"),
    ("asa", "student_registration_request"),
    ("asa", "student_portal_profile"),
    ("asa", "audit_event"),
    ("asa", "integration_event"),
]

DEV_REFERENCE_TABLES: list[tuple[str, str]] = [
    ("asa", "enrollment"),
    ("asa", "course_section"),
    ("asa", "course"),
    ("asa", "term"),
    ("asa", "instructor"),
]


def quote_name(name: str) -> str:
    return f"[{name.replace(']', ']]')}]"


def qualified(schema: str, table: str) -> str:
    return f"{quote_name(schema)}.{quote_name(table)}"


def table_exists(cursor, schema: str, table: str) -> bool:
    cursor.execute(
        """
        SELECT 1
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
          AND TABLE_TYPE = 'BASE TABLE';
        """,
        schema,
        table,
    )
    return cursor.fetchone() is not None


def table_columns(cursor, schema: str, table: str) -> set[str]:
    cursor.execute(
        """
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?;
        """,
        schema,
        table,
    )
    return {str(row[0]) for row in cursor.fetchall()}


def count_rows(cursor, schema: str, table: str) -> int | None:
    if not table_exists(cursor, schema, table):
        return None

    cursor.execute(f"SELECT COUNT(*) FROM {qualified(schema, table)};")
    return int(cursor.fetchone()[0])


def delete_all_rows(cursor, schema: str, table: str) -> int | None:
    if not table_exists(cursor, schema, table):
        return None

    before = count_rows(cursor, schema, table) or 0
    cursor.execute(f"DELETE FROM {qualified(schema, table)};")
    return before


def delete_dev_reference_rows(cursor, schema: str, table: str) -> int | None:
    if not table_exists(cursor, schema, table):
        return None

    columns = table_columns(cursor, schema, table)
    if "source_system" not in columns:
        return 0

    cursor.execute(
        f"SELECT COUNT(*) FROM {qualified(schema, table)} WHERE source_system = ?;",
        "dev_simulation",
    )
    before = int(cursor.fetchone()[0])

    cursor.execute(
        f"DELETE FROM {qualified(schema, table)} WHERE source_system = ?;",
        "dev_simulation",
    )
    return before


def parse_name(display_name: str, email: str) -> tuple[str, str]:
    parts = [part for part in display_name.strip().split() if part]
    if len(parts) >= 2:
        return parts[0], " ".join(parts[1:])
    if len(parts) == 1:
        return parts[0], "Student"

    local_part = email.split("@", 1)[0] if email else "demo.student"
    cleaned = local_part.replace(".", " ").replace("_", " ").strip().title()
    fallback_parts = [part for part in cleaned.split() if part]
    if len(fallback_parts) >= 2:
        return fallback_parts[0], " ".join(fallback_parts[1:])
    return cleaned or "Demo", "Student"


def ensure_current_user_student(cursor) -> str:
    schema = "asa"
    table = "student"
    if not table_exists(cursor, schema, table):
        raise RuntimeError("Required table asa.student does not exist. Run the schema setup first.")

    columns = table_columns(cursor, schema, table)
    email = str(MOCK_CURRENT_USER.get("email") or "").strip()
    display_name = str(MOCK_CURRENT_USER.get("display_name") or "").strip()
    first_name, last_name = parse_name(display_name, email)

    if not email:
        raise RuntimeError("MOCK_CURRENT_USER.email is empty. The intake simulation needs a current-user email.")

    cursor.execute(
        """
        SELECT student_id
        FROM asa.student
        WHERE LOWER(email) = LOWER(?);
        """,
        email,
    )
    existing = cursor.fetchone()

    update_values: dict[str, object] = {
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "institution_student_id": "DEV-INTAKE-001",
        "is_active": 1,
        "academic_level": "undergraduate",
        "lifecycle_status": "active",
        "deleted_at": None,
        "deleted_by_user_id": None,
        "deleted_reason": None,
        "updated_at": "SYSUTCDATETIME()",
    }

    if existing:
        assignments: list[str] = []
        params: list[object] = []
        for column, value in update_values.items():
            if column not in columns:
                continue
            if value == "SYSUTCDATETIME()":
                assignments.append(f"{quote_name(column)} = SYSUTCDATETIME()")
            else:
                assignments.append(f"{quote_name(column)} = ?")
                params.append(value)

        if assignments:
            params.append(existing[0])
            cursor.execute(
                f"""
                UPDATE asa.student
                SET {', '.join(assignments)}
                WHERE student_id = ?;
                """,
                *params,
            )
        return str(existing[0])

    insert_values: dict[str, object] = {
        "source_system": "dev_simulation",
        "source_student_id": "dev-current-user",
        "institution_student_id": "DEV-INTAKE-001",
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "is_active": 1,
        "academic_level": "undergraduate",
        "lifecycle_status": "active",
    }

    insert_columns = [column for column in insert_values if column in columns]
    params = [insert_values[column] for column in insert_columns]

    if "source_system" not in insert_columns or "source_student_id" not in insert_columns:
        raise RuntimeError("asa.student is missing source_system/source_student_id columns needed for a safe dev seed.")

    cursor.execute(
        f"""
        INSERT INTO asa.student ({', '.join(quote_name(column) for column in insert_columns)})
        OUTPUT inserted.student_id
        VALUES ({', '.join(['?'] * len(insert_columns))});
        """,
        *params,
    )
    return str(cursor.fetchone()[0])


def print_table_counts(label: str, cursor, tables: Iterable[tuple[str, str]]) -> None:
    print(f"\n{label}")
    print("-" * len(label))
    for schema, table in tables:
        count = count_rows(cursor, schema, table)
        if count is None:
            print(f"{schema}.{table}: missing")
        else:
            print(f"{schema}.{table}: {count}")


def reset_database(dry_run: bool, include_dev_reference: bool) -> None:
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("SELECT DB_NAME();")
        database_name = cursor.fetchone()[0]
        print(f"Connected database: {database_name}")

        print_table_counts("Workflow row counts before reset", cursor, WORKFLOW_TABLES)

        if dry_run:
            print("\nDry run only. No rows were deleted and no student was seeded.")
            return

        deleted_summary: list[tuple[str, int | None]] = []
        for schema, table in WORKFLOW_TABLES:
            deleted_summary.append((f"{schema}.{table}", delete_all_rows(cursor, schema, table)))

        if include_dev_reference:
            for schema, table in DEV_REFERENCE_TABLES:
                deleted_summary.append((f"{schema}.{table} dev rows", delete_dev_reference_rows(cursor, schema, table)))

        student_id = ensure_current_user_student(cursor)
        connection.commit()

        print("\nDeleted rows")
        print("------------")
        for table_name, count in deleted_summary:
            if count is None:
                print(f"{table_name}: skipped; table missing")
            else:
                print(f"{table_name}: {count}")

        print_table_counts("Workflow row counts after reset", cursor, WORKFLOW_TABLES)
        print(f"\nSeeded/current-user student_id: {student_id}")
        print("Ready: start Flask, open the student registration form, and submit a clean intake request.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Reset local ASA workflow data and seed the current mock-user student.")
    parser.add_argument("--yes", action="store_true", help="Skip interactive confirmation.")
    parser.add_argument("--dry-run", action="store_true", help="Show row counts without deleting or seeding.")
    parser.add_argument(
        "--include-dev-reference",
        action="store_true",
        help="Also delete dev_simulation rows from reference/import-style tables.",
    )
    args = parser.parse_args()

    if not args.yes and not args.dry_run:
        print("This will delete local ASA workflow/prototype rows from the configured database.")
        print(f"Type {CONFIRMATION_PHRASE} to continue.")
        confirmation = input("> ").strip()
        if confirmation != CONFIRMATION_PHRASE:
            print("Reset cancelled.")
            return 1

    reset_database(dry_run=args.dry_run, include_dev_reference=args.include_dev_reference)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
