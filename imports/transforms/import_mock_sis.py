from __future__ import annotations

import csv
import os
from dataclasses import dataclass
from pathlib import Path

import pyodbc
from dotenv import load_dotenv


@dataclass
class Config:
    driver: str
    server: str
    database: str
    schema: str
    auth: str
    project_root: Path
    mock_sis_dir: Path


def load_config() -> Config:
    env_path = Path(__file__).resolve().parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)

    driver = os.getenv("DB_DRIVER", "").strip()
    server = os.getenv("DB_SERVER", "").strip()
    database = os.getenv("DB_DATABASE", "").strip()
    schema = os.getenv("DB_SCHEMA", "asa").strip()
    auth = os.getenv("DB_AUTH", "").strip().lower()
    project_root_raw = os.getenv("PROJECT_ROOT", "").strip()

    if not driver:
        raise ValueError("DB_DRIVER is not set")
    if not server:
        raise ValueError("DB_SERVER is not set")
    if not database:
        raise ValueError("DB_DATABASE is not set")
    if not schema:
        raise ValueError("DB_SCHEMA is not set")
    if auth not in {"windows", "sql"}:
        raise ValueError("DB_AUTH must be 'windows' or 'sql'")
    if not project_root_raw:
        raise ValueError("PROJECT_ROOT is not set")

    project_root = Path(project_root_raw).expanduser().resolve()
    mock_sis_dir = project_root / "mock-sis"

    if not mock_sis_dir.exists():
        raise FileNotFoundError(f"mock-sis folder not found: {mock_sis_dir}")

    return Config(
        driver=driver,
        server=server,
        database=database,
        schema=schema,
        auth=auth,
        project_root=project_root,
        mock_sis_dir=mock_sis_dir,
    )


def build_connection_string(config: Config) -> str:
    if config.auth == "windows":
        return (
            f"DRIVER={{{config.driver}}};"
            f"SERVER={config.server};"
            f"DATABASE={config.database};"
            "Trusted_Connection=yes;"
            "TrustServerCertificate=yes;"
        )

    username = os.getenv("DB_USERNAME", "").strip()
    password = os.getenv("DB_PASSWORD", "").strip()

    if not username or not password:
        raise ValueError("DB_USERNAME and DB_PASSWORD are required for SQL authentication")

    return (
        f"DRIVER={{{config.driver}}};"
        f"SERVER={config.server};"
        f"DATABASE={config.database};"
        f"UID={username};"
        f"PWD={password};"
        "TrustServerCertificate=yes;"
    )


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(f"CSV file not found: {path}")

    with path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        return [
            {str(key).strip(): str(value).strip() for key, value in row.items()}
            for row in reader
        ]


def upsert_term(cursor: pyodbc.Cursor, schema: str, row: dict[str, str]) -> None:
    sql = f"""
    MERGE {schema}.term AS target
    USING (
        SELECT
            ? AS source_system,
            ? AS source_term_id,
            ? AS term_code,
            ? AS term_name
    ) AS source
    ON target.source_system = source.source_system
       AND target.source_term_id = source.source_term_id
    WHEN MATCHED THEN
        UPDATE SET
            term_code = source.term_code,
            term_name = source.term_name,
            updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
        INSERT (source_system, source_term_id, term_code, term_name, is_active)
        VALUES (source.source_system, source.source_term_id, source.term_code, source.term_name, 1);
    """
    cursor.execute(
        sql,
        row["source_system"],
        row["source_term_id"],
        row["term_code"],
        row["term_name"],
    )


def upsert_course(cursor: pyodbc.Cursor, schema: str, row: dict[str, str]) -> None:
    sql = f"""
    MERGE {schema}.course AS target
    USING (
        SELECT
            ? AS source_system,
            ? AS source_course_id,
            ? AS subject_code,
            ? AS course_number,
            ? AS course_title
    ) AS source
    ON target.source_system = source.source_system
       AND target.source_course_id = source.source_course_id
    WHEN MATCHED THEN
        UPDATE SET
            subject_code = source.subject_code,
            course_number = source.course_number,
            course_title = source.course_title,
            updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
        INSERT (source_system, source_course_id, subject_code, course_number, course_title)
        VALUES (source.source_system, source.source_course_id, source.subject_code, source.course_number, source.course_title);
    """
    cursor.execute(
        sql,
        row["source_system"],
        row["source_course_id"],
        row["subject_code"],
        row["course_number"],
        row["course_title"],
    )


