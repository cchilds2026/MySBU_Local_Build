const asaStaffExamRequests = [
  {
    id: "exam-request-psy101-1",
    courseId: "psy101",
    courseCode: "PSY-101",
    courseTitle: "Intro to Psychology",
    title: "PSY-101 Midterm Request",
    submittedAt: "04/14/2026",
    requestedFor: "2026-05-08",
    requestedTime: "10:00 AM",
    status: "Review",
    studentName: "Jordan Williams",
    studentId: "900123456",
    studentEmail: "jordan.williams@sbu.edu",
    facultyName: "Dr. Lisa Turner",
    facultyEmail: "lturner@sbu.edu",
    notes: "Student requested reduced-distraction space and 1.5x extended time.",
    facultyResponse: null,
    staffNotes: "",
    staffStatus: "Received"
  },
  {
    id: "exam-request-eng220-1",
    courseId: "eng220",
    courseCode: "ENG-220",
    courseTitle: "Writing in Society",
    title: "ENG-220 Essay Exam Request",
    submittedAt: "04/13/2026",
    requestedFor: "2026-05-05",
    requestedTime: "1:00 PM",
    status: "Approved",
    studentName: "Jordan Williams",
    studentId: "900123456",
    studentEmail: "jordan.williams@sbu.edu",
    facultyName: "Prof. Michael Reed",
    facultyEmail: "mreed@sbu.edu",
    notes: "Student confirmed regular class date and approved exam timing.",
    facultyResponse: {
      deliveryMethod: "email",
      returnMethod: "scan_email",
      approvedExamDate: "2026-05-05",
      approvedExamTime: "1:00 PM",
      examDuration: "90",
      calculatorAllowed: "none",
      notesSheet: "no",
      notesSheetDetails: "",
      preferredContactMethod: "email",
      preferredContactValue: "mreed@sbu.edu",
      additionalInformation: "Essay exam should open directly in Microsoft Word."
    },
    staffNotes: "Exam packet received and entered into scheduling queue.",
    staffStatus: "Scheduled"
  }
];

const asaStaffStudents = [
  {
    id: "student-1",
    name: "Jordan Williams",
    studentId: "900123456",
    email: "jordan.williams@sbu.edu",
    status: "Active",
    accommodations: 3
  },
  {
    id: "student-2",
    name: "Casey Martin",
    studentId: "900456789",
    email: "casey.martin@sbu.edu",
    status: "Active",
    accommodations: 2
  }
];

const asaStaffDocumentation = [
  {
    id: "doc-1",
    studentName: "Jordan Williams",
    fileName: "provider-documentation.pdf",
    uploadedAt: "04/02/2026",
    status: "On File"
  },
  {
    id: "doc-2",
    studentName: "Casey Martin",
    fileName: "housing-support-documentation.pdf",
    uploadedAt: "04/01/2026",
    status: "Received"
  }
];

const asaStaffAccess = [
  { name: "Brianna", email: "brianna@sbu.edu", accessLevel: "ASA Staff" },
  { name: "Cody", email: "cody@sbu.edu", accessLevel: "ASA Staff" },
  { name: "ASA Director", email: "asa.director@sbu.edu", accessLevel: "ASA Staff" }
];

function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "no show") {
    return "status-badge status-badge--no-show";
  }

  if (
    normalized === "approved" ||
    normalized === "scheduled" ||
    normalized === "completed" ||
    normalized === "on file" ||
    normalized === "active"
  ) {
    return "status-badge status-badge--success";
  }

  if (
    normalized === "review" ||
    normalized === "received"
  ) {
    return "status-badge status-badge--pending";
  }

  return "status-badge";
}

function formatDisplayDate(dateString) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}

function renderSummaryCards() {
  const container = document.getElementById("asa-staff-summary-grid");
  if (!container) return;

  const reviewCount = asaStaffExamRequests.filter((item) => item.status === "Review").length;
  const scheduledCount = asaStaffExamRequests.filter((item) => item.staffStatus === "Scheduled").length;
  const noShowCount = asaStaffExamRequests.filter((item) => item.staffStatus === "No Show").length;
  const docsCount = asaStaffDocumentation.length;

  const cards = [
    {
      heading: "Awaiting Faculty Approval",
      value: reviewCount,
      meta: "Exam requests still waiting for instructor approval."
    },
    {
      heading: "Scheduled Exams",
      value: scheduledCount,
      meta: "Approved exams ready for staff handling."
    },
    {
      heading: "No Show Follow-Up",
      value: noShowCount,
      meta: "Exams marked as not attended by the student."
    },
    {
      heading: "Documentation Records",
      value: docsCount,
      meta: "Documentation files currently on file."
    }
  ];

  container.innerHTML = cards
    .map(
      (card) => `
        <article class="staff-summary-card">
          <h2>${card.heading}</h2>
          <p class="staff-summary-card__value">${card.value}</p>
          <p class="staff-summary-card__meta">${card.meta}</p>
        </article>
      `
    )
    .join("");
}

