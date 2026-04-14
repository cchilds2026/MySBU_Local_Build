# Source of Truth Matrix

This document defines which system owns each entity and field in the ASA platform.

## Ownership Types

- **SIS-owned**: imported from Colleague or another SIS feed; treated as read-only in the app
- **App-owned**: created and maintained by the ASA application; full CRUD in SQL
- **Integration-owned**: references or statuses related to external systems like Microsoft 365
- **Derived**: computed from other stored data

## System Boundaries

### SIS / Colleague
Expected source for:
- students
- instructors
- terms
- courses
- sections
- enrollments

### ASA Application SQL Database
Expected source for:
- exam requests
- faculty approval details
- staff workflow status
- uploaded exams
- faculty exam preferences
- accommodation workflows
- documentation review
- audit history
- notifications

### Microsoft 365 / Outlook / Graph
Expected source for:
- event IDs
- draft email IDs
- delivery status references
- identity verification results where needed

---

## Entity Matrix

## student

| Field | Ownership | Notes |
|---|---|---|
| student_id | App-owned | Internal UUID primary key |
| source_system | App-owned | Example: `colleague` |
| source_student_id | SIS-owned | External source identifier |
| institution_student_id | SIS-owned | Student-facing institutional ID |
| first_name | SIS-owned | Read-only import |
| last_name | SIS-owned | Read-only import |
| email | SIS-owned | Read-only import |
| is_active | SIS-owned | Read-only import |
| last_imported_at | App-owned | Import metadata |

## instructor

| Field | Ownership | Notes |
|---|---|---|
| instructor_id | App-owned | Internal UUID primary key |
| source_system | App-owned | Example: `colleague` |
| source_instructor_id | SIS-owned | External source identifier |
| first_name | SIS-owned | Read-only import |
| last_name | SIS-owned | Read-only import |
| email | SIS-owned | Read-only import |
| phone | SIS-owned | Read-only import if available |
| is_active | SIS-owned | Read-only import |
| last_imported_at | App-owned | Import metadata |

## term

| Field | Ownership | Notes |
|---|---|---|
| term_id | App-owned | Internal UUID primary key |
| source_system | App-owned | Example: `colleague` |
| source_term_id | SIS-owned | External source identifier |
| term_code | SIS-owned | Imported from SIS |
| term_name | SIS-owned | Imported from SIS |
| start_date | SIS-owned | Imported from SIS |
| end_date | SIS-owned | Imported from SIS |
| is_active | Derived | Can be derived from dates or import flags |

## course

| Field | Ownership | Notes |
|---|---|---|
| course_id | App-owned | Internal UUID primary key |
| source_system | App-owned | Example: `colleague` |
| source_course_id | SIS-owned | External source identifier |
| subject_code | SIS-owned | Imported |
| course_number | SIS-owned | Imported |
| course_title | SIS-owned | Imported |

## course_section

| Field | Ownership | Notes |
|---|---|---|
| course_section_id | App-owned | Internal UUID primary key |
| source_system | App-owned | Example: `colleague` |
| source_section_id | SIS-owned | External source identifier |
| course_id | SIS-owned reference | Imported relationship |
| term_id | SIS-owned reference | Imported relationship |
| section_code | SIS-owned | Imported |
| primary_instructor_id | SIS-owned reference | Imported relationship |
| meeting_pattern | SIS-owned | Imported if available |
| exam_date | SIS-owned | Imported if available |
| exam_time | SIS-owned | Imported if available |
| last_imported_at | App-owned | Import metadata |

## enrollment

| Field | Ownership | Notes |
|---|---|---|
| enrollment_id | App-owned | Internal UUID primary key |
| student_id | SIS-owned reference | Imported relationship |
| course_section_id | SIS-owned reference | Imported relationship |
| enrollment_status | SIS-owned | Imported |
| last_imported_at | App-owned | Import metadata |

## exam_request

| Field | Ownership | Notes |
|---|---|---|
| exam_request_id | App-owned | Internal UUID primary key |
| student_id | SIS-owned reference | Based on imported student |
| course_section_id | SIS-owned reference | Based on imported section |
| submitted_at | App-owned | Created in app |
| requested_exam_date | App-owned | Student-submitted |
| requested_start_time | App-owned | Student-submitted |
| student_notes | App-owned | Student-submitted |
| workflow_status | App-owned | Main app workflow status |
| staff_status | App-owned | Staff handling status |
| created_by_user_id | App-owned | User identity reference |
| updated_at | App-owned | Timestamp |
| cancelled_at | App-owned | Nullable |

## exam_request_faculty_response

| Field | Ownership | Notes |
|---|---|---|
| exam_request_faculty_response_id | App-owned | Internal UUID primary key |
| exam_request_id | App-owned reference | One-to-one with exam request |
| provided_to_asa_method | App-owned | Faculty form field |
| return_method | App-owned | Faculty form field |
| approved_exam_date | App-owned | Faculty form field |
| approved_start_time | App-owned | Faculty form field |
| duration_minutes | App-owned | Faculty form field |
| calculator_policy | App-owned | Faculty form field |
| notes_sheet_allowed | App-owned | Faculty form field |
| notes_sheet_details | App-owned | Faculty form field |
| preferred_contact_method | App-owned | Faculty form field |
| preferred_contact_value | App-owned | Faculty form field |
| additional_information | App-owned | Faculty form field |
| approved_time_diff_acknowledged | App-owned | Faculty confirmation checkbox |
| submitted_at | App-owned | Timestamp |
| submitted_by_user_id | App-owned | User identity reference |

