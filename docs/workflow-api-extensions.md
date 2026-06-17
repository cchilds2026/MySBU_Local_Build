# Workflow API Extensions

This adds the first API surface for the workflow tables in `data-model/workflow-extensions.sql`.

## Local Entry Point

Run the workflow-enabled API entry point:

```powershell
.venv\Scripts\python.exe api\app_with_workflows.py
```

It imports the existing Flask app, registers the workflow routes, and runs on the same local API address:

```text
http://127.0.0.1:5050/api
```

## Endpoint Groups

- `GET /api/workflow/intake-packets`
- `POST /api/workflow/intake-packets`
- `PATCH /api/workflow/intake-packets/{packet_id}/status`
- `GET /api/workflow/student-agreements`
- `POST /api/workflow/student-agreements`
- `PATCH /api/workflow/student-agreements/{agreement_id}/status`
- `GET /api/workflow/accommodation-letter-requests`
- `GET /api/workflow/accommodation-letter-requests/me`
- `POST /api/workflow/accommodation-letter-requests/me`
- `PATCH /api/workflow/accommodation-letter-requests/{request_id}/status`
- `GET /api/workflow/testing-rooms`
- `POST /api/workflow/testing-rooms`
- `GET /api/workflow/exam-schedule-assignments`
- `PUT /api/workflow/exam-requests/{exam_request_id}/schedule-assignment`

## Workflow Coverage

These endpoints cover the first manual-process gaps identified from the ASA workflow:

- Intake packet status tracking from registration through completed intake.
- Student agreement tracking for signed forms, consent, lecture recording, contracts, and related intake forms.
- Student-initiated accommodation letter requests tied to enrolled course sections.
- Testing room inventory for ASA exam scheduling.
- Exam schedule assignment tracking for room, staff, time, and status.

## Notes

- The route bundle is additive. Existing API routes continue to work unchanged.
- Staff routes require the current user to have the `asa_staff` mock role.
- The student letter request route uses the current mock user email to find the matching student and enrolled course section.
- These endpoints expect `data-model/workflow-extensions.sql` to be applied after `data-model/schema.sql`.
