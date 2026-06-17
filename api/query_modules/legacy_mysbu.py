from __future__ import annotations

from typing import Any

from db import get_connection
from .shared import rows_to_dicts


class LegacyMysbuIntegrationNotConfigured(RuntimeError):
    """Raised when the SQL view contract has not been installed or mapped yet."""


LEGACY_MYSBU_VIEW_NAME = "asa.v_legacy_mysbu_form_submission"


def _as_int(value: Any, default: int = 50, maximum: int = 200) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default

    if parsed < 1:
        return default

    return min(parsed, maximum)


def _is_missing_contract_error(error: Exception) -> bool:
    message = str(error).lower()

    return (
        "v_legacy_mysbu_form_submission" in message
        or "invalid object name" in message
        or "could not find" in message
    )


def get_legacy_mysbu_form_submissions(
    *,
    student_identifier: str | None = None,
    student_email: str | None = None,
    source_form_name: str | None = None,
    limit: int | str | None = 50,
) -> list[dict[str, Any]]:
    """Return legacy MySBU/Ektron form submissions exposed through the contract view.

    The ASA app should query the stable asa.v_legacy_mysbu_form_submission view only.
    IT/DBA can later remap that view to ektron_mysbuINT tables without changing Python.
    """

    row_limit = _as_int(limit)
    filters: list[str] = []
    params: list[Any] = []

    if student_identifier:
        filters.append("student_identifier = ?")
        params.append(student_identifier.strip())

    if student_email:
        filters.append("student_email = ?")
        params.append(student_email.strip())

    if source_form_name:
        filters.append("source_form_name = ?")
        params.append(source_form_name.strip())

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    sql = f"""
        SELECT TOP {row_limit}
            legacy_submission_id,
            source_system,
            source_form_name,
            submitted_at,
            student_identifier,
            student_email,
            student_first_name,
            student_last_name,
            raw_status,
            source_url,
            raw_payload
        FROM {LEGACY_MYSBU_VIEW_NAME}
        {where_clause}
        ORDER BY submitted_at DESC, legacy_submission_id DESC
    """

    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql, params)
            return rows_to_dicts(cursor, cursor.fetchall())
    except Exception as error:
        if _is_missing_contract_error(error):
            raise LegacyMysbuIntegrationNotConfigured(
                "Legacy MySBU integration view is not configured. "
                "Install database/contracts/legacy-mysbu-integration-contract.sql "
                "and have IT/DBA map asa.v_legacy_mysbu_form_submission to ektron_mysbuINT."
            ) from error

        raise
