from __future__ import annotations

import os
from pathlib import Path

import pyodbc
from dotenv import load_dotenv


def load_env() -> tuple[str, str, str, str, str]:
    env_path = Path(__file__).resolve().parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)

    driver = os.getenv("DB_DRIVER", "").strip()
    server = os.getenv("DB_SERVER", "").strip()
    database = os.getenv("DB_DATABASE", "").strip()
    auth = os.getenv("DB_AUTH", "").strip().lower()
    project_root = os.getenv("PROJECT_ROOT", "").strip()

    if not driver:
        raise ValueError("DB_DRIVER is not set in imports/transforms/.env")
    if not server:
        raise ValueError("DB_SERVER is not set in imports/transforms/.env")
    if not database:
        raise ValueError("DB_DATABASE is not set in imports/transforms/.env")
    if auth not in {"windows", "sql"}:
        raise ValueError("DB_AUTH must be 'windows' or 'sql'")
    if not project_root:
        raise ValueError("PROJECT_ROOT is not set in imports/transforms/.env")

    return driver, server, database, auth, project_root


def build_connection_string(driver: str, server: str, database: str, auth: str) -> str:
    if auth == "windows":
        return (
            f"DRIVER={{{driver}}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            "Trusted_Connection=yes;"
            "TrustServerCertificate=yes;"
        )

    username = os.getenv("DB_USERNAME", "").strip()
    password = os.getenv("DB_PASSWORD", "").strip()

    if not username or not password:
        raise ValueError("DB_USERNAME and DB_PASSWORD are required for SQL authentication")

    return (
        f"DRIVER={{{driver}}};"
        f"SERVER={server};"
        f"DATABASE={database};"
        f"UID={username};"
        f"PWD={password};"
        "TrustServerCertificate=yes;"
    )


def execute_batches(cursor: pyodbc.Cursor, sql_text: str) -> None:
    batches = [batch.strip() for batch in sql_text.split("\nGO") if batch.strip()]
    for batch in batches:
        cursor.execute(batch)


def main() -> None:
    driver, server, database, auth, project_root = load_env()
    connection_string = build_connection_string(driver, server, database, auth)

    schema_path = Path(project_root).resolve() / "data-model" / "workflow-extensions.sql"
    if not schema_path.exists():
        raise FileNotFoundError(f"Workflow extension schema file not found: {schema_path}")

    schema_sql = schema_path.read_text(encoding="utf-8")

    with pyodbc.connect(connection_string) as connection:
        cursor = connection.cursor()
        execute_batches(cursor, schema_sql)
        connection.commit()

    print(f"Workflow extension schema loaded successfully from: {schema_path}")


if __name__ == "__main__":
    main()
