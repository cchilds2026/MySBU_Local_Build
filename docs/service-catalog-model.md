# Service catalog model

The service catalog should become a central organizing layer for the MySBU redesign. It should help students, faculty, staff, Sitefinity page editors, and the chatbot locate the right office, resource, form, or workflow.

## Why a service catalog

Department pages alone are not enough. Users often know what they need to do, but not which office owns it.

Examples:

```text
I need extra time on an exam.
I need a travel signature.
I need benefits information.
I need to upload documentation.
I need onboarding forms.
```

A service catalog lets the site organize around user intent rather than only department structure.

## Core entities

### Department

A department owns services and content.

Recommended fields:

```text
department_id
name
short_name
type
sitefinity_section_path
audiences
contacts
service_categories
chatbot_summary
```

### Service

A service is something a user is trying to find, understand, or complete.

Recommended fields:

```text
service_id
title
department_id
category
audiences
service_type
fulfillment_model
sitefinity_path
summary
keywords
related_components
chatbot_intent
last_reviewed_at
content_owner
```

### Resource

A resource is a document, form, link, policy, guide, or external reference.

Recommended fields:

```text
resource_id
title
description
department_id
audiences
category
resource_type
file_or_link
status
sort_order
related_service_ids
last_reviewed_at
content_owner
```

### Contact

A contact record gives users a clear next step when the content does not answer the question.

Recommended fields:

```text
contact_id
department_id
label
email
phone
location
hours
escalation_notes
related_service_ids
```

## Service types

```text
content
workflow
guided-content
external-system
manual-office-process
```

## Fulfillment models

```text
sitefinity-cms
custom-app
sitefinity-cms-plus-workflow
external-system
manual-office-process
```

This field is important because it prevents the rebuild from treating every service as a custom software project.

## Recommended Sitefinity content types

```text
Department
Service
Department Resource
FAQ Item
Contact Card
Alert
Process Step Group
Quick Link Card
Staff Profile
```

## Recommended Sitefinity widgets

```text
Department Hero
Service Catalog List
Service Card Grid
Resource List
FAQ Accordion
Contact Card
Alert Banner
Process Steps
Department Sidebar Navigation
Staff Directory
Document Checklist
Policy Library
```

## Chatbot metadata

Every service should be structured so the chatbot can identify:

```text
What is the user trying to do?
Which department owns it?
Which audience is it for?
Where should the user go?
Is it informational or transactional?
What keywords and synonyms should match it?
```

Example:

```text
User says: I need extra time on exams.
Matched service: ASA exam accommodations.
Department: ASA.
Audience: student.
Fulfillment: custom workflow.
Route: /accessibility-services/exam-accommodations.
```

## Audience model

Start with broad audience labels:

```text
students
faculty-staff
graduate-students
international-students
student-employees
managers
admitted-students
asa-staff
```

Sitefinity widgets should be able to filter content by one or more audience values.

## Department showcase sequence

1. ASA: showcase content plus custom workflows.
2. HR: showcase CMS/resource/policy/service catalog patterns.
3. ISSA: showcase content plus document/checklist/workflow patterns.

## Implementation notes

The current prototype keeps service data in:

```text
assets/js/data/service-catalog.js
```

This is intentionally simple. It is a front-end stand-in for a future Sitefinity service content type.

The current department config files are in:

```text
assets/js/data/departments/
```

These are also stand-ins for Sitefinity department content/configuration.
