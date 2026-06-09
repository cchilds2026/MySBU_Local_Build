import {
  getDocumentationRecords,
  setDocumentationRecords
} from "../core/state.js";

const demoPdfDataUrl =
  "data:application/pdf;base64,JVBERi0xLjQKJcfsj6IKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA5NCA+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjcyIDcyMCBUZAooUHJvdmlkZXIgRG9jdW1lbnRhdGlvbiBQcmV2aWV3KSBUagowIDEgVGQKL0YxIDE0IFRmCihQcm90b3R5cGUgUERGIGZpbGUgZm9yIGJyb3dzZXIgcHJldmlldy4pIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKNSAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL0Jhc2VGb250IC9IZWx2ZXRpY2EgPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwMDYwIDAwMDAwIG4gCjAwMDAwMDAxMTcgMDAwMDAgbi AKMDAwMDAwMDI0MyAwMDAwMCBuIAowMDAwMDAwMzg4IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKNDU4CiUlRU9G";

const defaultDocumentationRecords = [
  {
    id: "doc-provider-demo",
    documentationType: "Provider Letter",
    fileName: "provider-documentation.pdf",
    mimeType: "application/pdf",
    uploadedAt: "03/28/2026",
    status: "On File",
    notes: "",
    studentName: "Student Name",
    studentId: "900123456",
    studentEmail: "student@sbu.edu",
    fileDataUrl: demoPdfDataUrl
  },
  {
    id: "doc-housing-demo",
    documentationType: "Housing Support Documentation",
    fileName: "housing-support-documentation.pdf",
    mimeType: "application/pdf",
    uploadedAt: "04/02/2026",
    status: "Received",
    notes: "",
    studentName: "Student Name",
    studentId: "900123456",
    studentEmail: "student@sbu.edu",
    fileDataUrl: demoPdfDataUrl
  }
];

let activePreviewUrl = null;

function ensureSeedData() {
  const existing = getDocumentationRecords();

  if (Array.isArray(existing) && existing.length > 0) {
    return existing;
  }

  setDocumentationRecords(defaultDocumentationRecords);
  return defaultDocumentationRecords;
}

function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "on file") return "status-badge status-badge--success";
  if (normalized === "received") return "status-badge status-badge--pending";
  return "status-badge";
}

function revokeActivePreviewUrl() {
  if (activePreviewUrl) {
    URL.revokeObjectURL(activePreviewUrl);
    activePreviewUrl = null;
  }
}

function dataUrlToObjectUrl(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    return "";
  }

  const [metadata, base64Data] = dataUrl.split(",");
  if (!metadata || !base64Data) {
    return "";
  }

  const mimeMatch = metadata.match(/^data:(.*?);base64$/);
  const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";

  const binaryString = window.atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

function getPreviewUrl(record) {
  revokeActivePreviewUrl();

  if (!record?.fileDataUrl) {
    return "";
  }

  if (record.fileDataUrl.startsWith("data:")) {
    activePreviewUrl = dataUrlToObjectUrl(record.fileDataUrl);
    return activePreviewUrl;
  }

  return record.fileDataUrl;
}

function renderDocumentationDetail(record, container) {
  if (!container || !record) return;

  const previewUrl = getPreviewUrl(record);

  container.hidden = false;
  container.innerHTML = `
    <section class="letter-preview" aria-labelledby="student-document-preview-title">
      <div class="letter-preview__header">
        <div>
          <h3 id="student-document-preview-title" class="letter-preview__title">
            ${record.fileName}
          </h3>
          <p class="letter-preview__meta">
            ${record.documentationType} · Uploaded ${record.uploadedAt}
          </p>
        </div>

        <span class="${getStatusClass(record.status)}">${record.status}</span>
      </div>

      <div class="letter-preview__document">
        <div class="letter-preview__document-meta">
          <p><strong>Student:</strong> ${record.studentName}</p>
          <p><strong>SBU ID:</strong> ${record.studentId}</p>
          <p><strong>Student Email:</strong> ${record.studentEmail}</p>
          <p><strong>Documentation Type:</strong> ${record.documentationType}</p>
          <p><strong>File Name:</strong> ${record.fileName}</p>
          <p><strong>Uploaded:</strong> ${record.uploadedAt}</p>
        </div>

        ${
          record.notes
            ? `
          <div class="letter-preview__notes">
            <h4>Submitted Notes</h4>
            <p>${record.notes}</p>
          </div>
        `
            : ""
        }

        <div class="document-preview-frame">
          ${
            previewUrl
              ? `
            <iframe
              class="document-preview-frame__viewer"
              src="${previewUrl}"
              title="PDF preview for ${record.fileName}"
            ></iframe>
          `
              : `
            <p>Preview unavailable for this file.</p>
          `
          }
        </div>
      </div>
    </section>
  `;
}

function renderDocumentationList(records, listContainer, detailContainer) {
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
        <strong>${record.fileName}</strong>
        <p>${record.documentationType} · Uploaded ${record.uploadedAt}</p>
      </span>
      <span class="${getStatusClass(record.status)}">${record.status}</span>
    `;

    button.addEventListener("click", () => {
      listContainer
        .querySelectorAll(".record-row--interactive")
        .forEach((row) => row.setAttribute("aria-pressed", "false"));

      button.setAttribute("aria-pressed", "true");
      renderDocumentationDetail(record, detailContainer);
    });

    listContainer.appendChild(button);
  });

  if (records[0]) {
    renderDocumentationDetail(records[0], detailContainer);
  }
}

export function initStudentDocumentRecords() {
  const listContainer = document.getElementById("student-document-record-list");
  const detailContainer = document.getElementById("student-document-detail");

  if (!listContainer || !detailContainer) return;

  const records = ensureSeedData()
    .slice()
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  renderDocumentationList(records, listContainer, detailContainer);

  window.addEventListener("beforeunload", revokeActivePreviewUrl, { once: true });
}