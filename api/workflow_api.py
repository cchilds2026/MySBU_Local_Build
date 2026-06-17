from __future__ import annotations

from typing import Any

from flask import Blueprint, jsonify, request

from db import get_connection
from query_modules.shared import get_mock_current_faculty_user, rows_to_dicts
from query_modules.student_portal import get_student_by_email


workflow_bp = Blueprint("workflow", __name__, url_prefix="/api")

INTAKE_STATUSES = {
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
LETTER_STATUSES = {
    "requested",
    "pending_staff_review",
    "ready_to_send",
    "sent",
    "cancelled",
    "superseded",
}
ASSIGNMENT_STATUSES = {
    "draft",
    "scheduled",
    "rescheduled",
    "completed",
    "cancelled",
    "no_show",
}


def _clean(value: Any) -> str:
    return str(value or "").strip()


def _current_user_id() -> str:
    user = get_mock_current_faculty_user()
    return _clean(user.get("user_id") or user.get("email") or "portal:unknown")


def _require_staff():
    user = get_mock_current_faculty_user()
    roles = user.get("roles") if isinstance(user.get("roles"), list) else []
    return user if "asa_staff" in roles else None


def _staff_required():
    return jsonify({"error": "ASA staff access required"}), 403


def _statuses() -> list[str]:
    raw_status = request.args.get("status", "").strip()
    return [item.strip() for item in raw_status.split(",") if item.strip()]


def _validate_status(status: str, allowed: set[str], label: str) -> str:
    status = _clean(status)
    if status not in allowed:
        raise ValueError(f"Invalid {label} status")
    return status


def _status_filter(column: str, allowed: set[str], label: str) -> tuple[str, list[Any]]:
    statuses = [_validate_status(item, allowed, label) for item in _statuses()]
    if not statuses:
        return "", []
    placeholders = ", ".join(["?"] * len(statuses))
    return f"WHERE {column} IN ({placeholders})", statuses


def _all(sql: str, params: list[Any] | None = None) -> list[dict[str, Any]]:
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, *(params or []))
        return rows_to_dicts(cursor, cursor.fetchall())


def _one(sql: str, params: list[Any] | None = None) -> dict[str, Any] | None:
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, *(params or []))
        row = cursor.fetchone()
        return rows_to_dicts(cursor, [row])[0] if row else None


def _current_student() -> dict[str, Any] | None:
    user = get_mock_current_faculty_user()
    email = _clean(user.get("email"))
    return get_student_by_email(email) if email else None


@workflow_bp.get("/workflow/intake-packets")
def intake_packets():
    if not _require_staff():
        return _staff_required()

    where_clause, params = _status_filter("sip.status", INTAKE_STATUSES, "intake packet")
    return jsonify(_all(f"""
        SELECT
            sip.student_intake_packet_id,
            sip.student_id,
            s.institution_student_id,
            s.first_name AS student_first_name,
            s.last_name AS student_last_name,
            s.email AS student_email,
            sip.student_registration_request_id,
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
        JOIN asa.student s ON sip.student_id = s.student_id
        {where_clause}
        ORDER BY sip.updated_at DESC, sip.created_at DESC;
    """, params))


