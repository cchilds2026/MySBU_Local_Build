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

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function renderEmpty(container, message) {
  container.innerHTML = `
    <div class="faculty-empty-state">
      ${escapeHtml(message)}
    </div>
  `;
}

function renderResources(container, resources) {
  if (!Array.isArray(resources) || resources.length === 0) {
    renderEmpty(container, "No ASA resources are currently published for this portal.");
    return;
  }

  container.innerHTML = resources
    .map((resource) => {
      const title = escapeHtml(resource.title || "Untitled resource");
      const category = escapeHtml(resource.category || "Resource");
      const description = escapeHtml(resource.description || "");
      const fileName = escapeHtml(resource.file_name || "Downloadable file");
      const storagePath = escapeAttribute(resource.storage_path || "#");
      const updatedAt = escapeHtml(formatDate(resource.updated_at));

      return `
        <article class="asa-resource-card">
          <div class="asa-resource-card__body">
            <div class="asa-resource-card__topline">
              <span class="status-badge">${category}</span>
              <span class="asa-resource-card__date">
                Updated ${updatedAt}
              </span>
            </div>

            <h3 class="asa-resource-card__title">${title}</h3>

            ${
              description
                ? `<p class="asa-resource-card__description">${description}</p>`
                : ""
            }

            <p class="asa-resource-card__filename">
              ${fileName}
            </p>
          </div>

          <div class="asa-resource-card__actions">
            <a
              class="button-secondary button-secondary--small"
              href="${storagePath}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open / Download
            </a>
          </div>
        </article>
      `;
    })
    .join("");
}

export async function initAsaPublicResources(audience) {
  const containers = Array.from(
    document.querySelectorAll("[data-asa-resource-list]")
  ).filter((container) => container.dataset.audience === audience);

  if (!containers.length) return;

  containers.forEach((container) => {
    renderEmpty(container, "Loading ASA resources...");
  });

  try {
    const resources = await portalApi.getPublishedAsaResources({ audience });

    containers.forEach((container) => {
      renderResources(container, resources);
    });
  } catch (error) {
    console.warn("ASA public resources could not be loaded.", error);

    containers.forEach((container) => {
      renderEmpty(
        container,
        "ASA resources could not be loaded. Start the Flask API to view live resource data."
      );
    });
  }
}