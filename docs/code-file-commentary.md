# MySBU Local Build - Code File Commentary

This document explains the purpose of the main code files in the repository so a web developer can orient quickly. It should be kept with the project and updated whenever files are added, deleted, or moved.

The goal is to avoid over-commenting every source file while still giving the developer a plain-English map of what each file is for, what owns it, and what should be cleaned up before production.

## Current Architecture Summary

The prototype has two layers:

1. **Static front end** served by Live Server or a static server.
2. **Flask API** served from `api/app.py` on `http://127.0.0.1:5050/api`.

The active browser entrypoint is:

```text
assets/js/main.js
```

The active page router is:

```text
assets/js/shell/page-module-router.js
```

The active API client is:

```text
assets/js/services/portal-api.js
```

The newer front-end pattern is:

```text
assets/js/features/<feature-name>/...
```

The older front-end pattern is:

```text
assets/js/modules/...
```

Some old modules are still used, but some are now compatibility/legacy files and should be removed after verification.

---

## Active Front-End Shell Files

### `assets/js/main.js`

**Purpose:** Main browser entrypoint for all pages. It loads shared HTML includes, initializes the portal shell, obtains the current user, and hands the page to the page module router.

**Keep:** Yes.

**Notes for developer:** This is the only script tag used by most HTML pages. Avoid adding page-specific script tags unless a deliberate build-system decision is made.

### `assets/js/core/include.js`

**Purpose:** Loads shared HTML partials from `data-include` attributes.

**Keep:** Yes.

**Notes for developer:** This is what allows pages to include shared header, footer, sidebar cards, tab markup, and contact cards.

### `assets/js/shell/portal-shell.js`

**Purpose:** Loads the current user and applies audience-card visibility on the home page.

**Keep:** Yes.

**Notes for developer:** This is where authenticated/role-aware shell behavior starts. In production, it should rely on SSO/AD claims rather than a local preview fallback.

### `assets/js/services/current-user-provider.js`

**Purpose:** Provides the current user to the front end. It checks demo-role override first, then calls `/api/me`.

**Keep:** Yes.

**Production note:** Replace mock/demo behavior with server-provided authenticated user data.

### `assets/js/shell/page-module-router.js`

**Purpose:** Determines which page is currently loaded using `body[data-page]`, checks access, applies the student-registration gate, and initializes the correct page module.

**Keep:** Yes.

**Cleanup note:** Make sure all imported modules actually exist. The active router expects:

```text
assets/js/features/asa-resources/public-resource-list.js
assets/js/features/asa-resources/resource-admin.js
assets/js/features/asa-staff-workspace/index.js
```

### `assets/js/shell/role-utils.js`

**Purpose:** Central role/permission helper for student, faculty, graduate, and ASA staff access.

**Keep:** Yes.

**Production note:** Role values should eventually come from AD/SSO/backend identity.

### `assets/js/shell/student-registration-gate.js`

**Purpose:** Determines whether a student/graduate/faculty user should be redirected to the registration form before using portal pages.

**Keep:** Yes, but review business rules.

**Notes for developer:** ASA staff bypass this gate. The local/demo override exists only for prototype behavior.

### `assets/js/shell/demo-role-switcher.js`

**Purpose:** Lets the local prototype switch between demo roles on the home page.

**Keep:** Yes for prototype. Remove or disable in production.

### `assets/js/shell/demo-role-state.js`

**Purpose:** Stores selected demo role in local browser state.

**Keep:** Prototype only.

### `assets/js/shell/asa-staff-dashboard-summary.js`

**Purpose:** Loads and renders summary counts/cards for ASA staff workflow tabs.

**Keep:** Yes if the staff dashboard summary cards remain.

### `assets/js/shell/asa-staff-utility-nav.js`

**Purpose:** Adds utility-nav behaviors to the ASA staff portal after includes load.

**Keep:** Yes if the ASA staff utility nav remains.

