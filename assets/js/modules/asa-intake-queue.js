import { getAsaIntakeQueue } from "../core/state.js";

export function renderAsaIntakeQueue() {
  const queueList = document.getElementById("asa-intake-queue-list");
  if (!queueList) return;

  const queue = getAsaIntakeQueue();

  if (!queue.length) {
    queueList.innerHTML = `
      <article class="staff-record-card">
        <div class="staff-record-card__main">
          <div class="staff-record-card__topline">
            <strong>No students currently awaiting intake</strong>
            <span class="status-badge">Clear</span>
          </div>
          <p class="staff-record-card__summary">
            New registrations will appear here once the student registration form is submitted.
          </p>
        </div>
      </article>
    `;
    return;
  }

  queueList.innerHTML = queue
    .map((item) => {
      const docsLabel =
        item.documentationStatus === "uploaded"
          ? "Documentation uploaded"
          : item.documentationStatus === "pending"
            ? "Documentation pending"
            : "Documentation not started";

      return `
        <article class="staff-record-card">
          <div class="staff-record-card__main">
            <div class="staff-record-card__topline">
              <strong>${item.studentName}</strong>
              <span class="status-badge">${item.intakeStatus === "Completed" ? "Complete" : "New"}</span>
            </div>
            <p class="staff-record-card__meta">
              ${item.requestType} · ${item.disabilityType} · ${item.registrationDate} · ${docsLabel}
            </p>
            <p class="staff-record-card__summary">
              ${item.intakeStatus === "Completed"
                ? "Intake has been finalized in the prototype workflow."
                : "Intake not started. Student record is ready for staff review."}
            </p>
          </div>
          <div class="staff-record-card__actions">
            <a class="button-primary" href="/pages/asa-intake-form.html">Open Intake</a>
            <button class="button-secondary" type="button">Mark In Progress</button>
          </div>
        </article>
      `;
    })
    .join("");
}