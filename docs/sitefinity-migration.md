# MySBU Sitefinity Migration Vision

## Goal

The ultimate goal is to migrate the MySBU accommodations platform into the university's Sitefinity CMS intranet site.

This project should therefore be treated as more than a standalone prototype. It is also a concrete illustration of what the current intranet could become: more accessible, more task-oriented, and more useful for students, faculty, and Accessibility Services and Accommodations staff.

The current Sitefinity intranet may eventually need to be redone more broadly. Until then, this prototype can help stakeholders see what is possible and define requirements for that future rebuild.

## Strategic Framing

The prototype should answer two questions:

1. What should an effective accommodations-management experience do?
2. What should a better intranet experience feel like for people trying to complete real university tasks?

That second question matters because ASA workflows are high-touch, sensitive, and often stressful for students. If the intranet can support these workflows well, it creates a strong model for improving other internal services too.

## Recommended Sitefinity Role

Sitefinity should eventually own:

- intranet navigation
- landing pages
- policy and help content
- non-sensitive ASA resources
- content managed by web or communications staff
- page shells that route people to the right task

The accommodations application should own:

- student accommodation records
- documentation review
- accommodation profiles
- accommodation letters
- exam requests
- faculty responses
- staff workflow statuses
- audit history
- sensitive student data

This boundary is important. Sitefinity can present the experience, but sensitive accommodation workflows should be backed by a secure application database and server-side authorization.

## Migration Options

### Option 1: Sitefinity Content Shell Plus Embedded App

Sitefinity provides the intranet page, navigation, and content. Secure application views are embedded or linked inside that structure.

Best for:

- keeping workflow logic in a dedicated app
- preserving stronger control over sensitive data
- moving faster while the broader intranet remains unchanged

Risks:

- embedded views must handle authentication cleanly
- visual consistency needs coordination between the app and Sitefinity theme

### Option 2: Sitefinity Widgets Calling Backend APIs

Sitefinity pages use custom widgets that call the accommodations backend APIs.

Best for:

- a more native intranet feel
- reusable CMS-managed components
- tighter integration with Sitefinity page editing

Risks:

- custom widget development may be heavier
- backend API security still needs careful implementation
- complex workflows may be awkward inside CMS widget patterns

### Option 3: Full Intranet Rebuild With ASA as First Model

The ASA platform becomes the reference implementation for a larger intranet rebuild.

Best for:

- long-term accessibility and usability improvement
- a consistent design system
- replacing weak current intranet patterns

Risks:

- larger project scope
- more stakeholders
- slower path to an ASA-specific launch

## Recommended Path

Start with Option 1:

- keep the application workflows separate and secure
- use Sitefinity as the intranet entry point
- let the prototype define the desired accessible experience
- migrate content and navigation in stages

Then evaluate whether selected screens should become native Sitefinity widgets after the workflows are stable.

## What the Prototype Should Demonstrate

The prototype should show:

- clear role-based paths for students, faculty, and ASA staff
- accessible forms with plain-language labels
- visible status and next-step language
- one ASA staff workspace instead of scattered tasks
- searchable student records for staff
- resource pages that are easy for students and faculty to use
- reduced reliance on email for routine exam and letter workflows
- a cleaner information architecture than the current intranet

## Sitefinity Migration Questions

Before migration, confirm:

- What Sitefinity version is the intranet using?
- How does the intranet authenticate users?
- Are AD/SSO roles or group claims available to Sitefinity pages or custom widgets?
- Can Sitefinity host custom frontend bundles safely?
- Should app views be embedded, linked, or rebuilt as widgets?
- Where should sensitive documents live?
- Who owns ASA content updates after launch?
- What accessibility standards does the institution require for intranet pages?
- What parts of the current Sitefinity theme create accessibility or usability problems?

## Accessibility Improvement Opportunity

This project can help make the accessibility argument concrete.

Instead of only saying the current intranet is hard to use, the prototype can show:

- how headings should structure a page
- how task buttons should be labeled
- how forms should guide users through required fields
- how status messages should be written
- how students should find accommodation actions quickly
- how faculty should respond without searching through unrelated content
- how staff should see daily work without relying on email and spreadsheets

## Suggested Sitefinity Migration Deliverables

When the project is ready for the web/CMS team, prepare:

- a page-to-destination migration map
- a CMS-owned versus app-owned data map
- an accessibility reference checklist
- a current intranet gap summary
- an authentication and embedding plan
- a stakeholder demo showing current intranet limitations beside the prototype direction

## Definition of Success

The Sitefinity migration is successful when:

- users enter the ASA workflows naturally through the intranet
- students, faculty, and ASA staff see only the workflows relevant to them
- sensitive data remains protected by backend authorization
- ASA staff can maintain non-sensitive content without developer help
- migrated pages preserve the prototype's accessibility improvements
- stakeholders can use the project as a model for broader intranet redesign
