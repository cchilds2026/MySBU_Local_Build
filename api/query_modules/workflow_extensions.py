from __future__ import annotations

from typing import Any

from db import get_connection
from .shared import get_mock_current_faculty_user, rows_to_dicts
from .student_portal import get_student_by_email


INTAKE_PACKET_STATUSES = {
    "started",
    "registration_received",
    "documentation_pending",
    "documentation_received",
    "ready_to_schedule",
    "scheduled",
    "intake_complete",
    "closed",
    "cancelled",
}

AGREEMENT_STATUSES = {"pending", "signed", "expired", "revoked", "waived"}

LETTER_REQUEST_STATUSES = {
    "requested",
    "pending_staff_review",
    "ready_to_send",
    "sent",
    "cancelled",
    "superseded",
}

EXAM_ASSIGNMENT_STATUSES = {
    "draft",
    "scheduled",
    "rescheduled",
    "completed",
    "cancelled",
    "no_show",
}


def _clean(value: Any) -> str:
    return str(value or "").strip()


def _validate_status(status: str, allowed_statuses: set[str], label: str) -> str:
    status = _clean(status)

    if status not in allowed_statuses:
        raise ValueError(f"Invalid {label} status")

    return status


def _status_filter(
    column_name: str,
    statuses: list[str] | None,
    allowed_statuses: set[str],
    label: str,
) -> tuple[list[str], list[Any]]:
    if not statuses:
        return [], []

    clean_statuses = [
        _validate_status(status, allowed_statuses, label)
        for status in statuses
        if _clean(status)
    ]

    if not clean_statuses:
        return [], []

    placeholders = ", ".join(["?"] * len(clean_statuses))
    return [f"{column_name} IN ({placeholders})"], clean_statuses


def _fetch_one(cursor) -> dict[str, Any] | None:
    row = cursor.fetchone()
    if not row:
        return None
    return rows_to_dicts(cursor, [row])[0]


def _current_student() -> dict[str, Any] | None:
    current_user = get_mock_current_faculty_user()
    current_email = _clean(current_user.get("email"))

    if not current_email:
        return None

    return get_student_by_email(current_email)


def get_intake_packets(
    statuses: list[str] | None = None,
) -> list[dict[str, Any]]:
    filters, params = _status_filter(
        "sip.status",
        statuses,
        INTAKE_PACKET_STATUSES,
        "intake packet",
    )
    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    sql = f"""
    SELECT
        sip.student_intake_packet_id,
        sip.student_id,
        s.institution_student_id,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.email AS student_email,
        sip.student_registration_request_id,
        srr.request_type AS registration_request_type,
        sip.status,
        sip.registration_received_at,
        sip.documentation_received_at,
        sip.ready_to_schedule_at,
        sip.intake_scheduled_at,
        sip.intake_completed_at,
        sip.navigate_appointment_reference,
        sip.assigned_staff_user_id,
        sip.staff_notes,
        sip.created_at,
        sip.updated_at
    FROM asa.student_intake_packet sip
    JOIN asa.student s
        ON sip.student_id = s.student_id
    LEFT JOIN asa.student_registration_request srr
        ON sip.student_registration_request_id = srr.student_registration_request_id
    {where_clause}
    ORDER BY sip.updated_at DESC, sip.created_at DESC;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, *params)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_intake_packet_by_id(
    student_intake_packet_id: str,
) -> dict[str, Any] | None:
    sql = """
    SELECT
        sip.student_intake_packet_id,
        sip.student_id,
        s.institution_student_id,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.email AS student_email,
        sip.student_registration_request_id,
        srr.request_type AS registration_request_type,
        sip.status,
        sip.registration_received_at,
        sip.documentation_received_at,
        sip.ready_to_schedule_at,
        sip.intake_scheduled_at,
        sip.intake_completed_at,
        sip.navigate_appointment_reference,
        sip.assigned_staff_user_id,
        sip.staff_notes,
        sip.created_at,
        sip.updated_at
    FROM asa.student_intake_packet sip
    JOIN asa.student s
        ON sip.student_id = s.student_id
    LEFT JOIN asa.student_registration_request srr
        ON sip.student_registration_request_id = srr.student_registration_request_id
    WHERE sip.student_intake_packet_id = ?;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, student_intake_packet_id)
        return _fetch_one(cursor)


