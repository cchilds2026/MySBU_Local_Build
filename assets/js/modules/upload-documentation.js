import {
  getDocumentationRecords,
  setDocumentationRecords
} from "../core/state.js";

function formatToday() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const year = today.getFullYear();
  return `${month}/${day}/${year}`;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read uploaded file."));
    reader.readAsDataURL(file);
  });
}

function upsertDocumentationRecord(nextRecord) {
  const existing = getDocumentationRecords();

  const merged = [nextRecord, ...existing].reduce((accumulator, record) => {
    const alreadyExists = accumulator.some(
      (item) =>
        item.fileName === record.fileName &&
        item.uploadedAt === record.uploadedAt
    );

    if (!alreadyExists) {
      accumulator.push(record);
    }

    return accumulator;
  }, []);

  setDocumentationRecords(merged);
}

function getSelectedTypeLabel(selectElement) {
  if (!selectElement || selectElement.selectedIndex < 0) return "";
  return selectElement.options[selectElement.selectedIndex].text.trim();
}

export function initUploadDocumentationForm() {
  const form = document.getElementById("upload-documentation-form");
  if (!form) return;

  const message = document.getElementById("upload-documentation-message");
  const fileInput = document.getElementById("documentation-file");
  const typeSelect = document.getElementById("documentation-type");
  const notesField = document.getElementById("documentation-notes");

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

  if (fileInput) {
    fileInput.setAttribute("accept", "application/pdf");
  }

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      clearMessage();
    }, 0);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    if (!form.checkValidity()) {
      showMessage("error", "Please complete all required fields before submitting your documentation.");
      form.reportValidity();
      return;
    }

    const file = fileInput?.files?.[0];

    if (!file) {
      showMessage("error", "Please choose a PDF file to upload.");
      return;
    }

    if (file.type !== "application/pdf") {
      showMessage("error", "For this prototype, please upload a PDF file.");
      return;
    }

    try {
      const fileDataUrl = await readFileAsDataUrl(file);

      const record = {
        id: `doc-${slugify(file.name)}-${Date.now()}`,
        documentationType: getSelectedTypeLabel(typeSelect),
        fileName: file.name,
        mimeType: file.type,
        uploadedAt: formatToday(),
        status: "On File",
        notes: notesField?.value?.trim() || "",
        studentName: document.getElementById("upload-student-name")?.value || "Student Name",
        studentId: document.getElementById("upload-student-id")?.value || "900123456",
        studentEmail: document.getElementById("upload-student-email")?.value || "student@sbu.edu",
        fileDataUrl
      };

      upsertDocumentationRecord(record);

      showMessage(
        "success",
        "Your documentation has been uploaded and is now available in the Documentation tab."
      );

      form.reset();
    } catch (error) {
      showMessage("error", "The uploaded PDF could not be processed for preview.");
    }
  });
}