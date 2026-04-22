from __future__ import annotations

from typing import Any

from db import get_connection
from .shared import get_mock_current_faculty_user, rows_to_dicts


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
        {key: value for key, value in record.items() if key != "instructor_email"}
        for record in seeded_letters
        if record["instructor_email"].strip().lower() == normalized_email
    ]


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


def get_asa_letter_approvals() -> list[dict[str, Any]]:
    return [
        {
            "asa_letter_request_id": "asa-letter-1",
            "student_name": "Jordan Williams",
            "student_id": "900123456",
            "student_email": "jordan.williams@sbu.edu",
            "request_type": "Academic",
            "submitted_at": "2026-04-20",
            "workflow_status": "submitted",
            "summary": "Accommodation letter draft prepared for extended testing time and reduced distraction testing.",
            "approved_accommodations": [
                "Extended Time on Exams",
                "Reduced Distraction Testing",
            ],
        },
        {
            "asa_letter_request_id": "asa-letter-2",
            "student_name": "Casey Martin",
            "student_id": "900456789",
            "student_email": "casey.martin@sbu.edu",
            "request_type": "Housing",
            "submitted_at": "2026-04-19",
            "workflow_status": "in_review",
            "summary": "Housing accommodation letter draft prepared for accessible room placement and seating access.",
            "approved_accommodations": [
                "Accessible Seating",
                "Housing Accessibility Review",
            ],
        },
    ]


def get_asa_letter_approvals_by_status(statuses: list[str]) -> list[dict[str, Any]]:
    normalized_statuses = {str(status).strip().lower() for status in statuses}
    return [
        record
        for record in get_asa_letter_approvals()
        if str(record.get("workflow_status", "")).strip().lower() in normalized_statuses
    ]


def get_asa_letter_approval_by_id(asa_letter_request_id: str) -> dict[str, Any] | None:
    for record in get_asa_letter_approvals():
        if record["asa_letter_request_id"] == asa_letter_request_id:
            return record
    return None


def update_asa_letter_approval_status(
    asa_letter_request_id: str,
    workflow_status: str,
    reviewed_by_user_id: str,
) -> dict[str, Any] | None:
    allowed_statuses = {"submitted", "in_review", "approved", "returned"}

    if workflow_status not in allowed_statuses:
        raise ValueError("Invalid workflow status")

    record = get_asa_letter_approval_by_id(asa_letter_request_id)
    if not record:
        return None

    updated = dict(record)
    updated["workflow_status"] = workflow_status
    updated["reviewed_by_user_id"] = reviewed_by_user_id
    updated["reviewed_at"] = "2026-04-22"

    return updated