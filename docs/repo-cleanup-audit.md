# MySBU Local Build - Repository Cleanup Audit

*Last reviewed from GitHub repo state after ASA resource/workspace rebuild and workflow route alignment.*

## Purpose

This document identifies files and code areas that should be deleted, condensed, split apart, or documented before handing the prototype to a web developer. It is intended to reduce confusion by distinguishing active build paths from older prototype paths.

## Executive Summary

The project is functional as a local prototype. The highest-value cleanup items before handoff are now:

1. **Merge the duplicate ASA staff workspace cleanup**: PR #4 removes `assets/js/features/asa-staff-workspace/index..js`. The active router imports `assets/js/features/asa-staff-workspace/index.js`.
2. **Treat ASA resource module cleanup as complete**: the active router imports `assets/js/features/asa-resources/public-resource-list.js` and `assets/js/features/asa-resources/resource-admin.js`, and the older misplaced direct files are no longer present.
3. **Remove retired ASA staff-access management files** because staff roles are now expected to be controlled by IT/AD or backend identity, not by MySBU.
4. **Remove the old `assets/js/app/*` bootstrap path** unless it is intentionally revived. The active app now enters through `assets/js/main.js`.
5. **Remove or archive old mock-only dashboard modules** that contain hardcoded sample data and are no longer part of the active flow.
6. **Keep front-end/API route alignment current**. Student lifecycle and exam-delete routes now exist in Flask; remaining work is behavior verification against SQL data and UI testing.
7. **Split `api/app.py` and large query modules** into smaller route and repository modules before handing over long-term ownership.
8. **Maintain docs next to each major code area**, preferably using `docs/code-file-commentary.md` rather than filling every file with verbose comments.

---

## Immediate Fixes Before Handoff

### 1. Remove duplicate ASA staff workspace entrypoint

Current state:

* The active router imports `../features/asa-staff-workspace/index.js`.
* `assets/js/features/asa-staff-workspace/index.js` is the file to keep.
* `assets/js/features/asa-staff-workspace/index..js` is a duplicate typo file and should be removed.

Action:

* Merge PR #4 or otherwise delete:

```text
assets/js/features/asa-staff-workspace/index..js
```

Then verify the active file still exists:

```text
assets/js/features/asa-staff-workspace/index.js
```

### 2. Treat ASA resource module folder cleanup as complete

Current state:

The router expects and the repo now contains:

```text
assets/js/features/asa-resources/public-resource-list.js
assets/js/features/asa-resources/resource-admin.js
```

The older misplaced direct files are no longer present:

```text
assets/js/features/public-resource-list.js
assets/js/features/resource-admin.js
```

Action:

* Keep the active folder structure:

```text
assets/js/features/asa-resources/
```

* Do not recreate the older direct files under `assets/js/features/`.

---

## Delete / Archive Candidates

These files conflict with the current architecture or appear to be obsolete.

### Strong delete candidates

| Path                                       | Recommendation                                      | Reason                                                                                                          |
| ------------------------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `pages/asa-staff-access.html`              | Delete or move to `_archive/`                       | Role management moved to IT/AD, not MySBU.                                                                      |
| `assets/css/pages/asa-staff-access.css`    | Delete after page deletion                          | Only supports retired staff-access page.                                                                        |
| `assets/js/modules/asa-staff-access.js`    | Delete after page deletion                          | Maintains prototype localStorage allowlist, which conflicts with AD/backend role ownership.                     |
| `assets/js/modules/asa-staff-dashboard.js` | Delete or archive                                   | Contains hardcoded mock exam/student/documentation/access arrays. Current staff portal uses API-backed modules. |
| `assets/js/app/bootstrap.js`               | Delete if unused                                    | Older bootstrap path. Active entry is `assets/js/main.js`.                                                      |
| `assets/js/app/page-registry.js`           | Delete if unused                                    | Older page registry duplicates current `assets/js/shell/page-module-router.js`.                                 |
| `assets/js/modules/home-routing.js`        | Delete if only referenced by old `page-registry.js` | Replaced by `demo-role-switcher` and shell routing.                                                             |
| `assets/js/modules/staff-gates.js`         | Delete if only referenced by old `page-registry.js` | Active access is handled by `role-utils.js` and `page-module-router.js`.                                        |
| `assets/js/modules/tabs.js`                | Delete if only referenced by old bootstrap          | Active tab behavior is in `page-module-router.js`.                                                              |
| `assets/js/modules/accordions.js`          | Delete if only referenced by old bootstrap          | No active import found outside old bootstrap.                                                                   |
| `assets/js/modules/contact-bindings.js`    | Delete if only referenced by old bootstrap          | No active import found outside old bootstrap.                                                                   |

