# MySBU Local Build - Repository Cleanup Audit

_Last reviewed from GitHub repo state after ASA resource/workspace rebuild._

## Purpose

This document identifies files and code areas that should be deleted, condensed, split apart, or documented before handing the prototype to a web developer. It is intended to reduce confusion by distinguishing active build paths from older prototype paths.

## Executive Summary

The project is functional as a local prototype, but there are several cleanup items that should be handled before handoff:

1. **Fix/push the ASA staff workspace filename**: the repo still shows `assets/js/features/asa-staff-workspace/index..js`, while the active router imports `assets/js/features/asa-staff-workspace/index.js`.
2. **Move or recreate ASA resource modules in the expected folder**: the active router imports `assets/js/features/asa-resources/public-resource-list.js` and `assets/js/features/asa-resources/resource-admin.js`, but the repo also contains older resource files directly under `assets/js/features/`.
3. **Remove retired ASA staff-access management files** because staff roles are now expected to be controlled by IT/AD or backend identity, not by MySBU.
4. **Remove the old `assets/js/app/*` bootstrap path** unless it is intentionally revived. The active app now enters through `assets/js/main.js`.
5. **Remove or archive old mock-only dashboard modules** that contain hardcoded sample data and are no longer part of the active flow.
6. **Resolve front-end/API mismatches** where `portal-api.js` exposes methods that currently do not have matching Flask routes.
7. **Split `api/app.py` and large query modules** into smaller route and repository modules before handing over long-term ownership.
8. **Add comments or docs next to each major code area**, preferably using a `docs/code-file-commentary.md` file rather than filling every file with verbose comments.

---

## Immediate Fixes Before Handoff

### 1. Correct the ASA staff workspace filename in Git

Current risk:

- The active router imports `../features/asa-staff-workspace/index.js`.
- GitHub search still shows `assets/js/features/asa-staff-workspace/index..js`.
- If the corrected filename was only fixed locally, push the rename.

Action:

```text
Rename:
assets/js/features/asa-staff-workspace/index..js

to:
assets/js/features/asa-staff-workspace/index.js
```

Then verify:

```text
http://127.0.0.1:5500/assets/js/features/asa-staff-workspace/index.js
```

### 2. Ensure ASA resource modules live in the expected folder

The router expects:

```text
assets/js/features/asa-resources/public-resource-list.js
assets/js/features/asa-resources/resource-admin.js
```

The repo contains older resource modules at:

```text
assets/js/features/public-resource-list.js
assets/js/features/resource-admin.js
```

Those older files are in the wrong location for the current router. Their relative imports are also wrong if used from that direct `features/` folder because they import `../../services/portal-api.js`, which resolves outside `assets/js`.

Action:

- Keep the active folder structure:

```text
assets/js/features/asa-resources/
```

- Move or recreate the files there.
- Delete the misplaced direct files after confirming nothing imports them:

```text
assets/js/features/public-resource-list.js
assets/js/features/resource-admin.js
```

---

## Delete / Archive Candidates

These files conflict with the current architecture or appear to be obsolete.

### Strong delete candidates

| Path | Recommendation | Reason |
|---|---|---|
| `pages/asa-staff-access.html` | Delete or move to `_archive/` | Role management moved to IT/AD, not MySBU. |
| `assets/css/pages/asa-staff-access.css` | Delete after page deletion | Only supports retired staff-access page. |
| `assets/js/modules/asa-staff-access.js` | Delete after page deletion | Maintains prototype localStorage allowlist, which conflicts with AD/backend role ownership. |
| `assets/js/modules/asa-staff-dashboard.js` | Delete or archive | Contains hardcoded mock exam/student/documentation/access arrays. Current staff portal uses API-backed modules. |
| `assets/js/app/bootstrap.js` | Delete if unused | Older bootstrap path. Active entry is `assets/js/main.js`. |
| `assets/js/app/page-registry.js` | Delete if unused | Older page registry duplicates current `assets/js/shell/page-module-router.js`. |
| `assets/js/modules/home-routing.js` | Delete if only referenced by old `page-registry.js` | Replaced by `demo-role-switcher` and shell routing. |
| `assets/js/modules/staff-gates.js` | Delete if only referenced by old `page-registry.js` | Active access is handled by `role-utils.js` and `page-module-router.js`. |
| `assets/js/modules/tabs.js` | Delete if only referenced by old bootstrap | Active tab behavior is in `page-module-router.js`. |
| `assets/js/modules/accordions.js` | Delete if only referenced by old bootstrap | No active import found outside old bootstrap. |
| `assets/js/modules/contact-bindings.js` | Delete if only referenced by old bootstrap | No active import found outside old bootstrap. |

