from __future__ import annotations

import json
from typing import Any

from db import get_connection
from .shared import get_mock_current_faculty_user, rows_to_dicts


def get_student_by_email(email: str) -> dict[str, Any] | None:
    sql = """
    SELECT
        student_id,
        institution_student_id,
        first_name,
        last_name,
        email
    FROM asa.student
    WHERE LOWER(email) = LOWER(?);
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, email)
        row = cursor.fetchone()
        if not row:
            return None
        return rows_to_dicts(cursor, [row])[0]


def get_student_portal_profile_by_student_id(student_id: str) -> dict[str, Any] | None:
    sql = """
    SELECT
        student_portal_profile_id,
        student_id,
        student_registration_complete,
        student_registration_completed_at,
        completed_by_user_id,
        last_updated_by_user_id,
        created_at,
        updated_at
    FROM asa.student_portal_profile
    WHERE student_id = ?;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, student_id)
        row = cursor.fetchone()
        if not row:
            return None
        return rows_to_dicts(cursor, [row])[0]


def get_current_user_student_registration_status() -> dict[str, Any]:
    current_user = get_mock_current_faculty_user()
    current_email = str(current_user.get("email") or "").strip()

    if not current_email:
        return {
            "matched_student": None,
            "student_registration_complete": False,
            "student_registration_completed_at": None,
            "source": "no-email",
        }

    student = get_student_by_email(current_email)
    if not student:
        return {
            "matched_student": None,
            "student_registration_complete": False,
            "student_registration_completed_at": None,
            "source": "no-student-match",
        }

    profile = get_student_portal_profile_by_student_id(student["student_id"])

    return {
        "matched_student": student,
        "student_registration_complete": bool(profile["student_registration_complete"]) if profile else False,
        "student_registration_completed_at": (
            profile["student_registration_completed_at"] if profile else None
        ),
        "source": "student_portal_profile" if profile else "default-none",
    }