def upsert_instructor(cursor: pyodbc.Cursor, schema: str, row: dict[str, str]) -> None:
    is_active = 1 if row.get("is_active", "true").lower() == "true" else 0

    sql = f"""
    MERGE {schema}.instructor AS target
    USING (
        SELECT
            ? AS source_system,
            ? AS source_instructor_id,
            ? AS first_name,
            ? AS last_name,
            ? AS email,
            ? AS phone,
            ? AS is_active
    ) AS source
    ON target.source_system = source.source_system
       AND target.source_instructor_id = source.source_instructor_id
    WHEN MATCHED THEN
        UPDATE SET
            first_name = source.first_name,
            last_name = source.last_name,
            email = source.email,
            phone = source.phone,
            is_active = source.is_active,
            last_imported_at = SYSUTCDATETIME(),
            updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
        INSERT (
            source_system,
            source_instructor_id,
            first_name,
            last_name,
            email,
            phone,
            is_active,
            last_imported_at
        )
        VALUES (
            source.source_system,
            source.source_instructor_id,
            source.first_name,
            source.last_name,
            source.email,
            source.phone,
            source.is_active,
            SYSUTCDATETIME()
        );
    """
    cursor.execute(
        sql,
        row["source_system"],
        row["source_instructor_id"],
        row["first_name"],
        row["last_name"],
        row.get("email") or None,
        row.get("phone") or None,
        is_active,
    )


def upsert_student(cursor: pyodbc.Cursor, schema: str, row: dict[str, str]) -> None:
    is_active = 1 if row.get("is_active", "true").lower() == "true" else 0

    sql = f"""
    MERGE {schema}.student AS target
    USING (
        SELECT
            ? AS source_system,
            ? AS source_student_id,
            ? AS institution_student_id,
            ? AS first_name,
            ? AS last_name,
            ? AS email,
            ? AS is_active
    ) AS source
    ON target.source_system = source.source_system
       AND target.source_student_id = source.source_student_id
    WHEN MATCHED THEN
        UPDATE SET
            institution_student_id = source.institution_student_id,
            first_name = source.first_name,
            last_name = source.last_name,
            email = source.email,
            is_active = source.is_active,
            last_imported_at = SYSUTCDATETIME(),
            updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
        INSERT (
            source_system,
            source_student_id,
            institution_student_id,
            first_name,
            last_name,
            email,
            is_active,
            last_imported_at
        )
        VALUES (
            source.source_system,
            source.source_student_id,
            source.institution_student_id,
            source.first_name,
            source.last_name,
            source.email,
            source.is_active,
            SYSUTCDATETIME()
        );
    """
    cursor.execute(
        sql,
        row["source_system"],
        row["source_student_id"],
        row.get("institution_student_id") or None,
        row["first_name"],
        row["last_name"],
        row.get("email") or None,
        is_active,
    )


