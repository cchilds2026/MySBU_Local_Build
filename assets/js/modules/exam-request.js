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

  function finalizeExamSubmission() {
    hideAllModals();

    showMessage(
      "success",
      "Your exam scheduling request has been submitted successfully. Backend review, SQL storage, and dashboard retrieval can be connected here later."
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