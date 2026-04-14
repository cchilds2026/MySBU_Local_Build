import { getExamRequestRecords, setExamRequestRecords } from "../core/state.js";

const defaultExamRecords = [
  {
    id: "exam-bio202-midterm",
    course: "BIO-202 - Biology II",
    instructorName: "Dr. Jane Smith",
    instructorEmail: "jsmith@sbu.edu",
    classTime: "10:00 AM",
    examDate: "05/08/2026",
    requestedExamDate: "05/08/2026",
    requestedTime: "10:00 AM",
    submittedAt: "04/14/2026",
    status: "Approved",
    semester: "Spring 2026",
    studentName: "Student Name",
    studentId: "900123456",
    studentEmail: "student@sbu.edu",
    needsStaffFollowup: false,
    alternateDateRequested: false
  },
  {
    id: "exam-his210-quiz4",
    course: "HIS-210 - World Civilizations",
    instructorName: "Prof. Angela Morris",
    instructorEmail: "amorris@sbu.edu",
    classTime: "1:00 PM",
    examDate: "05/05/2026",
    requestedExamDate: "05/05/2026",
    requestedTime: "1:00 PM",
    submittedAt: "04/13/2026",
    status: "Reviewing",
    semester: "Spring 2026",
    studentName: "Student Name",
    studentId: "900123456",
    studentEmail: "student@sbu.edu",
    needsStaffFollowup: true,
    alternateDateRequested: false
  },
  {
    id: "exam-mat121-final",
    course: "MAT-121 - College Algebra",
    instructorName: "Prof. Daniel Harris",
    instructorEmail: "dharris@sbu.edu",
    classTime: "9:00 AM",
    examDate: "05/16/2026",
    requestedExamDate: "05/16/2026",
    requestedTime: "9:00 AM",
    submittedAt: "04/12/2026",
    status: "Pending",
    semester: "Spring 2026",
    studentName: "Student Name",
    studentId: "900123456",
    studentEmail: "student@sbu.edu",
    needsStaffFollowup: false,
    alternateDateRequested: false
  }
];

function ensureSeedData() {
  const existing = getExamRequestRecords();

  if (Array.isArray(existing) && existing.length > 0) {
    return existing;
  }

  setExamRequestRecords(defaultExamRecords);
  return defaultExamRecords;
}

function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "approved") return "status-badge status-badge--success";
  if (normalized === "reviewing") return "status-badge status-badge--pending";
  return "status-badge";
}

function renderExamDetail(record, container) {
  if (!container || !record) return;

  container.hidden = false;
  container.innerHTML = `
    <section class="letter-preview" aria-labelledby="student-exam-preview-title">
      <div class="letter-preview__header">
        <div>
          <h3 id="student-exam-preview-title" class="letter-preview__title">
            ${record.course} Exam Request
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
          <p><strong>Instructor:</strong> ${record.instructorName}</p>
          <p><strong>Instructor Email:</strong> ${record.instructorEmail}</p>
          <p><strong>Class Time:</strong> ${record.classTime || "Not provided"}</p>
          <p><strong>Original Exam Date:</strong> ${record.examDate}</p>
          <p><strong>Requested Exam Date:</strong> ${record.requestedExamDate}</p>
          <p><strong>Requested Start Time:</strong> ${record.requestedTime}</p>
          <p><strong>Needs Staff Follow-Up:</strong> ${record.needsStaffFollowup ? "Yes" : "No"}</p>
          <p><strong>Alternate Date Requested:</strong> ${record.alternateDateRequested ? "Yes" : "No"}</p>
        </div>

        <div class="letter-preview__body">
          <p>
            This record reflects the exam scheduling request submitted by the student for
            <strong>${record.course}</strong>.
          </p>

          <p>
            The student requested to take the exam on <strong>${record.requestedExamDate}</strong>
            at <strong>${record.requestedTime}</strong>.
          </p>

          ${
            record.needsStaffFollowup
              ? `
            <div class="letter-preview__notes">
              <h4>Staff Review Notice</h4>
              <p>
                This request has been flagged for follow-up because it appears to require staff review
                before final confirmation.
              </p>
            </div>
          `
              : ""
          }

          <p>
            Accessibility Services and Accommodations will review this request and coordinate final
            scheduling as needed.
          </p>
        </div>
      </div>
    </section>
  `;
}

function renderExamList(records, listContainer, detailContainer) {
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
        <strong>${record.course}</strong>
        <p>Requested for ${record.requestedExamDate} at ${record.requestedTime}</p>
      </span>
      <span class="${getStatusClass(record.status)}">${record.status}</span>
    `;

    button.addEventListener("click", () => {
      listContainer
        .querySelectorAll(".record-row--interactive")
        .forEach((row) => row.setAttribute("aria-pressed", "false"));

      button.setAttribute("aria-pressed", "true");
      renderExamDetail(record, detailContainer);
    });

    listContainer.appendChild(button);
  });

  if (records[0]) {
    renderExamDetail(records[0], detailContainer);
  }
}

export function initStudentExamRecords() {
  const listContainer = document.getElementById("student-exam-record-list");
  const detailContainer = document.getElementById("student-exam-detail");

  if (!listContainer || !detailContainer) return;

  const records = ensureSeedData()
    .slice()
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  renderExamList(records, listContainer, detailContainer);
}