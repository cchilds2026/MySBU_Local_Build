import { getLatestRegistrationPayload, getAsaIntakeQueue, setAsaIntakeQueue } from "../core/state.js";

function showMessage(messageNode, type, text) {
  if (!messageNode) return;
  messageNode.hidden = false;
  messageNode.className = `form-message form-message--${type}`;
  messageNode.textContent = text;
}

function clearMessage(messageNode) {
  if (!messageNode) return;
  messageNode.hidden = true;
  messageNode.textContent = "";
  messageNode.className = "form-message";
}

function showAcknowledgment(node) {
  if (node) node.hidden = false;
}

function hideAcknowledgment(node) {
  if (node) node.hidden = true;
}

function populateAsaIntakeRegistrationSummary() {
  const form = document.getElementById("asa-intake-form");
  if (!form) return;

  const payload = getLatestRegistrationPayload();
  if (!payload) return;

  const requestedAccommodationLines = [...(payload.requestedAccommodations || [])];

  if (payload.requestedAccommodationsOther) {
    requestedAccommodationLines.push(`Other: ${payload.requestedAccommodationsOther}`);
  }

  const priorLabel =
    payload.priorAccommodations === "yes"
      ? "Yes"
      : payload.priorAccommodations === "no"
        ? "No"
        : "";

  const fields = {
    "intake-request-type": payload.requestTypeLabel || "",
    "intake-disability-type": payload.disabilityTypeLabel || "",
    "intake-academic-impact": payload.academicImpact || "",
    "intake-daily-life-impact": payload.dailyLifeImpact || "",
    "intake-prior-accommodations": priorLabel,
    "intake-prior-accommodations-details": payload.priorAccommodationsDetails || "",
    "intake-requested-accommodations": requestedAccommodationLines.length
      ? requestedAccommodationLines.join("\n")
      : "No academic accommodations selected in registration."
  };

  Object.entries(fields).forEach(([id, value]) => {
    const field = document.getElementById(id);
    if (field) field.value = value;
  });
}

export function initAsaIntakeForm() {
  const form = document.getElementById("asa-intake-form");
  if (!form) return;

  populateAsaIntakeRegistrationSummary();

  const message = document.getElementById("asa-intake-message");
  const acknowledgment = document.getElementById("asa-intake-acknowledgment");
  const documentationStatus = document.getElementById("intake-documentation-status");
  const lectureRecording = document.getElementById("intake-lecture-recording");
  const lectureAgreement = document.getElementById("agreement-lecture");
  const docsAgreement = document.getElementById("agreement-docs");
  const testingCheckboxes = form.querySelectorAll('input[name="testing_accommodations"]');
  const studentContractCheckbox = document.getElementById("intake-student-contract");

  function syncConditionalSections() {
    if (lectureAgreement) {
      lectureAgreement.hidden = !(lectureRecording && lectureRecording.checked);
    }

    if (docsAgreement && documentationStatus) {
      docsAgreement.hidden = documentationStatus.value !== "provisional";
    }
  }

  function hasTestingAccommodationSelected() {
    return Array.from(testingCheckboxes).some((checkbox) => checkbox.checked);
  }

  documentationStatus?.addEventListener("change", () => {
    clearMessage(message);
    hideAcknowledgment(acknowledgment);
    syncConditionalSections();
  });

  lectureRecording?.addEventListener("change", () => {
    clearMessage(message);
    hideAcknowledgment(acknowledgment);
    syncConditionalSections();
  });

  form.querySelectorAll("input, textarea, select").forEach((field) => {
    field.addEventListener("change", () => {
      clearMessage(message);
      hideAcknowledgment(acknowledgment);
    });
  });

  syncConditionalSections();

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      clearMessage(message);
      hideAcknowledgment(acknowledgment);
      syncConditionalSections();
      populateAsaIntakeRegistrationSummary();
    }, 0);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    clearMessage(message);
    hideAcknowledgment(acknowledgment);

    if (!form.checkValidity()) {
      showMessage(message, "error", "Please complete all required intake fields before finalizing.");
      form.reportValidity();
      return;
    }

    if (lectureRecording?.checked) {
      const lectureAgreementAccepted = document.getElementById("intake-lecture-recording-agreement");
      if (lectureAgreementAccepted && !lectureAgreementAccepted.checked) {
        showMessage(message, "error", "Please complete the lecture recording agreement acknowledgment.");
        return;
      }
    }

    if (documentationStatus?.value === "provisional") {
      const docContract = document.getElementById("intake-doc-contract");
      if (docContract && !docContract.checked) {
        showMessage(message, "error", "Please complete the documentation contract acknowledgment.");
        return;
      }
    }

    if (hasTestingAccommodationSelected() && studentContractCheckbox && !studentContractCheckbox.checked) {
      showMessage(message, "error", "Please confirm the student contract and exam guidelines acknowledgment.");
      return;
    }

    const queue = getAsaIntakeQueue().map((item) => {
      if (item.studentId === "900123456") {
        return { ...item, intakeStatus: "Completed" };
      }
      return item;
    });

    setAsaIntakeQueue(queue);
    showAcknowledgment(acknowledgment);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}