def upsert_current_user_student_registration_status(
    student_registration_complete: bool,
    acted_by_user_id: str,
) -> dict[str, Any] | None:
    current_user = get_mock_current_faculty_user()
    current_email = str(current_user.get("email") or "").strip()

    if not current_email:
        return None

    student = get_student_by_email(current_email)
    if not student:
        return None

    student_id = student["student_id"]

    with get_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT student_portal_profile_id
            FROM asa.student_portal_profile
            WHERE student_id = ?;
            """,
            student_id,
        )
        existing = cursor.fetchone()

        if existing:
            if student_registration_complete:
                cursor.execute(
                    """
                    UPDATE asa.student_portal_profile
                    SET
                        student_registration_complete = ?,
                        student_registration_completed_at = COALESCE(
                            student_registration_completed_at,
                            SYSUTCDATETIME()
                        ),
                        completed_by_user_id = COALESCE(completed_by_user_id, ?),
                        last_updated_by_user_id = ?,
                        updated_at = SYSUTCDATETIME()
                    WHERE student_id = ?;
                    """,
                    1,
                    acted_by_user_id,
                    acted_by_user_id,
                    student_id,
                )
            else:
                cursor.execute(
                    """
                    UPDATE asa.student_portal_profile
                    SET
                        student_registration_complete = ?,
                        student_registration_completed_at = NULL,
                        completed_by_user_id = NULL,
                        last_updated_by_user_id = ?,
                        updated_at = SYSUTCDATETIME()
                    WHERE student_id = ?;
                    """,
                    0,
                    acted_by_user_id,
                    student_id,
                )
        else:
            cursor.execute(
                """
                INSERT INTO asa.student_portal_profile (
                    student_id,
                    student_registration_complete,
                    student_registration_completed_at,
                    completed_by_user_id,
                    last_updated_by_user_id,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, SYSUTCDATETIME(), SYSUTCDATETIME());
                """,
                student_id,
                1 if student_registration_complete else 0,
                None,
                acted_by_user_id if student_registration_complete else None,
                acted_by_user_id,
            )

            if student_registration_complete:
                cursor.execute(
                    """
                    UPDATE asa.student_portal_profile
                    SET student_registration_completed_at = SYSUTCDATETIME()
                    WHERE student_id = ?;
                    """,
                    student_id,
                )

        connection.commit()

    return get_current_user_student_registration_status()


def create_current_user_student_registration_request(
    payload: dict[str, Any],
    submitted_by_user_id: str,
) -> dict[str, Any] | None:
    current_user = get_mock_current_faculty_user()
    current_email = str(current_user.get("email") or "").strip()

    if not current_email:
        return None

    student = get_student_by_email(current_email)
    if not student:
        return None

    student_id = student["student_id"]
    requested_accommodations = payload.get("requested_accommodations") or []
    requested_accommodations_json = json.dumps(requested_accommodations)

    document_file_name = payload.get("document_file_name")
    document_storage_path = payload.get("document_storage_path")
    docs_pending_acknowledged = 1 if bool(payload.get("docs_pending_acknowledged")) else 0

    if document_file_name or document_storage_path:
        docs_review_status = "pending"
    elif docs_pending_acknowledged:
        docs_review_status = "awaiting_upload"
    else:
        docs_review_status = "pending"

    with get_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO asa.student_registration_request (
                student_id,
                request_type,
                disability_type,
                academic_impact,
                daily_life_impact,
                prior_accommodations,
                prior_accommodations_details,
                requested_accommodations_json,
                requested_accommodations_other,
                document_file_name,
                document_storage_path,
                docs_pending_acknowledged,
                docs_review_status,
                release_consent,
                workflow_status,
                submitted_at,
                created_at,
                updated_at
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted',
                SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME()
            );
            """,
            student_id,
            payload.get("request_type"),
            payload.get("disability_type"),
            payload.get("academic_impact"),
            payload.get("daily_life_impact"),
            payload.get("prior_accommodations"),
            payload.get("prior_accommodations_details"),
            requested_accommodations_json,
            payload.get("requested_accommodations_other"),
            document_file_name,
            document_storage_path,
            docs_pending_acknowledged,
            docs_review_status,
            1 if bool(payload.get("release_consent")) else 0,
        )

        cursor.execute(
            """
            UPDATE asa.student_portal_profile
            SET
                student_registration_complete = 1,
                student_registration_completed_at = COALESCE(
                    student_registration_completed_at,
                    SYSUTCDATETIME()
                ),
                completed_by_user_id = COALESCE(completed_by_user_id, ?),
                last_updated_by_user_id = ?,
                updated_at = SYSUTCDATETIME()
            WHERE student_id = ?;
            """,
            submitted_by_user_id,
            submitted_by_user_id,
            student_id,
        )

        if cursor.rowcount == 0:
            cursor.execute(
                """
                INSERT INTO asa.student_portal_profile (
                    student_id,
                    student_registration_complete,
                    student_registration_completed_at,
                    completed_by_user_id,
                    last_updated_by_user_id,
                    created_at,
                    updated_at
                )
                VALUES (?, 1, SYSUTCDATETIME(), ?, ?, SYSUTCDATETIME(), SYSUTCDATETIME());
                """,
                student_id,
                submitted_by_user_id,
                submitted_by_user_id,
            )

        connection.commit()

    return get_latest_current_user_student_registration_request()


