# API Endpoint Inventory

This file maps the front-end API client to the Flask routes currently in the prototype. It is meant to help a developer see what is already wired and where future production work should focus.

Base URL in local development:

```text
http://127.0.0.1:5050/api
```

The front-end API client is:

```text
assets/js/services/portal-api.js
```

The current Flask route file is:

```text
api/app.py
```

## Health and identity

| Front-end method | Route | Notes |
|---|---|---|
| `health()` | `GET /api/health` | Returns API status and attempts a database check. |
| `getCurrentUser()` | `GET /api/me` | Uses the local mock current user in this prototype. |

## Student registration

| Front-end method | Route | Notes |
|---|---|---|
| `getMyStudentRegistrationStatus()` | `GET /api/me/student-registration-status` | Current user's registration-complete flag. |
| `saveMyStudentRegistrationStatus()` | `PATCH /api/me/student-registration-status` | Updates current user's registration-complete flag. |
| `getStudentRegistrationRequests()` | `GET /api/student-registration-requests` | Optional `status` query parameter. |
| `getMyStudentRegistrationRequests()` | `GET /api/student-registration-requests/me` | Requests for the current mock user. |
| `getStudentRegistrationRequest()` | `GET /api/student-registration-requests/<id>` | Single request detail. |
| `createStudentRegistrationRequest()` | `POST /api/student-registration-requests` | Student-facing request submission. |
| `updateStudentRegistrationRequestStatus()` | `PATCH /api/student-registration-requests/<id>/status` | ASA staff workflow status update. |
| `deleteStudentRegistrationRequest()` | `DELETE /api/student-registration-requests/<id>` | Staff cleanup/delete action. |
| `updateStudentRegistrationRequestDocsStatus()` | `PATCH /api/student-registration-requests/<id>/docs-status` | Documentation review status. |

## Student directory and lifecycle

| Front-end method | Route | Notes |
|---|---|---|
| `getStudentsDirectory()` | `GET /api/students-directory` | ASA staff student directory. |
| `getStudentDirectoryDetail()` | `GET /api/students-directory/<student_id>` | Single student record. |
| `updateStudentAcademicLevel()` | `PATCH /api/students-directory/<student_id>/academic-level` | Moves student between undergraduate and graduate. |
| `archiveStudentRecord()` | `PATCH /api/students-directory/<student_id>/archive` | Archives a student record. |
| `restoreStudentRecord()` | `PATCH /api/students-directory/<student_id>/restore` | Restores an archived student record. |
| `deleteStudentRecord()` | `DELETE /api/students-directory/<student_id>` | Soft-deletes the student record in app data. |

## ASA staff inbox and resources

| Front-end method | Route | Notes |
|---|---|---|
| `getAsaInbox()` | `GET /api/asa/inbox` | Unified ASA staff inbox. |
| `getPublishedAsaResources()` | `GET /api/asa/resources` | Public read-only resources. Uses `audience` query parameter. |
| `getAsaResourcesAdmin()` | `GET /api/asa/resources/admin` | Staff resource manager list. |
| `createAsaResource()` | `POST /api/asa/resources` | Creates a draft resource. |
| `updateAsaResource()` | `PATCH /api/asa/resources/<resource_id>` | Edits resource metadata/link. |
| `publishAsaResource()` | `PATCH /api/asa/resources/<resource_id>/publish` | Publishes resource to selected audience. |
| `archiveAsaResource()` | `PATCH /api/asa/resources/<resource_id>/archive` | Removes resource from public views. |

## Documentation and letter review

| Front-end method | Route | Notes |
|---|---|---|
| `getDocumentationQueue()` | `GET /api/documentation-queue` | Optional `status` query parameter. |
| `getAsaLetterApprovals()` | `GET /api/asa-letter-approvals` | Prototype letter approval queue. |
| `getAsaLetterApproval()` | `GET /api/asa-letter-approvals/<id>` | Single letter approval detail. |
| `updateAsaLetterApprovalStatus()` | `PATCH /api/asa-letter-approvals/<id>/status` | Updates prototype letter workflow status. |

## Faculty and exam workflows

| Front-end method | Route | Notes |
|---|---|---|
| `getExamRequests()` | `GET /api/exam-requests` | Optional `source_section_id` query parameter. |
| `getExamRequest()` | `GET /api/exam-requests/<exam_request_id>` | Single exam request detail. |
| `deleteExamRequest()` | `DELETE /api/exam-requests/<exam_request_id>` | Staff/test cleanup route. |
| `updateExamStaffStatus()` | `PATCH /api/exam-requests/<exam_request_id>/staff-status` | Staff status update. |
| `updateExamFacultyResponse()` | `PATCH /api/exam-requests/<exam_request_id>/faculty-response` | Faculty response submission/update. |
| `getFacultyPreferenceBySection()` | `GET /api/faculty-exam-preferences?source_section_id=...` | Gets preferences for one course section. |
| `saveFacultyPreference()` | `PATCH /api/faculty-exam-preferences/<source_section_id>` | Saves faculty exam preferences. |
| `getUploadedExams()` | `GET /api/uploaded-exams` | Optional `source_section_id` query parameter. |
| `getUploadedExamsBySection()` | `GET /api/uploaded-exams?source_section_id=...` | Uploaded exams by section. |
| `createUploadedExam()` | `POST /api/uploaded-exams` | Saves uploaded exam metadata. |

## Debug routes

These routes are useful during local development but should be removed or locked down before production:

```text
GET /api/debug/faculty-courses/me
GET /api/debug/faculty-letters/me
```