def create_intake_packet(
    payload: dict[str, Any],
    acted_by_user_id: str,
) -> dict[str, Any] | None:
    student_id = _clean(payload.get("student_id"))
    if not student_id:
        raise ValueError("student_id is required")

    status = _validate_status(
        payload.get("status", "started"),
        INTAKE_PACKET_STATUSES,
        "intake packet",
    )

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO asa.student_intake_packet (
                student_id,
                student_registration_request_id,
                status,
                navigate_appointment_reference,
                assigned_staff_user_id,
                staff_notes,
                created_at,
                updated_at
            )
            OUTPUT INSERTED.student_intake_packet_id
            VALUES (?, ?, ?, ?, ?, ?, SYSUTCDATETIME(), SYSUTCDATETIME());
            """,
            student_id,
            payload.get("student_registration_request_id"),
            status,
            payload.get("navigate_appointment_reference"),
            payload.get("assigned_staff_user_id") or acted_by_user_id,
            payload.get("staff_notes"),
        )
        row = cursor.fetchone()
        connection.commit()

    if not row:
        return None

    return get_intake_packet_by_id(str(row[0]))


def update_intake_packet_status(
    student_intake_packet_id: str,
    status: str,
    payload: dict[str, Any],
    acted_by_user_id: str,
) -> dict[str, Any] | None:
    status = _validate_status(status, INTAKE_PACKET_STATUSES, "intake packet")
    timestamp_columns = {
        "registration_received": "registration_received_at",
        "documentation_received": "documentation_received_at",
        "ready_to_schedule": "ready_to_schedule_at",
        "scheduled": "intake_scheduled_at",
        "intake_complete": "intake_completed_at",
    }

    set_clauses = [
        "status = ?",
        "updated_at = SYSUTCDATETIME()",
    ]
    params: list[Any] = [status]

    timestamp_column = timestamp_columns.get(status)
    if timestamp_column:
        set_clauses.append(f"{timestamp_column} = COALESCE({timestamp_column}, SYSUTCDATETIME())")

    if "navigate_appointment_reference" in payload:
        set_clauses.append("navigate_appointment_reference = ?")
        params.append(payload.get("navigate_appointment_reference"))

    if "assigned_staff_user_id" in payload:
        set_clauses.append("assigned_staff_user_id = ?")
        params.append(payload.get("assigned_staff_user_id") or acted_by_user_id)

    if "staff_notes" in payload:
        set_clauses.append("staff_notes = ?")
        params.append(payload.get("staff_notes"))

    params.append(student_intake_packet_id)

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            f"""
            UPDATE asa.student_intake_packet
            SET {', '.join(set_clauses)}
            WHERE student_intake_packet_id = ?;
            """,
            *params,
        )

        if cursor.rowcount == 0:
            return None

        connection.commit()

    return get_intake_packet_by_id(student_intake_packet_id)


def get_student_agreements(
    student_id: str | None = None,
    statuses: list[str] | None = None,
) -> list[dict[str, Any]]:
    filters, params = _status_filter(
        "sa.status",
        statuses,
        AGREEMENT_STATUSES,
        "agreement",
    )

    if student_id:
        filters.append("sa.student_id = ?")
        params.append(student_id)

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    sql = f"""
    SELECT
        sa.student_agreement_id,
        sa.student_id,
        s.institution_student_id,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.email AS student_email,
        sa.agreement_type,
        sa.status,
        sa.signed_at,
        sa.expires_at,
        sa.revoked_at,
        sa.due_at,
        sa.document_record_id,
        sa.related_accommodation_item_id,
        sa.notes,
        sa.created_at,
        sa.updated_at
    FROM asa.student_agreement sa
    JOIN asa.student s
        ON sa.student_id = s.student_id
    {where_clause}
    ORDER BY sa.updated_at DESC, sa.created_at DESC;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, *params)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_student_agreement_by_id(
    student_agreement_id: str,
) -> dict[str, Any] | None:
    sql = """
    SELECT
        sa.student_agreement_id,
        sa.student_id,
        s.institution_student_id,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.email AS student_email,
        sa.agreement_type,
        sa.status,
        sa.signed_at,
        sa.expires_at,
        sa.revoked_at,
        sa.due_at,
        sa.document_record_id,
        sa.related_accommodation_item_id,
        sa.notes,
        sa.created_at,
        sa.updated_at
    FROM asa.student_agreement sa
    JOIN asa.student s
        ON sa.student_id = s.student_id
    WHERE sa.student_agreement_id = ?;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, student_agreement_id)
        return _fetch_one(cursor)


def create_student_agreement(
    payload: dict[str, Any],
) -> dict[str, Any] | None:
    student_id = _clean(payload.get("student_id"))
    agreement_type = _clean(payload.get("agreement_type"))

    if not student_id:
        raise ValueError("student_id is required")
    if not agreement_type:
        raise ValueError("agreement_type is required")

    status = _validate_status(
        payload.get("status", "pending"),
        AGREEMENT_STATUSES,
        "agreement",
    )

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO asa.student_agreement (
                student_id,
                agreement_type,
                status,
                due_at,
                expires_at,
                document_record_id,
                related_accommodation_item_id,
                notes,
                created_at,
                updated_at
            )
            OUTPUT INSERTED.student_agreement_id
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, SYSUTCDATETIME(), SYSUTCDATETIME());
            """,
            student_id,
            agreement_type,
            status,
            payload.get("due_at"),
            payload.get("expires_at"),
            payload.get("document_record_id"),
            payload.get("related_accommodation_item_id"),
            payload.get("notes"),
        )
        row = cursor.fetchone()
        connection.commit()

    if not row:
        return None

    return get_student_agreement_by_id(str(row[0]))