function renderQueue() {
  const container = document.getElementById("asa-staff-queue-list");
  if (!container) return;

  const queueItems = [
    ...asaStaffExamRequests
      .filter((item) => item.status === "Review" || item.staffStatus === "Received" || item.staffStatus === "No Show")
      .map((item) => ({
        title: item.title,
        status: item.staffStatus === "No Show" ? "No Show" : item.status === "Review" ? "Faculty Review" : item.staffStatus,
        meta: `${item.studentName} · ${item.courseCode} · Requested ${formatDisplayDate(item.requestedFor)} at ${item.requestedTime}`,
        summary: item.notes
      })),
    ...asaStaffDocumentation.map((item) => ({
      title: item.fileName,
      status: item.status,
      meta: `${item.studentName} · Uploaded ${item.uploadedAt}`,
      summary: "Documentation record available for review."
    }))
  ];

  container.innerHTML = queueItems
    .map(
      (item) => `
        <article class="staff-record-card">
          <div class="staff-record-card__main">
            <div class="staff-record-card__topline">
              <strong>${item.title}</strong>
              <span class="${getStatusClass(item.status)}">${item.status}</span>
            </div>
            <p class="staff-record-card__meta">${item.meta}</p>
            <p class="staff-record-card__summary">${item.summary}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderExamFilterGroup(activeFilter, onFilterChange) {
  const container = document.getElementById("asa-staff-exam-filter-group");
  if (!container) return;

  const filters = ["All", "Review", "Approved", "Scheduled", "Completed", "No Show"];

  container.innerHTML = "";

  filters.forEach((filter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = filter === activeFilter ? "button-primary" : "button-secondary";
    button.textContent = filter;

    button.addEventListener("click", () => onFilterChange(filter));

    container.appendChild(button);
  });
}

function buildExamManagementModal() {
  let modal = document.getElementById("asa-staff-exam-management-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.id = "asa-staff-exam-management-modal";
  modal.hidden = true;

  modal.innerHTML = `
    <div class="modal-dialog modal-dialog--faculty-exam" role="dialog" aria-modal="true" aria-labelledby="asa-staff-exam-management-title">
      <div class="faculty-exam-modal__header">
        <div>
          <h2 id="asa-staff-exam-management-title" class="modal-title">Manage Exam Request</h2>
          <p class="modal-text">Review request details, faculty approvals, and update staff handling status.</p>
        </div>
        <button type="button" class="faculty-modal-close" id="asa-staff-exam-management-close" aria-label="Close exam management modal">×</button>
      </div>

      <div id="asa-staff-exam-management-summary"></div>

      <form class="asa-form" id="asa-staff-exam-management-form" novalidate>
        <input type="hidden" id="asa-staff-exam-management-id" />

        <fieldset class="form-section">
          <legend class="form-section__title">Staff Status</legend>

          <div class="form-grid">
            <div class="form-field">
              <label class="form-label" for="asa-staff-exam-status">
                Staff Handling Status <span class="form-required">*</span>
              </label>
              <select class="form-select" id="asa-staff-exam-status" required>
                <option value="">Select one</option>
                <option value="Received">Received</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="No Show">No Show</option>
              </select>
            </div>

            <div class="form-field form-field--full">
              <label class="form-label" for="asa-staff-exam-notes">
                Staff Notes
              </label>
              <textarea
                class="form-textarea"
                id="asa-staff-exam-notes"
                placeholder="Add internal scheduling or follow-up notes."
              ></textarea>
            </div>
          </div>
        </fieldset>

        <div class="form-message" id="asa-staff-exam-message" hidden aria-live="polite"></div>

        <div class="modal-actions">
          <button type="button" class="button-secondary" id="asa-staff-exam-cancel">Cancel</button>
          <button type="submit" class="button-primary">Save Staff Update</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function buildExamSummaryHtml(record) {
  const facultyResponse = record.facultyResponse;

  return `
    <section class="letter-preview">
      <div class="letter-preview__header">
        <div>
          <h3 class="letter-preview__title">${record.title}</h3>
          <p class="letter-preview__meta">${record.courseCode}: ${record.courseTitle} · Submitted ${record.submittedAt}</p>
        </div>
        <span class="${getStatusClass(record.staffStatus || record.status)}">${record.staffStatus || record.status}</span>
      </div>

      <div class="letter-preview__document">
        <div class="letter-preview__document-meta">
          <p><strong>Student:</strong> ${record.studentName}</p>
          <p><strong>SBU ID:</strong> ${record.studentId}</p>
          <p><strong>Student Email:</strong> ${record.studentEmail}</p>
          <p><strong>Faculty:</strong> ${record.facultyName}</p>
          <p><strong>Faculty Email:</strong> ${record.facultyEmail}</p>
          <p><strong>Requested Date:</strong> ${formatDisplayDate(record.requestedFor)}</p>
          <p><strong>Requested Time:</strong> ${record.requestedTime}</p>
          <p><strong>Faculty Approval Status:</strong> ${record.status}</p>
          <p><strong>Staff Status:</strong> ${record.staffStatus}</p>
        </div>

        <div class="letter-preview__body">
          <p><strong>Student Notes:</strong> ${record.notes}</p>

          ${
            facultyResponse
              ? `
            <div class="letter-preview__notes">
              <h4>Faculty Approval Details</h4>
              <p><strong>Delivery to ASA:</strong> ${facultyResponse.deliveryMethod || "Not provided"}</p>
              <p><strong>Return Method:</strong> ${facultyResponse.returnMethod || "Not provided"}</p>
              <p><strong>Approved Exam Date:</strong> ${facultyResponse.approvedExamDate ? formatDisplayDate(facultyResponse.approvedExamDate) : "Not provided"}</p>
              <p><strong>Approved Exam Time:</strong> ${facultyResponse.approvedExamTime || "Not provided"}</p>
              <p><strong>Exam Duration:</strong> ${facultyResponse.examDuration ? `${facultyResponse.examDuration} minutes` : "Not provided"}</p>
              <p><strong>Calculator:</strong> ${facultyResponse.calculatorAllowed || "Not provided"}</p>
              <p><strong>Notes Sheet:</strong> ${facultyResponse.notesSheet || "Not provided"}</p>
              <p><strong>Notes Sheet Details:</strong> ${facultyResponse.notesSheetDetails || "None"}</p>
              <p><strong>Preferred Contact:</strong> ${facultyResponse.preferredContactMethod || "Not provided"} · ${facultyResponse.preferredContactValue || "Not provided"}</p>
              <p><strong>Additional Information:</strong> ${facultyResponse.additionalInformation || "None"}</p>
            </div>
          `
              : `
            <div class="letter-preview__notes">
              <h4>Faculty Approval Details</h4>
              <p>No faculty approval form has been submitted yet.</p>
            </div>
          `
          }
        </div>
      </div>
    </section>
  `;
}

function initExamManagementModal(renderAll) {
  const modal = buildExamManagementModal();
  const form = document.getElementById("asa-staff-exam-management-form");
  const closeButton = document.getElementById("asa-staff-exam-management-close");
  const cancelButton = document.getElementById("asa-staff-exam-cancel");
  const message = document.getElementById("asa-staff-exam-message");
  const requestIdField = document.getElementById("asa-staff-exam-management-id");
  const summaryContainer = document.getElementById("asa-staff-exam-management-summary");

  function hideModal() {
    modal.hidden = true;
    form.reset();
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
  }

  function showMessage(type, text) {
    message.hidden = false;
    message.className = `form-message form-message--${type}`;
    message.textContent = text;
  }

  closeButton.addEventListener("click", hideModal);
  cancelButton.addEventListener("click", hideModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      hideModal();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      showMessage("error", "Please complete all required staff exam fields before saving.");
      form.reportValidity();
      return;
    }

    const record = asaStaffExamRequests.find((item) => item.id === requestIdField.value);
    if (!record) {
      showMessage("error", "The selected exam request could not be found.");
      return;
    }

    const nextStaffStatus = document.getElementById("asa-staff-exam-status").value;
    const nextStaffNotes = document.getElementById("asa-staff-exam-notes").value.trim();

    record.staffStatus = nextStaffStatus;
    record.staffNotes = nextStaffNotes;

    if (nextStaffStatus === "No Show") {
      record.status = "No Show";
    }

    showMessage("success", "Staff exam update saved successfully.");

    window.setTimeout(() => {
      hideModal();
      renderAll();
    }, 700);
  });

  function openModal(record) {
    requestIdField.value = record.id;
    summaryContainer.innerHTML = buildExamSummaryHtml(record);

    document.getElementById("asa-staff-exam-status").value = record.staffStatus || "";
    document.getElementById("asa-staff-exam-notes").value = record.staffNotes || "";

    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";

    modal.hidden = false;
  }

  return { openModal };
}