@workflow_bp.post("/workflow/intake-packets")
def intake_packet_create():
    if not _require_staff():
        return _staff_required()

    payload = request.get_json(silent=True) or {}
    student_id = _clean(payload.get("student_id"))
    if not student_id:
        return jsonify({"error": "student_id is required"}), 400

    try:
        status = _validate_status(payload.get("status", "started"), INTAKE_STATUSES, "intake packet")
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("""
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
            payload.get("assigned_staff_user_id") or _current_user_id(),
            payload.get("staff_notes"),
        )
        record_id = str(cursor.fetchone()[0])
        connection.commit()

    return jsonify({"student_intake_packet_id": record_id}), 201


@workflow_bp.patch("/workflow/intake-packets/<packet_id>/status")
def intake_packet_status(packet_id: str):
    if not _require_staff():
        return _staff_required()

    payload = request.get_json(silent=True) or {}
    timestamp_columns = {
        "registration_received": "registration_received_at",
        "documentation_received": "documentation_received_at",
        "ready_to_schedule": "ready_to_schedule_at",
        "scheduled": "intake_scheduled_at",
        "intake_complete": "intake_completed_at",
    }

    try:
        status = _validate_status(payload.get("status"), INTAKE_STATUSES, "intake packet")
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    set_parts = ["status = ?", "updated_at = SYSUTCDATETIME()"]
    params: list[Any] = [status]
    timestamp_column = timestamp_columns.get(status)
    if timestamp_column:
        set_parts.append(f"{timestamp_column} = COALESCE({timestamp_column}, SYSUTCDATETIME())")
    for column in ("navigate_appointment_reference", "assigned_staff_user_id", "staff_notes"):
        if column in payload:
            set_parts.append(f"{column} = ?")
            params.append(payload.get(column))
    params.append(packet_id)

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(f"""
            UPDATE asa.student_intake_packet
            SET {', '.join(set_parts)}
            WHERE student_intake_packet_id = ?;
        """, *params)
        if cursor.rowcount == 0:
            return jsonify({"error": "Intake packet not found"}), 404
        connection.commit()

    return jsonify({"student_intake_packet_id": packet_id, "status": status})


@workflow_bp.get("/workflow/student-agreements")
def student_agreements():
    if not _require_staff():
        return _staff_required()

    where_clause, params = _status_filter("sa.status", AGREEMENT_STATUSES, "agreement")
    student_id = request.args.get("student_id", "").strip()
    if student_id:
        where_clause = f"{where_clause} AND sa.student_id = ?" if where_clause else "WHERE sa.student_id = ?"
        params.append(student_id)

    return jsonify(_all(f"""
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
        JOIN asa.student s ON sa.student_id = s.student_id
        {where_clause}
        ORDER BY sa.updated_at DESC, sa.created_at DESC;
    """, params))


@workflow_bp.post("/workflow/student-agreements")
def student_agreement_create():
    if not _require_staff():
        return _staff_required()

    payload = request.get_json(silent=True) or {}
    student_id = _clean(payload.get("student_id"))
    agreement_type = _clean(payload.get("agreement_type"))
    if not student_id or not agreement_type:
        return jsonify({"error": "student_id and agreement_type are required"}), 400

    try:
        status = _validate_status(payload.get("status", "pending"), AGREEMENT_STATUSES, "agreement")
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("""
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
        record_id = str(cursor.fetchone()[0])
        connection.commit()

    return jsonify({"student_agreement_id": record_id}), 201


@workflow_bp.patch("/workflow/student-agreements/<agreement_id>/status")
def student_agreement_status(agreement_id: str):
    if not _require_staff():
        return _staff_required()

    payload = request.get_json(silent=True) or {}
    try:
        status = _validate_status(payload.get("status"), AGREEMENT_STATUSES, "agreement")
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    set_parts = ["status = ?", "updated_at = SYSUTCDATETIME()"]
    if status == "signed":
        set_parts.append("signed_at = COALESCE(signed_at, SYSUTCDATETIME())")
    if status == "revoked":
        set_parts.append("revoked_at = COALESCE(revoked_at, SYSUTCDATETIME())")

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(f"""
            UPDATE asa.student_agreement
            SET {', '.join(set_parts)}
            WHERE student_agreement_id = ?;
        """, status, agreement_id)
        if cursor.rowcount == 0:
            return jsonify({"error": "Student agreement not found"}), 404
        connection.commit()

    return jsonify({"student_agreement_id": agreement_id, "status": status})


def _letter_rows(where_clause: str, params: list[Any]) -> list[dict[str, Any]]:
    return _all(f"""
        SELECT
            alr.accommodation_letter_request_id,
            alr.student_id,
            s.institution_student_id,
            s.first_name AS student_first_name,
            s.last_name AS student_last_name,
            s.email AS student_email,
            cs.course_section_id,
            cs.source_section_id,
            c.subject_code,
            c.course_number,
            c.course_title,
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
        JOIN asa.student s ON alr.student_id = s.student_id
        JOIN asa.course_section cs ON alr.course_section_id = cs.course_section_id
        JOIN asa.course c ON cs.course_id = c.course_id
        JOIN asa.term t ON alr.term_id = t.term_id
        LEFT JOIN asa.instructor i ON cs.primary_instructor_id = i.instructor_id
        {where_clause}
        ORDER BY alr.requested_at DESC, alr.created_at DESC;
    """, params)


@workflow_bp.get("/workflow/accommodation-letter-requests")
def letter_requests():
    if not _require_staff():
        return _staff_required()

    where_clause, params = _status_filter("alr.status", LETTER_STATUSES, "letter request")
    return jsonify(_letter_rows(where_clause, params))


@workflow_bp.get("/workflow/accommodation-letter-requests/me")
def my_letter_requests():
    student = _current_student()
    if not student:
        return jsonify([])
    return jsonify(_letter_rows("WHERE alr.student_id = ?", [student["student_id"]]))


@workflow_bp.post("/workflow/accommodation-letter-requests/me")
def my_letter_request_create():
    payload = request.get_json(silent=True) or {}
    student = _current_student()
    if not student:
        return jsonify({"error": "No matching student record found for current user"}), 404
    if not bool(payload.get("student_acknowledged")):
        return jsonify({"error": "student_acknowledged is required"}), 400

    source_section_id = _clean(payload.get("source_section_id"))
    course_section_id = _clean(payload.get("course_section_id"))
    if not source_section_id and not course_section_id:
        return jsonify({"error": "source_section_id or course_section_id is required"}), 400

    with get_connection() as connection:
        cursor = connection.cursor()
        if course_section_id:
            cursor.execute("""
                SELECT cs.course_section_id, cs.term_id
                FROM asa.course_section cs
                JOIN asa.enrollment e ON cs.course_section_id = e.course_section_id
                WHERE e.student_id = ? AND cs.course_section_id = ?;
            """, student["student_id"], course_section_id)
        else:
            cursor.execute("""
                SELECT cs.course_section_id, cs.term_id
                FROM asa.course_section cs
                JOIN asa.enrollment e ON cs.course_section_id = e.course_section_id
                WHERE e.student_id = ? AND cs.source_section_id = ?;
            """, student["student_id"], source_section_id)
        section = cursor.fetchone()
        if not section:
            return jsonify({"error": "No matching enrolled course section found"}), 400

        cursor.execute("""
            INSERT INTO asa.accommodation_letter_request (
                student_id,
                course_section_id,
                term_id,
                requested_at,
                requested_by_user_id,
                status,
                student_acknowledged,
                created_at,
                updated_at
            )
            OUTPUT INSERTED.accommodation_letter_request_id
            VALUES (?, ?, ?, SYSUTCDATETIME(), ?, 'requested', 1, SYSUTCDATETIME(), SYSUTCDATETIME());
        """, student["student_id"], section[0], section[1], _current_user_id())
        record_id = str(cursor.fetchone()[0])
        connection.commit()

    return jsonify({"accommodation_letter_request_id": record_id}), 201


@workflow_bp.patch("/workflow/accommodation-letter-requests/<request_id>/status")
def letter_request_status(request_id: str):
    if not _require_staff():
        return _staff_required()

    payload = request.get_json(silent=True) or {}
    try:
        status = _validate_status(payload.get("status"), LETTER_STATUSES, "letter request")
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("""
            UPDATE asa.accommodation_letter_request
            SET
                status = ?,
                reviewed_at = SYSUTCDATETIME(),
                reviewed_by_user_id = ?,
                staff_notes = COALESCE(?, staff_notes),
                accommodation_letter_id = COALESCE(?, accommodation_letter_id),
                updated_at = SYSUTCDATETIME()
            WHERE accommodation_letter_request_id = ?;
        """, status, _current_user_id(), payload.get("staff_notes"), payload.get("accommodation_letter_id"), request_id)
        if cursor.rowcount == 0:
            return jsonify({"error": "Accommodation letter request not found"}), 404
        connection.commit()

    return jsonify({"accommodation_letter_request_id": request_id, "status": status})


@workflow_bp.get("/workflow/testing-rooms")
def testing_rooms():
    if not _require_staff():
        return _staff_required()

    include_inactive = request.args.get("include_inactive", "").lower() in {"1", "true", "yes"}
    return jsonify(_all("""
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
    """, [1 if include_inactive else 0]))


@workflow_bp.post("/workflow/testing-rooms")
def testing_room_create():
    if not _require_staff():
        return _staff_required()

    payload = request.get_json(silent=True) or {}
    if not _clean(payload.get("room_code")) or not _clean(payload.get("room_name")):
        return jsonify({"error": "room_code and room_name are required"}), 400

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("""
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
            payload.get("room_code"),
            payload.get("room_name"),
            payload.get("location_description"),
            payload.get("capacity"),
            0 if payload.get("is_active") is False else 1,
            payload.get("notes"),
        )
        record_id = str(cursor.fetchone()[0])
        connection.commit()

    return jsonify({"testing_room_id": record_id}), 201


@workflow_bp.get("/workflow/exam-schedule-assignments")
def exam_schedule_assignments():
    if not _require_staff():
        return _staff_required()

    where_clause, params = _status_filter("esa.status", ASSIGNMENT_STATUSES, "exam assignment")
    return jsonify(_all(f"""
        SELECT
            esa.exam_schedule_assignment_id,
            esa.exam_request_id,
            esa.testing_room_id,
            tr.room_code,
            tr.room_name,
            esa.assigned_staff_user_id,
            esa.scheduled_start_at,
            esa.scheduled_end_at,
            esa.status,
            esa.staff_notes,
            s.first_name AS student_first_name,
            s.last_name AS student_last_name,
            s.email AS student_email,
            c.subject_code,
            c.course_number,
            c.course_title,
            cs.source_section_id
        FROM asa.exam_schedule_assignment esa
        JOIN asa.exam_request er ON esa.exam_request_id = er.exam_request_id
        JOIN asa.student s ON er.student_id = s.student_id
        JOIN asa.course_section cs ON er.course_section_id = cs.course_section_id
        JOIN asa.course c ON cs.course_id = c.course_id
        LEFT JOIN asa.testing_room tr ON esa.testing_room_id = tr.testing_room_id
        {where_clause}
        ORDER BY esa.scheduled_start_at, esa.created_at;
    """, params))


@workflow_bp.put("/workflow/exam-requests/<exam_request_id>/schedule-assignment")
def exam_schedule_assignment_upsert(exam_request_id: str):
    if not _require_staff():
        return _staff_required()

    payload = request.get_json(silent=True) or {}
    if not payload.get("scheduled_start_at"):
        return jsonify({"error": "scheduled_start_at is required"}), 400

    try:
        status = _validate_status(payload.get("status", "scheduled"), ASSIGNMENT_STATUSES, "exam assignment")
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    exam_status = {
        "scheduled": "scheduled",
        "rescheduled": "scheduled",
        "completed": "completed",
        "cancelled": "cancelled",
        "no_show": "no_show",
    }.get(status)

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("SELECT exam_request_id, staff_status FROM asa.exam_request WHERE exam_request_id = ?;", exam_request_id)
        exam_row = cursor.fetchone()
        if not exam_row:
            return jsonify({"error": "Exam request not found"}), 404

        cursor.execute("""
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
            exam_request_id,
            payload.get("testing_room_id"),
            payload.get("assigned_staff_user_id") or _current_user_id(),
            payload.get("scheduled_start_at"),
            payload.get("scheduled_end_at"),
            status,
            payload.get("staff_notes"),
        )
        assignment_id = str(cursor.fetchone()[0])

        if exam_status:
            cursor.execute("""
                UPDATE asa.exam_request
                SET staff_status = ?, workflow_status = ?, updated_at = SYSUTCDATETIME()
                WHERE exam_request_id = ?;
            """, exam_status, exam_status, exam_request_id)
            cursor.execute("""
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
                exam_request_id,
                f"exam_assignment_{status}",
                exam_row[1],
                exam_status,
                payload.get("staff_notes"),
                _current_user_id(),
            )

        connection.commit()

    return jsonify({"exam_schedule_assignment_id": assignment_id, "status": status}), 201
