from __future__ import annotations

from flask import Flask, jsonify, request
from flask_cors import CORS

from queries import (
    archive_asa_resource,
    create_asa_resource,
    create_current_user_student_registration_request,
    create_uploaded_exam,
    delete_student_registration_request,
    get_asa_inbox_items,
    get_asa_letter_approval_by_id,
    get_asa_letter_approvals,
    get_asa_letter_approvals_by_status,
    get_asa_resources_admin,
    get_current_user_student_registration_requests,
    get_current_user_student_registration_status,
    get_documentation_queue_items,
    get_exam_request_by_id,
    get_exam_requests,
    get_exam_requests_by_course,
    get_faculty_course_debug_summary,
    get_faculty_courses,
    get_faculty_courses_by_instructor_email,
    get_faculty_exam_preference_by_section,
    get_faculty_exam_preferences,
    get_faculty_letter_debug_summary,
    get_faculty_letters_by_instructor_email,
    get_mock_current_faculty_user,
    get_published_asa_resources,
    get_registered_student_detail,
    get_registered_students_directory,
    get_student_registration_request_by_id,
    get_student_registration_requests,
    get_student_registration_requests_by_status,
    get_uploaded_exams,
    get_uploaded_exams_by_section,
    publish_asa_resource,
    update_asa_letter_approval_status,
    update_asa_resource,
    update_exam_request_staff_status,
    update_student_registration_request_docs_status,
    update_student_registration_request_status,
    upsert_current_user_student_registration_status,
    upsert_exam_request_faculty_response,
    upsert_faculty_exam_preference,
)


app = Flask(__name__)

CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=True,
)


@app.get("/api/health")
def health():
    return {"status": "ok"}, 200


@app.get("/api/me")
def current_user():
    user = get_mock_current_faculty_user()

    return jsonify(
        {
            "user_id": user.get("user_id"),
            "email": user.get("email"),
            "display_name": user.get("display_name"),
            "roles": user.get("roles", []),
            "authentication_source": "mock",
        }
    )


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


@app.get("/api/asa/inbox")
def asa_inbox():
    user = _require_asa_staff_user()
    if not user:
        return jsonify({"error": "ASA staff access required"}), 403

    return jsonify(get_asa_inbox_items())


@app.get("/api/asa/resources")
def asa_resources_public():
    audience = request.args.get("audience", "").strip()

    try:
        resources = get_published_asa_resources(audience)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify(resources)


@app.get("/api/asa/resources/admin")
def asa_resources_admin():
    user = _require_asa_staff_user()
    if not user:
        return jsonify({"error": "ASA staff access required"}), 403

    return jsonify(get_asa_resources_admin())