def update_student_agreement_status(
    student_agreement_id: str,
    status: str,
    payload: dict[str, Any],
) -> dict[str, Any] | None:
    status = _validate_status(status, AGREEMENT_STATUSES, "agreement")

    set_clauses = [
        "status = ?",
        "updated_at = SYSUTCDATETIME()",
    ]
    params: list[Any] = [status]

    if status == "signed":
        set_clauses.append("signed_at = COALESCE(signed_at, SYSUTCDATETIME())")
    elif status == "revoked":
        set_clauses.append("revoked_at = COALESCE(revoked_at, SYSUTCDATETIME())")

    for column_name in ("expires_at", "due_at", "document_record_id", "notes"):
        if column_name in payload:
            set_clauses.append(f"{column_name} = ?")
            params.append(payload.get(column_name))

    params.append(student_agreement_id)

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            f"""
            UPDATE asa.student_agreement
            SET {', '.join(set_clauses)}
            WHERE student_agreement_id = ?;
            """,
            *params,
        )

        if cursor.rowcount == 0:
            return None

        connection.commit()

    return get_student_agreement_by_id(student_agreement_id)


def get_accommodation_letter_requests(
    statuses: list[str] | None = None,
    student_id: str | None = None,
) -> list[dict[str, Any]]:
    filters, params = _status_filter(
        "alr.status",
        statuses,
        LETTER_REQUEST_STATUSES,
        "letter request",
    )

    if student_id:
        filters.append("alr.student_id = ?")
        params.append(student_id)

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    sql = f"""
    SELECT
        alr.accommodation_letter_request_id,
        alr.student_id,
        s.institution_student_id,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.email AS student_email,
        alr.course_section_id,
        cs.source_section_id,
        cs.section_code,
        c.subject_code,
        c.course_number,
        c.course_title,
        alr.term_id,
        t.term_code,
        t.term_name,
        i.first_name AS instructor_first_name,
        i.last_name AS instructor_last_name,
        i.email AS instructor_email,
        alr.requested_at,
        alr.requested_by_user_id,
        alr.status,
        alr.student_acknowledged,
        alr.reviewed_at,
        alr.reviewed_by_user_id,
        alr.staff_notes,
        alr.accommodation_letter_id,
        alr.created_at,
        alr.updated_at
    FROM asa.accommodation_letter_request alr
    JOIN asa.student s
        ON alr.student_id = s.student_id
    JOIN asa.course_section cs
        ON alr.course_section_id = cs.course_section_id
    JOIN asa.course c
        ON cs.course_id = c.course_id
    JOIN asa.term t
        ON alr.term_id = t.term_id
    LEFT JOIN asa.instructor i
        ON cs.primary_instructor_id = i.instructor_id
    {where_clause}
    ORDER BY alr.requested_at DESC, alr.created_at DESC;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, *params)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_accommodation_letter_request_by_id(
    accommodation_letter_request_id: str,
) -> dict[str, Any] | None:
    sql = """
    SELECT
        alr.accommodation_letter_request_id,
        alr.student_id,
        s.institution_student_id,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.email AS student_email,
        alr.course_section_id,
        cs.source_section_id,
        cs.section_code,
        c.subject_code,
        c.course_number,
        c.course_title,
        alr.term_id,
        t.term_code,
        t.term_name,
        i.first_name AS instructor_first_name,
        i.last_name AS instructor_last_name,
        i.email AS instructor_email,
        alr.requested_at,
        alr.requested_by_user_id,
        alr.status,
        alr.student_acknowledged,
        alr.reviewed_at,
        alr.reviewed_by_user_id,
        alr.staff_notes,
        alr.accommodation_letter_id,
        alr.created_at,
        alr.updated_at
    FROM asa.accommodation_letter_request alr
    JOIN asa.student s
        ON alr.student_id = s.student_id
    JOIN asa.course_section cs
        ON alr.course_section_id = cs.course_section_id
    JOIN asa.course c
        ON cs.course_id = c.course_id
    JOIN asa.term t
        ON alr.term_id = t.term_id
    LEFT JOIN asa.instructor i
        ON cs.primary_instructor_id = i.instructor_id
    WHERE alr.accommodation_letter_request_id = ?;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, accommodation_letter_request_id)
        return _fetch_one(cursor)