---

## Active API Client

### `assets/js/services/portal-api.js`

**Purpose:** Central wrapper for API calls. Adds base URL, JSON headers, credentials, query-string building, and error handling.

**Keep:** Yes.

**Cleanup note:** Previously identified student lifecycle and exam-delete methods now have matching Flask routes. Continue using this file as the central API client, and verify new methods against Flask routes as features are added.

---

## Active ASA Resource Files

### `assets/js/features/asa-resources/public-resource-list.js`

**Purpose:** Loads read-only/downloadable ASA resources into the Student Portal and Faculty/Staff Portal.

**Keep:** Yes.

**Data source:**

```text
GET /api/asa/resources?audience=student
GET /api/asa/resources?audience=faculty_staff
```

### `assets/js/features/asa-resources/resource-admin.js`

**Purpose:** ASA staff resource manager for creating, editing, publishing, archiving, and swapping file links.

**Keep:** Yes.

**Data source:**

```text
GET /api/asa/resources/admin
POST /api/asa/resources
PATCH /api/asa/resources/<resource_id>
PATCH /api/asa/resources/<resource_id>/publish
PATCH /api/asa/resources/<resource_id>/archive
```

### `assets/css/pages/asa-resources.css`

**Purpose:** Styles ASA resource cards, ASA resource manager rows, and ASA inbox rows.

**Keep:** Yes.

---

## Active ASA Staff Workspace Files

### `assets/js/features/asa-staff-workspace/index.js`

**Purpose:** Entry file for the ASA staff workspace feature.

**Keep:** Yes.

**Important:** GitHub previously showed a typo version named `index..js`. The active router imports `index.js`; the duplicate typo file should not be recreated after cleanup.

### `assets/js/features/asa-staff-workspace/inbox.js`

**Purpose:** Loads and renders the unified ASA staff inbox.

**Keep:** Yes.

**Data source:**

```text
GET /api/asa/inbox
```

### `assets/js/features/asa-staff-registration-intake.js`

**Purpose:** Handles ASA staff registration/intake queue behavior inside the staff portal.

**Keep:** Yes, if the intake workflow remains in scope.

### `assets/js/features/asa-staff-letter-approvals.js`

**Purpose:** Loads and manages ASA accommodation letter approval workflow.

**Keep:** Yes, but note that some letter data is still seeded/mock in `api/query_modules/faculty.py`.

### `assets/js/features/asa-staff-documentation-queue.js`

**Purpose:** Loads documentation queue records and lets ASA staff update documentation review status.

**Keep:** Yes.

### `assets/js/asa-staff-exams.js`

**Purpose:** Initializes staff-facing exam request handling.

**Keep:** Yes if ASA exam operations remain in the prototype.

### `assets/js/features/asa-staff-exams/api.js`

**Purpose:** API helpers specifically for ASA staff exam functions.

**Keep:** Yes if still imported by exam staff modules.

### `assets/js/features/asa-staff-exams/renderers.js`

**Purpose:** Rendering helpers for ASA staff exam request UI.

**Keep:** Yes if still imported by exam staff modules.

### `assets/js/features/asa-exam-operations.js`

**Purpose:** Main ASA exam operations page module.

**Keep:** Yes.

---

## Active Student/ASA Record Files

### `assets/js/features/asa-students-directory.js`

**Purpose:** Renders the ASA staff student directory with active/archived filtering and search.

**Keep:** Yes.

**Backend dependency:** Uses `portalApi.getStudentsDirectory({ lifecycle_status })`.

### `assets/js/features/asa-student-record.js`

**Purpose:** Renders a single student record and exposes staff actions such as delete registration request, academic-level change, archive, restore, and delete.

**Keep:** Yes.

**Cleanup note:** The student lifecycle actions now have matching Flask routes. Continue testing archive, restore, academic-level change, delete, and registration-request delete behavior against SQL-backed records.

