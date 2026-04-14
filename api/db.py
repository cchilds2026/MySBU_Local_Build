from __future__ import annotations

import os
from pathlib import Path

import pyodbc
from dotenv import load_dotenv


def load_env() -> None:
    project_root = Path(__file__).resolve().parent.parent
    env_path = project_root / "imports" / "transforms" / ".env"

    if env_path.exists():
        load_dotenv(env_path)


def get_connection() -> pyodbc.Connection:
    load_env()

    driver = os.getenv("DB_DRIVER", "").strip()
    server = os.getenv("DB_SERVER", "").strip()
    database = os.getenv("DB_DATABASE", "").strip()
    auth = os.getenv("DB_AUTH", "").strip().lower()

    if not driver:
        raise ValueError("DB_DRIVER is not set")
    if not server:
        raise ValueError("DB_SERVER is not set")
    if not database:
        raise ValueError("DB_DATABASE is not set")
    if auth not in {"windows", "sql"}:
        raise ValueError("DB_AUTH must be 'windows' or 'sql'")

    if auth == "windows":
        connection_string = (
            f"DRIVER={{{driver}}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            "Trusted_Connection=yes;"
            "TrustServerCertificate=yes;"
        )
    else:
        username = os.getenv("DB_USERNAME", "").strip()
        password = os.getenv("DB_PASSWORD", "").strip()

        if not username or not password:
            raise ValueError("DB_USERNAME and DB_PASSWORD are required for SQL auth")

        connection_string = (
            f"DRIVER={{{driver}}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"UID={username};"
            f"PWD={password};"
            "TrustServerCertificate=yes;"
        )

    return pyodbc.connect(connection_string)