\# Legacy MySBU / Ektron Integration Contract



\## Purpose



This document defines the handoff contract for reading selected legacy MySBU, Sitefinity, or Ektron data from ektron\_mysbuINT.



The ASA app should not query Ektron tables directly from frontend code or workflow logic. The app should query a stable SQL view in the student\_success database. IT or a DBA can later map the real Ektron tables into that view.



\## Source Database



Database: ektron\_mysbuINT



Assumption: ektron\_mysbuINT is on the same SQL Server instance as student\_success.



\## Required Access



The ASA app only needs read access.



Required for discovery:

\- CONNECT to ektron\_mysbuINT

\- SELECT on relevant schemas, tables, or DBA-created views



Required for the application service account if this integration is enabled:

\- SELECT only

\- No INSERT

\- No UPDATE

\- No DELETE

\- No DDL



\## Stable View Contract



The app queries:



student\_success.asa.v\_legacy\_mysbu\_form\_submission



Expected columns:



| Column | Purpose |

|---|---|

| legacy\_submission\_id | Stable source identifier from Ektron or Sitefinity. |

| source\_system | Usually ektron\_mysbuINT; mock for local testing. |

| source\_form\_name | Legacy form or content source name. |

| submitted\_at | When the form or content record was submitted or created. |

| student\_identifier | SBU ID, username, Colleague ID, or other matched identifier. |

| student\_email | Student email if available. |

| student\_first\_name | Student first name if available. |

| student\_last\_name | Student last name if available. |

| raw\_status | Legacy status value if available. |

| source\_url | Legacy source URL if available. |

| raw\_payload | Optional raw payload for migration or debugging. |



\## Local Development Fallback



The SQL contract script creates:



\- asa.legacy\_mysbu\_form\_submission\_mock

\- asa.v\_legacy\_mysbu\_form\_submission



By default, the view points to the mock table. This lets the Flask route exist before IT maps the real Ektron tables.



\## Flask Endpoint



GET /api/legacy-mysbu/form-submissions



Optional query parameters:



\- student\_identifier

\- student\_email

\- source\_form\_name

\- limit



Example:



/api/legacy-mysbu/form-submissions?student\_identifier=123456\&limit=25



If the SQL view is not installed, the endpoint returns a 503 response with integration\_status set to not\_configured.



\## IT / DBA TODO



1\. Identify the relevant ektron\_mysbuINT tables or views.

2\. Confirm where legacy form submissions are stored.

3\. Confirm whether student identity appears as SBU ID, email, username, Colleague ID, or another identifier.

4\. Replace the mock view body in asa.v\_legacy\_mysbu\_form\_submission with the real Ektron mapping.

5\. Keep the output column names unchanged.

6\. Keep access read-only.



\## App Boundary



This integration is for reference and migration support only.



Do not store new ASA workflow records in ektron\_mysbuINT.



ASA-owned workflow records should remain in the application database, including:



\- intake records

\- documentation review

\- accommodation profiles

\- accommodation letters

\- exam requests

\- faculty responses

\- staff workflow statuses

\- audit history

