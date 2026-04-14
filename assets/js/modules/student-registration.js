import {
  getRegistrationState,
  setRegistrationState,
  getAsaIntakeQueue,
  setAsaIntakeQueue,
  setLatestRegistrationPayload,
  getPrototypeUser
} from "../core/state.js";

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

function addStudentToAsaQueue(registrationData = {}) {
  const currentUser = getPrototypeUser();
  const queue = getAsaIntakeQueue();

  const alreadyExists = queue.some((item) => item.studentId === "900123456");
  if (alreadyExists) return;

  const requestTypeLabels = {
    academic: "Academic Accommodations",
    housing: "Housing Accommodations",
    temporary: "Temporary Accommodations"
  };

  const disabilityTypeLabels = {
    adhd: "ADHD",
    autism: "Autism Spectrum Disorder",
    learning_disability: "Learning Disability",
    mental_health: "Mental Health Condition",
    medical: "Medical Condition",
    mobility: "Mobility / Physical Disability",
    hearing: "Hearing Disability",
    vision: "Vision Disability",
    temporary: "Temporary Condition",
    other: "Other"
  };

  const queueRecord = {
    studentName: currentUser.name,
    studentId: "900123456",
    email: currentUser.email,
    major: "Psychology",
    registrationDate: "04/13/2026",
    documentationStatus: getRegistrationState().documentationStatus,
    intakeStatus: "Not Started",
    requestType: requestTypeLabels[registrationData.requestType] || "Accommodation Request",
    disabilityType: disabilityTypeLabels[registrationData.disabilityType] || "Not Provided"
  };

  queue.unshift(queueRecord);
  setAsaIntakeQueue(queue);

  setLatestRegistrationPayload({
    requestType: registrationData.requestType || "",
    requestTypeLabel: queueRecord.requestType,
    disabilityType: registrationData.disabilityType || "",
    disabilityTypeLabel: queueRecord.disabilityType,
    academicImpact: registrationData.academicImpact || "",
    dailyLifeImpact: registrationData.dailyLifeImpact || "",
    priorAccommodations: registrationData.priorAccommodations || "",
    priorAccommodationsDetails: registrationData.priorAccommodationsDetails || "",
    requestedAccommodations: registrationData.requestedAccommodations || [],
    requestedAccommodationsOther: registrationData.requestedAccommodationsOther || "",
    documentationStatus: queueRecord.documentationStatus
  });
}

export function initStudentRegistrationForm() {
  const form = document.getElementById("student-registration-form");
  if (!form) return;

  const message = document.getElementById("student-registration-message");
  const acknowledgment = document.getElementById("student-registration-acknowledgment");

  const documentUpload = document.getElementById("registration-document-upload");
  const docsPending = document.getElementById("registration-docs-pending");
  const requestType = document.getElementById("registration-request-type");
  const requestedAccommodationsSection = document.getElementById("registration-requested-accommodations-section");
  const priorAccommodations = document.getElementById("registration-prior-accommodations");
  const priorAccommodationsDetailsField = document.getElementById("registration-prior-accommodations-details-field");
  const priorAccommodationsDetails = document.getElementById("registration-prior-accommodations-details");

  function syncConditionalFields() {
    if (requestedAccommodationsSection) {
      requestedAccommodationsSection.hidden = !(requestType && requestType.value === "academic");
    }

    if (priorAccommodationsDetailsField) {
      const shouldShow = priorAccommodations && priorAccommodations.value === "yes";
      priorAccommodationsDetailsField.hidden = !shouldShow;

      if (priorAccommodationsDetails) {
        priorAccommodationsDetails.required = shouldShow;
        if (!shouldShow) priorAccommodationsDetails.value = "";
      }
    }
  }

  function getRequestedAccommodationSelections() {
    return Array.from(form.querySelectorAll('input[name="requested_accommodations"]:checked'));
  }

  if (requestType) {
    requestType.addEventListener("change", () => {
      clearMessage(message);
      hideAcknowledgment(acknowledgment);
      syncConditionalFields();
    });
  }

  if (priorAccommodations) {
    priorAccommodations.addEventListener("change", () => {
      clearMessage(message);
      hideAcknowledgment(acknowledgment);
      syncConditionalFields();
    });
  }

  form.querySelectorAll("input, textarea, select").forEach((field) => {
    field.addEventListener("change", () => {
      clearMessage(message);
      hideAcknowledgment(acknowledgment);
    });
  });

  syncConditionalFields();

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      clearMessage(message);
      hideAcknowledgment(acknowledgment);
      syncConditionalFields();
    }, 0);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    clearMessage(message);
    hideAcknowledgment(acknowledgment);
    syncConditionalFields();

    if (!form.checkValidity()) {
      showMessage(message, "error", "Please complete all required fields before submitting your registration.");
      form.reportValidity();
      return;
    }

    const hasUpload = documentUpload?.files && documentUpload.files.length > 0;
    const docsPendingChecked = docsPending?.checked;

    if (!hasUpload && !docsPendingChecked) {
      showMessage(
        message,
        "error",
        "Please either upload documentation now or acknowledge that you still need to provide documentation."
      );
      return;
    }

    if (requestType?.value === "academic") {
      const hasAccommodationChecks = getRequestedAccommodationSelections().length > 0;
      const otherField = document.getElementById("registration-requested-accommodations-other");
      const hasOtherText = otherField && otherField.value.trim() !== "";

      if (!hasAccommodationChecks && !hasOtherText) {
        showMessage(
          message,
          "error",
          "Please select at least one requested academic accommodation or describe another accommodation request."
        );
        return;
      }
    }

    const nextState = {
      registrationComplete: true,
      documentationStatus: hasUpload ? "uploaded" : "pending",
      submittedToQueue: true
    };

    const registrationData = {
      requestType: requestType ? requestType.value : "",
      disabilityType: document.getElementById("registration-disability-type")?.value || "",
      academicImpact: document.getElementById("registration-academic-impact")?.value.trim() || "",
      dailyLifeImpact: document.getElementById("registration-daily-life-impact")?.value.trim() || "",
      priorAccommodations: document.getElementById("registration-prior-accommodations")?.value || "",
      priorAccommodationsDetails:
        document.getElementById("registration-prior-accommodations-details")?.value.trim() || "",
      requestedAccommodations: getRequestedAccommodationSelections().map((checkbox) => checkbox.value),
      requestedAccommodationsOther:
        document.getElementById("registration-requested-accommodations-other")?.value.trim() || ""
    };

    setRegistrationState(nextState);
    addStudentToAsaQueue(registrationData);

    form.reset();

    window.setTimeout(() => {
      clearMessage(message);
      showAcknowledgment(acknowledgment);
      window.scrollTo({ top: 0, behavior: "smooth" });
      syncConditionalFields();
    }, 0);
  });
}