function renderExamRequests(activeFilter, openModal) {
  const container = document.getElementById("asa-staff-exam-request-list");
  if (!container) return;

  const filtered = asaStaffExamRequests.filter((item) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Review") return item.status === "Review";
    if (activeFilter === "Approved") return item.status === "Approved";
    return item.staffStatus === activeFilter;
  });

  if (!filtered.length) {
    renderEmptyState(container, "No exam requests match the selected filter.");
    return;
  }

  container.innerHTML = "";

  filtered.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "staff-record-card staff-record-card--button";

    button.innerHTML = `
      <div class="staff-record-card__main">
        <div class="staff-record-card__topline">
          <strong>${item.title}</strong>
          <span class="${getStatusClass(item.staffStatus || item.status)}">${item.staffStatus || item.status}</span>
        </div>
        <p class="staff-record-card__meta">
          ${item.studentName} · ${item.courseCode} · Requested ${formatDisplayDate(item.requestedFor)} at ${item.requestedTime}
        </p>
        <p class="staff-record-card__summary">
          Faculty status: ${item.status}${item.facultyResponse ? " · Faculty approval form on file" : " · Awaiting faculty form"}
        </p>
      </div>
    `;

    button.addEventListener("click", () => openModal(item));
    container.appendChild(button);
  });
}

