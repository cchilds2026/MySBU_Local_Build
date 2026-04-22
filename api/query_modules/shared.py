from __future__ import annotations

from typing import Any

from settings import MOCK_CURRENT_USER


def rows_to_dicts(cursor, rows) -> list[dict[str, Any]]:
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in rows]


def get_mock_current_faculty_user() -> dict[str, Any]:
    return dict(MOCK_CURRENT_USER)