### `assets/js/modules/student-registration.js`

**Purpose:** Handles student registration form submission and registration-complete state.

**Keep:** Yes.

### `assets/js/modules/student-letter-records.js`

**Purpose:** Legacy module for student-facing accommodation letter records.

**Keep:** Yes if the student dashboard tabs still use it.

### `assets/js/modules/student-exam-records.js`

**Purpose:** Legacy module for student-facing exam records.

**Keep:** Yes if the student dashboard tabs still use it.

### `assets/js/modules/student-document-records.js`

**Purpose:** Legacy module for student-facing document records.

**Keep:** Yes if the student dashboard tabs still use it.

### `assets/js/modules/exam-request.js`

**Purpose:** Handles student exam request form behavior.

**Keep:** Yes if `pages/request-exam.html` remains active.

### `assets/js/modules/accommodation-letter.js`

**Purpose:** Handles student accommodation letter request form behavior.

**Keep:** Yes if `pages/request-accommodation-letter.html` remains active.

### `assets/js/modules/upload-documentation.js`

**Purpose:** Handles documentation upload form behavior.

**Keep:** Yes if `pages/upload-documentation.html` remains active.

### `assets/js/modules/asa-intake.js`

**Purpose:** Handles ASA staff intake form behavior.

**Keep:** Yes if `pages/asa-intake-form.html` remains active.

### `assets/js/modules/asa-intake-queue.js`

**Purpose:** Renders ASA intake queue data for intake-related workflows.

**Keep:** Yes if intake queue remains active.

---

## Active Faculty Dashboard Files

### `assets/js/features/faculty-dashboard/index.js`

**Purpose:** Main faculty dashboard orchestrator. Loads courses/letters, initializes modals, renders course contexts, letters, exam requests, uploaded exams, and preferences.

**Keep:** Yes.

**Cleanup note:** This file is long but reasonably organized. Further split only if new faculty workflows are added.

### `assets/js/features/faculty-dashboard/api.js`

**Purpose:** Faculty dashboard API wrapper functions.

**Keep:** Yes.

### `assets/js/features/faculty-dashboard/state.js`

**Purpose:** Creates and stores dashboard state such as selected course and cached records.

**Keep:** Yes.

### `assets/js/features/faculty-dashboard/normalizers.js`

**Purpose:** Converts API record shapes into front-end UI shapes.

**Keep:** Yes.

### `assets/js/features/faculty-dashboard/course-normalizers.js`

**Purpose:** Normalizes course data for faculty dashboard rendering.

**Keep:** Yes.

### `assets/js/features/faculty-dashboard/course-provider.js`

**Purpose:** Loads current faculty courses.

**Keep:** Yes.

### `assets/js/features/faculty-dashboard/letter-provider.js`

**Purpose:** Loads current faculty accommodation letters.

**Keep:** Yes.

### `assets/js/features/faculty-dashboard/renderers/ui-core.js`

**Purpose:** Shared rendering utilities for faculty dashboard UI.

**Keep:** Yes.

### `assets/js/features/faculty-dashboard/renderers/course-renderers.js`

**Purpose:** Renders faculty course list and selected course context.

**Keep:** Yes.

### `assets/js/features/faculty-dashboard/renderers/record-renderers.js`

**Purpose:** Renders faculty record lists and modal display content.

**Keep:** Yes.

### `assets/js/features/faculty-dashboard/modals/read-only-modal.js`

**Purpose:** Generic read-only modal helper used by faculty dashboard records.

**Keep:** Yes.

### `assets/js/features/faculty-dashboard/modals/upload-exam-modal.js`

**Purpose:** Faculty upload-exam modal.

**Keep:** Yes.

### `assets/js/features/faculty-dashboard/modals/preference-modal.js`

**Purpose:** Faculty exam preference modal shell.

**Keep:** Yes.

### `assets/js/features/faculty-dashboard/modals/preference-workflow.js`

