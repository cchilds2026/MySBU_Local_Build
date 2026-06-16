from __future__ import annotations

from flask import Blueprint, jsonify, request

from query_modules.shared import get_mock_current_faculty_user
from query_modules.workflow_extensions import (
    create_current_user_accommodation_letter_request,
    create_intake_packet,
    create_student_agreement,
    create_testing_room,
    get_accommodation_letter_request_by_id,
    get_accommodation_letter_requests,
    get_current_user_accommodation_letter_requests,
    get_exam_schedule_assignments,
    get_intake_packet_by_id,
    get_intake_packets,
    get_student_agreement_by_id,
    get_student_agreements,
    get_testing_rooms,
    update_accommodation_letter_request_status,
    update_intake_packet_status,
    update_student_agreement_status,
    update_testing_room,
    upsert_exam_schedule_assignment,
)


workflow_bp = Blueprint("workflow", __name__, url_prefix="/api")


def _current_user_id() -> str:
    user = get_mock_current_faculty_user()

    return str(
        user.get("user_id")
        or user.get("email")
        or "portal:unknown"
    ).strip()


def _require_asa_staff_user():
    user = get_mock_current_faculty_user()
    roles = user.get("roles", [])

    if not isinstance(roles, list):
        roles = []

    if "asa_staff" not in roles:
        return None

    return user


def _statuses_from_query() -> list[str] | None:
    status = request.args.get("status", "").strip()
    if not status:
        return None
    return [item.strip() for item in status.split(",") if item.strip()]


def _staff_required_response():
    return jsonify({"error": "ASA staff access required"}), 403


@workflow_bp.get("/workflow/intake-packets")
def workflow_intake_packets():
    if not _require_asa_staff_user():
        return _staff_required_response()

    try:
        return jsonify(get_intake_packets(_statuses_from_query()))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400


@workflow_bp.post("/workflow/intake-packets")
def workflow_intake_packet_create():
    if not _require_asa_staff_user():
        return _staff_required_response()

    payload = request.get_json(silent=True) or {}

    try:
        created = create_intake_packet(payload, _current_user_id())
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not created:
        return jsonify({"error": "Unable to create intake packet"}), 400

    return jsonify(created), 201


@workflow_bp.get("/workflow/intake-packets/<student_intake_packet_id>")
def workflow_intake_packet_detail(student_intake_packet_id: str):
    if not _require_asa_staff_user():
        return _staff_required_response()

    record = get_intake_packet_by_id(student_intake_packet_id)

    if not record:
        return jsonify({"error": "Intake packet not found"}), 404

    return jsonify(record)


