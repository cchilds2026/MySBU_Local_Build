import { getStatusClass, renderEmptyState, updateTabCounter } from "./ui-core.js";

export function buildLetterModalHtml(record, course) {
  return `
    <section class="letter-preview">
      <div class="letter-preview__header">
        <div>
          <h3 class="letter-preview__title">${record.title}</h3>
          <p class="letter-preview__meta">${course.code} · Received ${record.receivedAt}</p>
        </div>
        <span class="${getStatusClass(record.status)}">${record.status}</span>
      </div>

      <div class="letter-preview__document">
        <div class="letter-preview__document-meta">
          <p><strong>Student:</strong> ${record.studentName}</p>
          <p><strong>SBU ID:</strong> ${record.studentId}</p>
          <p><strong>Student Email:</strong> ${record.studentEmail}</p>
          <p><strong>Course:</strong> ${course.code}: ${course.title}</p>
        </div>

        <div class="letter-preview__body">
          <p>${record.summary}</p>
          <p><strong>Approved accommodations:</strong></p>
          <ul class="letter-preview__list">
            ${record.accommodations.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      </div>
    </section>
  `;
}

export function buildUploadedExamModalHtml(record, course) {
  return `
    <section class="letter-preview">
      <div class="letter-preview__header">
        <div>
          <h3 class="letter-preview__title">${record.title}</h3>
          <p class="letter-preview__meta">${course.code} · Uploaded ${record.uploadedAt}</p>
        </div>
        <span class="${getStatusClass(record.status)}">${record.status}</span>
      </div>

      <div class="letter-preview__document">
        <div class="letter-preview__document-meta">
          <p><strong>File Name:</strong> ${record.fileName}</p>
          <p><strong>Return Method:</strong> ${record.deliveryMethod || "Not provided"}</p>
          <p><strong>Class Exam Date:</strong> ${record.classExamDate || "Not provided"}</p>
          <p><strong>Class Exam Time:</strong> ${record.classExamTime || "Not provided"}</p>
          <p><strong>Course:</strong> ${course.code}: ${course.title}</p>
        </div>

        <div class="letter-preview__body">
          <p>${record.notes}</p>

          ${
            record.sharepointFileUrl
              ? `
            <p style="margin-top: 1rem;">
              <a
                class="button-secondary"
                href="${record.sharepointFileUrl}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Document
              </a>
            </p>
          `
              : `
            <p style="margin-top: 1rem;">No document link is available for this uploaded exam.</p>
          `
          }
        </div>
      </div>
    </section>
  `;
}

export function renderModalList({
  records,
  listContainer,
  course,
  openModal,
  rowDescriptionBuilder
}) {
  if (!listContainer) return;

  listContainer.innerHTML = "";

  if (!course) {
    renderEmptyState(listContainer, "Select a course in the My Courses tab to view these records.");
    return;
  }

  if (!records.length) {
    renderEmptyState(listContainer, "No records are available for the selected course.");
    return;
  }

  records.forEach((record) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "record-row record-row--interactive";

    button.innerHTML = `
      <span>
        <strong>${record.title}</strong>
        <p>${rowDescriptionBuilder(record)}</p>
      </span>
      <span class="${getStatusClass(record.status)}">${record.status}</span>
    `;

    button.addEventListener("click", () => {
      openModal(record, course);
    });

    listContainer.appendChild(button);
  });
}

export function renderUploadedExamToolbar(selectedCourseId, uploadExamModal) {
  const toolbar = document.getElementById("faculty-uploaded-exam-toolbar");
  if (!toolbar) return;

  toolbar.innerHTML = `
    <div class="faculty-preference-launcher__footer">
      <button
        type="button"
        class="button-primary faculty-preference-launcher__button"
        id="faculty-open-upload-exam-modal"
        ${selectedCourseId ? "" : "disabled"}
      >
        Upload Exam
      </button>
    </div>
  `;

  const button = document.getElementById("faculty-open-upload-exam-modal");
  if (!button) return;

  button.addEventListener("click", () => {
    uploadExamModal.openModal();
  });
}

export function renderFacultyTabCounters(selectedCourseId, facultyLetters, facultyExamRequestsCache) {
  const unreadLetterCount = facultyLetters.filter(
    (record) =>
      record.courseId === selectedCourseId &&
      String(record.status || "").toLowerCase() === "unread"
  ).length;

  const unapprovedExamCount = facultyExamRequestsCache.filter(
    (record) =>
      record.courseId === selectedCourseId &&
      String(record.status || "").toLowerCase() === "review"
  ).length;

  updateTabCounter("faculty-letters-counter", unreadLetterCount);
  updateTabCounter("faculty-exams-counter", unapprovedExamCount);
}