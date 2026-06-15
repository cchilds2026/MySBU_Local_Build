# MySBU Accommodations Implementation Backlog

## Context

This backlog turns the current `MySBU_Local_Build` prototype into a staged build path for an Accommodate-like platform sized for a small university. The long-term target is to migrate the finished experience into the university's Sitefinity CMS intranet site, using the prototype as both an ASA workflow model and an illustration of a more accessible intranet experience.

## Priority 0: Stabilize the Current Prototype

### P0.1 Remove duplicate ASA staff workspace entry file

Current finding:

- `assets/js/features/asa-staff-workspace/index.js` exists and is the active router import.
- `assets/js/features/asa-staff-workspace/index..js` also exists as a duplicate.

Actions:

- Delete `assets/js/features/asa-staff-workspace/index..js`.
- Keep `assets/js/features/asa-staff-workspace/index.js`.
- Verify the ASA staff portal still loads.

Acceptance criteria:

- There is only one ASA staff workspace entry file.
- The active router import still resolves.

### P0.2 Refresh stale cleanup documentation

Current finding:

- The ASA resource files are already in `assets/js/features/asa-resources/`.
- Older misplaced resource files under `assets/js/features/` are no longer present.
- Student lifecycle and exam delete Flask routes already exist in `api/app.py`.

Actions:

- Update `docs/repo-cleanup-audit.md`.
- Update `docs/code-file-commentary.md`.
- Mark implemented routes and moved files as complete.
- Keep behavior verification as a QA task rather than a missing-code task.

Acceptance criteria:

- Handoff docs match the current repository state.

### P0.3 Remove retired staff-access prototype

Why it matters:

- Staff access should come from SSO/AD or backend identity, not local browser state.

Actions:

- Delete or archive `pages/asa-staff-access.html`.
- Delete or archive `assets/css/pages/asa-staff-access.css`.
- Delete or archive `assets/js/modules/asa-staff-access.js`.
- Remove any active navigation links to that retired workflow.

Acceptance criteria:

- No active route, page, or navigation item points users to frontend-managed staff access.

### P0.4 Verify local run instructions

Actions:

- Run the static frontend from `pages/index.html`.
- Run the Flask API from `api/app.py`.
- Confirm `/api/health` responds.
- Capture setup blockers in README or troubleshooting notes.

Acceptance criteria:

- A new developer can run the frontend and API from the documented steps.

## Priority 1: Clarify Production Architecture

### P1.1 Split Flask routes by domain

Suggested route modules:

- `api/routes/me_routes.py`
- `api/routes/student_registration_routes.py`
- `api/routes/student_directory_routes.py`
- `api/routes/documentation_routes.py`
- `api/routes/accommodation_profile_routes.py`
- `api/routes/accommodation_letter_routes.py`
- `api/routes/exam_request_routes.py`
- `api/routes/faculty_routes.py`
- `api/routes/asa_resource_routes.py`
- `api/routes/asa_inbox_routes.py`

Acceptance criteria:

- `api/app.py` mainly creates the app, configures CORS, and registers blueprints.

### P1.2 Split large query modules

Suggested query modules:

- `api/query_modules/students.py`
- `api/query_modules/student_registration.py`
- `api/query_modules/student_directory.py`
- `api/query_modules/documentation.py`
- `api/query_modules/accommodation_profiles.py`
- `api/query_modules/accommodation_letters.py`
- `api/query_modules/exam_requests.py`
- `api/query_modules/faculty_courses.py`
- `api/query_modules/faculty_letters.py`
- `api/query_modules/asa_letter_approvals.py`
- `api/query_modules/asa_resources.py`
- `api/query_modules/asa_inbox.py`

Acceptance criteria:

- Each module maps cleanly to one business domain.
- Demo or seeded data is clearly separated from production SQL-backed behavior.

### P1.3 Finalize source-of-truth rules

Actions:

- Keep SIS data read-only.
- Store external SIS IDs separately from app UUIDs.
- Document app-owned tables and lifecycles.
- Define how imports handle changed names, emails, course assignments, and inactive students.

Acceptance criteria:

- Developers know which system owns every major field before production work continues.

## Priority 2: Build the Core Accommodation Model

### P2.1 Add accommodation profiles

Core fields:

- profile ID
- student ID
- effective start date
- effective end date
- status
- created and updated metadata

Acceptance criteria:

- ASA staff can create, edit, activate, deactivate, and view a student's accommodation profile.

### P2.2 Add accommodation items

Core fields:

- item ID
- profile ID
- accommodation code
- accommodation display name
- faculty-visible text
- staff-only notes
- active flag

Acceptance criteria:

- Staff can maintain a controlled list of accommodations on a profile.
- Faculty-facing text is separated from internal notes.

### P2.3 Add letter generation workflow

Core fields:

- letter ID
- student ID
- course section ID
- term ID
- status
- generated content snapshot
- sent-to email
- sent timestamp
- acknowledgement timestamp

Acceptance criteria:

- Staff can generate a letter from current profile data.
- Sent letters preserve immutable content snapshots.