def get_current_user_student_registration_requests() -> list[dict[str, Any]]:
    current_user = get_mock_current_faculty_user()
    current_email = str(current_user.get("email") or "").strip()

    if not current_email:
        return []

    student = get_student_by_email(current_email)
    if not student:
        return []

    sql = """
    SELECT
        srr.student_registration_request_id,
        srr.student_id,
        srr.request_type,
        srr.disability_type,
        srr.academic_impact,
        srr.daily_life_impact,
        srr.prior_accommodations,
        srr.prior_accommodations_details,
        srr.requested_accommodations_json,
        srr.requested_accommodations_other,
        srr.document_file_name,
        srr.document_storage_path,
        srr.docs_pending_acknowledged,
        srr.docs_review_status,
        srr.docs_reviewed_at,
        srr.docs_reviewed_by_user_id,
        srr.release_consent,
        srr.workflow_status,
        srr.submitted_at,
        srr.reviewed_at,
        srr.reviewed_by_user_id,
        srr.created_at,
        srr.updated_at
    FROM asa.student_registration_request srr
    WHERE srr.student_id = ?
    ORDER BY srr.submitted_at DESC, srr.created_at DESC;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, student["student_id"])
        return rows_to_dicts(cursor, cursor.fetchall())


def get_latest_current_user_student_registration_request() -> dict[str, Any] | None:
    requests = get_current_user_student_registration_requests()
    return requests[0] if requests else None


def get_student_registration_requests() -> list[dict[str, Any]]:
    sql = """
    SELECT
        srr.student_registration_request_id,
        srr.student_id,
        s.institution_student_id,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.email AS student_email,
        srr.request_type,
        srr.disability_type,
        srr.academic_impact,
        srr.daily_life_impact,
        srr.prior_accommodations,
        srr.prior_accommodations_details,
        srr.requested_accommodations_json,
        srr.requested_accommodations_other,
        srr.document_file_name,
        srr.document_storage_path,
        srr.docs_pending_acknowledged,
        srr.docs_review_status,
        srr.docs_reviewed_at,
        srr.docs_reviewed_by_user_id,
        srr.release_consent,
        srr.workflow_status,
        srr.submitted_at,
        srr.reviewed_at,
        srr.reviewed_by_user_id,
        srr.created_at,
        srr.updated_at
    FROM asa.student_registration_request srr
    JOIN asa.student s
        ON srr.student_id = s.student_id
    ORDER BY srr.submitted_at DESC, srr.created_at DESC;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_student_registration_requests_by_status(
    statuses: list[str],
) -> list[dict[str, Any]]:
    if not statuses:
        return []

    placeholders = ", ".join(["?"] * len(statuses))
    sql = f"""
    SELECT
        srr.student_registration_request_id,
        srr.student_id,
        s.institution_student_id,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.email AS student_email,
        srr.request_type,
        srr.disability_type,
        srr.academic_impact,
        srr.daily_life_impact,
        srr.prior_accommodations,
        srr.prior_accommodations_details,
        srr.requested_accommodations_json,
        srr.requested_accommodations_other,
        srr.document_file_name,
        srr.document_storage_path,
        srr.docs_pending_acknowledged,
        srr.docs_review_status,
        srr.docs_reviewed_at,
        srr.docs_reviewed_by_user_id,
        srr.release_consent,
        srr.workflow_status,
        srr.submitted_at,
        srr.reviewed_at,
        srr.reviewed_by_user_id,
        srr.created_at,
        srr.updated_at
    FROM asa.student_registration_request srr
    JOIN asa.student s
        ON srr.student_id = s.student_id
    WHERE srr.workflow_status IN ({placeholders})
    ORDER BY srr.submitted_at DESC, srr.created_at DESC;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, *statuses)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_documentation_queue_items(
    docs_statuses: list[str] | None = None,
) -> list[dict[str, Any]]:
    filters = [
        "(srr.document_file_name IS NOT NULL OR srr.document_storage_path IS NOT NULL OR srr.docs_pending_acknowledged = 1)"
    ]
    params: list[Any] = []

    if docs_statuses:
        placeholders = ", ".join(["?"] * len(docs_statuses))
        filters.append(f"srr.docs_review_status IN ({placeholders})")
        params.extend(docs_statuses)

    where_clause = " AND ".join(filters)

    sql = f"""
    SELECT
        srr.student_registration_request_id,
        srr.student_id,
        s.institution_student_id,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.email AS student_email,
        srr.request_type,
        srr.disability_type,
        srr.document_file_name,
        srr.document_storage_path,
        srr.docs_pending_acknowledged,
        srr.docs_review_status,
        srr.docs_reviewed_at,
        srr.docs_reviewed_by_user_id,
        srr.workflow_status,
        srr.submitted_at,
        srr.updated_at
    FROM asa.student_registration_request srr
    JOIN asa.student s
        ON srr.student_id = s.student_id
    WHERE {where_clause}
    ORDER BY srr.submitted_at DESC, srr.created_at DESC;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, *params)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_student_registration_request_by_id(
    student_registration_request_id: str,
) -> dict[str, Any] | None:
    sql = """
    SELECT
        srr.student_registration_request_id,
        srr.student_id,
        s.institution_student_id,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.email AS student_email,
        srr.request_type,
        srr.disability_type,
        srr.academic_impact,
        srr.daily_life_impact,
        srr.prior_accommodations,
        srr.prior_accommodations_details,
        srr.requested_accommodations_json,
        srr.requested_accommodations_other,
        srr.document_file_name,
        srr.document_storage_path,
        srr.docs_pending_acknowledged,
        srr.docs_review_status,
        srr.docs_reviewed_at,
        srr.docs_reviewed_by_user_id,
        srr.release_consent,
        srr.workflow_status,
        srr.submitted_at,
        srr.reviewed_at,
        srr.reviewed_by_user_id,
        srr.created_at,
        srr.updated_at
    FROM asa.student_registration_request srr
    JOIN asa.student s
        ON srr.student_id = s.student_id
    WHERE srr.student_registration_request_id = ?;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, student_registration_request_id)
        row = cursor.fetchone()
        if not row:
            return None
        return rows_to_dicts(cursor, [row])[0]


def get_registered_students_directory(
    lifecycle_status: str = "active",
) -> list[dict[str, Any]]:
    allowed_statuses = {"active", "archived"}

    if lifecycle_status not in allowed_statuses:
        raise ValueError("Invalid lifecycle status")

    sql = """
    SELECT
        s.student_id,
        s.institution_student_id,
        s.first_name,
        s.last_name,
        s.email,
        COALESCE(s.academic_level, 'undergraduate') AS academic_level,
        COALESCE(s.lifecycle_status, 'active') AS lifecycle_status,
        s.archived_at,
        s.archive_delete_after_at,
        s.deleted_at,
        spp.student_registration_complete,
        spp.student_registration_completed_at,
        spp.updated_at AS profile_updated_at,
        COUNT(srr.student_registration_request_id) AS registration_request_count,
        MAX(srr.submitted_at) AS latest_registration_submitted_at
    FROM asa.student s
    LEFT JOIN asa.student_portal_profile spp
        ON s.student_id = spp.student_id
    LEFT JOIN asa.student_registration_request srr
        ON s.student_id = srr.student_id
    WHERE COALESCE(s.lifecycle_status, 'active') <> 'deleted'
      AND COALESCE(s.lifecycle_status, 'active') = ?
    GROUP BY
        s.student_id,
        s.institution_student_id,
        s.first_name,
        s.last_name,
        s.email,
        s.academic_level,
        s.lifecycle_status,
        s.archived_at,
        s.archive_delete_after_at,
        s.deleted_at,
        spp.student_registration_complete,
        spp.student_registration_completed_at,
        spp.updated_at
    ORDER BY
        s.last_name,
        s.first_name;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, lifecycle_status)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_registered_student_detail(student_id: str) -> dict[str, Any] | None:
    student_sql = """
    SELECT
        s.student_id,
        s.institution_student_id,
        s.first_name,
        s.last_name,
        s.email,
        COALESCE(s.academic_level, 'undergraduate') AS academic_level,
        COALESCE(s.lifecycle_status, 'active') AS lifecycle_status,
        s.archived_at,
        s.archive_delete_after_at,
        s.deleted_at,
        s.deleted_by_user_id,
        s.deleted_reason
    FROM asa.student s
    WHERE s.student_id = ?
      AND COALESCE(s.lifecycle_status, 'active') <> 'deleted';
    """

    requests_sql = """
    SELECT
        srr.student_registration_request_id,
        srr.request_type,
        srr.disability_type,
        srr.academic_impact,
        srr.daily_life_impact,
        srr.prior_accommodations,
        srr.prior_accommodations_details,
        srr.requested_accommodations_json,
        srr.requested_accommodations_other,
        srr.document_file_name,
        srr.document_storage_path,
        srr.docs_pending_acknowledged,
        srr.docs_review_status,
        srr.docs_reviewed_at,
        srr.docs_reviewed_by_user_id,
        srr.release_consent,
        srr.workflow_status,
        srr.submitted_at,
        srr.reviewed_at,
        srr.reviewed_by_user_id,
        srr.created_at,
        srr.updated_at
    FROM asa.student_registration_request srr
    WHERE srr.student_id = ?
    ORDER BY srr.submitted_at DESC, srr.created_at DESC;
    """

    with get_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(student_sql, student_id)
        student_row = cursor.fetchone()
        if not student_row:
            return None

        student_record = rows_to_dicts(cursor, [student_row])[0]
        profile = get_student_portal_profile_by_student_id(student_id)

        cursor.execute(requests_sql, student_id)
        request_records = rows_to_dicts(cursor, cursor.fetchall())

        return {
            "student": student_record,
            "portal_profile": profile,
            "registration_requests": request_records,
        }