### Conditional delete candidates

| Path                                     | Recommendation                    | Reason                                                                                    |
| ---------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `assets/js/modules/faculty-dashboard.js` | Delete if no import depends on it | It is just a compatibility re-export to the new faculty dashboard feature.                |
| `pages/asa-intake-form.html`             | Keep for now, review later        | This is an internal ASA workflow page; keep if the staff intake process remains in scope. |

---

## Areas to Condense

### 1. Repeated front-end helpers

The following patterns appear across several modules:

* `escapeHtml(value)`
* `formatStatusLabel(status)`
* `getStatusClass(status)`
* `renderEmptyState(container, message)`
* modal open/close logic
* API loading/error fallback blocks

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

`assets/js/services/portal-api.js` is the right place for all API calls.

Previously identified student lifecycle and exam-delete methods now have matching Flask routes. Continue using this file as the central API client, and verify new methods against Flask routes as features are added.

Action:

* Keep API methods grouped by domain.
* Verify route behavior against SQL-backed data before relying on a workflow in demos.
* Group methods by domain using comments:

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

* Keep component styles under `assets/css/components/`.
* Keep only page-specific exceptions under `assets/css/pages/`.
* Delete retired `asa-staff-access.css` after deleting the retired page.

---

## Areas to Break Into Smaller Pieces

### 1. `api/app.py`

Current issue:

* `api/app.py` owns most Flask routes: identity, student registration, documentation queue, ASA inbox, ASA resources, faculty courses, exam requests, faculty preferences, and uploaded exams.
* Workflow routes are beginning to move into a separate route module through the workflow API branch.

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
├── asa_resource_routes.py
└── workflow_routes.py
```

Keep `api/app.py` as a small app factory:

```python
from flask import Flask
from flask_cors import CORS

from routes.me_routes import me_bp
from routes.student_registration_routes import student_registration_bp
from routes.asa_resource_routes import asa_resource_bp
from routes.workflow_routes import workflow_bp


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    app.register_blueprint(me_bp, url_prefix="/api")
    app.register_blueprint(student_registration_bp, url_prefix="/api")
    app.register_blueprint(asa_resource_bp, url_prefix="/api/asa/resources")
    app.register_blueprint(workflow_bp, url_prefix="/api/workflow")
    return app
```

### 2. `api/query_modules/student_portal.py`

Current issue:

* This file handles student lookup, registration status, registration request creation, request deletion, documentation queue, student directory, student detail, academic level changes, archiving, restoring, deletion, workflow status updates, and docs status updates.

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

* This file mixes DB-backed faculty course queries with mock/seeded accommodation letter approval data.

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

## Front-End / API Alignment To Verify

### Student lifecycle actions

`portal-api.js` exposes methods for:

```text
PATCH /students-directory/<student_id>/academic-level
PATCH /students-directory/<student_id>/archive
PATCH /students-directory/<student_id>/restore
DELETE /students-directory/<student_id>
```

Current state:

* Matching Flask routes exist in `api/app.py`.
* Query functions exist in `api/query_modules/student_portal.py`.
* The front-end student record module calls these methods for academic-level change, archive, restore, and delete actions.

Remaining action:

* Verify behavior against real SQL data.
* Confirm the student record UI handles success, validation errors, and not-found responses cleanly.

### Exam delete action

`portal-api.js` exposes:

```text
DELETE /exam-requests/<exam_request_id>
```

Current state:

* A matching Flask route exists in `api/app.py`.
* Query logic exists in `api/query_modules/exam_requests.py`.

Remaining action:

* Verify behavior against real SQL data.
* Confirm any UI that calls this route handles delete success and not-found responses cleanly.

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

1. Merge or complete the duplicate ASA staff workspace cleanup.
2. Delete retired staff-access files.
3. Delete old `assets/js/app/*` bootstrap files if confirmed unused.
4. Remove old mock dashboard module.
5. Verify student lifecycle and exam-delete route behavior against SQL-backed data.
6. Add concise file headers to active files.
7. Hand off with:

   * `docs/source-of-truth-matrix.md`
   * `docs/repo-cleanup-audit.md`
   * `docs/code-file-commentary.md`
   * a short `README.md`

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