@workflow_bp.patch("/workflow/intake-packets/<student_intake_packet_id>/status")
def workflow_intake_packet_status_update(student_intake_packet_id: str):
    if not _require_asa_staff_user():
        return _staff_required_response()

    payload = request.get_json(silent=True) or {}
    status = str(payload.get("status", "")).strip()

    if not status:
        return jsonify({"error": "status is required"}), 400

    try:
        updated = update_intake_packet_status(
            student_intake_packet_id,
            status,
            payload,
            _current_user_id(),
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not updated:
        return jsonify({"error": "Intake packet not found"}), 404

    return jsonify(updated)


@workflow_bp.get("/workflow/student-agreements")
def workflow_student_agreements():
    if not _require_asa_staff_user():
        return _staff_required_response()

    student_id = request.args.get("student_id", "").strip() or None

    try:
        return jsonify(get_student_agreements(student_id, _statuses_from_query()))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400


@workflow_bp.post("/workflow/student-agreements")
def workflow_student_agreement_create():
    if not _require_asa_staff_user():
        return _staff_required_response()

    payload = request.get_json(silent=True) or {}

    try:
        created = create_student_agreement(payload)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not created:
        return jsonify({"error": "Unable to create student agreement"}), 400

    return jsonify(created), 201


@workflow_bp.get("/workflow/student-agreements/<student_agreement_id>")
def workflow_student_agreement_detail(student_agreement_id: str):
    if not _require_asa_staff_user():
        return _staff_required_response()

    record = get_student_agreement_by_id(student_agreement_id)

    if not record:
        return jsonify({"error": "Student agreement not found"}), 404

    return jsonify(record)


@workflow_bp.patch("/workflow/student-agreements/<student_agreement_id>/status")
def workflow_student_agreement_status_update(student_agreement_id: str):
    if not _require_asa_staff_user():
        return _staff_required_response()

    payload = request.get_json(silent=True) or {}
    status = str(payload.get("status", "")).strip()

    if not status:
        return jsonify({"error": "status is required"}), 400

    try:
        updated = update_student_agreement_status(
            student_agreement_id,
            status,
            payload,
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not updated:
        return jsonify({"error": "Student agreement not found"}), 404

    return jsonify(updated)


@workflow_bp.get("/workflow/accommodation-letter-requests")
def workflow_accommodation_letter_requests():
    if not _require_asa_staff_user():
        return _staff_required_response()

    try:
        return jsonify(get_accommodation_letter_requests(_statuses_from_query()))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400


@workflow_bp.get("/workflow/accommodation-letter-requests/me")
def workflow_my_accommodation_letter_requests():
    return jsonify(get_current_user_accommodation_letter_requests())


@workflow_bp.post("/workflow/accommodation-letter-requests/me")
def workflow_my_accommodation_letter_request_create():
    payload = request.get_json(silent=True) or {}

    try:
        created = create_current_user_accommodation_letter_request(
            payload,
            _current_user_id(),
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not created:
        return jsonify({"error": "No matching student record found for current user"}), 404

    return jsonify(created), 201


@workflow_bp.get("/workflow/accommodation-letter-requests/<accommodation_letter_request_id>")
def workflow_accommodation_letter_request_detail(accommodation_letter_request_id: str):
    if not _require_asa_staff_user():
        return _staff_required_response()

    record = get_accommodation_letter_request_by_id(accommodation_letter_request_id)

    if not record:
        return jsonify({"error": "Accommodation letter request not found"}), 404

    return jsonify(record)


@workflow_bp.patch("/workflow/accommodation-letter-requests/<accommodation_letter_request_id>/status")
def workflow_accommodation_letter_request_status_update(accommodation_letter_request_id: str):
    if not _require_asa_staff_user():
        return _staff_required_response()

    payload = request.get_json(silent=True) or {}
    status = str(payload.get("status", "")).strip()

    if not status:
        return jsonify({"error": "status is required"}), 400

    try:
        updated = update_accommodation_letter_request_status(
            accommodation_letter_request_id,
            status,
            payload,
            _current_user_id(),
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not updated:
        return jsonify({"error": "Accommodation letter request not found"}), 404

    return jsonify(updated)


@workflow_bp.get("/workflow/testing-rooms")
def workflow_testing_rooms():
    if not _require_asa_staff_user():
        return _staff_required_response()

    include_inactive = request.args.get("include_inactive", "").strip().lower()
    return jsonify(get_testing_rooms(include_inactive in {"1", "true", "yes"}))


@workflow_bp.post("/workflow/testing-rooms")
def workflow_testing_room_create():
    if not _require_asa_staff_user():
        return _staff_required_response()

    payload = request.get_json(silent=True) or {}

    try:
        created = create_testing_room(payload)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not created:
        return jsonify({"error": "Unable to create testing room"}), 400

    return jsonify(created), 201


@workflow_bp.patch("/workflow/testing-rooms/<testing_room_id>")
def workflow_testing_room_update(testing_room_id: str):
    if not _require_asa_staff_user():
        return _staff_required_response()

    payload = request.get_json(silent=True) or {}

    try:
        updated = update_testing_room(testing_room_id, payload)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not updated:
        return jsonify({"error": "Testing room not found"}), 404

    return jsonify(updated)


@workflow_bp.get("/workflow/exam-schedule-assignments")
def workflow_exam_schedule_assignments():
    if not _require_asa_staff_user():
        return _staff_required_response()

    try:
        return jsonify(get_exam_schedule_assignments(_statuses_from_query()))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400


@workflow_bp.put("/workflow/exam-requests/<exam_request_id>/schedule-assignment")
def workflow_exam_schedule_assignment_upsert(exam_request_id: str):
    if not _require_asa_staff_user():
        return _staff_required_response()

    payload = request.get_json(silent=True) or {}

    try:
        updated = upsert_exam_schedule_assignment(
            exam_request_id,
            payload,
            _current_user_id(),
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not updated:
        return jsonify({"error": "Exam request not found"}), 404

    return jsonify(updated)