def get_current_user_accommodation_letter_requests() -> list[dict[str, Any]]:
    student = _current_student()

    if not student:
        return []

    return get_accommodation_letter_requests(student_id=student["student_id"])


def _resolve_student_section(
    cursor,
    student_id: str,
    payload: dict[str, Any],
) -> dict[str, Any] | None:
    course_section_id = _clean(payload.get("course_section_id"))
    source_section_id = _clean(payload.get("source_section_id"))

    if not course_section_id and not source_section_id:
        raise ValueError("course_section_id or source_section_id is required")

    filters = ["e.student_id = ?"]
    params: list[Any] = [student_id]

    if course_section_id:
        filters.append("cs.course_section_id = ?")
        params.append(course_section_id)
    else:
        filters.append("cs.source_section_id = ?")
        params.append(source_section_id)

    cursor.execute(
        f"""
        SELECT
            cs.course_section_id,
            cs.term_id
        FROM asa.course_section cs
        JOIN asa.enrollment e
            ON cs.course_section_id = e.course_section_id
        WHERE {' AND '.join(filters)};
        """,
        *params,
    )
    return _fetch_one(cursor)


def create_current_user_accommodation_letter_request(
    payload: dict[str, Any],
    requested_by_user_id: str,
) -> dict[str, Any] | None:
    student = _current_student()

    if not student:
        return None

    student_acknowledged = 1 if bool(payload.get("student_acknowledged")) else 0
    if not student_acknowledged:
        raise ValueError("student_acknowledged is required")

    with get_connection() as connection:
        cursor = connection.cursor()
        section = _resolve_student_section(cursor, student["student_id"], payload)

        if not section:
            raise ValueError("No matching enrolled course section found")

        course_section_id = section["course_section_id"]
        term_id = section["term_id"]

        cursor.execute(
            """
            SELECT TOP 1 accommodation_letter_request_id
            FROM asa.accommodation_letter_request
            WHERE student_id = ?
              AND course_section_id = ?
              AND status NOT IN ('cancelled', 'superseded')
            ORDER BY requested_at DESC, created_at DESC;
            """,
            student["student_id"],
            course_section_id,
        )
        existing = cursor.fetchone()

        if existing:
            return get_accommodation_letter_request_by_id(str(existing[0]))

        cursor.execute(
            """
            INSERT INTO asa.accommodation_letter_request (
                student_id,
                course_section_id,
                term_id,
                requested_at,
                requested_by_user_id,
                status,
                student_acknowledged,
                staff_notes,
                created_at,
                updated_at
            )
            OUTPUT INSERTED.accommodation_letter_request_id
            VALUES (?, ?, ?, SYSUTCDATETIME(), ?, 'requested', ?, ?, SYSUTCDATETIME(), SYSUTCDATETIME());
            """,
            student["student_id"],
            course_section_id,
            term_id,
            requested_by_user_id,
            student_acknowledged,
            payload.get("staff_notes"),
        )
        row = cursor.fetchone()
        connection.commit()

    if not row:
        return None

    return get_accommodation_letter_request_by_id(str(row[0]))


