# Application component patterns

This document defines reusable application-style components for MySBU pages that are more complex than standard CMS content blocks. These patterns should guide future ASA, HR, and International Student Services pages so each department does not invent a different layout for records, files, approvals, and workflow history.

## Why this matters

Some pages are not simple content pages. They show operational records, student or employee details, document history, status changes, staff actions, and workflow queues.

If each department designs those pages separately, the platform becomes visually inconsistent and harder to maintain. A reusable component pattern gives users the same mental model across departments.

The ASA student record page is the first place this need is visible. It contains useful information, but the current layout can feel dense because student identity, registration details, documentation, lifecycle actions, and staff cleanup controls are all competing for attention.

## Recommended application components

| Component | Purpose | Example use |
|---|---|---|
| Record Manager | Standard layout for a single student, employee, case, or request record. | ASA student record, ISSA international student record, HR employee request record. |
| File Library Window | Standard document/resource/file panel. | ASA documentation, ISSA immigration uploads, HR policy/forms library. |
| Workflow Timeline | Chronological history of actions and status changes. | Accommodation review history, travel signature request history, HR onboarding steps. |
| Action Panel | Consistent location for high-impact staff actions. | Archive, restore, approve, deny, return for correction. |
| Status Summary Bar | Compact view of current status, owner, deadline, and next step. | Student accommodation status, exam request status, ISSA document status. |
| Related Records Panel | Links connected records without crowding the main page. | Student registration requests, exam requests, letters, uploaded files. |
| Staff Notes Panel | Internal-only notes and review comments. | ASA/HR/ISSA staff notes. |
| Audit Trail | Read-only system history for compliance and troubleshooting. | Who changed what and when. |

## Record Manager component

A Record Manager is the standard shell for pages centered on one person, case, request, or object.

### Recommended sections

```text
Record header
Status summary bar
Primary details
Related workflows
File library
Staff notes
Workflow timeline
Action panel
Audit trail
```

### Record header

The header should answer:

```text
Who or what is this record about?
What type of record is it?
What is its current status?
What is the next expected action?
```

For the ASA student record, this could include:

```text
Student name
Institution ID
Email
Academic level
Lifecycle status
Registration count
Latest submitted request
```

### Status summary bar

A short row of status cards or badges should replace scattered status text.

Recommended fields:

```text
Current status
Current owner / responsible office
Last updated
Next step
Risk / attention flag
```

### Primary details

This should be the stable profile information. It should not be mixed with action buttons.

For ASA:

```text
Student identity
Academic level
Portal registration status
Lifecycle status
Contact details
```

For HR:

```text
Employee/requester identity
Department
Request type
Employment category
```

For ISSA:

```text
Student identity
SEVIS-related identifiers if allowed
Visa/status category
Program level
```

### Related workflows

Use cards or rows for related workflow records.

For ASA:

```text
Registration requests
Accommodation letters
Exam requests
Documentation records
```

For ISSA:

```text
I-20 requests
Travel signature requests
CPT/OPT requests
Document uploads
```

For HR:

```text
Onboarding tasks
Policy acknowledgments
Benefits requests
Employment forms
```

### Action panel

High-impact actions should be grouped in a clear panel. They should not be visually mixed into normal read-only data.

Examples:

```text
Move to graduate
Move to undergraduate
Archive student
Restore student
Delete test record
Approve request
Return for correction
```

Use confirmation dialogs for destructive or lifecycle-changing actions.

### Audit trail

Audit trail should be read-only and visually separate from editable/actionable content.

Recommended fields:

```text
Action
Old value
New value
Acted by
Acted at
Related entity
```

## File Library Window component

A File Library Window is the standard component for documents and links. It can be used for CMS-managed resources and workflow-managed uploads.

### Recommended modes

```text
Public resource mode
Staff review mode
Workflow upload mode
Read-only archive mode
```

### Recommended fields

```text
Title
Description
Category
Audience
File name
File type
Storage provider
Storage path / URL
Status
Last updated
Related service
Related record
```

### Public resource mode

Used for Sitefinity-managed department resources.

Examples:

```text
ASA forms and guidance
HR benefits forms
ISSA travel and immigration guides
```

### Staff review mode

Used when staff need to evaluate documents.

Examples:

```text
ASA disability documentation review
ISSA immigration document review
HR onboarding documents
```

### Workflow upload mode

Used when users submit files as part of a process.

Examples:

```text
Upload ASA documentation
Upload ISSA travel documents
Upload HR onboarding paperwork
```

## ASA student record redesign direction

The current ASA student record should eventually be refactored into a Record Manager layout.

Recommended top-to-bottom order:

1. Student record header
2. Status summary bar
3. Primary student details
4. Student portal registration profile
5. Registration request history
6. Documentation/file library panel
7. Related exam and letter records
8. Staff notes and workflow timeline
9. Lifecycle/action panel
10. Audit trail

Destructive actions such as delete should be visually separated from routine actions such as changing academic level.

## Sitefinity relationship

Record Manager and File Library Window are application patterns, not necessarily pure CMS widgets.

Use Sitefinity for:

```text
CMS-managed resources
public department resources
FAQ content
service catalog content
contact cards
alerts
page composition
```

Use custom app/API for:

```text
private student/employee records
workflow uploads
review queues
approval actions
archive/restore/delete actions
audit trails
secure operational data
```

A Sitefinity page can host or link into these application patterns, but Sitefinity should not directly own sensitive transactional records unless IT chooses a secure implementation pattern for that data.

## Design rule

Do not design every department workflow page from scratch.

Use the same component-level objects:

```text
Record Manager
File Library Window
Workflow Timeline
Action Panel
Status Summary Bar
Related Records Panel
Audit Trail
```

Then customize them by department, role, and service.