def update_student_academic_level(
    student_id: str,
    academic_level: str,
    acted_by_user_id: str,
) -> dict[str, Any] | None:
    allowed_levels = {"undergraduate", "graduate"}

    if academic_level not in allowed_levels:
        raise ValueError("Invalid academic level")

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            UPDATE asa.student
            SET academic_level = ?
            WHERE student_id = ?
              AND COALESCE(lifecycle_status, 'active') <> 'deleted';
            """,
            academic_level,
            student_id,
        )

        if cursor.rowcount == 0:
            return None

        connection.commit()

    return get_registered_student_detail(student_id)


def archive_student_record(
    student_id: str,
    acted_by_user_id: str,
) -> dict[str, Any] | None:
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            UPDATE asa.student
            SET
                lifecycle_status = 'archived',
                archived_at = COALESCE(archived_at, SYSUTCDATETIME()),
                archive_delete_after_at = COALESCE(
                    archive_delete_after_at,
                    DATEADD(YEAR, 7, SYSUTCDATETIME())
                )
            WHERE student_id = ?
              AND COALESCE(lifecycle_status, 'active') <> 'deleted';
            """,
            student_id,
        )

        if cursor.rowcount == 0:
            return None

        connection.commit()

    return get_registered_student_detail(student_id)


def restore_student_record(
    student_id: str,
    acted_by_user_id: str,
) -> dict[str, Any] | None:
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            UPDATE asa.student
            SET lifecycle_status = 'active'
            WHERE student_id = ?
              AND COALESCE(lifecycle_status, 'active') <> 'deleted';
            """,
            student_id,
        )

        if cursor.rowcount == 0:
            return None

        connection.commit()

    return get_registered_student_detail(student_id)


def delete_student_record(
    student_id: str,
    acted_by_user_id: str,
    deleted_reason: str,
) -> dict[str, Any] | None:
    existing_record = get_registered_student_detail(student_id)
    if not existing_record:
        return None

    with get_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE asa.student
            SET
                lifecycle_status = 'deleted',
                deleted_at = SYSUTCDATETIME(),
                deleted_by_user_id = ?,
                deleted_reason = ?
            WHERE student_id = ?;
            """,
            acted_by_user_id,
            deleted_reason,
            student_id,
        )

        connection.commit()

    return existing_record


