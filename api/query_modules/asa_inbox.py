from __future__ import annotations

from datetime import date, datetime, time
from typing import Any

from .exam_requests import get_exam_requests
from .faculty import get_asa_letter_approvals_by_status
from .student_portal import (
    get_documentation_queue_items,
    get_student_registration_requests_by_status,
)


def _json_safe(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, time):
        return value.isoformat()
    return value


def _student_name(record: dict[str, Any]) -> str:
    first = str(record.get("student_first_name") or "").strip()
    last = str(record.get("student_last_name") or "").strip()
    full_name = f"{first} {last}".strip()

    return (
        full_name
        or str(record.get("student_name") or "").strip()
        or "Unknown student"
    )


def _submitted_at(record: dict[str, Any]) -> Any:
    return (
        record.get("submitted_at")
        or record.get("created_at")
        or record.get("updated_at")
        or ""
    )


def _normalize_item(
    *,
    item_id: str,
    item_type: str,
    source_portal: str,
    title: str,
    submitter_name: str,
    submitter_email: str | None,
    status: str,
    summary: str,
    submitted_at: Any,
    action_href: str,
) -> dict[str, Any]:
    return {
        "id": item_id,
        "type": item_type,
        "source_portal": source_portal,
        "title": title,
        "submitter_name": submitter_name,
        "submitter_email": submitter_email,
        "status": status,
        "summary": summary,
        "submitted_at": _json_safe(submitted_at),
        "action_href": action_href,
    }


def get_asa_inbox_items() -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []

    registration_records = get_student_registration_requests_by_status(
        ["submitted", "in_review", "returned"]
    )
    for record in registration_records:
        student_name = _student_name(record)
        items.append(
            _normalize_item(
                item_id=str(record.get("student_registration_request_id")),
                item_type="student_registration",
                source_portal="student",
                title="Student registration form",
                submitter_name=student_name,
                submitter_email=record.get("student_email"),
                status=str(record.get("workflow_status") or "submitted"),
                summary=(
                    f"{student_name} submitted a "
                    f"{record.get('request_type') or 'registration'} request."
                ),
                submitted_at=_submitted_at(record),
                action_href=(
                    "/pages/asa-student-record.html?"
                    f"student_id={record.get('student_id')}"
                ),
            )
        )

    documentation_records = get_documentation_queue_items(
        ["pending", "awaiting_upload", "in_review", "follow_up_needed"]
    )
    for record in documentation_records:
        student_name = _student_name(record)
        file_name = record.get("document_file_name") or "Documentation pending"
        items.append(
            _normalize_item(
                item_id=str(record.get("student_registration_request_id")),
                item_type="documentation",
                source_portal="student",
                title="Documentation review",
                submitter_name=student_name,
                submitter_email=record.get("student_email"),
                status=str(record.get("docs_review_status") or "pending"),
                summary=f"{file_name} requires ASA documentation review.",
                submitted_at=_submitted_at(record),
                action_href=(
                    "/pages/asa-staff-portal.html#asa-staff-tab-documentation"
                ),
            )
        )

    letter_records = get_asa_letter_approvals_by_status(["submitted", "in_review"])
    for record in letter_records:
        items.append(
            _normalize_item(
                item_id=str(record.get("asa_letter_request_id")),
                item_type="letter_approval",
                source_portal="asa_staff",
                title="Accommodation letter approval",
                submitter_name=str(record.get("student_name") or "Unknown student"),
                submitter_email=record.get("student_email"),
                status=str(record.get("workflow_status") or "submitted"),
                summary=str(record.get("summary") or "Letter approval needs review."),
                submitted_at=record.get("submitted_at"),
                action_href="/pages/asa-staff-portal.html#asa-staff-tab-letters",
            )
        )

    exam_records = get_exam_requests()
    active_exam_statuses = {
        "submitted",
        "received_by_asa",
        "in_review",
        "scheduled",
        "late_request",
        "conflict",
    }

    for record in exam_records:
        workflow_status = str(record.get("workflow_status") or "").strip().lower()
        staff_status = str(record.get("staff_status") or "").strip().lower()
        status = staff_status or workflow_status or "submitted"

        if workflow_status not in active_exam_statuses and staff_status not in active_exam_statuses:
            continue

        student_name = _student_name(record)
        course_label = (
            f"{record.get('subject_code') or ''} "
            f"{record.get('course_number') or ''}"
        ).strip()

        items.append(
            _normalize_item(
                item_id=str(record.get("exam_request_id")),
                item_type="exam_request",
                source_portal="student_and_faculty_staff",
                title="Exam request",
                submitter_name=student_name,
                submitter_email=record.get("student_email"),
                status=status,
                summary=(
                    f"{student_name} has an exam request"
                    f"{f' for {course_label}' if course_label else ''}."
                ),
                submitted_at=_submitted_at(record),
                action_href="/pages/asa-exam-operations.html",
            )
        )

    items.sort(
        key=lambda item: str(item.get("submitted_at") or ""),
        reverse=True,
    )

    return items