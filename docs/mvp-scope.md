# MySBU Accommodations Platform MVP Scope

## Purpose

Build a focused accommodations-management platform for a small university serving about 250 students with accommodations. The goal is not to clone every enterprise feature in Symplicity Accommodate, but to cover the recurring Accessibility Services and Accommodations workflows that students, faculty, and ASA staff need every week.

This prototype also has a longer-term purpose: it should illustrate what the university's Sitefinity CMS intranet could become. The current intranet may eventually need a broader rebuild, but this project can demonstrate a more accessible, task-oriented, workflow-centered experience using the ASA use case as a practical model.

## Core Workflows

The MVP should support:

- student intake and registration
- documentation submission and staff review
- approved accommodation profiles
- accommodation letter requests, approval, sending, and faculty visibility
- accommodated exam requests and exam operations
- faculty exam responses and reusable exam preferences
- an ASA staff workspace with a unified inbox
- student directory and single student record views
- ASA-managed resources for students and faculty
- audit history for sensitive workflow changes
- basic operational reporting and exports

## Guiding Principles

1. Keep the first production version small enough to launch.
2. Treat SIS data as read-only reference data.
3. Store ASA workflow data in the application database.
4. Make staff work visible through one operational inbox.
5. Keep student and faculty experiences simple, direct, and accessible.
6. Record sensitive actions and status changes in an audit trail.
7. Use SSO/AD or backend identity claims for access instead of building staff-role management into the frontend.
8. Design pages and workflows so they can guide a future Sitefinity intranet implementation.
9. Use the prototype to show stakeholders why the current intranet needs better accessibility, structure, and task design.

## Primary Roles

### Student

Students need to complete intake, upload documentation, see request status, request accommodation letters for current courses, request accommodated exams, and understand next steps without needing to know internal staff workflow terminology.

### Faculty or Instructor

Faculty need to view accommodation letters for students in their sections, acknowledge letters if required, respond to exam requests, upload or link exam materials, set reusable exam preferences, and see only the records relevant to their courses.

### ASA Staff

ASA staff need to monitor a unified inbox, review intake and documentation, create and maintain accommodation profiles, approve/send letters, manage exam logistics, update student lifecycle status, publish resources, and answer operational questions from reliable records.

### Web/CMS Team

The web or CMS team will eventually need to map prototype pages into Sitefinity pages, widgets, or embedded application views while preserving accessible layouts, plain-language workflows, and secure data boundaries.

## MVP Modules

### Student Intake

A student can submit an intake/registration request and ASA staff can move it through review states such as new, in review, needs information, approved, not eligible, or withdrawn.

### Documentation Review

Students can provide documentation metadata or links, and staff can review records, record outcomes, add notes, and request more information.

### Accommodation Profiles

ASA staff can maintain active accommodation profiles for students, including effective dates, profile status, controlled accommodation items, faculty-visible language, and staff-only notes.

### Accommodation Letters

Students can request letters for selected courses. Staff can approve or send letters. Faculty can view relevant letters. Sent letters should preserve an immutable content snapshot.

### Exam Accommodations

Students can submit exam requests. Faculty can respond and provide exam information. Staff can track scheduling, completion, cancellation, and no-shows.

### ASA Staff Workspace

Staff can start from one workspace that aggregates pending intake, documentation, letter, and exam work with filters, status labels, and links into details.

### Student Directory and Record

Staff can search for students and open a single record containing intake history, documentation records, active accommodations, letters, exam requests, and workflow history.

### Resource Library

ASA staff can manage resource metadata and links, publish resources to student and faculty/staff audiences, and archive outdated materials.

### Reporting

The MVP should provide basic counts and exports for active accommodated students, pending documentation, pending letters, upcoming exams, overdue faculty responses, and workflow volume by term.

## Data Ownership Boundaries

### SIS-Owned Data

Imported read-only data should include students, instructors, terms, courses, sections, and enrollments. The app should store internal IDs plus external SIS identifiers and should not write back to the SIS.

### App-Owned Data

The application should own intake requests, documentation review status, accommodation profiles, accommodation items, accommodation letters, exam requests, faculty responses, exam preferences, uploaded exam metadata, staff workflow actions, audit events, and notification/integration events.

### CMS-Owned Data

Sitefinity can own policy explanations, help text, FAQs, non-sensitive resource pages, landing pages, and intranet navigation. Sensitive student accommodation records, documentation, letters, exam requests, and audit history should remain in the application database and be exposed only through authenticated app views or secure integrations.

## Accessibility Expectations

The prototype and future Sitefinity implementation should model:

- semantic headings and form labels
- keyboard-accessible workflows
- visible focus states
- plain-language field labels and status text
- clear validation and error messages
- sufficient color contrast
- layouts that do not rely on color alone
- responsive pages that work on smaller screens

Because the target home is the intranet, the prototype should also serve as an accessibility reference for improving the current Sitefinity environment.

## Suggested Release Phases

### Phase 1: Stabilize the Prototype

Fix known file path issues, remove retired prototype files, align frontend API calls with Flask routes, and verify the app can run locally from the README.

### Phase 2: Production Data Shape

Finalize the schema, SIS import approach, controlled accommodation items, status transition rules, and audit event model.

### Phase 3: Staff-First Workflow Launch

Complete the unified inbox, student record, intake review, documentation review, accommodation profile editing, and letter approval workflow.

### Phase 4: Student and Faculty Launch

Open student intake, documentation, letter requests, exam requests, faculty letter views, faculty exam responses, and faculty exam preferences.

### Phase 5: Reporting and Integrations

Add exports, operational dashboards, Microsoft 365 integration where useful, notification templates, monitoring, and backups.

### Phase 6: Sitefinity Migration

Map the proven experience into the intranet, decide what belongs in Sitefinity versus the app backend, preserve accessibility improvements, and use the project as a demonstration for broader intranet redesign.

## First Launch Definition of Done

The MVP is launchable when staff can manage a student from intake through active accommodations, students can request letters and exams, faculty can see letters and respond to exam requests, staff can monitor daily work from one inbox, sensitive workflow changes are auditable, SIS data is imported read-only, production identity replaces demo-role behavior, document storage is approved by IT, and the project has a clear support runbook.
