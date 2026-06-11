# MySBU Local Build

This repository is a local working prototype for the MySBU Accessibility Services and Accommodations redesign. It includes static portal pages, a Flask API, SQL Server query modules, and handoff documentation for the developer who will rebuild or productionize the work.

## What is in this prototype

- Student, faculty/staff, graduate, and ASA staff portal pages
- ASA staff workspace with unified inbox sections
- ASA resource manager for publishing read-only/downloadable resources
- Student registration and documentation review workflows
- Faculty exam request and exam preference workflows
- SQL-backed Flask API endpoints for the main workflow data
- Local mock identity and demo-role handling for development only

## Active front-end entry points

Most pages load the same front-end entry file:

```text
assets/js/main.js
```

The active page router is:

```text
assets/js/shell/page-module-router.js
```

The central API client is:

```text
assets/js/services/portal-api.js
```

## Running the front end locally

1. Open this repository folder in VS Code.
2. Start Live Server from `pages/index.html`.
3. Confirm the site is served from the repository root, normally:

```text
http://127.0.0.1:5500/pages/index.html
```

The front end can render in local preview mode even if Flask is not running. API-backed panels will show fallback messages until the Flask API is available.

## Running the Flask API locally

Install dependencies:

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Run the API:

```powershell
.venv\Scripts\python.exe api/app.py
```

The API runs at:

```text
http://127.0.0.1:5050/api
```

Health check:

```text
http://127.0.0.1:5050/api/health
```

## Database configuration

The API loads database variables from:

```text
imports/transforms/.env
```

Use this file as a starting point:

```text
imports/transforms/.env.example
```

Required variables:

```text
DB_DRIVER
DB_SERVER
DB_DATABASE
DB_AUTH
```

`DB_USERNAME` and `DB_PASSWORD` are only required when `DB_AUTH=sql`.

## Active pages

```text
pages/index.html
pages/student-portal.html
pages/faculty-portal.html
pages/graduate-portal.html
pages/student-registration.html
pages/request-exam.html
pages/request-accommodation-letter.html
pages/upload-documentation.html
pages/asa-staff-portal.html
pages/asa-resources-admin.html
pages/asa-student-directory.html
pages/asa-student-record.html
pages/asa-exam-operations.html
pages/asa-intake-form.html
```

## Prototype identity behavior

Authentication is mocked locally. The front end has a local preview fallback for Live Server, and the Flask API has a mock current user in `api/settings.py`.

Production should replace both with authenticated identity and role claims from Active Directory, SSO, or another backend identity layer.

## Resource storage behavior

The ASA resource manager stores metadata and links. It does not upload files directly. The expected production direction is for files to live in OneDrive or SharePoint, with the app storing the title, description, audience, status, and file link.

## Handoff docs

Start here:

```text
docs/code-file-commentary.md
docs/repo-cleanup-audit.md
docs/source-of-truth-matrix.md
docs/api-endpoints.md
```

These files explain the code layout, current cleanup status, data ownership assumptions, API endpoints, and known production refactors.
