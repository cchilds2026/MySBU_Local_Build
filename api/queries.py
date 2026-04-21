from __future__ import annotations

from typing import Any

from db import get_connection
from settings import MOCK_CURRENT_USER


def rows_to_dicts(cursor, rows) -> list[dict[str, Any]]:
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in rows]


def get_mock_current_faculty_user() -> dict[str, Any]:
    return dict(MOCK_CURRENT_USER)


def get_faculty_courses() -> list[dict[str, Any]]:
    sql = """
    SELECT
        cs.source_section_id,
        cs.section_code,
        c.subject_code,
        c.course_number,
        c.course_title,
        t.term_name,
        CAST(0 AS INT) AS enrollment,
        i.first_name AS instructor_first_name,
        i.last_name AS instructor_last_name,
        i.email AS instructor_email
    FROM asa.course_section cs
    JOIN asa.course c
        ON cs.course_id = c.course_id
    LEFT JOIN asa.term t
        ON cs.term_id = t.term_id
    LEFT JOIN asa.instructor i
        ON cs.primary_instructor_id = i.instructor_id
    ORDER BY
        t.term_name,
        c.subject_code,
        c.course_number,
        cs.section_code;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_faculty_courses_by_instructor_email(instructor_email: str) -> list[dict[str, Any]]:
    sql = """
    SELECT
        cs.source_section_id,
        cs.section_code,
        c.subject_code,
        c.course_number,
        c.course_title,
        t.term_name,
        CAST(0 AS INT) AS enrollment,
        i.first_name AS instructor_first_name,
        i.last_name AS instructor_last_name,
        i.email AS instructor_email
    FROM asa.course_section cs
    JOIN asa.course c
        ON cs.course_id = c.course_id
    LEFT JOIN asa.term t
        ON cs.term_id = t.term_id
    LEFT JOIN asa.instructor i
        ON cs.primary_instructor_id = i.instructor_id
    WHERE LOWER(i.email) = LOWER(?)
    ORDER BY
        t.term_name,
        c.subject_code,
        c.course_number,
        cs.section_code;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, instructor_email)
        return rows_to_dicts(cursor, cursor.fetchall())

def get_faculty_letters_by_instructor_email(instructor_email: str) -> list[dict[str, Any]]:
    normalized_email = (instructor_email or "").strip().lower()

    seeded_letters = [
        {
            "faculty_letter_id": "letter-eng220-1",
            "source_section_id": "SEC-ENG220-01",
            "subject_code": "ENG",
            "course_number": "220",
            "course_title": "Writing in Society",
            "title": "Jordan Williams Accommodation Notice",
            "received_at": "2026-04-12",
            "status": "Unread",
            "student_name": "Jordan Williams",
            "student_id": "900123456",
            "student_email": "jordan.williams@sbu.edu",
            "summary": (
                "Student has approved accommodations on file through "
                "Accessibility Services and Accommodations for ENG-220."
            ),
            "accommodations": [
                "Extended Time on Exams",
                "Reduced Distraction Testing",
                "Note-Taking Support",
            ],
            "instructor_email": "mreed@sbu.edu",
        },
        {
            "faculty_letter_id": "letter-psy101-1",
            "source_section_id": "SEC-PSY101-01",
            "subject_code": "PSY",
            "course_number": "101",
            "course_title": "Intro to Psychology",
            "title": "Jordan Williams Accommodation Notice",
            "received_at": "2026-04-11",
            "status": "Read",
            "student_name": "Jordan Williams",
            "student_id": "900123456",
            "student_email": "jordan.williams@sbu.edu",
            "summary": (
                "Student has approved accommodations on file through "
                "Accessibility Services and Accommodations for PSY-101."
            ),
            "accommodations": [
                "Extended Time on Exams",
                "Reduced Distraction Testing",
            ],
            "instructor_email": "mreed@sbu.edu",
        },
        {
            "faculty_letter_id": "letter-fye100-1",
            "source_section_id": "SEC-FYE100-01",
            "subject_code": "FYE",
            "course_number": "100",
            "course_title": "First Year Seminar",
            "title": "Casey Martin Accommodation Notice",
            "received_at": "2026-04-08",
            "status": "Read",
            "student_name": "Casey Martin",
            "student_id": "900456789",
            "student_email": "casey.martin@sbu.edu",
            "summary": (
                "Student has approved accommodations on file through "
                "Accessibility Services and Accommodations for FYE-100."
            ),
            "accommodations": [
                "Accessible Seating",
                "Lecture Recording",
            ],
            "instructor_email": "mreed@sbu.edu",
        },
    ]

    return [
        {
            key: value
            for key, value in record.items()
            if key != "instructor_email"
        }
        for record in seeded_letters
        if record["instructor_email"].strip().lower() == normalized_email
    ]


def get_faculty_letter_debug_summary() -> dict[str, Any]:
    current_user = get_mock_current_faculty_user()
    current_email = str(current_user.get("email") or "").strip()

    matching_letters = (
        get_faculty_letters_by_instructor_email(current_email)
        if current_email
        else []
    )

    return {
        "mock_current_faculty_user": current_user,
        "matching_letter_count": len(matching_letters),
        "matching_letters": matching_letters,
    }

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
                mime_type,
                delivery_method,
                class_exam_date,
                class_exam_time,
                notes,
                uploaded_at,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME());
            """,
            course_section_id,
            uploaded_by_user_id,
            payload.get("title"),
            payload.get("file_name"),
            payload.get("storage_path"),
            payload.get("mime_type"),
            payload.get("delivery_method"),
            payload.get("class_exam_date"),
            payload.get("class_exam_time"),
            payload.get("notes"),
        )

        safe_notes = str(payload.get("notes") or "").replace('"', "'")
        safe_title = str(payload.get("title") or "").replace('"', "'")
        safe_file_name = str(payload.get("file_name") or "").replace('"', "'")

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

def get_instructor_emails() -> list[dict[str, Any]]:
    sql = """
    SELECT DISTINCT
        i.email,
        i.first_name,
        i.last_name
    FROM asa.instructor i
    WHERE i.email IS NOT NULL
      AND LTRIM(RTRIM(i.email)) <> ''
    ORDER BY i.email;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_faculty_course_debug_summary() -> dict[str, Any]:
    current_user = get_mock_current_faculty_user()
    current_email = str(current_user.get("email") or "").strip()

    instructor_emails = get_instructor_emails()
    matching_courses = (
        get_faculty_courses_by_instructor_email(current_email)
        if current_email
        else []
    )

    return {
        "mock_current_faculty_user": current_user,
        "instructor_emails": instructor_emails,
        "matching_course_count": len(matching_courses),
        "matching_courses": matching_courses,
    }

def get_uploaded_exams_by_section(source_section_id: str) -> list[dict[str, Any]]:
    sql = """
    SELECT
        ue.uploaded_exam_id,
        ue.title,
        ue.file_name,
        ue.storage_path,
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