def update_accommodation_letter_request_status(
    accommodation_letter_request_id: str,
    status: str,
    payload: dict[str, Any],
    reviewed_by_user_id: str,
) -> dict[str, Any] | None:
    status = _validate_status(status, LETTER_REQUEST_STATUSES, "letter request")

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            UPDATE asa.accommodation_letter_request
            SET
                status = ?,
                reviewed_at = SYSUTCDATETIME(),
                reviewed_by_user_id = ?,
                staff_notes = COALESCE(?, staff_notes),
                accommodation_letter_id = COALESCE(?, accommodation_letter_id),
                updated_at = SYSUTCDATETIME()
            WHERE accommodation_letter_request_id = ?;
            """,
            status,
            reviewed_by_user_id,
            payload.get("staff_notes"),
            payload.get("accommodation_letter_id"),
            accommodation_letter_request_id,
        )

        if cursor.rowcount == 0:
            return None

        connection.commit()

    return get_accommodation_letter_request_by_id(accommodation_letter_request_id)


def get_testing_rooms(include_inactive: bool = False) -> list[dict[str, Any]]:
    sql = """
    SELECT
        testing_room_id,
        room_code,
        room_name,
        location_description,
        capacity,
        is_active,
        notes,
        created_at,
        updated_at
    FROM asa.testing_room
    WHERE (? = 1 OR is_active = 1)
    ORDER BY is_active DESC, room_name;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, 1 if include_inactive else 0)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_testing_room_by_id(testing_room_id: str) -> dict[str, Any] | None:
    sql = """
    SELECT
        testing_room_id,
        room_code,
        room_name,
        location_description,
        capacity,
        is_active,
        notes,
        created_at,
        updated_at
    FROM asa.testing_room
    WHERE testing_room_id = ?;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, testing_room_id)
        return _fetch_one(cursor)


def create_testing_room(payload: dict[str, Any]) -> dict[str, Any] | None:
    room_code = _clean(payload.get("room_code"))
    room_name = _clean(payload.get("room_name"))

    if not room_code:
        raise ValueError("room_code is required")
    if not room_name:
        raise ValueError("room_name is required")

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO asa.testing_room (
                room_code,
                room_name,
                location_description,
                capacity,
                is_active,
                notes,
                created_at,
                updated_at
            )
            OUTPUT INSERTED.testing_room_id
            VALUES (?, ?, ?, ?, ?, ?, SYSUTCDATETIME(), SYSUTCDATETIME());
            """,
            room_code,
            room_name,
            payload.get("location_description"),
            payload.get("capacity"),
            0 if payload.get("is_active") is False else 1,
            payload.get("notes"),
        )
        row = cursor.fetchone()
        connection.commit()

    if not row:
        return None

    return get_testing_room_by_id(str(row[0]))