### Conditional delete candidates

| Path | Recommendation | Reason |
|---|---|---|
| `assets/js/modules/faculty-dashboard.js` | Delete if no import depends on it | It is just a compatibility re-export to the new faculty dashboard feature. |
| `assets/js/features/public-resource-list.js` | Delete after correct `asa-resources/` file exists | Wrong folder for active router. |
| `assets/js/features/resource-admin.js` | Delete after correct `asa-resources/` file exists | Wrong folder for active router. |
| `pages/asa-intake-form.html` | Keep for now, review later | This is an internal ASA workflow page; keep if the staff intake process remains in scope. |

---

## Areas to Condense

### 1. Repeated front-end helpers

The following patterns appear across several modules:

- `escapeHtml(value)`
- `formatStatusLabel(status)`
- `getStatusClass(status)`
- `renderEmptyState(container, message)`
- modal open/close logic
- API loading/error fallback blocks

Recommended shared files:

```text
assets/js/core/dom.js
assets/js/core/status-formatters.js
assets/js/core/rendering.js
assets/js/core/modal.js
```

Example responsibilities:

```text
assets/js/core/dom.js
- escapeHtml
- escapeAttribute
- getRequiredElement
- renderEmptyState

assets/js/core/status-formatters.js
- formatStatusLabel
- getStatusClass
- source/audience labels
```

### 2. Portal API wrapper

`assets/js/services/portal-api.js` is the right place for all API calls, but it now includes some methods that appear unfinished or not backed by Flask routes.

Action:

- Either add matching Flask routes or remove/comment the unused API methods.
- Group methods by domain using comments:

```js
// Current user / identity
// Student registration
// ASA staff workflow
// ASA resources
// Faculty dashboard
// Exam requests
// Uploaded exams
```

### 3. CSS page files

`assets/css/main.css` is already a useful import manifest. Keep that pattern.

Potential cleanup:

- Keep component styles under `assets/css/components/`.
- Keep only page-specific exceptions under `assets/css/pages/`.
- Delete retired `asa-staff-access.css` after deleting the retired page.

---

## Areas to Break Into Smaller Pieces

### 1. `api/app.py`

Current issue:

- `api/app.py` owns every Flask route: identity, student registration, documentation queue, ASA inbox, ASA resources, faculty courses, exam requests, faculty preferences, and uploaded exams.

Recommended split:

```text
api/routes/
├── __init__.py
├── me_routes.py
├── student_registration_routes.py
├── student_directory_routes.py
├── documentation_routes.py
├── faculty_routes.py
├── exam_request_routes.py
├── uploaded_exam_routes.py
├── asa_inbox_routes.py
└── asa_resource_routes.py
```

Keep `api/app.py` as a small app factory:

```python
from flask import Flask
from flask_cors import CORS

from routes.me_routes import me_bp
from routes.student_registration_routes import student_registration_bp
from routes.asa_resource_routes import asa_resource_bp


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    app.register_blueprint(me_bp, url_prefix="/api")
    app.register_blueprint(student_registration_bp, url_prefix="/api")
    app.register_blueprint(asa_resource_bp, url_prefix="/api/asa/resources")
    return app
```

