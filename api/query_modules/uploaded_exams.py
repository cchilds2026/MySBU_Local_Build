from __future__ import annotations

from typing import Any

from db import get_connection
from .shared import rows_to_dicts


def create_uploaded_exam(
    source_section_id: str,
    payload: dict[str, Any],
    uploaded_by_user_id: str,
) -> dict[str, Any] | None:
    with get_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT course_section_id
            FROM asa.course_section
            WHERE source_section_id = ?;
            """,
            source_section_id,
        )
        row = cursor.fetchone()

        if not row:
            return None

        course_section_id = row[0]

        cursor.execute(
            """
            INSERT INTO asa.uploaded_exam (
                course_section_id,
                uploaded_by_user_id,
                title,
                file_name,
                storage_path,
                sharepoint_file_url,
                mime_type,
                delivery_method,
                class_exam_date,
                class_exam_time,
                notes,
                uploaded_at,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME());
            """,
            course_section_id,
            uploaded_by_user_id,
            payload.get("title"),
            payload.get("file_name"),
            payload.get("storage_path"),
            payload.get("sharepoint_file_url"),
            payload.get("mime_type"),
            payload.get("delivery_method"),
            payload.get("class_exam_date"),
            payload.get("class_exam_time"),
            payload.get("notes"),
        )

        safe_notes = str(payload.get("notes") or "").replace('"', "'")
        safe_title = str(payload.get("title") or "").replace('"', "'")
        safe_file_name = str(payload.get("file_name") or "").replace('"', "'")
        safe_sharepoint_url = str(payload.get("sharepoint_file_url") or "").replace('"', "'")

        cursor.execute(
            """
            INSERT INTO asa.audit_event (
                entity_type,
                entity_id,
                action,
                old_value_json,
                new_value_json,
                acted_by_user_id,
                acted_at
            )
            VALUES (?, ?, ?, ?, ?, ?, SYSUTCDATETIME());
            """,
            "uploaded_exam",
            course_section_id,
            "uploaded_exam_created",
            "{}",
            (
                f'{{"source_section_id":"{source_section_id}",'
                f'"title":"{safe_title}",'
                f'"file_name":"{safe_file_name}",'
                f'"sharepoint_file_url":"{safe_sharepoint_url}",'
                f'"delivery_method":"{payload.get("delivery_method", "")}",'
                f'"class_exam_date":"{payload.get("class_exam_date", "")}",'
                f'"class_exam_time":"{payload.get("class_exam_time", "")}",'
                f'"notes":"{safe_notes}"}}'
            ),
            uploaded_by_user_id,
        )

        connection.commit()

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT TOP 1
                ue.uploaded_exam_id,
                ue.title,
                ue.file_name,
                ue.storage_path,
                ue.sharepoint_file_url,
                ue.mime_type,
                ue.delivery_method,
                ue.class_exam_date,
                ue.class_exam_time,
                ue.notes,
                ue.uploaded_at,
                cs.source_section_id,
                c.subject_code,
                c.course_number,
                c.course_title,
                cs.section_code
            FROM asa.uploaded_exam ue
            JOIN asa.course_section cs
                ON ue.course_section_id = cs.course_section_id
            JOIN asa.course c
                ON cs.course_id = c.course_id
            WHERE ue.course_section_id = ?
              AND ue.file_name = ?
              AND ue.title = ?
            ORDER BY ue.uploaded_at DESC, ue.created_at DESC;
            """,
            course_section_id,
            payload.get("file_name"),
            payload.get("title"),
        )
        row = cursor.fetchone()

        if not row:
            return None

        return rows_to_dicts(cursor, [row])[0]


def get_uploaded_exams() -> list[dict[str, Any]]:
    sql = """
    SELECT
        ue.uploaded_exam_id,
        ue.title,
        ue.file_name,
        ue.storage_path,
        ue.sharepoint_file_url,
        ue.mime_type,
        ue.delivery_method,
        ue.class_exam_date,
        ue.class_exam_time,
        ue.notes,
        ue.uploaded_at,
        cs.source_section_id,
        c.subject_code,
        c.course_number,
        c.course_title,
        cs.section_code
    FROM asa.uploaded_exam ue
    JOIN asa.course_section cs
        ON ue.course_section_id = cs.course_section_id
    JOIN asa.course c
        ON cs.course_id = c.course_id
    ORDER BY ue.uploaded_at DESC;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_uploaded_exams_by_section(source_section_id: str) -> list[dict[str, Any]]:
    sql = """
    SELECT
        ue.uploaded_exam_id,
        ue.title,
        ue.file_name,
        ue.storage_path,
        ue.sharepoint_file_url,
        ue.mime_type,
        ue.delivery_method,
        ue.class_exam_date,
        ue.class_exam_time,
        ue.notes,
        ue.uploaded_at,
        cs.source_section_id,
        c.subject_code,
        c.course_number,
        c.course_title,
        cs.section_code
    FROM asa.uploaded_exam ue
    JOIN asa.course_section cs
        ON ue.course_section_id = cs.course_section_id
    JOIN asa.course c
        ON cs.course_id = c.course_id
    WHERE cs.source_section_id = ?
    ORDER BY ue.uploaded_at DESC;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, source_section_id)
        return rows_to_dicts(cursor, cursor.fetchall())


def delete_uploaded_exam(
    uploaded_exam_id: str,
    deleted_by_user_id: str,
) -> dict[str, Any] | None:
    with get_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                ue.uploaded_exam_id,
                ue.title,
                ue.file_name,
                ue.storage_path,
                ue.sharepoint_file_url,
                ue.mime_type,
                ue.delivery_method,
                ue.class_exam_date,
                ue.class_exam_time,
                ue.notes,
                ue.uploaded_at,
                cs.source_section_id,
                c.subject_code,
                c.course_number,
                c.course_title,
                cs.section_code
            FROM asa.uploaded_exam ue
            JOIN asa.course_section cs
                ON ue.course_section_id = cs.course_section_id
            JOIN asa.course c
                ON cs.course_id = c.course_id
            WHERE ue.uploaded_exam_id = ?;
            """,
            uploaded_exam_id,
        )
        row = cursor.fetchone()

        if not row:
            return None

        existing_record = rows_to_dicts(cursor, [row])[0]

        cursor.execute(
            """
            DELETE FROM asa.uploaded_exam
            WHERE uploaded_exam_id = ?;
            """,
            uploaded_exam_id,
        )

        cursor.execute(
            """
            INSERT INTO asa.audit_event (
                entity_type,
                entity_id,
                action,
                old_value_json,
                new_value_json,
                acted_by_user_id,
                acted_at
            )
            VALUES (?, ?, ?, ?, ?, ?, SYSUTCDATETIME());
            """,
            "uploaded_exam",
            uploaded_exam_id,
            "uploaded_exam_deleted",
            "{}",
            f'{{"deleted_by_user_id":"{deleted_by_user_id}"}}',
            deleted_by_user_id,
        )

        connection.commit()

    return existing_record