def update_testing_room(
    testing_room_id: str,
    payload: dict[str, Any],
) -> dict[str, Any] | None:
    allowed_fields = {
        "room_code",
        "room_name",
        "location_description",
        "capacity",
        "is_active",
        "notes",
    }
    set_clauses = ["updated_at = SYSUTCDATETIME()"]
    params: list[Any] = []

    for field in allowed_fields:
        if field in payload:
            set_clauses.append(f"{field} = ?")
            value = payload.get(field)
            if field == "is_active":
                value = 1 if bool(value) else 0
            params.append(value)

    if len(set_clauses) == 1:
        raise ValueError("No testing room fields supplied")

    params.append(testing_room_id)

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            f"""
            UPDATE asa.testing_room
            SET {', '.join(set_clauses)}
            WHERE testing_room_id = ?;
            """,
            *params,
        )

        if cursor.rowcount == 0:
            return None

        connection.commit()

    return get_testing_room_by_id(testing_room_id)


def get_exam_schedule_assignments(
    statuses: list[str] | None = None,
) -> list[dict[str, Any]]:
    filters, params = _status_filter(
        "esa.status",
        statuses,
        EXAM_ASSIGNMENT_STATUSES,
        "exam assignment",
    )
    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    sql = f"""
    SELECT
        esa.exam_schedule_assignment_id,
        esa.exam_request_id,
        esa.testing_room_id,
        tr.room_code,
        tr.room_name,
        esa.assigned_staff_user_id,
        esa.scheduled_start_at,
        esa.scheduled_end_at,
        esa.outlook_event_integration_event_id,
        esa.status,
        esa.staff_notes,
        esa.created_at,
        esa.updated_at,
        s.institution_student_id,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.email AS student_email,
        c.subject_code,
        c.course_number,
        c.course_title,
        cs.source_section_id,
        cs.section_code
    FROM asa.exam_schedule_assignment esa
    JOIN asa.exam_request er
        ON esa.exam_request_id = er.exam_request_id
    JOIN asa.student s
        ON er.student_id = s.student_id
    JOIN asa.course_section cs
        ON er.course_section_id = cs.course_section_id
    JOIN asa.course c
        ON cs.course_id = c.course_id
    LEFT JOIN asa.testing_room tr
        ON esa.testing_room_id = tr.testing_room_id
    {where_clause}
    ORDER BY esa.scheduled_start_at, esa.created_at;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, *params)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_exam_schedule_assignment_by_id(
    exam_schedule_assignment_id: str,
) -> dict[str, Any] | None:
    sql = """
    SELECT
        esa.exam_schedule_assignment_id,
        esa.exam_request_id,
        esa.testing_room_id,
        tr.room_code,
        tr.room_name,
        esa.assigned_staff_user_id,
        esa.scheduled_start_at,
        esa.scheduled_end_at,
        esa.outlook_event_integration_event_id,
        esa.status,
        esa.staff_notes,
        esa.created_at,
        esa.updated_at
    FROM asa.exam_schedule_assignment esa
    LEFT JOIN asa.testing_room tr
        ON esa.testing_room_id = tr.testing_room_id
    WHERE esa.exam_schedule_assignment_id = ?;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, exam_schedule_assignment_id)
        return _fetch_one(cursor)