@app.post("/api/asa/resources")
def asa_resource_create():
    user = _require_asa_staff_user()
    if not user:
        return jsonify({"error": "ASA staff access required"}), 403

    payload = request.get_json(silent=True) or {}

    try:
        created = create_asa_resource(
            payload=payload,
            created_by_user_id=_current_user_id(),
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify(created), 201


@app.patch("/api/asa/resources/<resource_id>")
def asa_resource_update(resource_id: str):
    user = _require_asa_staff_user()
    if not user:
        return jsonify({"error": "ASA staff access required"}), 403

    payload = request.get_json(silent=True) or {}

    try:
        updated = update_asa_resource(
            resource_id=resource_id,
            payload=payload,
            updated_by_user_id=_current_user_id(),
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not updated:
        return jsonify({"error": "ASA resource not found"}), 404

    return jsonify(updated)


@app.patch("/api/asa/resources/<resource_id>/publish")
def asa_resource_publish(resource_id: str):
    user = _require_asa_staff_user()
    if not user:
        return jsonify({"error": "ASA staff access required"}), 403

    updated = publish_asa_resource(
        resource_id=resource_id,
        updated_by_user_id=_current_user_id(),
    )

    if not updated:
        return jsonify({"error": "ASA resource not found"}), 404

    return jsonify(updated)


@app.patch("/api/asa/resources/<resource_id>/archive")
def asa_resource_archive(resource_id: str):
    user = _require_asa_staff_user()
    if not user:
        return jsonify({"error": "ASA staff access required"}), 403

    updated = archive_asa_resource(
        resource_id=resource_id,
        updated_by_user_id=_current_user_id(),
    )

    if not updated:
        return jsonify({"error": "ASA resource not found"}), 404

    return jsonify(updated)


@app.get("/api/me/student-registration-status")
def current_user_student_registration_status():
    return jsonify(get_current_user_student_registration_status())


@app.patch("/api/me/student-registration-status")
def update_current_user_student_registration_status():
    payload = request.get_json(silent=True) or {}

    student_registration_complete = bool(
        payload.get("student_registration_complete")
    )
    acted_by_user_id = str(
        payload.get("acted_by_user_id", "portal:user")
    ).strip()

    updated = upsert_current_user_student_registration_status(
        student_registration_complete=student_registration_complete,
        acted_by_user_id=acted_by_user_id,
    )

    if not updated:
        return jsonify(
            {"error": "No matching student record found for current user"}
        ), 404

    return jsonify(updated)


@app.get("/api/student-registration-requests")
def student_registration_requests():
    status = request.args.get("status", "").strip()

    if status:
        statuses = [item.strip() for item in status.split(",") if item.strip()]
        return jsonify(get_student_registration_requests_by_status(statuses))

    return jsonify(get_student_registration_requests())


@app.get("/api/student-registration-requests/me")
def current_user_student_registration_requests():
    return jsonify(get_current_user_student_registration_requests())


@app.get("/api/student-registration-requests/<student_registration_request_id>")
def student_registration_request_detail(student_registration_request_id: str):
    record = get_student_registration_request_by_id(student_registration_request_id)

    if not record:
        return jsonify({"error": "Student registration request not found"}), 404

    return jsonify(record)


@app.post("/api/student-registration-requests")
def create_student_registration_request():
    payload = request.get_json(silent=True) or {}

    submitted_by_user_id = str(
        payload.get("submitted_by_user_id", "portal:student-registration-form")
    ).strip()

    required_fields = [
        "request_type",
        "disability_type",
        "academic_impact",
        "daily_life_impact",
        "prior_accommodations",
        "release_consent",
    ]

    missing = [
        field for field in required_fields if payload.get(field) in (None, "", [])
    ]

    if missing:
        return jsonify(
            {"error": f"Missing required field(s): {', '.join(missing)}"}
        ), 400

    created_record = create_current_user_student_registration_request(
        payload=payload,
        submitted_by_user_id=submitted_by_user_id,
    )

    if not created_record:
        return jsonify({"error": "No matching student record found for current user"}), 404

    return jsonify(created_record), 201


@app.patch("/api/student-registration-requests/<student_registration_request_id>/status")
def update_registration_request_status(student_registration_request_id: str):
    payload = request.get_json(silent=True) or {}

    workflow_status = str(payload.get("workflow_status", "")).strip()
    reviewed_by_user_id = str(
        payload.get("reviewed_by_user_id", "asa_staff:unknown")
    ).strip()

    if not workflow_status:
        return jsonify({"error": "workflow_status is required"}), 400

    try:
        updated_record = update_student_registration_request_status(
            student_registration_request_id=student_registration_request_id,
            workflow_status=workflow_status,
            reviewed_by_user_id=reviewed_by_user_id,
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not updated_record:
        return jsonify({"error": "Student registration request not found"}), 404

    return jsonify(updated_record)


@app.delete("/api/student-registration-requests/<student_registration_request_id>")
def delete_registration_request(student_registration_request_id: str):
    payload = request.get_json(silent=True) or {}

    deleted_by_user_id = str(
        payload.get("deleted_by_user_id", "asa_staff:unknown")
    ).strip()

    deleted_record = delete_student_registration_request(
        student_registration_request_id=student_registration_request_id,
        deleted_by_user_id=deleted_by_user_id,
    )

    if not deleted_record:
        return jsonify({"error": "Student registration request not found"}), 404

    return jsonify(
        {
            "deleted": True,
            "student_registration_request_id": student_registration_request_id,
            "deleted_record": deleted_record,
        }
    )


@app.get("/api/documentation-queue")
def documentation_queue():
    status = request.args.get("status", "").strip()

    if status:
        statuses = [item.strip() for item in status.split(",") if item.strip()]
        return jsonify(get_documentation_queue_items(statuses))

    return jsonify(get_documentation_queue_items())


@app.patch("/api/student-registration-requests/<student_registration_request_id>/docs-status")
def update_registration_request_docs_status(student_registration_request_id: str):
    payload = request.get_json(silent=True) or {}

    docs_review_status = str(payload.get("docs_review_status", "")).strip()
    reviewed_by_user_id = str(
        payload.get("reviewed_by_user_id", "asa_staff:documentation")
    ).strip()

    if not docs_review_status:
        return jsonify({"error": "docs_review_status is required"}), 400

    try:
        updated_record = update_student_registration_request_docs_status(
            student_registration_request_id=student_registration_request_id,
            docs_review_status=docs_review_status,
            reviewed_by_user_id=reviewed_by_user_id,
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not updated_record:
        return jsonify({"error": "Student registration request not found"}), 404

    return jsonify(updated_record)


@app.get("/api/asa-letter-approvals")
def asa_letter_approvals():
    status = request.args.get("status", "").strip()

    if status:
        statuses = [item.strip() for item in status.split(",") if item.strip()]
        return jsonify(get_asa_letter_approvals_by_status(statuses))

    return jsonify(get_asa_letter_approvals())


@app.get("/api/asa-letter-approvals/<asa_letter_request_id>")
def asa_letter_approval_detail(asa_letter_request_id: str):
    record = get_asa_letter_approval_by_id(asa_letter_request_id)

    if not record:
        return jsonify({"error": "ASA letter approval request not found"}), 404

    return jsonify(record)


@app.patch("/api/asa-letter-approvals/<asa_letter_request_id>/status")
def asa_letter_approval_status_update(asa_letter_request_id: str):
    payload = request.get_json(silent=True) or {}

    workflow_status = str(payload.get("workflow_status", "")).strip()
    reviewed_by_user_id = str(
        payload.get("reviewed_by_user_id", "asa_staff:unknown")
    ).strip()

    if not workflow_status:
        return jsonify({"error": "workflow_status is required"}), 400

    try:
        updated_record = update_asa_letter_approval_status(
            asa_letter_request_id=asa_letter_request_id,
            workflow_status=workflow_status,
            reviewed_by_user_id=reviewed_by_user_id,
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not updated_record:
        return jsonify({"error": "ASA letter approval request not found"}), 404

    return jsonify(updated_record)


@app.get("/api/students-directory")
def students_directory():
    return jsonify(get_registered_students_directory())


@app.get("/api/students-directory/<student_id>")
def student_directory_detail(student_id: str):
    record = get_registered_student_detail(student_id)

    if not record:
        return jsonify({"error": "Student not found"}), 404

    return jsonify(record)


@app.get("/api/faculty-courses")
def faculty_courses():
    return jsonify(get_faculty_courses())


@app.get("/api/faculty-courses/me")
def faculty_courses_me():
    current_user_data = get_mock_current_faculty_user()
    instructor_email = current_user_data.get("email", "").strip()

    if not instructor_email:
        return jsonify([])

    return jsonify(get_faculty_courses_by_instructor_email(instructor_email))


@app.get("/api/debug/faculty-courses/me")
def faculty_courses_me_debug():
    return jsonify(get_faculty_course_debug_summary())


@app.get("/api/faculty-letters/me")
def faculty_letters_me():
    current_user_data = get_mock_current_faculty_user()
    instructor_email = current_user_data.get("email", "").strip()

    if not instructor_email:
        return jsonify([])

    return jsonify(get_faculty_letters_by_instructor_email(instructor_email))


@app.get("/api/debug/faculty-letters/me")
def faculty_letters_me_debug():
    return jsonify(get_faculty_letter_debug_summary())


@app.get("/api/exam-requests")
def exam_requests():
    source_section_id = request.args.get("source_section_id", "").strip()

    if source_section_id:
        data = get_exam_requests_by_course(source_section_id)
    else:
        data = get_exam_requests()

    return jsonify(data)


@app.get("/api/exam-requests/<exam_request_id>")
def exam_request_detail(exam_request_id: str):
    record = get_exam_request_by_id(exam_request_id)

    if not record:
        return jsonify({"error": "Exam request not found"}), 404

    return jsonify(record)


@app.patch("/api/exam-requests/<exam_request_id>/staff-status")
def exam_request_staff_status_update(exam_request_id: str):
    payload = request.get_json(silent=True) or {}

    next_staff_status = str(payload.get("staff_status", "")).strip()
    staff_notes = str(payload.get("staff_notes", "")).strip()
    acted_by_user_id = str(
        payload.get("acted_by_user_id", "BONAS\\cchilds")
    ).strip()

    if not next_staff_status:
        return jsonify({"error": "staff_status is required"}), 400

    try:
        updated_record = update_exam_request_staff_status(
            exam_request_id=exam_request_id,
            next_staff_status=next_staff_status,
            staff_notes=staff_notes,
            acted_by_user_id=acted_by_user_id,
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not updated_record:
        return jsonify({"error": "Exam request not found"}), 404

    return jsonify(updated_record)


@app.patch("/api/exam-requests/<exam_request_id>/faculty-response")
def exam_request_faculty_response_update(exam_request_id: str):
    payload = request.get_json(silent=True) or {}

    submitted_by_user_id = str(
        payload.get("submitted_by_user_id", "faculty:unknown")
    ).strip()

    required_fields = [
        "provided_to_asa_method",
        "return_method",
        "approved_exam_date",
        "approved_start_time",
        "duration_minutes",
        "calculator_policy",
        "preferred_contact_method",
        "preferred_contact_value",
    ]

    missing = [
        field for field in required_fields if payload.get(field) in (None, "", [])
    ]

    if missing:
        return jsonify(
            {"error": f"Missing required field(s): {', '.join(missing)}"}
        ), 400

    try:
        payload["duration_minutes"] = int(payload["duration_minutes"])
    except (TypeError, ValueError):
        return jsonify({"error": "duration_minutes must be an integer"}), 400

    updated_record = upsert_exam_request_faculty_response(
        exam_request_id=exam_request_id,
        payload=payload,
        submitted_by_user_id=submitted_by_user_id,
    )

    if not updated_record:
        return jsonify({"error": "Exam request not found"}), 404

    return jsonify(updated_record)


@app.get("/api/faculty-exam-preferences")
def faculty_exam_preferences():
    source_section_id = request.args.get("source_section_id", "").strip()

    if source_section_id:
        record = get_faculty_exam_preference_by_section(source_section_id)

        if not record:
            return jsonify({"error": "Faculty exam preference not found"}), 404

        return jsonify(record)

    return jsonify(get_faculty_exam_preferences())


@app.patch("/api/faculty-exam-preferences/<source_section_id>")
def faculty_exam_preferences_update(source_section_id: str):
    payload = request.get_json(silent=True) or {}

    updated_by_user_id = str(
        payload.get("updated_by_user_id", "faculty:unknown")
    ).strip()

    updated_record = upsert_faculty_exam_preference(
        source_section_id=source_section_id,
        payload=payload,
        updated_by_user_id=updated_by_user_id,
    )

    if not updated_record:
        return jsonify({"error": "Course section not found"}), 404

    return jsonify(updated_record)


@app.get("/api/uploaded-exams")
def uploaded_exams():
    source_section_id = request.args.get("source_section_id", "").strip()

    if source_section_id:
        data = get_uploaded_exams_by_section(source_section_id)
    else:
        data = get_uploaded_exams()

    return jsonify(data)


@app.post("/api/uploaded-exams")
def uploaded_exams_create():
    payload = request.get_json(silent=True) or {}

    uploaded_by_user_id = str(
        payload.get("uploaded_by_user_id", "faculty:unknown")
    ).strip()

    required_fields = [
        "source_section_id",
        "title",
        "file_name",
        "storage_path",
        "mime_type",
        "delivery_method",
    ]

    missing = [
        field for field in required_fields if payload.get(field) in (None, "", [])
    ]

    if missing:
        return jsonify(
            {"error": f"Missing required field(s): {', '.join(missing)}"}
        ), 400

    created_record = create_uploaded_exam(
        source_section_id=str(payload.get("source_section_id", "")).strip(),
        payload=payload,
        uploaded_by_user_id=uploaded_by_user_id,
    )

    if not created_record:
        return jsonify({"error": "Course section not found"}), 404

    return jsonify(created_record), 201


if __name__ == "__main__":
    app.run(debug=True, port=5050)