# Workflow Schema Extensions

## Purpose

`data-model/workflow-extensions.sql` adds the first workflow-detail tables needed to move ASA work out of PDFs, spreadsheets, manual folders, and email tracking.

It is intentionally additive. It does not replace the initial canonical schema in `data-model/schema.sql`.

## Added Tables

### `asa.student_intake_packet`

Tracks the status of an intake packet after a student begins the accommodations process.

Useful for:

- registration received
- documentation pending or received
- ready to schedule intake
- Navigate appointment reference
- intake completion
- staff notes

### `asa.student_agreement`

Tracks signed or pending student agreements and consent forms.

Useful for:

- consent to release confidential information
- JCC/SBU release
- medical release
- documentation contract
- lecture recording agreement
- student contract and exam guidelines

Signed files can still be stored as document artifacts through `asa.documentation_record`.

### `asa.accommodation_letter_request`

Preserves the student-initiated request before an accommodation letter is generated and sent.

Useful for:

- semester-by-semester student letter requests
- staff review before sending
- cancellation or superseding without losing the request history

### `asa.testing_room`

Stores ASA testing rooms that can be assigned to approved exam requests.

### `asa.exam_schedule_assignment`

Tracks final exam scheduling details after student request and faculty response.

Useful for:

- testing room assignment
- assigned staff/proctor reference
- scheduled start/end time
- Outlook calendar integration reference
- completion, cancellation, or no-show status

## Added Exam Request Columns

The extension also adds optional columns to `asa.exam_request` when they do not already exist:

- `class_exam_date`
- `class_exam_time`
- `guidelines_acknowledged_at`

These capture fields from the current exam scheduling form that are not fully represented by the original student-request date/time fields.

## How to Apply Locally

First load the base schema as usual:

```powershell
.venv\Scripts\python.exe imports\transforms\load_schema.py
```

Then apply the workflow extension:

```powershell
.venv\Scripts\python.exe imports\transforms\load_workflow_extensions.py
```

Both scripts use the same database settings from:

```text
imports/transforms/.env
```

## Notes

This is a setup step for the next application work. It does not yet add API routes or front-end screens for these tables.

Suggested next implementation areas:

- student agreement tracking on the ASA student record
- student-initiated accommodation letter requests
- exam room assignment and calendar workflow
- intake packet status tracking
