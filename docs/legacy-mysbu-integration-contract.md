# Legacy MySBU / Ektron Integration Contract

## Purpose

This document defines the handoff contract for reading selected legacy MySBU, Sitefinity, or Ektron data from ektron_mysbuINT.

The ASA app should not query Ektron tables directly from frontend code or workflow logic. The app should query a stable SQL view in the student_success database. IT or a DBA can later map the real Ektron tables into that view.

## Source Database

Database: ektron_mysbuINT

Assumption: ektron_mysbuINT is on the same SQL Server instance as student_success.

## Required Access

The ASA app only needs read access.

Required for discovery:

- CONNECT to ektron_mysbuINT

- SELECT on relevant schemas, tables, or DBA-created views

Required for the application service account if this integration is enabled:

- SELECT only

- No INSERT

- No UPDATE

- No DELETE

- No DDL

## Stable View Contract

The app queries:

student_success.asa.v_legacy_mysbu_form_submission

Expected columns:

| Column | Purpose |

|---|---|

| legacy_submission_id | Stable source identifier from Ektron or Sitefinity. |

| source_system | Usually ektron_mysbuINT; mock for local testing. |

| source_form_name | Legacy form or content source name. |

| submitted_at | When the form or content record was submitted or created. |

| student_identifier | SBU ID, username, Colleague ID, or other matched identifier. |

| student_email | Student email if available. |

| student_first_name | Student first name if available. |

| student_last_name | Student last name if available. |

| raw_status | Legacy status value if available. |

| source_url | Legacy source URL if available. |

| raw_payload | Optional raw payload for migration or debugging. |

## Local Development Fallback

The SQL contract script creates:

- asa.legacy_mysbu_form_submission_mock

- asa.v_legacy_mysbu_form_submission

By default, the view points to the mock table. This lets the Flask route exist before IT maps the real Ektron tables.

## Flask Endpoint

GET /api/legacy-mysbu/form-submissions

Optional query parameters:

- student_identifier

- student_email

- source_form_name

- limit

Example:

/api/legacy-mysbu/form-submissions?student_identifier=123456&limit=25

If the SQL view is not installed, the endpoint returns a 503 response with integration_status set to not_configured.

## IT / DBA TODO

1. Identify the relevant ektron_mysbuINT tables or views.

2. Confirm where legacy form submissions are stored.

3. Confirm whether student identity appears as SBU ID, email, username, Colleague ID, or another identifier.

4. Replace the mock view body in asa.v_legacy_mysbu_form_submission with the real Ektron mapping.

5. Keep the output column names unchanged.

6. Keep access read-only.

## App Boundary

This integration is for reference and migration support only.

Do not store new ASA workflow records in ektron_mysbuINT.

ASA-owned workflow records should remain in the application database, including:

- intake records

- documentation review

- accommodation profiles

- accommodation letters

- exam requests

- faculty responses

- staff workflow statuses

- audit history