def update_student_registration_request_status(
    student_registration_request_id: str,
    workflow_status: str,
    reviewed_by_user_id: str,
) -> dict[str, Any] | None:
    allowed_statuses = {"submitted", "in_review", "intake_scheduled", "completed"}

    if workflow_status not in allowed_statuses:
        raise ValueError("Invalid workflow status")

    with get_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE asa.student_registration_request
            SET
                workflow_status = ?,
                reviewed_at = SYSUTCDATETIME(),
                reviewed_by_user_id = ?,
                updated_at = SYSUTCDATETIME()
            WHERE student_registration_request_id = ?;
            """,
            workflow_status,
            reviewed_by_user_id,
            student_registration_request_id,
        )

        if cursor.rowcount == 0:
            return None

        connection.commit()

    return get_student_registration_request_by_id(student_registration_request_id)


def update_student_registration_request_docs_status(
    student_registration_request_id: str,
    docs_review_status: str,
    reviewed_by_user_id: str,
) -> dict[str, Any] | None:
    allowed_statuses = {"pending", "awaiting_upload", "in_review", "reviewed", "follow_up_needed"}

    if docs_review_status not in allowed_statuses:
        raise ValueError("Invalid docs review status")

    with get_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE asa.student_registration_request
            SET
                docs_review_status = ?,
                docs_reviewed_at = SYSUTCDATETIME(),
                docs_reviewed_by_user_id = ?,
                updated_at = SYSUTCDATETIME()
            WHERE student_registration_request_id = ?;
            """,
            docs_review_status,
            reviewed_by_user_id,
            student_registration_request_id,
        )

        if cursor.rowcount == 0:
            return None

        connection.commit()

    return get_student_registration_request_by_id(student_registration_request_id)


def delete_student_registration_request(
    student_registration_request_id: str,
    deleted_by_user_id: str,
) -> dict[str, Any] | None:
    existing_record = get_student_registration_request_by_id(student_registration_request_id)
    if not existing_record:
        return None

    student_id = existing_record["student_id"]

    with get_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM asa.student_registration_request
            WHERE student_registration_request_id = ?;
            """,
            student_registration_request_id,
        )

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM asa.student_registration_request
            WHERE student_id = ?;
            """,
            student_id,
        )
        remaining_count = cursor.fetchone()[0]

        if remaining_count == 0:
            cursor.execute(
                """
                UPDATE asa.student_portal_profile
                SET
                    student_registration_complete = 0,
                    student_registration_completed_at = NULL,
                    completed_by_user_id = NULL,
                    last_updated_by_user_id = ?,
                    updated_at = SYSUTCDATETIME()
                WHERE student_id = ?;
                """,
                deleted_by_user_id,
                student_id,
            )
        else:
            cursor.execute(
                """
                UPDATE asa.student_portal_profile
                SET
                    last_updated_by_user_id = ?,
                    updated_at = SYSUTCDATETIME()
                WHERE student_id = ?;
                """,
                deleted_by_user_id,
                student_id,
            )

        connection.commit()

    return existing_record