## Priority 3: Complete Staff Operations

### P3.1 Upgrade unified inbox

Actions:

- Normalize inbox item shapes across intake, documentation, letters, and exams.
- Add filtering by type, status, and age.
- Add direct links to student record and request detail.

Acceptance criteria:

- Staff can triage daily work from one screen.

### P3.2 Complete student record

Sections:

- student summary
- current accommodation profile
- registration/intake history
- documentation records
- accommodation letters
- exam requests
- staff workflow history
- audit trail summary

Acceptance criteria:

- Staff can understand a student's full accommodation state without jumping across several pages.

### P3.3 Add audit event helper

Actions:

- Create one backend helper for writing audit events.
- Use it for status changes, sensitive edits, document actions, and letter sends.

Acceptance criteria:

- Major staff actions leave a timestamped record with actor, entity, action, and old/new values where appropriate.

## Priority 4: Complete Student and Faculty Self-Service

### P4.1 Student dashboard

Student-facing sections:

- intake/registration status
- documentation status
- active accommodations
- accommodation letters
- exam requests
- ASA resources

Acceptance criteria:

- Students see clear statuses and next steps.

### P4.2 Faculty dashboard

Faculty-facing sections:

- courses
- accommodation letters
- exam requests
- uploaded exam metadata
- reusable exam preferences
- faculty/staff resources

Acceptance criteria:

- Faculty can handle letters and exam logistics without contacting ASA for routine tasks.

### P4.3 Exam request workflow hardening

Actions:

- Define required lead time rules.
- Define allowed status transitions.
- Validate date/time inputs server-side.
- Ensure staff and faculty actions are auditable.

Acceptance criteria:

- Exam requests can move from student submission through faculty response and staff completion.

## Priority 5: Production Readiness

### P5.1 Replace mock identity

Actions:

- Remove demo-role switching from production.
- Use SSO/AD-backed identity.
- Map identity claims to student, faculty, and ASA staff roles.
- Enforce access server-side.

Acceptance criteria:

- Access does not rely on local browser state.

### P5.2 Secure document storage

Actions:

- Choose approved storage such as SharePoint, OneDrive, or institutional document storage.
- Store metadata and external references in the app database.
- Avoid storing sensitive files in static frontend paths.

Acceptance criteria:

- Document access is governed by institutional security controls and app permissions.

### P5.3 Add reporting exports

Reports:

- active accommodated students
- pending documentation
- pending letters
- upcoming exams
- overdue faculty responses
- workflow volume by term

Acceptance criteria:

- Staff can export routine operational reports without database access.

### P5.4 Add production runbook

Runbook sections:

- deployment steps
- environment variables
- database migration steps
- backup and restore
- access management
- support contacts
- known limitations

Acceptance criteria:

- IT and ASA know how to operate the system after launch.

## Priority 6: Sitefinity Intranet Migration

### P6.1 Create Sitefinity migration map

Actions:

- Map prototype pages to Sitefinity content pages, Sitefinity widgets, embedded authenticated app views, or backend-only APIs.
- Identify sensitive workflow screens.
- Identify pages that can be managed as ordinary CMS content.

Acceptance criteria:

- The web/CMS team can see how the prototype translates into the intranet.

### P6.2 Define CMS versus app ownership

Actions:

- Put policies, FAQs, help text, and resource landing pages in CMS ownership where appropriate.
- Keep accommodation profiles, documentation records, letters, exam requests, and audit history in the app database.
- Document how Sitefinity pages will call or embed secure app workflows.

Acceptance criteria:

- Sensitive data is not treated as ordinary CMS content.
- Content editors can manage non-sensitive ASA pages without developer changes.

### P6.3 Use the prototype as an accessibility reference

Actions:

- Capture accessible page patterns from the prototype.
- Compare those patterns against current Sitefinity intranet pages.
- Create a short improvement brief for the web/CMS team.

Acceptance criteria:

- The prototype can be used in demos as both a functional ASA platform and an accessibility/usability model for the intranet.

### P6.4 Plan Sitefinity authentication and embedding

Actions:

- Confirm how the current Sitefinity intranet authenticates users.
- Identify available role or group claims.
- Decide whether app views will be embedded in Sitefinity, rebuilt as widgets, or linked as authenticated application pages.
- Document how the backend will receive and trust the current user's identity.

Acceptance criteria:

- Students, faculty, and ASA staff can access the right workflows from the intranet without relying on demo-role behavior.

## Recommended First Sprint

Sprint goal: make the prototype reliable enough for focused stakeholder testing.

Work items:

1. Remove the duplicate ASA staff workspace entry file.
2. Refresh stale cleanup docs.
3. Remove retired staff-access files or clearly archive them.
4. Verify frontend and Flask API local run steps.
5. Add MVP, backlog, and Sitefinity migration docs.
6. Confirm the next feature build: accommodation profiles and letter generation.

Demo outcome:

- ASA staff can open the prototype, use the staff workspace, inspect a student record, and walk through the intended MVP and Sitefinity migration story without tripping over retired prototype paths.
