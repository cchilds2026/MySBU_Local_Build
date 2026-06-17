# MySBU Data and Workflow Gap Map

## Review Scope

Reviewed local workspace files:

- `work/Database Export.sql`
- `work/Intake_Forms&Housing_Forms/`
- current intake PDFs and DOCX forms
- accommodation letter guide
- exam scheduling guide
- housing/ESA documents
- special request documents for alternate text, foreign language substitution, and modified attendance

This review focuses on whether the current database can support the real ASA workflows described so far.

## Short Answer

The data model is in a good spot for the core academic accommodations and testing workflow.

The current `asa` schema already covers the main backbone:

- SIS reference data
- students
- instructors
- terms
- courses
- sections
- enrollments
- student registration requests
- documentation records
- accommodation profiles
- accommodation items
- accommodation letters
- exam requests
- faculty exam responses
- faculty exam preferences
- uploaded exam metadata
- staff exam actions
- audit events
- integration events
- resource library records
- import batches/files/errors

The main gaps are not the core tables. The gaps are around workflow detail:

- signed intake agreements and forms
- appointment references
- student-initiated letter request tracking before a letter is generated/sent
- room/proctor/calendar assignment for exams
- housing/ESA workflows
- modified attendance workflows
- alternate text and foreign language substitution workflows
- equipment loans
- richer status/history tracking outside the exam workflow

## Current Database Strengths

### Core Academic Accommodation Case

Strong foundation:

- `asa.student`
- `asa.student_registration_request`
- `asa.documentation_record`
- `asa.accommodation_profile`
- `asa.accommodation_item`

This supports the basic path:

student imported from SIS -> student registration request -> documentation review -> approved accommodation profile -> accommodation items.

### Accommodation Letters

Strong foundation:

- `asa.accommodation_letter`
- `asa.course_section`
- `asa.term`
- `asa.instructor`
- `asa.enrollment`

The current table supports generated/sent letters by student, section, and term. It also includes a `generated_content_snapshot`, which is important because sent letters should preserve the exact language that went out.

Likely gap:

- There is no separate `accommodation_letter_request` table for the student-initiated semester request before staff approval/generation.

That can still be handled with `accommodation_letter.status`, but a separate request table would better preserve the workflow:

student requested -> staff review -> generated -> sent -> acknowledged/superseded/cancelled.

### Exam Requests

Strong foundation:

- `asa.exam_request`
- `asa.exam_request_faculty_response`
- `asa.exam_request_staff_action`
- `asa.faculty_exam_preference`
- `asa.uploaded_exam`

This maps well to the current process:

student submits exam request -> faculty provides exam details -> staff tracks status -> faculty preferences and uploaded exams support future reuse.

Likely gaps:

- no testing room table
- no room assignment table
- no proctor/staff assignment table
- no calendar event table specifically tied to scheduled exams, although `asa.integration_event` can store Outlook/Graph references

### Audit and Integrations

Strong foundation:

- `asa.audit_event`
- `asa.integration_event`

This is the right pattern for FERPA-sensitive workflows and future Microsoft 365 integration.

Recommendation:

- Use these consistently across intake, documentation, letters, exams, housing, and special requests.

### Sitefinity and Resource Content

Strong foundation:

- `asa.resource_library`

This can support ASA-managed resource metadata and file links. Sitefinity can own public/intranet page content, while this table can own app-managed resource records if needed.

## Current Forms and Workflow Signals

### Student Intake

Forms reviewed show the intake process includes:

- registration form completion
- documentation submitted/type
- student name
- SBU ID
- major
- expected graduation date
- advisor
- language substitution flag
- testing accommodations
- classroom accommodations
- lecture recording agreement on file
- documentation review and need for more information
- granted/denied accommodation decisions
- grievance/appeal information

The database already captures some of this through:

- `student`
- `student_registration_request`
- `documentation_record`
- `accommodation_profile`
- `accommodation_item`

Gap:

- no `intake_packet` or `intake_checklist` table that records the staff checklist, appointment completion, required forms, and conditional agreements.

Lightweight option:

- add `asa.student_intake_packet`
- add `asa.student_intake_form`

### Consent and Release Forms

Forms reviewed include:

- consent to release confidential information
- JCC/SBU release
- graduate release/consent
- medical information release

These are partly document artifacts and partly workflow flags.

Recommended model:

- store signed PDFs or generated document snapshots as document records
- store a structured agreement record for status and dates

Suggested table:

- `asa.student_agreement`

Possible fields:

