from __future__ import annotations

from typing import Any

from db import get_connection
from .shared import rows_to_dicts


def get_exam_requests() -> list[dict[str, Any]]:
    sql = """
    SELECT
        er.exam_request_id,
        s.institution_student_id,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.email AS student_email,
        c.subject_code,
        c.course_number,
        c.course_title,
        cs.section_code,
        cs.source_section_id,
        er.requested_exam_date,
        er.requested_start_time,
        er.student_notes,
        er.workflow_status,
        er.staff_status,
        er.submitted_at
    FROM asa.exam_request er
    JOIN asa.student s
        ON er.student_id = s.student_id
    JOIN asa.course_section cs
        ON er.course_section_id = cs.course_section_id
    JOIN asa.course c
        ON cs.course_id = c.course_id
    ORDER BY er.requested_exam_date, er.requested_start_time;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_exam_requests_by_course(source_section_id: str) -> list[dict[str, Any]]:
    sql = """
    SELECT
        er.exam_request_id,
        s.institution_student_id,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.email AS student_email,
        c.subject_code,
        c.course_number,
        c.course_title,
        cs.section_code,
        cs.source_section_id,
        er.requested_exam_date,
        er.requested_start_time,
        er.student_notes,
        er.workflow_status,
        er.staff_status,
        er.submitted_at
    FROM asa.exam_request er
    JOIN asa.student s
        ON er.student_id = s.student_id
    JOIN asa.course_section cs
        ON er.course_section_id = cs.course_section_id
    JOIN asa.course c
        ON cs.course_id = c.course_id
    WHERE cs.source_section_id = ?
    ORDER BY er.requested_exam_date, er.requested_start_time;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, source_section_id)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_exam_request_by_id(exam_request_id: str) -> dict[str, Any] | None:
    sql = """
    SELECT
        er.exam_request_id,
        s.institution_student_id,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.email AS student_email,
        c.subject_code,
        c.course_number,
        c.course_title,
        cs.section_code,
        cs.source_section_id,
        i.first_name AS instructor_first_name,
        i.last_name AS instructor_last_name,
        i.email AS instructor_email,
        er.requested_exam_date,
        er.requested_start_time,
        er.student_notes,
        er.workflow_status,
        er.staff_status,
        er.submitted_at,
        fr.exam_request_faculty_response_id,
        fr.provided_to_asa_method,
        fr.return_method,
        fr.approved_exam_date,
        fr.approved_start_time,
        fr.duration_minutes,
        fr.calculator_policy,
        fr.notes_sheet_allowed,
        fr.notes_sheet_details,
        fr.preferred_contact_method,
        fr.preferred_contact_value,
        fr.additional_information,
        fr.approved_time_diff_acknowledged
    FROM asa.exam_request er
    JOIN asa.student s
        ON er.student_id = s.student_id
    JOIN asa.course_section cs
        ON er.course_section_id = cs.course_section_id
    JOIN asa.course c
        ON cs.course_id = c.course_id
    LEFT JOIN asa.instructor i
        ON cs.primary_instructor_id = i.instructor_id
    LEFT JOIN asa.exam_request_faculty_response fr
        ON er.exam_request_id = fr.exam_request_id
    WHERE er.exam_request_id = ?;
    """

    actions_sql = """
    SELECT
        exam_request_staff_action_id,
        action_type,
        from_status,
        to_status,
        staff_notes,
        acted_at,
        acted_by_user_id
    FROM asa.exam_request_staff_action
    WHERE exam_request_id = ?
    ORDER BY acted_at DESC;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, exam_request_id)
        row = cursor.fetchone()

        if not row:
            return None

        record = rows_to_dicts(cursor, [row])[0]

        cursor.execute(actions_sql, exam_request_id)
        record["staff_actions"] = rows_to_dicts(cursor, cursor.fetchall())

        return record


def update_exam_request_staff_status(
    exam_request_id: str,
    next_staff_status: str,
    staff_notes: str,
    acted_by_user_id: str,
) -> dict[str, Any] | None:
    allowed_staff_statuses = {
        "received_by_asa",
        "scheduled",
        "completed",
        "no_show",
        "cancelled",
    }

    if next_staff_status not in allowed_staff_statuses:
        raise ValueError("Invalid staff status")

    with get_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                exam_request_id,
                workflow_status,
                staff_status
            FROM asa.exam_request
            WHERE exam_request_id = ?;
            """,
            exam_request_id,
        )

        current_row = cursor.fetchone()
        if not current_row:
            return None

        current_exam_request_id, current_workflow_status, current_staff_status = current_row

        next_workflow_status = current_workflow_status
        if next_staff_status == "scheduled":
            next_workflow_status = "scheduled"
        elif next_staff_status == "completed":
            next_workflow_status = "completed"
        elif next_staff_status == "no_show":
            next_workflow_status = "no_show"
        elif next_staff_status == "cancelled":
            next_workflow_status = "cancelled"
        elif next_staff_status == "received_by_asa" and current_workflow_status == "submitted":
            next_workflow_status = "received_by_asa"

        cursor.execute(
            """
            UPDATE asa.exam_request
            SET
                staff_status = ?,
                workflow_status = ?,
                updated_at = SYSUTCDATETIME()
            WHERE exam_request_id = ?;
            """,
            next_staff_status,
            next_workflow_status,
            current_exam_request_id,
        )

        cursor.execute(
            """
            INSERT INTO asa.exam_request_staff_action (
                exam_request_id,
                action_type,
                from_status,
                to_status,
                staff_notes,
                acted_at,
                acted_by_user_id
            )
            VALUES (?, ?, ?, ?, ?, SYSUTCDATETIME(), ?);
            """,
            current_exam_request_id,
            next_staff_status,
            current_staff_status,
            next_staff_status,
            staff_notes,
            acted_by_user_id,
        )

        safe_staff_notes = (staff_notes or "").replace('"', "'")

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
            "exam_request",
            current_exam_request_id,
            "staff_status_updated",
            f'{{"workflow_status":"{current_workflow_status}","staff_status":"{current_staff_status}"}}',
            f'{{"workflow_status":"{next_workflow_status}","staff_status":"{next_staff_status}","staff_notes":"{safe_staff_notes}"}}',
            acted_by_user_id,
        )

        connection.commit()

    return get_exam_request_by_id(exam_request_id)


