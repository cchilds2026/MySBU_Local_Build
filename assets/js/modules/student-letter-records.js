import { getAccommodationLetterRecords, setAccommodationLetterRecords } from "../core/state.js";

const defaultLetterRecords = [
  {
    id: "letter-psy101-spring-2026",
    course: "PSY-101 - Intro to Psychology",
    instructor: "Dr. Lisa Turner",
    instructorEmail: "lturner@sbu.edu",
    submittedAt: "04/12/2026",
    status: "Sent",
    semester: "Spring 2026",
    studentName: "Student Name",
    studentId: "900123456",
    studentEmail: "student@sbu.edu",
    accommodations: [
      "Extended Time on Exams",
      "Reduced Distraction Testing",
      "Note-Taking Support"
    ],
    notes: "",
    requestMode: "update"
  },
  {
    id: "letter-eng220-spring-2026",
    course: "ENG-220 - Writing in Society",
    instructor: "Prof. Michael Reed",
    instructorEmail: "mreed@sbu.edu",
    submittedAt: "04/10/2026",
    status: "Pending",
    semester: "Spring 2026",
    studentName: "Student Name",
    studentId: "900123456",
    studentEmail: "student@sbu.edu",
    accommodations: [
      "Extended Time on Exams",
      "Reduced Distraction Testing",
      "Note-Taking Support"
    ],
    notes: "",
    requestMode: "update"
  },
  {
    id: "letter-bio202-spring-2026",
    course: "BIO-202 - Biology II",
    instructor: "Dr. Jane Smith",
    instructorEmail: "jsmith@sbu.edu",
    submittedAt: "04/08/2026",
    status: "Sent",
    semester: "Spring 2026",
    studentName: "Student Name",
    studentId: "900123456",
    studentEmail: "student@sbu.edu",
    accommodations: [
      "Extended Time on Exams",
      "Reduced Distraction Testing",
      "Note-Taking Support"
    ],
    notes: "",
    requestMode: "original"
  }
];

function getStatusClass(status) {
  return String(status || "").toLowerCase() === "sent"
    ? "status-badge status-badge--success"
    : "status-badge status-badge--pending";
}

function ensureLetterSeedData() {
  const existing = getAccommodationLetterRecords();

  if (Array.isArray(existing) && existing.length > 0) {
    return existing;
  }

  setAccommodationLetterRecords(defaultLetterRecords);
  return defaultLetterRecords;
}

function buildLetterBody(record) {
  return `
    <p>Dear ${record.instructor},</p>

    <p>
      This message serves as notification from Accessibility Services and Accommodations that
      <strong>${record.studentName}</strong> has approved accommodations on file for the
      <strong>${record.semester}</strong> term.
    </p>

    <p>
      The following accommodations apply to <strong>${record.course}</strong>:
    </p>

    <ul class="letter-preview__list">
      ${record.accommodations.map((item) => `<li>${item}</li>`).join("")}
    </ul>

    <p>
      These accommodations are approved through the office and should be implemented in accordance
      with university procedure. If there are questions about how an accommodation applies within
      the course environment, please contact Accessibility Services and Accommodations directly.
    </p>

    ${
      record.notes
        ? `
      <div class="letter-preview__notes">
        <h4>Student Notes Submitted with Request</h4>
        <p>${record.notes}</p>
      </div>
    `
        : ""
    }

    <p>
      Thank you,<br />
      Accessibility Services and Accommodations
    </p>
  `;
}

function renderLetterDetail(record, container) {
  if (!container || !record) return;

  container.hidden = false;
  container.innerHTML = `
    <section class="letter-preview" aria-labelledby="student-letter-preview-title">
      <div class="letter-preview__header">
        <div>
          <h3 id="student-letter-preview-title" class="letter-preview__title">
            ${record.course} Accommodation Letter
          </h3>
          <p class="letter-preview__meta">
            ${record.status} · Submitted ${record.submittedAt} · ${record.semester}
          </p>
        </div>

        <span class="${getStatusClass(record.status)}">${record.status}</span>
      </div>

      <div class="letter-preview__document">
        <div class="letter-preview__document-meta">
          <p><strong>Student:</strong> ${record.studentName}</p>
          <p><strong>SBU ID:</strong> ${record.studentId}</p>
          <p><strong>Student Email:</strong> ${record.studentEmail}</p>
          <p><strong>Instructor:</strong> ${record.instructor}</p>
          <p><strong>Instructor Email:</strong> ${record.instructorEmail}</p>
          <p><strong>Request Type:</strong> ${
            record.requestMode === "update"
              ? "Update to Existing Semester Letters"
              : "Original Semester Letter Request"
          }</p>
        </div>

        <div class="letter-preview__body">
          ${buildLetterBody(record)}
        </div>
      </div>
    </section>
  `;
}

function renderLetterList(records, listContainer, detailContainer) {
  if (!listContainer) return;

  listContainer.innerHTML = "";

  records.forEach((record, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "record-row record-row--interactive";
    button.dataset.recordId = record.id;
    button.setAttribute("aria-pressed", index === 0 ? "true" : "false");

    button.innerHTML = `
      <span>
        <strong>${record.course} Accommodation Letter</strong>
        <p>Submitted ${record.submittedAt}</p>
      </span>
      <span class="${getStatusClass(record.status)}">${record.status}</span>
    `;

    button.addEventListener("click", () => {
      listContainer
        .querySelectorAll(".record-row--interactive")
        .forEach((row) => row.setAttribute("aria-pressed", "false"));

      button.setAttribute("aria-pressed", "true");
      renderLetterDetail(record, detailContainer);
    });

    listContainer.appendChild(button);
  });

  if (records[0]) {
    renderLetterDetail(records[0], detailContainer);
  }
}

export function initStudentLetterRecords() {
  const listContainer = document.getElementById("student-letter-record-list");
  const detailContainer = document.getElementById("student-letter-detail");

  if (!listContainer || !detailContainer) return;

  const records = ensureLetterSeedData()
    .slice()
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  renderLetterList(records, listContainer, detailContainer);
}