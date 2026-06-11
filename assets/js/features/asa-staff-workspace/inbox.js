import { portalApi } from "../../services/portal-api.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function formatStatusLabel(status) {
  return String(status || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSourceLabel(source) {
  const labels = {
    student: "Student Portal",
    faculty_staff: "Faculty/Staff Portal",
    student_and_faculty_staff: "Student + Faculty/Staff",
    asa_staff: "ASA Staff Workflow"
  };

  return labels[source] || formatStatusLabel(source);
}

function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (
    normalized === "approved" ||
    normalized === "published" ||
    normalized === "scheduled" ||
    normalized === "completed" ||
    normalized === "reviewed"
  ) {
    return "status-badge status-badge--success";
  }

  if (
    normalized === "submitted" ||
    normalized === "pending" ||
    normalized === "awaiting_upload" ||
    normalized === "in_review" ||
    normalized === "received_by_asa"
  ) {
    return "status-badge status-badge--pending";
  }

  if (
    normalized === "returned" ||
    normalized === "follow_up_needed" ||
    normalized === "late_request" ||
    normalized === "conflict"
  ) {
    return "status-badge status-badge--read";
  }

  return "status-badge";
}

const WORKFLOW_GROUPS = Object.freeze({
  student_registration: {
    label: "Registration intake",
    stage: "Intake",
    nextAction: "Open the student record, verify the submitted request, and decide whether intake can begin or follow-up is needed."
  },
  documentation: {
    label: "Documentation review",
    stage: "Documentation",
    nextAction: "Review the uploaded documentation status and determine whether it is sufficient, pending, or needs follow-up."
  },
  letter_approval: {
    label: "Accommodation letter approval",
    stage: "Letters",
    nextAction: "Review the drafted accommodation letter and confirm whether it is ready for faculty release."
  },
  exam_request: {
    label: "Exam coordination",
    stage: "Exams",
    nextAction: "Check timing, faculty response, delivery instructions, and any late/conflict flags before scheduling or completing the request."
  }
});

function getWorkflowGroup(item) {
  return WORKFLOW_GROUPS[item.type] || {
    label: "Other workflow items",
    stage: "Review",
    nextAction: "Open the item and determine the next staff action."
  };
}

function groupItems(items) {
  return items.reduce((groups, item) => {
    const group = getWorkflowGroup(item);
    const key = item.type || "other";

    if (!groups.has(key)) {
      groups.set(key, {
        ...group,
        items: []
      });
    }

    groups.get(key).items.push(item);
    return groups;
  }, new Map());
}

function renderEmpty(container, message) {
  container.innerHTML = `
    <div class="faculty-empty-state">
      ${escapeHtml(message)}
    </div>
  `;
}

function renderInboxItem(item) {
  const group = getWorkflowGroup(item);
  const title = escapeHtml(item.title || "ASA workflow item");
  const status = escapeHtml(formatStatusLabel(item.status || "new"));
  const source = escapeHtml(formatSourceLabel(item.source_portal || ""));
  const submitterName = escapeHtml(item.submitter_name || "Unknown submitter");
  const submitterEmail = escapeHtml(item.submitter_email || "");
  const summary = escapeHtml(item.summary || "");
  const submittedAt = escapeHtml(item.submitted_at || "");
  const actionHref = escapeAttribute(item.action_href || "#");
  const statusClass = getStatusClass(item.status);

  return `
    <article class="asa-inbox-row">
      <div class="asa-inbox-row__main">
        <div class="asa-inbox-row__stage">
          <span class="status-badge">${escapeHtml(group.stage)}</span>
          <span class="${statusClass}">${status}</span>
        </div>

        <div class="asa-inbox-row__topline">
          <strong>${title}</strong>
        </div>

        <p class="asa-inbox-row__meta">
          ${source} · ${submitterName}
          ${submitterEmail ? `· ${submitterEmail}` : ""}
        </p>

        ${summary ? `<p class="asa-inbox-row__summary">${summary}</p>` : ""}

        <p class="asa-inbox-row__action-note">
          <strong>Recommended next action:</strong> ${escapeHtml(group.nextAction)}
        </p>

        ${
          submittedAt
            ? `<p class="asa-inbox-row__date">Submitted/updated: ${submittedAt}</p>`
            : ""
        }
      </div>

      <div class="asa-inbox-row__actions">
        <a
          class="button-secondary button-secondary--small"
          href="${actionHref}"
        >
          Open Work Item
        </a>
      </div>
    </article>
  `;
}

function renderInbox(container, items) {
  if (!Array.isArray(items) || items.length === 0) {
    renderEmpty(container, "No ASA workflow items currently need staff action.");
    return;
  }

  const groupedItems = Array.from(groupItems(items).values());

  container.innerHTML = groupedItems
    .map(
      (group) => `
        <section class="asa-inbox-group" aria-label="${escapeAttribute(group.label)}">
          <h3 class="asa-inbox-group__heading">
            <span>${escapeHtml(group.label)}</span>
            <span class="status-badge">${group.items.length}</span>
          </h3>
          ${group.items.map(renderInboxItem).join("")}
        </section>
      `
    )
    .join("");
}

export function initAsaStaffInbox() {
  const container = document.getElementById("asa-staff-inbox-list");
  const count = document.getElementById("asa-staff-inbox-count");
  const refreshButton = document.getElementById("asa-staff-inbox-refresh");

  if (!container) return;

  async function loadInbox() {
    renderEmpty(container, "Loading ASA inbox...");

    if (refreshButton) {
      refreshButton.disabled = true;
    }

    try {
      const items = await portalApi.getAsaInbox();

      if (count) {
        count.textContent = String(Array.isArray(items) ? items.length : 0);
      }

      renderInbox(container, items);
    } catch (error) {
      console.warn("ASA inbox could not be loaded.", error);

      if (count) {
        count.textContent = "0";
      }

      renderEmpty(
        container,
        "ASA inbox could not be loaded. Start the Flask API to view live workflow data."
      );
    } finally {
      if (refreshButton) {
        refreshButton.disabled = false;
      }
    }
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", loadInbox);
  }

  loadInbox();
}