def upsert_course_section(cursor: pyodbc.Cursor, schema: str, row: dict[str, str]) -> None:
    sql = f"""
    MERGE {schema}.course_section AS target
    USING (
        SELECT
            ? AS source_system,
            ? AS source_section_id,
            (
                SELECT course_id
                FROM {schema}.course
                WHERE source_system = ? AND source_course_id = ?
            ) AS course_id,
            (
                SELECT term_id
                FROM {schema}.term
                WHERE source_system = ? AND source_term_id = ?
            ) AS term_id,
            ? AS section_code,
            (
                SELECT instructor_id
                FROM {schema}.instructor
                WHERE source_system = ? AND source_instructor_id = ?
            ) AS primary_instructor_id,
            ? AS meeting_pattern,
            ? AS exam_date,
            ? AS exam_time
    ) AS source
    ON target.source_system = source.source_system
       AND target.source_section_id = source.source_section_id
    WHEN MATCHED THEN
        UPDATE SET
            course_id = source.course_id,
            term_id = source.term_id,
            section_code = source.section_code,
            primary_instructor_id = source.primary_instructor_id,
            meeting_pattern = source.meeting_pattern,
            exam_date = source.exam_date,
            exam_time = source.exam_time,
            last_imported_at = SYSUTCDATETIME(),
            updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
        INSERT (
            source_system,
            source_section_id,
            course_id,
            term_id,
            section_code,
            primary_instructor_id,
            meeting_pattern,
            exam_date,
            exam_time,
            last_imported_at
        )
        VALUES (
            source.source_system,
            source.source_section_id,
            source.course_id,
            source.term_id,
            source.section_code,
            source.primary_instructor_id,
            source.meeting_pattern,
            source.exam_date,
            source.exam_time,
            SYSUTCDATETIME()
        );
    """
    cursor.execute(
        sql,
        row["source_system"],
        row["source_section_id"],
        row["source_system"],
        row["source_course_id"],
        row["source_system"],
        row["source_term_id"],
        row["section_code"],
        row["source_system"],
        row["source_instructor_id"],
        row.get("meeting_pattern") or None,
        row.get("exam_date") or None,
        row.get("exam_time") or None,
    )


def upsert_enrollment(cursor: pyodbc.Cursor, schema: str, row: dict[str, str]) -> None:
    sql = f"""
    MERGE {schema}.enrollment AS target
    USING (
        SELECT
            (
                SELECT student_id
                FROM {schema}.student
                WHERE source_system = ? AND source_student_id = ?
            ) AS student_id,
            (
                SELECT course_section_id
                FROM {schema}.course_section
                WHERE source_system = ? AND source_section_id = ?
            ) AS course_section_id,
            ? AS enrollment_status
    ) AS source
    ON target.student_id = source.student_id
       AND target.course_section_id = source.course_section_id
    WHEN MATCHED THEN
        UPDATE SET
            enrollment_status = source.enrollment_status,
            last_imported_at = SYSUTCDATETIME(),
            updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
        INSERT (
            student_id,
            course_section_id,
            enrollment_status,
            last_imported_at
        )
        VALUES (
            source.student_id,
            source.course_section_id,
            source.enrollment_status,
            SYSUTCDATETIME()
        );
    """
    cursor.execute(
        sql,
        row["source_system"],
        row["source_student_id"],
        row["source_system"],
        row["source_section_id"],
        row["enrollment_status"],
    )


def import_instructors(cursor: pyodbc.Cursor, config: Config) -> int:
    rows = read_csv_rows(config.mock_sis_dir / "instructors.csv")
    for row in rows:
        upsert_instructor(cursor, config.schema, row)
    return len(rows)


def import_students(cursor: pyodbc.Cursor, config: Config) -> int:
    rows = read_csv_rows(config.mock_sis_dir / "students.csv")
    for row in rows:
        upsert_student(cursor, config.schema, row)
    return len(rows)


def import_course_sections(cursor: pyodbc.Cursor, config: Config) -> int:
    rows = read_csv_rows(config.mock_sis_dir / "course_sections.csv")
    for row in rows:
        upsert_term(cursor, config.schema, row)
        upsert_course(cursor, config.schema, row)
        upsert_course_section(cursor, config.schema, row)
    return len(rows)


def import_enrollments(cursor: pyodbc.Cursor, config: Config) -> int:
    rows = read_csv_rows(config.mock_sis_dir / "enrollments.csv")
    for row in rows:
        upsert_enrollment(cursor, config.schema, row)
    return len(rows)


def main() -> None:
    config = load_config()
    connection_string = build_connection_string(config)

    with pyodbc.connect(connection_string) as connection:
        cursor = connection.cursor()

        instructor_count = import_instructors(cursor, config)
        student_count = import_students(cursor, config)
        section_count = import_course_sections(cursor, config)
        enrollment_count = import_enrollments(cursor, config)

        connection.commit()

    print("Import complete.")
    print(f"Instructors imported: {instructor_count}")
    print(f"Students imported: {student_count}")
    print(f"Course sections imported: {section_count}")
    print(f"Enrollments imported: {enrollment_count}")


if __name__ == "__main__":
    main()