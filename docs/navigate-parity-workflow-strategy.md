# Navigate parity workflow strategy

## Purpose

ASA staff already use or understand EAB Navigate as a student-success workflow environment. The MySBU ASA staff pages should therefore feel familiar in information architecture and workflow logic while remaining a distinct MySBU/Sitefinity-native experience.

This is a parity strategy, not a visual clone. Do not copy EAB branding, proprietary screen layouts, protected UI details, or product terminology where it would create confusion. Instead, reuse the staff mental model:

```text
student profile
coordinated care
cases/referrals
alerts
to-dos
appointments / meetings
notes and attachments
campaigns / outreach
progress reports / faculty signals
```

## Design goal

ASA staff should be able to answer these questions within seconds:

```text
Who is the student?
What is the current support/case status?
What process stage is the student in?
What needs staff action next?
What files or documentation are attached?
What related requests exist?
What has already happened?
What should be recorded after staff action?
```

## Staff workspace model

The ASA staff portal should behave like a triage dashboard.

Recommended primary areas:

| Area | Purpose |
|---|---|
| Staff Home | Summary of work requiring action. |
| Assigned Work | Open cases, requests, files, and exam issues that require staff action. |
| Student Search / Directory | Find a student and open their profile. |
| Student Profile | One student-centered record manager. |
| Cases / Requests | Registration, documentation, letters, exams, and accommodations. |
| Files / Documentation | Review documents and attachments. |
| Notes / Timeline | Staff notes, action history, and workflow events. |
| Alerts / Flags | Missing documentation, late exams, follow-up needed, conflicts. |
| Actions | Approve, return, archive, restore, delete test data, or route forward. |

## Student profile model

The ASA student record should become the staff user's main student profile view.

Recommended structure:

```text
Profile header
Signal/status cards
Open cases and requests
Files and documentation
Timeline / notes
Staff action panel
Audit trail
```

The profile header should show:

```text
Student name
SBU ID
Email
Academic level
Lifecycle status
Current process stage
Recommended next staff action
```

## Cases and tasks model

Registration requests, documentation review items, exam requests, and letter approvals should be presented as cases/tasks rather than disconnected rows.

Each case/task should show:

```text
Case type
Current status
Submitted/updated date
Student/context
Recommended next action
Open action
Related files or notes when available
```

## Files and documentation model

Files should use a consistent file-library pattern.

Each file/document record should show:

```text
Document title or file name
Review status
Related request
Submitted/updated date
Next review action
```

For now, this can be a workflow-document panel. In the final Sitefinity build, public resources should be CMS-managed while private workflow documents should remain in the secure application/workflow layer.

## Alerts and signals

The interface should convert raw statuses into plain staff signals.

Examples:

| Raw status | Staff-facing signal |
|---|---|
| submitted | New item waiting for review. |
| in_review | Staff review is underway. |
| awaiting_upload | Student needs to upload documentation. |
| follow_up_needed | Staff follow-up is needed. |
| late_request | Exam request may need intervention. |
| conflict | Scheduling or process conflict needs attention. |
| approved | Approved and ready for next workflow step. |

## Sitefinity relationship

Sitefinity should route users into the correct staff workspace and host reusable CMS content, resources, and service catalog entries.

The Navigate-parity workflow areas should be hosted from or linked by Sitefinity but backed by custom application logic when they involve private student records, secure documents, audit trails, or staff actions.

## Implementation guidance

Use shared component objects:

```text
record-manager
student-profile-header
signal-card-grid
case-list
file-library-window
workflow-timeline
action-panel
alert/flag list
```

Keep labels consistent across ASA, HR, and ISSA so staff do not have to relearn the interface for each department.

## Do not overbuild

Do not recreate all of Navigate. MySBU should complement it and provide department-specific workflows that Navigate does not own.

The goal is parity of mental model, not replacement.