**Purpose:** Renders/saves faculty exam preference workflow.

**Keep:** Yes.

### `assets/js/features/faculty-dashboard/modals/faculty-exam-modal.js`

**Purpose:** Faculty exam request review/response modal.

**Keep:** Yes.

---

## Shared Core Files

### `assets/js/core/state.js`

**Purpose:** Local prototype state helpers.

**Keep:** Prototype only. Review before production.

### `assets/js/core/storage.js`

**Purpose:** Local storage wrapper/utilities.

**Keep:** Prototype only if still used by demo/local state.

### `assets/js/core/date-formatters.js`

**Purpose:** Shared date formatting helpers.

**Keep:** Yes.

### `assets/js/data/site-config.js`

**Purpose:** Defines API base URL and system/workflow registry metadata.

**Keep:** Yes.

**Production note:** Replace local API base URL assumptions with environment-based config or server-injected config.

---

## Retired / Legacy Front-End Files

### `assets/js/app/bootstrap.js`

**Purpose:** Older app bootstrap system.

**Recommendation:** Delete if no page imports it.

**Reason:** Active entry is now `assets/js/main.js`.

### `assets/js/app/page-registry.js`

**Purpose:** Older page registry system.

**Recommendation:** Delete if no page imports it.

**Reason:** Active router is `assets/js/shell/page-module-router.js`.

### `assets/js/modules/asa-staff-access.js`

**Purpose:** Old prototype allowlist-based ASA staff access management.

**Recommendation:** Delete.

**Reason:** Staff access should be handled by IT/AD/backend identity.

### `assets/js/modules/asa-staff-dashboard.js`

**Purpose:** Old hardcoded ASA staff dashboard with mock exam/student/documentation/access arrays.

**Recommendation:** Delete or move to `_archive/`.

**Reason:** It duplicates newer API-backed staff workflow modules.

### `assets/js/modules/faculty-dashboard.js`

**Purpose:** Compatibility re-export to `features/faculty-dashboard/index.js`.

**Recommendation:** Delete after deleting old `assets/js/app/page-registry.js`.

### `assets/js/modules/home-routing.js`

**Purpose:** Older home page routing behavior.

**Recommendation:** Delete if only referenced by old page registry.

### `assets/js/modules/staff-gates.js`

**Purpose:** Older staff gate behavior.

**Recommendation:** Delete if only referenced by old page registry.

### `assets/js/modules/tabs.js`

**Purpose:** Older tab initializer.

**Recommendation:** Delete if only referenced by old bootstrap.

### `assets/js/modules/accordions.js`

**Purpose:** Older accordion initializer.

**Recommendation:** Delete if only referenced by old bootstrap.

### `assets/js/modules/contact-bindings.js`

**Purpose:** Older contact binding helper.

**Recommendation:** Delete if only referenced by old bootstrap.

---

## Flask API Files

### `api/app.py`

**Purpose:** Main Flask app and API route definitions.

**Keep:** Yes for prototype.

**Refactor recommended:** Split routes into `api/routes/` before production or handoff if time permits. The file currently mixes unrelated domains. The workflow API branch starts this direction by adding separate workflow route/query modules.

### `api/db.py`

**Purpose:** Loads DB environment variables and creates pyodbc connections.

**Keep:** Yes.

**Production note:** Confirm secret handling, connection pooling, and deployment-specific authentication.

### `api/settings.py`

**Purpose:** Stores mock current user for local development.

**Keep:** Prototype only.

**Production note:** Replace with authenticated user/session provider.

### `api/queries.py`

**Purpose:** Re-export hub for query modules so `app.py` can import from one file.

**Keep:** Acceptable for prototype. In a larger refactor, route files can import directly from domain query modules.

### `api/query_modules/shared.py`

**Purpose:** Shared backend utilities such as row-to-dict conversion and mock current user retrieval.

**Keep:** Yes.

