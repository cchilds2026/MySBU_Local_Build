# Intake simulation walkthrough

Use this walkthrough to clear prototype workflow data, seed one clean current-user student, submit a new intake request, and verify the ASA staff workflow from the staff point of view.

## What this reset does

The dev reset script deletes local workflow/prototype rows from tables that hold temporary ASA workflow data, including registration requests, student portal profiles, documentation records, exam requests, accommodation records, and audit/integration events when those tables exist.

It then makes sure the current mock user has a matching student row in `asa.student` so the Student Registration form can submit a clean intake request.

It does **not** delete static hardcoded examples that still exist in some prototype query modules, such as temporary letter-approval samples. Those are not database rows.

## Step 1: Pull latest repo changes

```powershell
cd "C:\Users\cchilds\Desktop\MySBU_Local_Build"
git pull origin main
```

## Step 2: Stop Flask if it is running

Close the terminal running:

```powershell
.venv\Scripts\python.exe api/app.py
```

## Step 3: Preview the reset

This shows current workflow row counts without deleting anything.

```powershell
.venv\Scripts\python.exe tools/dev_reset_intake.py --dry-run
```

## Step 4: Reset temporary workflow data

```powershell
.venv\Scripts\python.exe tools/dev_reset_intake.py --yes
```

Optional: also remove rows from reference/import-style tables where `source_system = 'dev_simulation'`.

```powershell
.venv\Scripts\python.exe tools/dev_reset_intake.py --yes --include-dev-reference
```

## Step 5: Start the Flask API

```powershell
.venv\Scripts\python.exe api/app.py
```

Verify the API in the browser:

```text
http://127.0.0.1:5050/api/health
```

Expected result:

```json
{
  "api": "ok",
  "database": "ok",
  "status": "ok"
}
```

## Step 6: Start the student intake

Open Live Server and go to:

```text
/pages/student-registration.html
```

Submit a clean registration request. For the first workflow test, use a scenario like:

```text
Request type: Academic accommodation
Disability type: ADHD / learning-related support
Academic impact: Needs more time processing exam questions and completing timed assessments.
Daily life impact: Manages symptoms with planning and support but testing remains difficult.
Prior accommodations: Yes
Requested accommodations: Extended time; reduced distraction testing
Documentation: either attach a prototype file path or acknowledge documentation is pending
Release consent: checked
```

## Step 7: Verify the student view

Open:

```text
/pages/student-portal.html
```

Check that the Accommodation Journey and student dashboard make sense after the request is submitted.

## Step 8: Verify ASA staff triage

Open:

```text
/pages/asa-staff-portal.html
```

Expected behavior:

```text
Unified ASA Inbox shows a Registration intake item.
If documentation is pending or uploaded, Documentation review should also be represented.
The item should show a recommended next staff action.
Open Work Item should take you to the student profile.
```

## Step 9: Open the student profile

From the ASA inbox or Student Directory, open the student profile.

The profile should now be organized around:

```text
Profile header
Recommended next staff action
Current stage
Registration status
Open cases
Latest status
Cases / Requests
Files / Documentation
Staff Actions
Timeline / Notes
```

## Step 10: Simulate intake progression with API calls

The current UI shows the student profile and staff context. For this first simulation pass, move the workflow through statuses with API calls so you can test the state model before adding more staff action buttons.

In PowerShell, first get the registration request ID:

```powershell
$request = Invoke-RestMethod "http://127.0.0.1:5050/api/student-registration-requests?status=submitted,in_review,intake_scheduled"
$request[0].student_registration_request_id
```

Store it:

```powershell
$requestId = $request[0].student_registration_request_id
```

Move the request into staff review:

```powershell
Invoke-RestMethod \
  -Method Patch \
  -Uri "http://127.0.0.1:5050/api/student-registration-requests/$requestId/status" \
  -ContentType "application/json" \
  -Body '{"workflow_status":"in_review","reviewed_by_user_id":"asa_staff:intake_simulation"}'
```

Move documentation into review:

```powershell
Invoke-RestMethod \
  -Method Patch \
  -Uri "http://127.0.0.1:5050/api/student-registration-requests/$requestId/docs-status" \
  -ContentType "application/json" \
  -Body '{"docs_review_status":"in_review","reviewed_by_user_id":"asa_staff:intake_simulation"}'
```

Mark documentation reviewed:

```powershell
Invoke-RestMethod \
  -Method Patch \
  -Uri "http://127.0.0.1:5050/api/student-registration-requests/$requestId/docs-status" \
  -ContentType "application/json" \
  -Body '{"docs_review_status":"reviewed","reviewed_by_user_id":"asa_staff:intake_simulation"}'
```

Schedule intake:

```powershell
Invoke-RestMethod \
  -Method Patch \
  -Uri "http://127.0.0.1:5050/api/student-registration-requests/$requestId/status" \
  -ContentType "application/json" \
  -Body '{"workflow_status":"intake_scheduled","reviewed_by_user_id":"asa_staff:intake_simulation"}'
```

Complete intake:

```powershell
Invoke-RestMethod \
  -Method Patch \
  -Uri "http://127.0.0.1:5050/api/student-registration-requests/$requestId/status" \
  -ContentType "application/json" \
  -Body '{"workflow_status":"completed","reviewed_by_user_id":"asa_staff:intake_simulation"}'
```

Refresh the student profile after each step.

## Step 11: Check the staff inbox again

Return to:

```text
/pages/asa-staff-portal.html
```

Expected progression:

```text
submitted / pending items appear in the unified inbox
in_review items remain actionable
completed intake items should no longer appear in the intake triage list
```

## Step 12: What to observe

As you test, focus on these questions:

```text
Can staff tell where the student is in the process?
Is the recommended next action accurate?
Is the student profile easier to understand than the old record page?
Do the case/file/action panels feel similar enough to Navigate-style work?
Are any labels confusing or misleading?
Where does the workflow still feel disconnected?
```

Use those observations to decide the next UX pass.
