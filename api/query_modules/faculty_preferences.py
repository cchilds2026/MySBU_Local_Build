from __future__ import annotations

from typing import Any

from db import get_connection
from .shared import rows_to_dicts


def get_faculty_exam_preferences() -> list[dict[str, Any]]:
    sql = """
    SELECT
        fep.faculty_exam_preference_id,
        cs.source_section_id,
        c.subject_code,
        c.course_number,
        c.course_title,
        cs.section_code,
        fep.provided_to_asa_method,
        fep.return_method,
        fep.calculator_policy,
        fep.notes_sheet_allowed,
        fep.notes_sheet_details,
        fep.preferred_contact_method,
        fep.preferred_contact_value,
        fep.additional_information,
        fep.updated_at
    FROM asa.faculty_exam_preference fep
    JOIN asa.course_section cs
        ON fep.course_section_id = cs.course_section_id
    JOIN asa.course c
        ON cs.course_id = c.course_id
    ORDER BY c.subject_code, c.course_number, cs.section_code;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_faculty_exam_preference_by_section(source_section_id: str) -> dict[str, Any] | None:
    sql = """
    SELECT
        fep.faculty_exam_preference_id,
        cs.source_section_id,
        c.subject_code,
        c.course_number,
        c.course_title,
        cs.section_code,
        fep.provided_to_asa_method,
        fep.return_method,
        fep.calculator_policy,
        fep.notes_sheet_allowed,
        fep.notes_sheet_details,
        fep.preferred_contact_method,
        fep.preferred_contact_value,
        fep.additional_information,
        fep.updated_at
    FROM asa.faculty_exam_preference fep
    JOIN asa.course_section cs
        ON fep.course_section_id = cs.course_section_id
    JOIN asa.course c
        ON cs.course_id = c.course_id
    WHERE cs.source_section_id = ?;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, source_section_id)
        row = cursor.fetchone()
        if not row:
            return None
        return rows_to_dicts(cursor, [row])[0]


def upsert_faculty_exam_preference(
    source_section_id: str,
    payload: dict[str, Any],
    updated_by_user_id: str,
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
        notes_sheet_allowed = 1 if bool(payload.get("notes_sheet_allowed")) else 0

        cursor.execute(
            """
            SELECT faculty_exam_preference_id
            FROM asa.faculty_exam_preference
            WHERE course_section_id = ?;
            """,
            course_section_id,
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                """
                UPDATE asa.faculty_exam_preference
                SET
                    provided_to_asa_method = ?,
                    return_method = ?,
                    calculator_policy = ?,
                    notes_sheet_allowed = ?,
                    notes_sheet_details = ?,
                    preferred_contact_method = ?,
                    preferred_contact_value = ?,
                    additional_information = ?,
                    updated_at = SYSUTCDATETIME()
                WHERE course_section_id = ?;
                """,
                payload.get("provided_to_asa_method"),
                payload.get("return_method"),
                payload.get("calculator_policy"),
                notes_sheet_allowed,
                payload.get("notes_sheet_details"),
                payload.get("preferred_contact_method"),
                payload.get("preferred_contact_value"),
                payload.get("additional_information"),
                course_section_id,
            )
            audit_action = "faculty_exam_preference_updated"
        else:
            cursor.execute(
                """
                INSERT INTO asa.faculty_exam_preference (
                    course_section_id,
                    provided_to_asa_method,
                    return_method,
                    calculator_policy,
                    notes_sheet_allowed,
                    notes_sheet_details,
                    preferred_contact_method,
                    preferred_contact_value,
                    additional_information,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, SYSUTCDATETIME(), SYSUTCDATETIME());
                """,
                course_section_id,
                payload.get("provided_to_asa_method"),
                payload.get("return_method"),
                payload.get("calculator_policy"),
                notes_sheet_allowed,
                payload.get("notes_sheet_details"),
                payload.get("preferred_contact_method"),
                payload.get("preferred_contact_value"),
                payload.get("additional_information"),
            )
            audit_action = "faculty_exam_preference_created"

        safe_additional_information = str(payload.get("additional_information") or "").replace('"', "'")
        safe_contact_value = str(payload.get("preferred_contact_value") or "").replace('"', "'")

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
            "faculty_exam_preference",
            course_section_id,
            audit_action,
            "{}",
            (
                f'{{"source_section_id":"{source_section_id}",'
                f'"provided_to_asa_method":"{payload.get("provided_to_asa_method", "")}",'
                f'"return_method":"{payload.get("return_method", "")}",'
                f'"calculator_policy":"{payload.get("calculator_policy", "")}",'
                f'"preferred_contact_method":"{payload.get("preferred_contact_method", "")}",'
                f'"preferred_contact_value":"{safe_contact_value}",'
                f'"additional_information":"{safe_additional_information}"}}'
            ),
            updated_by_user_id,
        )

        connection.commit()

    return get_faculty_exam_preference_by_section(source_section_id)