### `api/query_modules/student_portal.py`

**Purpose:** Student lookup, registration status, student registration requests, documentation queue, student directory, student lifecycle, and student record updates.

**Keep:** Yes, but split.

**Refactor recommended:** Split into `students.py`, `student_registration.py`, `documentation.py`, and `student_lifecycle.py`.

### `api/query_modules/exam_requests.py`

**Purpose:** Exam request retrieval, detail retrieval, staff status updates, faculty response updates, and exam request delete logic.

**Keep:** Yes.

### `api/query_modules/uploaded_exams.py`

**Purpose:** Uploaded exam metadata create/read/delete logic.

**Keep:** Yes.

### `api/query_modules/faculty.py`

**Purpose:** Faculty course queries, faculty letters, and seeded ASA letter approval mock data.

**Keep:** Yes, but split.

**Refactor recommended:** Move seeded ASA letter approvals into a separate module and mark as demo data.

### `api/query_modules/faculty_preferences.py`

**Purpose:** Faculty exam preference retrieval and updates.

**Keep:** Yes.

### `api/query_modules/asa_resources.py`

**Purpose:** ASA resource library data access for published/admin resources, create/update/publish/archive.

**Keep:** Yes.

### `api/query_modules/asa_inbox.py`

**Purpose:** Aggregates student registration, documentation queue, letter approvals, and exam requests into one normalized ASA staff inbox.

**Keep:** Yes.

### `api/query_modules/__init__.py`

**Purpose:** Package marker for query modules.

**Keep:** Yes.

### `api/services/document_storage.py`

**Purpose:** Service layer for document storage behavior.

**Keep:** Yes if upload/document storage logic uses it. If unused, document as future integration point.

---

## Import / Transform Files

### `imports/transforms/load_schema.py`

**Purpose:** Loads/creates schema objects for the local SQL database.

**Keep:** Yes.

### `imports/transforms/import_mock_sis.py`

**Purpose:** Imports mock SIS data for local testing.

**Keep:** Yes for prototype/demo database setup.

---

## HTML Page Files

### `pages/index.html`

**Purpose:** Home/landing page and role-switching entry point.

**Keep:** Yes.

### `pages/student-portal.html`

**Purpose:** Student portal shell. Loads student dashboard tabs, ASA resources, and student FAQ.

**Keep:** Yes.

### `pages/faculty-portal.html`

**Purpose:** Faculty/staff portal shell. Loads faculty dashboard tabs, ASA resources, and faculty FAQ.

**Keep:** Yes.

### `pages/graduate-portal.html`

**Purpose:** Graduate portal shell.

**Keep:** Yes if graduate-specific experience remains in scope.

### `pages/student-registration.html`

**Purpose:** Student registration/intake request entry page.

**Keep:** Yes.

### `pages/request-exam.html`

**Purpose:** Student exam request form.

**Keep:** Yes.

### `pages/request-accommodation-letter.html`

**Purpose:** Student accommodation letter request form.

**Keep:** Yes.

### `pages/upload-documentation.html`

**Purpose:** Student documentation upload page.

**Keep:** Yes if documentation submission remains in prototype scope.

### `pages/asa-staff-portal.html`

**Purpose:** ASA staff workspace, including unified inbox and staff workflow tabs.

**Keep:** Yes.

### `pages/asa-resources-admin.html`

**Purpose:** ASA staff resource manager page.

**Keep:** Yes.

### `pages/asa-student-directory.html`

**Purpose:** ASA staff student directory page.

**Keep:** Yes.

### `pages/asa-student-record.html`

**Purpose:** ASA staff single-student record page.

**Keep:** Yes.

### `pages/asa-exam-operations.html`

**Purpose:** ASA staff exam operations page.

**Keep:** Yes.

### `pages/asa-intake-form.html`

**Purpose:** ASA staff intake form page.

**Keep:** Yes if staff intake remains in scope.

