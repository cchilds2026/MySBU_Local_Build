# Component inventory

This inventory tracks reusable components that should become part of the MySBU department component library. ASA is the first showcase department, with HR and International Student Services as next-use cases.

## Current reusable candidates

| Component | Current source/prototype | Sitewide value | Sitefinity target |
|---|---|---|---|
| Accordion / FAQ | `assets/js/core/accordions.js`, `components/accordions/` | High | Reusable FAQ/disclosure widget |
| Resource list | `assets/js/features/asa-resources/public-resource-list.js` | High | Department resource list widget |
| Resource admin | `assets/js/features/asa-resources/resource-admin.js` | Medium | Prefer Sitefinity content management |
| Contact card | `assets/css/components/contact-card.css` and page markup | High | Office contact card widget |
| Card grid | Portal and dashboard cards | High | Quick-link / service-card grid widget |
| Tab panel | Shared tab behavior in router | Medium | Accessible tabs widget, used sparingly |
| Status badge | `assets/css/components/badges.css` | High | Shared visual/status utility |
| Alert/message panel | Form messages and empty states | High | Alert/banner widget |
| Staff dashboard summary | ASA staff portal | Medium | Dashboard-card pattern for workflow apps |
| Department/sidebar navigation | Shared ASA staff utility/sidebar nav | High | Department navigation widget |
| Process steps | Not fully extracted yet | High | Step-by-step service guidance widget |
| Document checklist | Not fully extracted yet | High for ASA/ISSA | Checklist widget |
| Policy library | Not fully extracted yet | High for HR | Filterable resource/policy widget |

## Naming rule

Use department-neutral names for reusable components.

Good:

```text
department-resource-list
service-card
contact-card
accordion-faq
alert-banner
process-steps
```

Avoid for reusable components:

```text
asa-resource-list
asa-card
asa-faq
```

ASA-specific names should only be used for ASA-specific workflows, such as accommodation registration or ASA staff inbox behavior.

## Accessibility requirements by component

### Accordion / FAQ

```text
Use button elements for triggers
Use aria-expanded on trigger
Use aria-controls pointing to panel ID
Use hidden or equivalent state for collapsed panels
Remain keyboard operable without custom key traps
Preserve heading hierarchy
```

### Resource list

```text
Use semantic list/card markup
Include clear file/link labels
Avoid ambiguous 'click here' text
Expose file type/description when useful
Ensure links open predictably and are announced clearly
```

### Service card

```text
Show service owner, audience, category, and route
Use headings correctly
Keep card itself from becoming an inaccessible nested interactive region
Use explicit CTA links/buttons where needed
```

### Contact card

```text
Use real mailto/tel links
Include office label and escalation context
Avoid relying only on layout to convey meaning
```

### Alert banner

```text
Use semantic status/warning language
Do not rely on color alone
Keep urgent alerts short and actionable
```

### Tab panel

```text
Use tabs only when content is closely related
Maintain tablist/tab/tabpanel relationships
Preserve keyboard and focus behavior
Do not hide critical content behind unnecessary tabs
```

## Department fit

| Component | ASA | HR | ISSA |
|---|---:|---:|---:|
| Accordion / FAQ | Yes | Yes | Yes |
| Resource list | Yes | Yes | Yes |
| Contact card | Yes | Yes | Yes |
| Service catalog list | Yes | Yes | Yes |
| Alert banner | Yes | Yes | Yes |
| Process steps | Yes | Yes | Yes |
| Document checklist | Yes | Possible | Yes |
| Policy library | Possible | Yes | Possible |
| Staff directory | Possible | Yes | Possible |
| Workflow queue | Yes | Maybe | Yes |

## Extraction priority

1. Accordion / FAQ
2. Service card and service catalog list
3. Resource list
4. Contact card
5. Alert banner
6. Process steps
7. Document checklist
8. Policy/resource library
9. Department navigation
10. Workflow dashboard cards

## Current showcase page

The current component-library showcase page is:

```text
pages/component-library.html
```

It uses:

```text
assets/js/data/departments/
assets/js/data/service-catalog.js
assets/js/components/department-profile.js
assets/js/components/service-catalog.js
assets/css/components/service-catalog.css
```

This is a static prototype of the model. In production, these data structures should become Sitefinity content types and widgets.