### 2. `api/query_modules/student_portal.py`

Current issue:

- This file handles student lookup, registration status, registration request creation, request deletion, documentation queue, student directory, student detail, academic level changes, archiving, restoring, deletion, workflow status updates, and docs status updates.

Recommended split:

```text
api/query_modules/students.py
api/query_modules/student_registration.py
api/query_modules/student_directory.py
api/query_modules/documentation.py
api/query_modules/student_lifecycle.py
```

### 3. `api/query_modules/faculty.py`

Current issue:

- This file mixes DB-backed faculty course queries with mock/seeded accommodation letter approval data.

Recommended split:

```text
api/query_modules/faculty_courses.py
api/query_modules/faculty_letters.py
api/query_modules/asa_letter_approvals.py
```

Mark seeded/demo data clearly:

```python
# DEMO DATA ONLY - replace with SQL-backed letter workflow before production.
```

### 4. Faculty dashboard front end

The faculty dashboard is already better organized than the older modules, with `api.js`, `state.js`, `normalizers.js`, renderers, and modals. Keep this pattern and use it as the model for ASA workspace work.

Potential next split:

```text
assets/js/features/asa-staff-workspace/
├── index.js
├── inbox.js
├── inbox-renderers.js
├── inbox-api.js
├── request-detail-modal.js
└── status-actions.js
```

---

## Front-End / API Mismatches To Resolve

### Student lifecycle actions

`portal-api.js` exposes methods for:

```text
PATCH /students-directory/<student_id>/academic-level
PATCH /students-directory/<student_id>/archive
PATCH /students-directory/<student_id>/restore
DELETE /students-directory/<student_id>
```

The front-end student record module calls those methods for moving students between undergraduate/graduate, archive, restore, and delete.

The current `app.py` only exposes:

```text
GET /api/students-directory
GET /api/students-directory/<student_id>
```

Action:

- Add the missing routes, or remove those buttons from `assets/js/features/asa-student-record.js`.
- Since query functions already exist in `student_portal.py`, adding routes is likely the correct fix.

### Exam delete action

`portal-api.js` exposes:

```text
DELETE /exam-requests/<exam_request_id>
```

If no active UI calls it, remove it from `portal-api.js`. If a UI does call it, add the Flask route and query import.

---

## Comments / Documentation Strategy

Avoid putting large essay-style comments inside every code file. That makes the code harder to scan. Instead:

1. Add short file-header comments to major files.
2. Maintain a detailed file map in `docs/code-file-commentary.md`.
3. Use comments only where business rules or non-obvious workflow assumptions exist.

Recommended header format:

```js
/*
  Purpose: Loads published ASA resources into Student and Faculty/Staff portals.
  Data source: GET /api/asa/resources?audience=student|faculty_staff.
  Notes: Displays read-only/downloadable files only. ASA staff manage resources separately.
*/
```

Recommended Python header format:

```python
"""
Routes for ASA resource publication and staff-managed resource metadata.

The actual file storage is expected to live in OneDrive/SharePoint. This API stores
only display metadata, publication status, audience, and the storage path/link.
"""
```

---

## Recommended Handoff Order

1. Fix/push missing/misnamed files.
2. Delete retired staff-access files.
3. Delete old `assets/js/app/*` bootstrap files if confirmed unused.
4. Remove old mock dashboard module.
5. Resolve missing API routes for student lifecycle actions.
6. Add concise file headers to active files.
7. Hand off with:
   - `docs/source-of-truth-matrix.md`
   - `docs/repo-cleanup-audit.md`
   - `docs/code-file-commentary.md`
   - a short `README.md`

## Suggested README Sections

```text
1. What this prototype does
2. How to run Live Server
3. How to run Flask API
4. Required database/environment setup
5. Active page list
6. Active API endpoint list
7. Known prototype limitations
8. Suggested production migration path
```
