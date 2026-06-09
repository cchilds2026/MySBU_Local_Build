from __future__ import annotations

from typing import Any
from uuid import uuid4

from db import get_connection
from .shared import rows_to_dicts


PUBLIC_AUDIENCES = {"student", "faculty_staff"}
RESOURCE_AUDIENCES = {"student", "faculty_staff", "both"}


def _clean_text(value: Any, fallback: str = "") -> str:
    return str(value if value is not None else fallback).strip()


def _clean_optional_text(value: Any) -> str | None:
    text = _clean_text(value)
    return text or None


def _clean_int(value: Any, fallback: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def _validate_audience(audience: str, *, allow_both: bool) -> str:
    normalized = _clean_text(audience).lower()

    allowed = RESOURCE_AUDIENCES if allow_both else PUBLIC_AUDIENCES
    if normalized not in allowed:
        allowed_list = ", ".join(sorted(allowed))
        raise ValueError(f"Invalid audience. Expected one of: {allowed_list}")

    return normalized


def _select_sql() -> str:
    return """
    SELECT
        CONVERT(NVARCHAR(36), resource_id) AS resource_id,
        title,
        description,
        category,
        audience,
        file_name,
        storage_path,
        mime_type,
        status,
        sort_order,
        published_at,
        archived_at,
        created_by_user_id,
        updated_by_user_id,
        created_at,
        updated_at
    FROM asa.resource_library
    """


def get_published_asa_resources(audience: str) -> list[dict[str, Any]]:
    normalized_audience = _validate_audience(audience, allow_both=False)

    sql = f"""
    {_select_sql()}
    WHERE status = 'published'
      AND audience IN (?, 'both')
    ORDER BY
        sort_order,
        title;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, normalized_audience)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_asa_resources_admin() -> list[dict[str, Any]]:
    sql = f"""
    {_select_sql()}
    ORDER BY
        CASE status
            WHEN 'draft' THEN 1
            WHEN 'published' THEN 2
            WHEN 'archived' THEN 3
            ELSE 4
        END,
        sort_order,
        title;
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql)
        return rows_to_dicts(cursor, cursor.fetchall())


def get_asa_resource_by_id(resource_id: str) -> dict[str, Any] | None:
    sql = f"""
    {_select_sql()}
    WHERE resource_id = TRY_CONVERT(UNIQUEIDENTIFIER, ?);
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, resource_id)
        row = cursor.fetchone()

        if not row:
            return None

        return rows_to_dicts(cursor, [row])[0]


def _validate_resource_payload(payload: dict[str, Any]) -> dict[str, Any]:
    title = _clean_text(payload.get("title"))
    category = _clean_text(payload.get("category"))
    audience = _validate_audience(payload.get("audience", ""), allow_both=True)
    file_name = _clean_text(payload.get("file_name"))
    storage_path = _clean_text(payload.get("storage_path"))

    missing = []
    if not title:
        missing.append("title")
    if not category:
        missing.append("category")
    if not audience:
        missing.append("audience")
    if not file_name:
        missing.append("file_name")
    if not storage_path:
        missing.append("storage_path")

    if missing:
        raise ValueError(f"Missing required field(s): {', '.join(missing)}")

    return {
        "title": title,
        "description": _clean_optional_text(payload.get("description")),
        "category": category,
        "audience": audience,
        "file_name": file_name,
        "storage_path": storage_path,
        "mime_type": _clean_optional_text(payload.get("mime_type")),
        "sort_order": _clean_int(payload.get("sort_order"), 0),
    }


def create_asa_resource(
    payload: dict[str, Any],
    created_by_user_id: str,
) -> dict[str, Any]:
    values = _validate_resource_payload(payload)
    resource_id = str(uuid4())

    sql = """
    INSERT INTO asa.resource_library (
        resource_id,
        title,
        description,
        category,
        audience,
        file_name,
        storage_path,
        mime_type,
        status,
        sort_order,
        created_by_user_id,
        updated_by_user_id,
        created_at,
        updated_at
    )
    VALUES (
        TRY_CONVERT(UNIQUEIDENTIFIER, ?),
        ?, ?, ?, ?, ?, ?, ?,
        'draft',
        ?,
        ?, ?,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    );
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            sql,
            resource_id,
            values["title"],
            values["description"],
            values["category"],
            values["audience"],
            values["file_name"],
            values["storage_path"],
            values["mime_type"],
            values["sort_order"],
            created_by_user_id,
            created_by_user_id,
        )
        connection.commit()

    created = get_asa_resource_by_id(resource_id)
    if not created:
        raise ValueError("Resource was created but could not be reloaded")

    return created


def update_asa_resource(
    resource_id: str,
    payload: dict[str, Any],
    updated_by_user_id: str,
) -> dict[str, Any] | None:
    values = _validate_resource_payload(payload)

    sql = """
    UPDATE asa.resource_library
    SET
        title = ?,
        description = ?,
        category = ?,
        audience = ?,
        file_name = ?,
        storage_path = ?,
        mime_type = ?,
        sort_order = ?,
        updated_by_user_id = ?,
        updated_at = SYSUTCDATETIME()
    WHERE resource_id = TRY_CONVERT(UNIQUEIDENTIFIER, ?);
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            sql,
            values["title"],
            values["description"],
            values["category"],
            values["audience"],
            values["file_name"],
            values["storage_path"],
            values["mime_type"],
            values["sort_order"],
            updated_by_user_id,
            resource_id,
        )
        connection.commit()

    return get_asa_resource_by_id(resource_id)


def publish_asa_resource(
    resource_id: str,
    updated_by_user_id: str,
) -> dict[str, Any] | None:
    sql = """
    UPDATE asa.resource_library
    SET
        status = 'published',
        published_at = COALESCE(published_at, SYSUTCDATETIME()),
        archived_at = NULL,
        updated_by_user_id = ?,
        updated_at = SYSUTCDATETIME()
    WHERE resource_id = TRY_CONVERT(UNIQUEIDENTIFIER, ?);
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, updated_by_user_id, resource_id)
        connection.commit()

    return get_asa_resource_by_id(resource_id)


def archive_asa_resource(
    resource_id: str,
    updated_by_user_id: str,
) -> dict[str, Any] | None:
    sql = """
    UPDATE asa.resource_library
    SET
        status = 'archived',
        archived_at = SYSUTCDATETIME(),
        updated_by_user_id = ?,
        updated_at = SYSUTCDATETIME()
    WHERE resource_id = TRY_CONVERT(UNIQUEIDENTIFIER, ?);
    """

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(sql, updated_by_user_id, resource_id)
        connection.commit()

    return get_asa_resource_by_id(resource_id)