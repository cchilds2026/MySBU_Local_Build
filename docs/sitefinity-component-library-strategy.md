# Sitefinity component library strategy

## Direction

The MySBU rebuild should be Sitefinity-centered. Sitefinity should be treated as the main platform for authentication routing, department page management, structured content, reusable widgets, service catalog content, and WCAG-conscious presentation patterns.

The custom application layer should remain available for transactional workflows that Sitefinity should not own directly, such as accommodation registration, exam request processing, documentation review, staff inboxes, student lifecycle records, or future ISSA/HR workflow queues.

ASA is the first showcase department. HR and International Student Services are the next planning targets.

## Core principle

Build reusable components first, then configure them by department.

A department page should be assembled from approved components rather than rebuilt from scratch each time. Department-specific content, service categories, resources, contacts, alerts, and workflows should be provided through structured configuration or Sitefinity content types.

## Target platform model

```text
Sitefinity
  - Authentication and routing into MySBU sections
  - CMS pages and department landing pages
  - Reusable widgets/components
  - Structured content types
  - Resource libraries and file/link management
  - Service catalog entries
  - Editorial workflow and publishing

Custom workflow/API layer
  - Transactional forms and queues
  - Student/faculty/staff workflow records
  - SQL-backed operational data
  - Integrations with Colleague, Informer, Navigate, Outlook, OneDrive, and other systems
```

## Sitewide reusable components

These should be developed as sitewide standards rather than department-specific one-offs:

| Component | Purpose |
|---|---|
| Department hero | Consistent department page introduction and routing context. |
| Service catalog list | Helps users and chatbot find the right service quickly. |
| Service card | Summarizes a service, audience, owner, route, and keywords. |
| Accordion / FAQ | Reusable accessible disclosure pattern for policies and questions. |
| Resource list | Forms, policies, guides, documents, and external links. |
| Contact card | Office contacts, locations, hours, and escalation paths. |
| Alert banner | Deadlines, closures, warnings, and urgent updates. |
| Card grid | Common quick-link and action-card layout. |
| Process steps | Step-by-step service guidance. |
| Tab panel | Grouped content where tabs are appropriate and accessible. |
| Status badge | Consistent workflow/status labeling. |
| Staff directory | Department staff listing where needed. |
| Document checklist | Especially useful for ASA and ISSA. |
| Policy library | Especially useful for HR and administrative offices. |

## Service catalog model

The service catalog should become a central organizing pattern for MySBU. Each service should have enough metadata for humans, Sitefinity widgets, search, and chatbot navigation.

Recommended fields:

```text
Service ID
Title
Department owner
Audience
Category
Summary
Keywords
Route / canonical URL
Fulfillment model
Related resources
Related contacts
Related workflows
Sitefinity content owner
Last reviewed date
```

Fulfillment model should clearly identify whether a service is:

```text
sitefinity-cms
custom-app
sitefinity-cms-plus-workflow
external-system
manual-office-process
```

This distinction matters because not every service should become a custom application workflow.

## Department model

Each department should have a configuration record or Sitefinity content item with:

```text
Department ID
Name
Short name
Primary audience groups
Service categories
Contacts
Sitefinity section path
Reusable components used
Custom workflows needed
Chatbot routing summary
```

Current prototype stubs exist for:

```text
assets/js/data/departments/asa.js
assets/js/data/departments/hr.js
assets/js/data/departments/issa.js
```

## ASA as showcase

ASA should demonstrate both sides of the model:

1. Reusable presentation/content components.
2. Custom transactional workflows.

Reusable patterns shown through ASA:

```text
Accordion / FAQ
Resource list
Department contact card
Service card
Process steps
Alert/message panels
Tab panels
Status badges
Sidebar navigation
```

ASA-specific workflows that should stay custom:

```text
Accommodation registration
Documentation review
Exam accommodation workflow
ASA staff inbox
Student lifecycle archive/restore/delete
```

## HR planning direction

HR will likely be more CMS/content-heavy at first.

Likely reusable components:

```text
Service catalog list
Resource list
Policy library
Accordion / FAQ
Contact card
Alert banner
Process steps
Staff directory
```

Potential service categories:

```text
Benefits
Payroll
Employment
Hiring and onboarding
Policies
Leave and workplace support
Student employment
```

Custom workflow should only be added when a process needs routing, approvals, record retention, or system integration.

## ISSA planning direction

International Student Services will likely need a mix of CMS content and workflow-backed requests.

Likely reusable components:

```text
Service catalog list
Accordion / FAQ
Resource list
Document checklist
Process steps
Alert banner
Contact card
Status badge
```

Potential service categories:

```text
Immigration status
I-20 and visa documents
Travel signatures
Employment authorization
Arrival and orientation
Forms and document requests
```

Likely future workflows:

```text
I-20 request
Travel signature request
CPT/OPT request
Immigration document upload
Arrival/check-in process
```

## WCAG and accessibility expectations

Reusable components should be built once with accessibility requirements included by default.

Minimum expectations:

```text
Semantic HTML before custom roles
Keyboard-operable interactions
Visible focus states
Correct aria-expanded / aria-controls for accordions
Correct tablist / tab / tabpanel relationships for tabs
Color contrast that meets WCAG expectations
No information conveyed by color alone
Headings in logical order
Skip link support
Clear error and validation messaging
Reduced reliance on hover-only interactions
```

## Chatbot implications

A chatbot can only navigate the site well if pages and services have consistent metadata. The service catalog should give the chatbot reliable signals:

```text
Service title
Department owner
Audience
Keywords
Summary
Canonical route
Fulfillment model
Related resources
Related forms
```

This is one reason the service catalog should be a central Sitefinity content type, not just a visual card layout.

## Repo implications

The repository should gradually move from ASA-only naming toward a platform structure:

```text
assets/js/components/
assets/js/data/departments/
assets/js/data/service-catalog.js
assets/css/components/
pages/component-library.html
```

Current ASA workflow files can remain under ASA-specific feature folders until they are either productionized as workflows or replaced by Sitefinity widgets.

## Implementation rule

Use Sitefinity for reusable content and department page management.

Use custom code only when the feature needs:

```text
transactional workflow
role-based operational access
student/faculty/staff record updates
audit trails
system integrations
approval queues
secure document processing
```

This rule prevents the rebuild from becoming another set of one-off custom pages.
