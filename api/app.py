from __future__ import annotations

from flask import Flask, jsonify, request
from flask_cors import CORS

from queries import (
    create_uploaded_exam,
    get_exam_request_by_id,
    get_exam_requests,
    get_exam_requests_by_course,
    get_faculty_exam_preference_by_section,
    get_faculty_exam_preferences,
    get_uploaded_exams,
    get_uploaded_exams_by_section,
    update_exam_request_staff_status,
    upsert_exam_request_faculty_response,
    upsert_faculty_exam_preference,
)

app = Flask(__name__)
CORS(app)


@app.get("/api/health")
def health() -> tuple[dict[str, str], int]:
    return {"status": "ok"}, 200


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
    acted_by_user_id = str(payload.get("acted_by_user_id", "BONAS\\cchilds")).strip()

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
    submitted_by_user_id = str(payload.get("submitted_by_user_id", "faculty:unknown")).strip()

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

    missing = [field for field in required_fields if payload.get(field) in (None, "", [])]
    if missing:
        return jsonify({"error": f"Missing required field(s): {', '.join(missing)}"}), 400

    try:
        if payload.get("duration_minutes") is not None:
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

    data = get_faculty_exam_preferences()
    return jsonify(data)


@app.patch("/api/faculty-exam-preferences/<source_section_id>")
def faculty_exam_preferences_update(source_section_id: str):
    payload = request.get_json(silent=True) or {}
    updated_by_user_id = str(payload.get("updated_by_user_id", "faculty:unknown")).strip()

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
    uploaded_by_user_id = str(payload.get("uploaded_by_user_id", "faculty:unknown")).strip()

    required_fields = [
        "source_section_id",
        "title",
        "file_name",
        "storage_path",
        "mime_type",
        "delivery_method",
    ]

    missing = [field for field in required_fields if payload.get(field) in (None, "", [])]
    if missing:
        return jsonify({"error": f"Missing required field(s): {', '.join(missing)}"}), 400

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