function renderStudents() {
  const container = document.getElementById("asa-staff-student-list");
  if (!container) return;

  container.innerHTML = asaStaffStudents
    .map(
      (item) => `
        <article class="staff-record-card">
          <div class="staff-record-card__main">
            <div class="staff-record-card__topline">
              <strong>${item.name}</strong>
              <span class="${getStatusClass(item.status)}">${item.status}</span>
            </div>
            <p class="staff-record-card__meta">${item.studentId} · ${item.email}</p>
            <p class="staff-record-card__summary">${item.accommodations} approved accommodation(s) on file.</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderDocumentation() {
  const container = document.getElementById("asa-staff-documentation-list");
  if (!container) return;

  container.innerHTML = asaStaffDocumentation
    .map(
      (item) => `
        <article class="staff-record-card">
          <div class="staff-record-card__main">
            <div class="staff-record-card__topline">
              <strong>${item.fileName}</strong>
              <span class="${getStatusClass(item.status)}">${item.status}</span>
            </div>
            <p class="staff-record-card__meta">${item.studentName} · Uploaded ${item.uploadedAt}</p>
            <p class="staff-record-card__summary">Documentation record available for staff review.</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderStaffAccess() {
  const container = document.getElementById("asa-staff-access-list");
  if (!container) return;

  container.innerHTML = asaStaffAccess
    .map(
      (item) => `
        <article class="staff-access-row">
          <div>
            <strong>${item.name}</strong>
            <p>${item.email}</p>
            <p>${item.accessLevel}</p>
          </div>
          <button type="button" class="button-secondary button-secondary--small">Edit Access</button>
        </article>
      `
    )
    .join("");
}

export function initAsaStaffDashboard() {
  const panel = document.getElementById("asa-staff-dashboard-panel");
  if (!panel) return;

  let activeExamFilter = "All";

  const examModal = initExamManagementModal(renderAll);

  function renderAll() {
    renderSummaryCards();
    renderQueue();
    renderExamFilterGroup(activeExamFilter, (nextFilter) => {
      activeExamFilter = nextFilter;
      renderAll();
    });
    renderExamRequests(activeExamFilter, examModal.openModal);
    renderStudents();
    renderDocumentation();
    renderStaffAccess();
  }

  renderAll();
}