- `student_agreement_id`
- `student_id`
- `agreement_type`
- `status`
- `signed_at`
- `expires_at`
- `revoked_at`
- `document_record_id`
- `created_at`
- `updated_at`

### Contract for Documentation

The contract for documentation has a specific business rule:

- accommodations may be temporarily granted while current documentation is pending
- accommodation privileges may cease if documentation is not received by a deadline

Current database support:

- `student_registration_request.docs_review_status`
- `documentation_record.status`
- `accommodation_profile.effective_end_date`

Gap:

- no explicit documentation contract deadline/status.

Recommended approach:

- add agreement records with `agreement_type = documentation_contract`
- store deadline in structured form, either as `expires_at` or a specific `due_at` field
- use workflow reminders based on that date

### Lecture Recording Agreement

This should usually be a conditional agreement tied to an accommodation item.

Recommended approach:

- store lecture recording as an `accommodation_item`
- store the signed lecture recording agreement in `student_agreement`
- optionally link the agreement to the accommodation item

### Student Contract and Exam Guidelines

This form includes student acknowledgement of responsibilities:

- request letters each semester
- discuss accommodations with professors
- submit exam scheduling forms 3-5 days before class exam
- follow exam/check-in rules

Recommended approach:

- store signed contract as `student_agreement`
- keep the actual signed PDF as `documentation_record` or a separate document artifact
- expose the agreement status on the staff student record

### Equipment Loan Agreement

The database does not currently model equipment loans.

Suggested table:

- `asa.equipment_loan`

Possible fields:

- `equipment_loan_id`
- `student_id`
- `equipment_description`
- `model_or_serial_number`
- `checked_out_at`
- `due_at`
- `checked_in_at`
- `status`
- `agreement_document_record_id`
- `created_by_user_id`
- `updated_by_user_id`

### Provider Documentation Form

This is best treated primarily as a document artifact. It contains provider/diagnostic detail that should remain protected and not be over-structured unless staff have a clear reporting or decision need.

Recommended structured fields:

- document type
- provider form received date
- documentation status
- review outcome
- review notes

Avoid over-structuring detailed diagnostic content unless necessary.

## Letter Workflow Gap

The current guide shows the student currently selects:

- instructor name
- course name
- agreement checkbox
- submit

Current database support:

- `accommodation_letter`
- SIS-backed course and instructor tables

Recommended addition:

- `asa.accommodation_letter_request`

Why:

- preserves the student-initiated action
- supports one request producing one or more letters
- supports staff review before generation
- supports rejection/cancellation without creating a sent-letter record

Suggested fields:

- `accommodation_letter_request_id`
- `student_id`
- `course_section_id`
- `term_id`
- `requested_at`
- `requested_by_user_id`
- `status`
- `student_acknowledged`
- `reviewed_at`
- `reviewed_by_user_id`
- `staff_notes`
- `accommodation_letter_id`

Suggested statuses:

- `requested`
- `pending_staff_review`
- `ready_to_send`
- `sent`
- `cancelled`
- `superseded`

## Exam Workflow Gap

The current guide shows the student currently provides:

- class exam date
- class exam time
- instructor
- course
- in-person/proctored in ASA checkbox
- requested SSC exam date
- requested SSC exam time
- exam guideline acknowledgement

Current database support:

- `exam_request.requested_exam_date`
- `exam_request.requested_start_time`
- `exam_request.student_notes`
- `exam_request.workflow_status`
- `exam_request.staff_status`
- `exam_request_faculty_response`

Gaps:

- no explicit class exam date/time separate from requested ASA date/time unless faculty response supplies it
- no student acknowledgement field for exam guidelines
- no testing room assignment
- no proctor/staff assignment
- no scheduled calendar event field except general `integration_event`

Recommended additions:

- add `class_exam_date` and `class_exam_time` to `asa.exam_request`, or make clear that faculty response is the source for class exam date/time
- add `guidelines_acknowledged_at` to `asa.exam_request`
- add `asa.testing_room`
- add `asa.exam_schedule_assignment`

Suggested `exam_schedule_assignment` fields:

- `exam_schedule_assignment_id`
- `exam_request_id`
- `testing_room_id`
- `assigned_staff_user_id`
- `scheduled_start_at`
- `scheduled_end_at`
- `outlook_event_integration_event_id`
- `status`
- `staff_notes`

## Housing and ESA Gap

Housing/ESA documents show a separate workflow involving:

- housing accommodation request
- ESA request packet
- provider ESA request information
- consent to communicate with Residence Life and relevant campus parties
- roommate/suitemate/apartment mate acknowledgement
- annual ESA paperwork
- Disability Housing Accommodation Committee review

