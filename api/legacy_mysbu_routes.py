from __future__ import annotations

from flask import Blueprint, jsonify, request

from query_modules.legacy_mysbu import (
    LegacyMysbuIntegrationNotConfigured,
    get_legacy_mysbu_form_submissions,
)
from query_modules.shared import get_mock_current_faculty_user


legacy_mysbu_bp = Blueprint("legacy_mysbu", __name__, url_prefix="/api")


def _require_asa_staff_user():
    user = get_mock_current_faculty_user()
    roles = user.get("roles", [])

    if not isinstance(roles, list):
        roles = []

    if "asa_staff" not in roles:
        return None

    return user


def _staff_required_response():
    return jsonify({"error": "ASA staff access required"}), 403


@legacy_mysbu_bp.get("/legacy-mysbu/form-submissions")
def legacy_mysbu_form_submissions():
    if not _require_asa_staff_user():
        return _staff_required_response()

    try:
        records = get_legacy_mysbu_form_submissions(
            student_identifier=request.args.get("student_identifier"),
            student_email=request.args.get("student_email"),
            source_form_name=request.args.get("source_form_name"),
            limit=request.args.get("limit", 50),
        )
    except LegacyMysbuIntegrationNotConfigured as error:
        return jsonify(
            {
                "error": str(error),
                "integration_status": "not_configured",
                "required_view": "asa.v_legacy_mysbu_form_submission",
                "source_database": "ektron_mysbuINT",
            }
        ), 503

    return jsonify(
        {
            "integration_status": "configured",
            "source_database": "ektron_mysbuINT",
            "records": records,
        }
    )
