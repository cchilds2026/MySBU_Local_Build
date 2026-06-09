import { portalApi } from "../../services/portal-api.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function formatStatusLabel(status) {
  return String(status || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "published") {
    return "status-badge status-badge--success";
  }

  if (normalized === "draft") {
    return "status-badge status-badge--pending";
  }

  return "status-badge";
}

function getElement(id) {
  return document.getElementById(id);
}

function getFormPayload() {
  return {
    title: getElement("asa-resource-title")?.value.trim() || "",
    description: getElement("asa-resource-description")?.value.trim() || "",
    category: getElement("asa-resource-category")?.value.trim() || "",
    audience: getElement("asa-resource-audience")?.value || "student",
    file_name: getElement("asa-resource-file-name")?.value.trim() || "",
    storage_path: getElement("asa-resource-storage-path")?.value.trim() || "",
    mime_type: getElement("asa-resource-mime-type")?.value.trim() || "",
    sort_order: getElement("asa-resource-sort-order")?.value || "0"
  };
}

function setFormPayload(resource) {
  getElement("asa-resource-title").value = resource.title || "";
  getElement("asa-resource-description").value = resource.description || "";
  getElement("asa-resource-category").value = resource.category || "";
  getElement("asa-resource-audience").value = resource.audience || "student";
  getElement("asa-resource-file-name").value = resource.file_name || "";
  getElement("asa-resource-storage-path").value = resource.storage_path || "";
  getElement("asa-resource-mime-type").value = resource.mime_type || "";
  getElement("asa-resource-sort-order").value = resource.sort_order ?? 0;
}

function showMessage(type, text) {
  const message = getElement("asa-resource-admin-message");
  if (!message) return;

  message.hidden = false;
  message.className = `form-message form-message--${type}`;
  message.textContent = text;
}

function hideMessage() {
  const message = getElement("asa-resource-admin-message");
  if (!message) return;

  message.hidden = true;
  message.className = "form-message";
  message.textContent = "";
}

function renderEmpty(container, message) {
  container.innerHTML = `
    <div class="faculty-empty-state">
      ${escapeHtml(message)}
    </div>
  `;
}

function renderResourceList(container, resources) {
  if (!Array.isArray(resources) || resources.length === 0) {
    renderEmpty(container, "No ASA resources have been created yet.");
    return;
  }

  container.innerHTML = resources
    .map((resource) => {
      const resourceId = escapeAttribute(resource.resource_id);
      const title = escapeHtml(resource.title || "Untitled resource");
      const status = escapeHtml(formatStatusLabel(resource.status || "draft"));
      const category = escapeHtml(resource.category || "Uncategorized");
      const audience = escapeHtml(resource.audience || "student");
      const sortOrder = escapeHtml(resource.sort_order ?? 0);
      const fileName = escapeHtml(resource.file_name || "No file name");
      const description = escapeHtml(resource.description || "");
      const storagePath = escapeAttribute(resource.storage_path || "#");
      const statusClass = getStatusClass(resource.status);

      return `
        <article class="asa-resource-admin-row">
          <div class="asa-resource-admin-row__main">
            <div class="asa-resource-admin-row__topline">
              <strong>${title}</strong>
              <span class="${statusClass}">
                ${status}
              </span>
            </div>

            <p class="asa-resource-admin-row__meta">
              ${category} · Audience: ${audience} · Sort: ${sortOrder}
            </p>

            <p class="asa-resource-admin-row__summary">
              ${fileName}
            </p>

            ${
              description
                ? `<p class="asa-resource-admin-row__summary">${description}</p>`
                : ""
            }
          </div>

          <div class="asa-resource-admin-row__actions">
            <button
              type="button"
              class="button-secondary button-secondary--small"
              data-resource-action="edit"
              data-resource-id="${resourceId}"
            >
              Edit
            </button>

            <button
              type="button"
              class="button-secondary button-secondary--small"
              data-resource-action="publish"
              data-resource-id="${resourceId}"
              ${resource.status === "published" ? "disabled" : ""}
            >
              Publish
            </button>

            <button
              type="button"
              class="button-secondary button-secondary--small"
              data-resource-action="archive"
              data-resource-id="${resourceId}"
              ${resource.status === "archived" ? "disabled" : ""}
            >
              Archive
            </button>

            <a
              class="button-secondary button-secondary--small"
              href="${storagePath}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open File
            </a>
          </div>
        </article>
      `;
    })
    .join("");
}

export function initAsaResourceAdmin() {
  const panel = getElement("asa-resource-admin-panel");
  if (!panel) return;

  const form = getElement("asa-resource-admin-form");
  const list = getElement("asa-resource-admin-list");
  const resetButton = getElement("asa-resource-reset-button");
  const submitButton = getElement("asa-resource-submit-button");

  if (!form || !list || !resetButton || !submitButton) return;

  let resources = [];
  let editingResourceId = null;

  function resetForm() {
    form.reset();
    editingResourceId = null;
    submitButton.textContent = "Create Draft Resource";
    hideMessage();
  }

  async function loadResources() {
    renderEmpty(list, "Loading ASA resources...");

    try {
      resources = await portalApi.getAsaResourcesAdmin();
      renderResourceList(list, resources);
    } catch (error) {
      console.warn("Could not load ASA resources admin data.", error);

      resources = [];
      renderEmpty(
        list,
        "ASA Resource Manager could not load live data. Start the Flask API to manage resources."
      );
    }
  }

  function beginEdit(resourceId) {
    const resource = resources.find((item) => item.resource_id === resourceId);

    if (!resource) {
      showMessage("error", "Selected resource could not be found.");
      return;
    }

    editingResourceId = resourceId;
    setFormPayload(resource);
    submitButton.textContent = "Save Resource Changes";

    showMessage(
      "success",
      "Editing existing resource. Update the file name or storage path to swap in a newer file."
    );

    getElement("asa-resource-title")?.focus();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      showMessage("error", "Complete all required resource fields.");
      form.reportValidity();
      return;
    }

    const payload = getFormPayload();
    submitButton.disabled = true;

    try {
      if (editingResourceId) {
        await portalApi.updateAsaResource(editingResourceId, payload);
        showMessage("success", "ASA resource updated.");
      } else {
        await portalApi.createAsaResource(payload);
        showMessage("success", "ASA draft resource created.");
      }

      resetForm();
      await loadResources();
    } catch (error) {
      console.error("Resource save failed.", error);
      showMessage(
        "error",
        error.message || "Resource could not be saved. Confirm the Flask API is running."
      );
    } finally {
      submitButton.disabled = false;
    }
  });

  resetButton.addEventListener("click", resetForm);

  list.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-resource-action]");
    if (!button) return;

    const action = button.dataset.resourceAction;
    const resourceId = button.dataset.resourceId;

    if (!resourceId) return;

    if (action === "edit") {
      beginEdit(resourceId);
      return;
    }

    button.disabled = true;

    try {
      if (action === "publish") {
        await portalApi.publishAsaResource(resourceId);
        showMessage("success", "Resource published to the selected portal audience.");
      }

      if (action === "archive") {
        await portalApi.archiveAsaResource(resourceId);
        showMessage("success", "Resource archived and removed from public portal views.");
      }

      await loadResources();
    } catch (error) {
      console.error("Resource action failed.", error);
      showMessage(
        "error",
        error.message || "Resource action failed. Confirm the Flask API is running."
      );
    } finally {
      button.disabled = false;
    }
  });

  loadResources();
}