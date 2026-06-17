# Workflow API Extensions

This follow-up API pass exposes the first application routes for the workflow tables added by `data-model/workflow-extensions.sql`.

## Files to add

```text
api/workflow_routes.py
api/query_modules/workflow_extensions.py
docs/workflow-api-extensions.md
```

Do not copy `__pycache__` directories or `.pyc` files from the generated archive.

## Required `api/app.py` change

Register the workflow blueprint in the existing Flask app instead of using a separate alternate entry point.

Add this import after the existing `from queries import (...)` block:

```python
from workflow_routes import workflow_bp
```

Then register it after the `CORS(...)` block:

```python
app.register_blueprint(workflow_bp)
```

The existing local command can remain the same:

```powershell
.venv\Scripts\python.exe api\app.py
```

## Endpoint groups

### Intake packets

- `GET /api/workflow/intake-packets`
- `POST /api/workflow/intake-packets`
- `GET /api/workflow/intake-packets/{student_intake_packet_id}`
- `PATCH /api/workflow/intake-packets/{student_intake_packet_id}/status`

### Student agreements

- `GET /api/workflow/student-agreements`
- `POST /api/workflow/student-agreements`
- `GET /api/workflow/student-agreements/{student_agreement_id}`
- `PATCH /api/workflow/student-agreements/{student_agreement_id}/status`

### Accommodation letter requests

- `GET /api/workflow/accommodation-letter-requests`
- `GET /api/workflow/accommodation-letter-requests/me`
- `POST /api/workflow/accommodation-letter-requests/me`
- `GET /api/workflow/accommodation-letter-requests/{accommodation_letter_request_id}`
- `PATCH /api/workflow/accommodation-letter-requests/{accommodation_letter_request_id}/status`

### Testing rooms

- `GET /api/workflow/testing-rooms`
- `POST /api/workflow/testing-rooms`
- `PATCH /api/workflow/testing-rooms/{testing_room_id}`

### Exam schedule assignments

- `GET /api/workflow/exam-schedule-assignments`
- `PUT /api/workflow/exam-requests/{exam_request_id}/schedule-assignment`

## Workflow coverage

These endpoints intentionally match the first workflow-detail gaps identified for the ASA platform:

- intake packet status tracking from registration through completed intake
- agreement tracking for consent, documentation contracts, lecture recording, and student contract forms
- student-initiated accommodation letter requests tied to enrolled course sections
- testing room inventory for ASA exam scheduling
- exam schedule assignment tracking for room, staff/proctor reference, time, and status

## Notes

- The route bundle is additive. Existing API routes continue to work unchanged.
- Staff routes require the current mock user to have the `asa_staff` role.
- The student letter request route uses the current mock user email to find the matching student and enrolled course section.
- These endpoints expect `data-model/workflow-extensions.sql` to be applied after `data-model/schema.sql`.
- This pass creates backend capability only. Frontend wiring should be a separate PR.