def delete_exam_request(
    exam_request_id: str,
    deleted_by_user_id: str,
) -> dict[str, Any] | None:
    existing_record = get_exam_request_by_id(exam_request_id)
    if not existing_record:
        return None

    with get_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM asa.exam_request_faculty_response
            WHERE exam_request_id = ?;
            """,
            exam_request_id,
        )

        cursor.execute(
            """
            DELETE FROM asa.exam_request_staff_action
            WHERE exam_request_id = ?;
            """,
            exam_request_id,
        )

        cursor.execute(
            """
            DELETE FROM asa.exam_request
            WHERE exam_request_id = ?;
            """,
            exam_request_id,
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
            "exam_request",
            exam_request_id,
            "deleted",
            '{}',
            f'{{"deleted_by_user_id":"{deleted_by_user_id}"}}',
            deleted_by_user_id,
        )

        connection.commit()

    return existing_record


def upsert_exam_request_faculty_response(
    exam_request_id: str,
    payload: dict[str, Any],
    submitted_by_user_id: str,
) -> dict[str, Any] | None:
    with get_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT exam_request_id, workflow_status
            FROM asa.exam_request
            WHERE exam_request_id = ?;
            """,
            exam_request_id,
        )
        current_row = cursor.fetchone()
        if not current_row:
            return None

        current_exam_request_id, current_workflow_status = current_row

        notes_sheet_allowed = payload.get("notes_sheet_allowed")
        if notes_sheet_allowed is not None:
            notes_sheet_allowed = 1 if bool(notes_sheet_allowed) else 0

        approved_time_diff_acknowledged = 1 if bool(payload.get("approved_time_diff_acknowledged")) else 0

        cursor.execute(
            """
            SELECT exam_request_faculty_response_id
            FROM asa.exam_request_faculty_response
            WHERE exam_request_id = ?;
            """,
            current_exam_request_id,
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                """
                UPDATE asa.exam_request_faculty_response
                SET
                    provided_to_asa_method = ?,
                    return_method = ?,
                    approved_exam_date = ?,
                    approved_start_time = ?,
                    duration_minutes = ?,
                    calculator_policy = ?,
                    notes_sheet_allowed = ?,
                    notes_sheet_details = ?,
                    preferred_contact_method = ?,
                    preferred_contact_value = ?,
                    additional_information = ?,
                    approved_time_diff_acknowledged = ?,
                    submitted_at = SYSUTCDATETIME(),
                    submitted_by_user_id = ?,
                    updated_at = SYSUTCDATETIME()
                WHERE exam_request_id = ?;
                """,
                payload.get("provided_to_asa_method"),
                payload.get("return_method"),
                payload.get("approved_exam_date"),
                payload.get("approved_start_time"),
                payload.get("duration_minutes"),
                payload.get("calculator_policy"),
                notes_sheet_allowed,
                payload.get("notes_sheet_details"),
                payload.get("preferred_contact_method"),
                payload.get("preferred_contact_value"),
                payload.get("additional_information"),
                approved_time_diff_acknowledged,
                submitted_by_user_id,
                current_exam_request_id,
            )
            audit_action = "faculty_response_updated"
        else:
            cursor.execute(
                """
                INSERT INTO asa.exam_request_faculty_response (
                    exam_request_id,
                    provided_to_asa_method,
                    return_method,
                    approved_exam_date,
                    approved_start_time,
                    duration_minutes,
                    calculator_policy,
                    notes_sheet_allowed,
                    notes_sheet_details,
                    preferred_contact_method,
                    preferred_contact_value,
                    additional_information,
                    approved_time_diff_acknowledged,
                    submitted_at,
                    submitted_by_user_id,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSUTCDATETIME(), ?, SYSUTCDATETIME(), SYSUTCDATETIME());
                """,
                current_exam_request_id,
                payload.get("provided_to_asa_method"),
                payload.get("return_method"),
                payload.get("approved_exam_date"),
                payload.get("approved_start_time"),
                payload.get("duration_minutes"),
                payload.get("calculator_policy"),
                notes_sheet_allowed,
                payload.get("notes_sheet_details"),
                payload.get("preferred_contact_method"),
                payload.get("preferred_contact_value"),
                payload.get("additional_information"),
                approved_time_diff_acknowledged,
                submitted_by_user_id,
            )
            audit_action = "faculty_response_created"

        cursor.execute(
            """
            UPDATE asa.exam_request
            SET
                workflow_status = 'faculty_approved',
                updated_at = SYSUTCDATETIME()
            WHERE exam_request_id = ?;
            """,
            current_exam_request_id,
        )

        safe_additional_information = str(payload.get("additional_information") or "").replace('"', "'")

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
            "exam_request",
            current_exam_request_id,
            audit_action,
            f'{{"workflow_status":"{current_workflow_status}"}}',
            f'{{"workflow_status":"faculty_approved","provided_to_asa_method":"{payload.get("provided_to_asa_method", "")}","return_method":"{payload.get("return_method", "")}","additional_information":"{safe_additional_information}"}}',
            submitted_by_user_id,
        )

        connection.commit()

    return get_exam_request_by_id(exam_request_id)