## exam_request_staff_action

| Field | Ownership | Notes |
|---|---|---|
| exam_request_staff_action_id | App-owned | Internal UUID primary key |
| exam_request_id | App-owned reference | Related exam request |
| action_type | App-owned | Example: received, scheduled, completed, no_show |
| from_status | App-owned | Previous status |
| to_status | App-owned | New status |
| staff_notes | App-owned | Notes for action |
| acted_at | App-owned | Timestamp |
| acted_by_user_id | App-owned | User identity reference |

## faculty_exam_preference

| Field | Ownership | Notes |
|---|---|---|
| faculty_exam_preference_id | App-owned | Internal UUID primary key |
| course_section_id | App-owned reference | Can later move to course-level if desired |
| provided_to_asa_method | App-owned | Default for exam requests |
| return_method | App-owned | Default for exam requests |
| calculator_policy | App-owned | Default for exam requests |
| notes_sheet_allowed | App-owned | Default for exam requests |
| notes_sheet_details | App-owned | Default for exam requests |
| preferred_contact_method | App-owned | Default for exam requests |
| preferred_contact_value | App-owned | Default for exam requests |
| additional_information | App-owned | Default for exam requests |
| updated_at | App-owned | Timestamp |
| updated_by_user_id | App-owned | User identity reference |

## uploaded_exam

| Field | Ownership | Notes |
|---|---|---|
| uploaded_exam_id | App-owned | Internal UUID primary key |
| course_section_id | App-owned reference | Related section |
| uploaded_by_user_id | App-owned | User identity reference |
| title | App-owned | Entered in app |
| file_name | App-owned | Stored metadata |
| storage_path | App-owned | Internal file storage reference |
| mime_type | App-owned | Stored metadata |
| delivery_method | App-owned | App-owned workflow field |
| class_exam_date | App-owned | Faculty-provided or SIS-derived later |
| class_exam_time | App-owned | Faculty-provided or SIS-derived later |
| notes | App-owned | Faculty notes |
| uploaded_at | App-owned | Timestamp |

## documentation_record

| Field | Ownership | Notes |
|---|---|---|
| documentation_record_id | App-owned | Internal UUID primary key |
| student_id | SIS-owned reference | Related student |
| file_name | App-owned | Stored metadata |
| storage_path | App-owned | Internal file storage reference |
| mime_type | App-owned | Stored metadata |
| documentation_type | App-owned | App-specific classification |
| status | App-owned | Review lifecycle |
| uploaded_at | App-owned | Timestamp |
| reviewed_at | App-owned | Timestamp |
| reviewed_by_user_id | App-owned | User identity reference |
| review_notes | App-owned | Staff notes |

## accommodation_profile

| Field | Ownership | Notes |
|---|---|---|
| accommodation_profile_id | App-owned | Internal UUID primary key |
| student_id | SIS-owned reference | Related student |
| effective_start_date | App-owned | Workflow-owned |
| effective_end_date | App-owned | Workflow-owned |
| status | App-owned | Active, inactive, pending, etc. |

## accommodation_item

| Field | Ownership | Notes |
|---|---|---|
| accommodation_item_id | App-owned | Internal UUID primary key |
| accommodation_profile_id | App-owned reference | Related profile |
| accommodation_code | App-owned | Controlled internal code |
| accommodation_name | App-owned | Controlled display label |
| details | App-owned | Freeform notes |

## accommodation_letter

| Field | Ownership | Notes |
|---|---|---|
| accommodation_letter_id | App-owned | Internal UUID primary key |
| student_id | SIS-owned reference | Related student |
| course_section_id | SIS-owned reference | Related section |
| term_id | SIS-owned reference | Related term |
| status | App-owned | Draft, sent, acknowledged, etc. |
| sent_at | App-owned | Timestamp |
| generated_content_snapshot | App-owned | Immutable sent content snapshot |
| sent_to_email | App-owned | Address used for delivery |

## audit_event

| Field | Ownership | Notes |
|---|---|---|
| audit_event_id | App-owned | Internal UUID primary key |
| entity_type | App-owned | Example: `exam_request` |
| entity_id | App-owned | Related entity UUID |
| action | App-owned | Created, updated, status_changed, etc. |
| old_value_json | App-owned | Prior state snapshot |
| new_value_json | App-owned | New state snapshot |
| acted_by_user_id | App-owned | User identity reference |
| acted_at | App-owned | Timestamp |

## integration_event

| Field | Ownership | Notes |
|---|---|---|
| integration_event_id | App-owned | Internal UUID primary key |
| entity_type | App-owned | Related domain object type |
| entity_id | App-owned | Related domain object UUID |
| integration_name | App-owned | Example: `m365_graph` |
| action_type | App-owned | Example: `create_calendar_event` |
| external_reference_id | Integration-owned | Event ID, draft ID, etc. |
| status | App-owned | Pending, success, failed |
| requested_at | App-owned | Timestamp |
| completed_at | App-owned | Timestamp |
| error_message | App-owned | Failure detail |

---

## Initial Architectural Rules

1. **All app workflows write only to the app SQL database**
2. **SIS data is treated as imported read-only reference data**
3. **No direct writes back to Colleague**
4. **External integrations write only references and statuses back into app tables**
5. **All workflow status changes should be auditable**
6. **Internal UUIDs should be the primary keys across the app**
7. **External system identifiers should be stored separately from internal keys**