Current database support:

- not directly modeled in the `asa` schema

Recommended addition:

- `asa.special_accommodation_request` as a general parent table
- optionally separate detail tables for housing/ESA if the workflow is complex

Suggested parent fields:

- `special_accommodation_request_id`
- `student_id`
- `request_type`
- `term_id`
- `academic_year`
- `status`
- `submitted_at`
- `reviewed_at`
- `reviewed_by_user_id`
- `decision`
- `decision_reason`
- `staff_notes`

Possible request types:

- `housing`
- `emotional_support_animal`
- `modified_attendance`
- `alternate_text`
- `foreign_language_substitution`
- `temporary_accommodation`

## Modified Attendance Gap

Modified attendance documents show a course-specific, instructor-involved agreement. It includes:

- student
- instructor
- course
- agreed maximum/expected absences or late arrivals
- instructor notification rules
- assignment due date rules
- exam/quiz makeup rules
- student and instructor acknowledgement

Current database support:

- course/section/instructor/student data exists
- no specific modified attendance agreement table

Recommended table:

- `asa.modified_attendance_agreement`

Suggested fields:

- `modified_attendance_agreement_id`
- `student_id`
- `course_section_id`
- `instructor_id`
- `status`
- `max_absences_or_late_arrivals`
- `notification_timing`
- `notification_method`
- `assignment_due_policy`
- `exam_quiz_makeup_policy`
- `student_acknowledged_at`
- `instructor_acknowledged_at`
- `staff_approved_at`
- `agreement_document_record_id`

## Alternate Text Gap

Alternate text forms include:

- student
- course(s)
- textbook/material details
- receipt requirement
- agreement on use of alternate format materials

Current database support:

- no specific alternate text request model

Recommended model:

- use `asa.special_accommodation_request` with `request_type = alternate_text`
- add `asa.alternate_text_material` if multiple books/materials need to be tracked

Suggested material fields:

- `alternate_text_material_id`
- `special_accommodation_request_id`
- `course_section_id`
- `title`
- `author`
- `edition`
- `isbn`
- `publisher`
- `receipt_document_record_id`
- `status`
- `delivered_at`

## Foreign Language Substitution Gap

Foreign language substitution appears to be a special academic accommodation with policy requirements and review/notification steps.

Current database support:

- can be represented as an accommodation item, but the request/review process is not modeled

Recommended model:

- use `asa.special_accommodation_request` with `request_type = foreign_language_substitution`
- link resulting approved accommodation item to the request
- store policy acknowledgement and approval artifacts as agreements/documents

## Temporary Accommodation Gap

Temporary accommodations were mentioned as a separate workflow, but no separate temporary accommodation form was reviewed in this pass.

Recommended model:

- support temporary accommodations through `accommodation_profile.effective_start_date` and `effective_end_date`
- add a special request type if temporary requests have their own intake/approval process

## Form Digitization Recommendation

The fillable PDFs often have generic field names such as `Textbox1` and `Check Box17`. That is normal for PDFs but not ideal for a future digital workflow.

Recommendation:

- do not use PDF field names as the canonical data model
- use the visible form labels and workflow meaning instead
- create accessible HTML forms with semantic labels
- store structured fields only where the office needs status, reporting, automation, or decision support
- preserve signed PDFs or generated document snapshots as artifacts when needed

## Suggested New Tables

Highest-value additions:

1. `asa.student_intake_packet`
2. `asa.student_intake_form`
3. `asa.student_agreement`
4. `asa.accommodation_letter_request`
5. `asa.testing_room`
6. `asa.exam_schedule_assignment`
7. `asa.special_accommodation_request`
8. `asa.modified_attendance_agreement`
9. `asa.equipment_loan`
10. `asa.alternate_text_material`

These additions keep the current good schema intact while adding the workflow detail needed to replace shared folders, PDFs, spreadsheets, and manual email tracking.

## Suggested First Schema Additions

Do not start with every special workflow. Start with the tables that unlock the core academic/testing process:

1. `student_agreement`
2. `accommodation_letter_request`
3. `testing_room`
4. `exam_schedule_assignment`
5. `student_intake_packet`

Then add special request tables once housing, modified attendance, temporary accommodations, alternate text, and foreign language substitution are fully mapped.

## Suggested Next PR

Add a repo doc:

```text
docs/data-workflow-gap-map.md
```

Include:

- current schema strengths
- current form families
- recommended new workflow tables
- Sitefinity/app ownership boundary
- first schema migration priorities

This should come before writing migrations because it gives the database work a clear target.