### `pages/asa-staff-access.html`

**Purpose:** Old ASA staff access-management prototype.

**Recommendation:** Delete or move to `_archive/`.

**Reason:** Access management moved to IT/AD/backend identity.

---

## CSS Files

### `assets/css/main.css`

**Purpose:** CSS import manifest.

**Keep:** Yes.

### `assets/css/tokens.css`

**Purpose:** Design variables/tokens.

**Keep:** Yes.

### `assets/css/base.css`

**Purpose:** Global base styles and resets.

**Keep:** Yes.

### `assets/css/layout.css`

**Purpose:** Site/page layout rules.

**Keep:** Yes.

### `assets/css/utilities.css`

**Purpose:** Reusable utility classes.

**Keep:** Yes.

### `assets/css/components/buttons.css`

**Purpose:** Button components.

**Keep:** Yes.

### `assets/css/components/cards.css`

**Purpose:** Card components.

**Keep:** Yes.

### `assets/css/forms.css`

**Purpose:** Form styling.

**Keep:** Yes.

### `assets/css/components/modals.css`

**Purpose:** Modal components.

**Keep:** Yes.

### `assets/css/components/tabs.css`

**Purpose:** Tab panel styling.

**Keep:** Yes.

### `assets/css/components/accordion.css`

**Purpose:** Accordion styling.

**Keep:** Yes if accordion markup remains active.

### `assets/css/components/badges.css`

**Purpose:** Status badge styling.

**Keep:** Yes.

### `assets/css/components/staff-dashboard.css`

**Purpose:** Staff dashboard components and record rows.

**Keep:** Yes.

### `assets/css/components/contact-card.css`

**Purpose:** Shared contact-card styling.

**Keep:** Yes.

### `assets/css/pages/home.css`

**Purpose:** Home page-specific styles.

**Keep:** Yes.

### `assets/css/pages/portals.css`

**Purpose:** Portal page-specific styles.

**Keep:** Yes.

### `assets/css/pages/request-exam.css`

**Purpose:** Exam request page-specific styles.

**Keep:** Yes.

### `assets/css/pages/request-accommodation-letter.css`

**Purpose:** Accommodation letter request page-specific styles.

**Keep:** Yes.

### `assets/css/pages/student-registration.css`

**Purpose:** Student registration form page-specific styles.

**Keep:** Yes.

### `assets/css/pages/asa-staff-portal.css`

**Purpose:** ASA staff portal page-specific styles.

**Keep:** Yes.

### `assets/css/pages/asa-intake-form.css`

**Purpose:** ASA intake form page-specific styles.

**Keep:** Yes if `pages/asa-intake-form.html` remains active.

### `assets/css/pages/asa-resources.css`

**Purpose:** ASA resource and inbox card styles.

**Keep:** Yes.

### `assets/css/pages/asa-staff-access.css`

**Purpose:** Old staff access page styles.

**Recommendation:** Delete with `pages/asa-staff-access.html`.

---

## Recommended File Header Comments

Use short comments, not long essays.

### JavaScript feature file

```js
/*
  Purpose: Loads published ASA resources into the Student and Faculty/Staff portals.
  Data source: GET /api/asa/resources?audience=student|faculty_staff.
  Production note: File links should point to read-only OneDrive/SharePoint resources.
*/
```

### Python query module

```python
"""
Data-access functions for ASA resource metadata.

The actual files are expected to live in OneDrive/SharePoint. This module stores
only metadata, publication status, audience, and resource links/paths.
"""
```

### HTML page

```html
<!--
  Page purpose: ASA staff resource manager.
  Initialized by: assets/js/features/asa-resources/resource-admin.js
  Access: asa_staff role via page-module-router.js
-->
```

### CSS file

```css
/*
  ASA resources and ASA inbox presentation styles.
  Used by Student Portal, Faculty/Staff Portal, ASA Staff Portal, and Resource Manager.
*/
```