def upsert_exam_schedule_assignment(
    exam_request_id: str,
    payload: dict[str, Any],
    acted_by_user_id: str,
) -> dict[str, Any] | None:
    status = _validate_status(
        payload.get("status", "scheduled"),
        EXAM_ASSIGNMENT_STATUSES,
        "exam assignment",
    )

    scheduled_start_at = payload.get("scheduled_start_at")
    if not scheduled_start_at:
        raise ValueError("scheduled_start_at is required")

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT exam_request_id, staff_status, workflow_status
            FROM asa.exam_request
            WHERE exam_request_id = ?;
            """,
            exam_request_id,
        )
        exam_row = cursor.fetchone()

        if not exam_row:
            return None

        current_exam_request_id, current_staff_status, current_workflow_status = exam_row

        cursor.execute(
            """
            SELECT TOP 1 exam_schedule_assignment_id
            FROM asa.exam_schedule_assignment
            WHERE exam_request_id = ?
            ORDER BY created_at DESC;
            """,
            current_exam_request_id,
        )
        existing_assignment = cursor.fetchone()

        if existing_assignment:
            assignment_id = existing_assignment[0]
            cursor.execute(
                """
                UPDATE asa.exam_schedule_assignment
                SET
                    testing_room_id = ?,
                    assigned_staff_user_id = ?,
                    scheduled_start_at = ?,
                    scheduled_end_at = ?,
                    status = ?,
                    staff_notes = ?,
                    updated_at = SYSUTCDATETIME()
                WHERE exam_schedule_assignment_id = ?;
                """,
                payload.get("testing_room_id"),
                payload.get("assigned_staff_user_id") or acted_by_user_id,
                scheduled_start_at,
                payload.get("scheduled_end_at"),
                status,
                payload.get("staff_notes"),
                assignment_id,
            )
        else:
            cursor.execute(
                """
                INSERT INTO asa.exam_schedule_assignment (
                    exam_request_id,
                    testing_room_id,
                    assigned_staff_user_id,
                    scheduled_start_at,
                    scheduled_end_at,
                    status,
                    staff_notes,
                    created_at,
                    updated_at
                )
                OUTPUT INSERTED.exam_schedule_assignment_id
                VALUES (?, ?, ?, ?, ?, ?, ?, SYSUTCDATETIME(), SYSUTCDATETIME());
                """,
                current_exam_request_id,
                payload.get("testing_room_id"),
                payload.get("assigned_staff_user_id") or acted_by_user_id,
                scheduled_start_at,
                payload.get("scheduled_end_at"),
                status,
                payload.get("staff_notes"),
            )
            assignment_id = cursor.fetchone()[0]

        exam_status_map = {
            "scheduled": "scheduled",
            "rescheduled": "scheduled",
            "completed": "completed",
            "cancelled": "cancelled",
            "no_show": "no_show",
        }
        next_exam_status = exam_status_map.get(status)

        if next_exam_status:
            cursor.execute(
                """
                UPDATE asa.exam_request
                SET
                    staff_status = ?,
                    workflow_status = ?,
                    updated_at = SYSUTCDATETIME()
                WHERE exam_request_id = ?;
                """,
                next_exam_status,
                next_exam_status,
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
                f"exam_assignment_{status}",
                current_staff_status,
                next_exam_status,
                payload.get("staff_notes"),
                acted_by_user_id,
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
                current_exam_request_id,
                "exam_schedule_assignment_upserted",
                f'{{"workflow_status":"{current_workflow_status}","staff_status":"{current_staff_status}"}}',
                f'{{"workflow_status":"{next_exam_status}","staff_status":"{next_exam_status}","assignment_status":"{status}"}}',
                acted_by_user_id,
            )

        connection.commit()

    return get_exam_schedule_assignment_by_id(str(assignment_id))
