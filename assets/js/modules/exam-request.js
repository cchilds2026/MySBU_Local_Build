import {
  getExamRequestRecords,
  setExamRequestRecords
} from "../core/state.js";

function addBusinessDays(date, businessDays) {
  const result = new Date(date);
  let added = 0;

  while (added < businessDays) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();

    if (day !== 0 && day !== 6) {
      added += 1;
    }
  }

  return result;
}

function normalizeDateOnly(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateForDisplay(dateString) {
  if (!dateString) return "";
  const date = normalizeDateOnly(dateString);
  if (!date) return dateString;

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapExamStatus(needsFollowup) {
  return needsFollowup ? "Reviewing" : "Approved";
}

function upsertExamRequestRecords(nextRecords) {
  const existing = getExamRequestRecords();

  const merged = [...nextRecords, ...existing].reduce((accumulator, record) => {
    const alreadyExists = accumulator.some(
      (item) =>
        item.course === record.course &&
        item.examDate === record.examDate &&
        item.requestedExamDate === record.requestedExamDate &&
        item.requestedTime === record.requestedTime
    );

    if (!alreadyExists) {
      accumulator.push(record);
    }

    return accumulator;
  }, []);

  setExamRequestRecords(merged);
}

function buildExamRequestRecord({
  courseText,
  instructorName,
  instructorEmail,
  classTime,
  examDate,
  requestedExamDate,
  requestedTime,
  studentName,
  studentId,
  studentEmail,
  semester,
  needsFollowup
}) {
  const displayRequestedDate = requestedExamDate || examDate;
  const displayRequestedTime = requestedTime || classTime || "TBD";
  const status = mapExamStatus(needsFollowup);

  return {
    id: `exam-${slugify(courseText)}-${Date.now()}`,
    course: courseText,
    instructorName,
    instructorEmail,
    classTime,
    examDate: formatDateForDisplay(examDate),
    requestedExamDate: formatDateForDisplay(displayRequestedDate),
    requestedTime: displayRequestedTime,
    submittedAt: formatDateForDisplay(new Date().toISOString().slice(0, 10)),
    status,
    semester,
    studentName,
    studentId,
    studentEmail,
    needsStaffFollowup: needsFollowup,
    alternateDateRequested: Boolean(requestedExamDate && requestedExamDate !== examDate)
  };
}

export function initExamRequestForm() {
  const examForm = document.getElementById("exam-request-form");
  if (!examForm) return;

  const message = document.getElementById("exam-form-message");
  const courseSelect = document.getElementById("course-select");
  const instructorNameDisplay = document.getElementById("instructor-name-display");
  const instructorEmailDisplay = document.getElementById("instructor-email-display");
  const classTimeDisplay = document.getElementById("class-time-display");
  const instructorEmailHidden = document.getElementById("instructor-email");
  const classTimeHidden = document.getElementById("class-time-hidden");
  const originalExamDate = document.getElementById("exam-date");
  const requestedExamDate = document.getElementById("requested-exam-date");
  const requestedTime = document.getElementById("requested-time");
  const alternateDateConfirmed = document.getElementById("alternate-date-confirmed");
  const needsStaffFollowup = document.getElementById("needs-staff-followup");
  const alternateModal = document.getElementById("alternate-date-modal");
  const alternateAgree = document.getElementById("alternate-date-agree");
  const alternateContinue = document.getElementById("alternate-date-continue");
  const alternateEmailProfessor = document.getElementById("alternate-date-email-professor");
  const lateModal = document.getElementById("late-request-modal");
  const lateContinue = document.getElementById("late-request-continue");

  function hideAllModals() {
    if (alternateModal) alternateModal.hidden = true;
    if (lateModal) lateModal.hidden = true;
  }

  function showMessage(type, text) {
    if (!message) return;
    message.hidden = false;
    message.className = `form-message form-message--${type}`;
    message.textContent = text;
  }

  function clearMessage() {
    if (!message) return;
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
  }

  function populateCourseMetadata() {
    if (!courseSelect) return;

    const selectedOption = courseSelect.options[courseSelect.selectedIndex];
    const instructorName = selectedOption?.dataset?.instructor || "";
    const instructorEmail = selectedOption?.dataset?.instructorEmail || "";
    const classTime = selectedOption?.dataset?.classTime || "";

    if (instructorNameDisplay) instructorNameDisplay.value = instructorName;
    if (instructorEmailDisplay) instructorEmailDisplay.value = instructorEmail;
    if (classTimeDisplay) classTimeDisplay.value = classTime;
    if (instructorEmailHidden) instructorEmailHidden.value = instructorEmail;
    if (classTimeHidden) classTimeHidden.value = classTime;
  }

  function needsAlternateDateConfirmation() {
    if (!originalExamDate || !requestedExamDate || !alternateDateConfirmed) return false;

    const originalValue = originalExamDate.value;
    const requestedValue = requestedExamDate.value;

    if (!originalValue || !requestedValue) return false;
    if (originalValue === requestedValue) return false;
    if (alternateDateConfirmed.value === "true") return false;

    return true;
  }

  function needsLateRequestWarning() {
    if (!originalExamDate || !originalExamDate.value) return false;

    const examDate = normalizeDateOnly(originalExamDate.value);
    if (!examDate) return false;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deadline = addBusinessDays(today, 3);

    return examDate < deadline;
  }

  function buildProfessorMailto() {
    const courseText =
      courseSelect && courseSelect.selectedIndex > 0
        ? courseSelect.options[courseSelect.selectedIndex].text
        : "";

    const originalDate = originalExamDate?.value || "";
    const requestedDate = requestedExamDate?.value || "";
    const instructorEmail = instructorEmailHidden?.value || "";

    const subject = encodeURIComponent("Exam Scheduling Request Follow-Up");
    const body = encodeURIComponent(
      `Hello,\n\nI am requesting to take my exam on a different date than the rest of the class and wanted to check with you first.\n\nCourse: ${courseText}\nOriginal Exam Date: ${originalDate}\nRequested Alternate Date: ${requestedDate}\n\nThank you.`
    );

    return `mailto:${instructorEmail}?subject=${subject}&body=${body}`;
  }

  function persistExamRequest() {
    if (!courseSelect || courseSelect.selectedIndex < 1) return;

    const selectedOption = courseSelect.options[courseSelect.selectedIndex];
    const courseText = selectedOption.text;
    const instructorName = selectedOption.dataset.instructor || "";
    const instructorEmail = selectedOption.dataset.instructorEmail || "";
    const classTime = selectedOption.dataset.classTime || "";
    const examDate = originalExamDate?.value || "";
    const requestedDateValue = requestedExamDate?.value || "";
    const requestedTimeValue = requestedTime?.value || "";
    const studentName = document.getElementById("student-name-display")?.value || "Student Name";
    const studentId = document.getElementById("student-id")?.value || "900123456";
    const studentEmail = document.getElementById("student-email")?.value || "student@sbu.edu";
    const semester = document.getElementById("semester")?.value || "Spring 2026";
    const needsFollowup = needsStaffFollowup?.value === "true";

    const record = buildExamRequestRecord({
      courseText,
      instructorName,
      instructorEmail,
      classTime,
      examDate,
      requestedExamDate: requestedDateValue,
      requestedTime: requestedTimeValue,
      studentName,
      studentId,
      studentEmail,
      semester,
      needsFollowup
    });

    upsertExamRequestRecords([record]);
  }

  function finalizeExamSubmission() {
    persistExamRequest();
    hideAllModals();

    showMessage(
      "success",
      "Your exam scheduling request has been submitted successfully."
    );

    examForm.reset();

    if (alternateDateConfirmed) alternateDateConfirmed.value = "false";
    if (needsStaffFollowup) needsStaffFollowup.value = "false";
    if (alternateAgree) alternateAgree.checked = false;
    if (alternateContinue) alternateContinue.disabled = true;

    populateCourseMetadata();
  }

  function continueSubmissionFlow() {
    hideAllModals();

    if (needsLateRequestWarning()) {
      if (needsStaffFollowup) needsStaffFollowup.value = "true";

      if (lateModal) {
        lateModal.hidden = false;
        return;
      }
    }

    finalizeExamSubmission();
  }

  if (courseSelect) {
    courseSelect.addEventListener("change", () => {
      populateCourseMetadata();
      clearMessage();
    });

    populateCourseMetadata();
  }

  if (requestedExamDate && alternateDateConfirmed) {
    requestedExamDate.addEventListener("change", () => {
      alternateDateConfirmed.value = "false";

      if (alternateAgree) alternateAgree.checked = false;
      if (alternateContinue) alternateContinue.disabled = true;

      clearMessage();
    });
  }

  if (originalExamDate) {
    originalExamDate.addEventListener("change", clearMessage);
  }

  if (alternateAgree && alternateContinue) {
    alternateAgree.addEventListener("change", () => {
      alternateContinue.disabled = !alternateAgree.checked;
    });
  }

  if (alternateContinue && alternateDateConfirmed) {
    alternateContinue.addEventListener("click", () => {
      alternateDateConfirmed.value = "true";
      continueSubmissionFlow();
    });
  }

  if (alternateEmailProfessor) {
    alternateEmailProfessor.addEventListener("click", () => {
      window.location.href = buildProfessorMailto();
    });
  }

  if (lateContinue) {
    lateContinue.addEventListener("click", () => {
      finalizeExamSubmission();
    });
  }

  examForm.addEventListener("reset", () => {
    window.setTimeout(() => {
      hideAllModals();
      clearMessage();

      if (alternateDateConfirmed) alternateDateConfirmed.value = "false";
      if (needsStaffFollowup) needsStaffFollowup.value = "false";
      if (alternateAgree) alternateAgree.checked = false;
      if (alternateContinue) alternateContinue.disabled = true;

      populateCourseMetadata();
    }, 0);
  });

  examForm.addEventListener("submit", (event) => {
    event.preventDefault();

    hideAllModals();
    clearMessage();

    if (!examForm.checkValidity()) {
      showMessage("error", "Please complete all required fields before submitting your request.");
      examForm.reportValidity();
      return;
    }

    if (needsAlternateDateConfirmation()) {
      if (alternateModal) {
        alternateModal.hidden = false;
        return;
      }
    }

    if (needsLateRequestWarning()) {
      if (needsStaffFollowup) needsStaffFollowup.value = "true";

      if (lateModal) {
        lateModal.hidden = false;
        return;
      }
    }

    finalizeExamSubmission();
  });
}