import { portalApi } from "../../services/portal-api.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

  if (normalized === "archived") {
    return "status-badge";
  }

  return "status-badge";
}

function getFormPayload() {
  return {
    title: document.getElementById("asa-resource-title").value.trim(),
    description: document.getElementById("asa-resource-description").value.trim(),
    category: document.getElementById("asa-resource-category").value.trim(),
    audience: document.getElementById("asa-resource-audience").value,
    file_name: document.getElementById("asa-resource-file-name").value.trim(),
    storage_path: document.getElementById("asa-resource-storage-path").value.trim(),
    mime_type: document.getElementById("asa-resource-mime-type").value.trim(),
    sort_order: document.getElementById("asa-resource-sort-order").value
  };
}

function setFormPayload(resource) {
  document.getElementById("asa-resource-title").value = resource.title || "";
  document.getElementById("asa-resource-description").value = resource.description || "";
  document.getElementById("asa-resource-category").value = resource.category || "";
  document.getElementById("asa-resource-audience").value = resource.audience || "student";
  document.getElementById("asa-resource-file-name").value = resource.file_name || "";
  document.getElementById("asa-resource-storage-path").value = resource.storage_path || "";
  document.getElementById("asa-resource-mime-type").value = resource.mime_type || "";
  document.getElementById("asa-resource-sort-order").value = resource.sort_order ?? 0;
}

function showMessage(type, text) {
  const message = document.getElementById("asa-resource-admin-message");
  if (!message) return;

  message.hidden = false;
  message.className = `form-message form-message--${type}`;
  message.textContent = text;
}

function hideMessage() {
  const message = document.getElementById("asa-resource-admin-message");
  if (!message) return;

  message.hidden = true;
  message.textContent = "";
  message.className = "form-message";
}

function renderResourceList(container, resources) {
  if (!resources.length) {
    container.innerHTML = `
      <div class="faculty-empty-state">
        No ASA resources have been created yet.
      </div>
    `;
    return;
  }

  container.innerHTML = resources
    .map(
      (resource) => `
        <article class="asa-resource-admin-row">
          <div class="asa-resource-admin-row__main">
            <div class="asa-resource-admin-row__topline">
              <strong>${escapeHtml(resource.title)}</strong>
              <span class="${getStatusClass(resource.status)}">
                ${escapeHtml(formatStatusLabel(resource.status))}
              </span>
            </div>

            <p class="asa-resource-admin-row__meta">
              ${escapeHtml(resource.category)}
              · Audience: ${escapeHtml(resource.audience)}
              · Sort: ${escapeHtml(resource.sort_order)}
            </p>

            <p class="asa-resource-admin-row__summary">
              ${escapeHtml(resource.file_name)}
            </p>

            ${
              resource.description
                ? `<p class="asa-resource-admin-row__summary">${escapeHtml(resource.description)}</p>`
                : ""
            }
          </div>

          <div class="asa-resource-admin-row__actions">
            <button
              type="button"
              class="button-secondary button-secondary--small"
              data-resource-action="edit"
              data-resource-id="${escapeHtml(resource.resource_id)}"
            >
              Edit
            </button>

            <button
              type="button"
              class="button-secondary button-secondary--small"
              data-resource-action="publish"
              data-resource-id="${escapeHtml(resource.resource_id)}"
              ${resource.status === "published" ? "disabled" : ""}
            >
              Publish
            </button>

            <button
              type="button"
              class="button-secondary button-secondary--small"
              data-resource-action="archive"
              data-resource-id="${escapeHtml(resource.resource_id)}"
              ${resource.status === "archived" ? "disabled" : ""}
            >
              Archive
            </button>

            <a
              class="button-secondary button-secondary--small"
              href="${escapeHtml(resource.storage_path)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open File
            </a>
          </div>
        </article>
      `
    )
    .join("");
}

export function initAsaResourceAdmin() {
  const panel = document.getElementById("asa-resource-admin-panel");
  if (!panel) return;

  const form = document.getElementById("asa-resource-admin-form");
  const list = document.getElementById("asa-resource-admin-list");
  const resetButton = document.getElementById("asa-resource-reset-button");
  const submitButton = document.getElementById("asa-resource-submit-button");

  let resources = [];
  let editingResourceId = null;

  function resetForm() {
    form.reset();
    editingResourceId = null;
    submitButton.textContent = "Create Draft Resource";
    hideMessage();
  }

  async function loadResources() {
    list.innerHTML = `
      <div class="faculty-empty-state">
        Loading ASA resources...
      </div>
    `;

    resources = await portalApi.getAsaResourcesAdmin();
    renderResourceList(list, resources);
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

    document.getElementById("asa-resource-title").focus();
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
      showMessage("error", error.message || "Resource could not be saved.");
    } finally {
      submitButton.disabled = false;
    }
  });

  resetButton.addEventListener("click", () => {
    resetForm();
  });

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
      showMessage("error", error.message || "Resource action failed.");
    } finally {
      button.disabled = false;
    }
  });

  loadResources().catch((error) => {
    showMessage("error", error.message || "ASA resources could not be loaded.");
  });
}