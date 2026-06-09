import { portalApi } from "../../services/portal-api.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "Not published yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function renderEmpty(container, message) {
  container.innerHTML = `<div class="faculty-empty-state">${escapeHtml(message)}</div>`;
}

function renderResources(container, resources) {
  if (!resources.length) {
    renderEmpty(container, "No ASA resources are currently published for this portal.");
    return;
  }

  container.innerHTML = resources
    .map(
      (resource) => `
        <article class="asa-resource-card">
          <div class="asa-resource-card__body">
            <div class="asa-resource-card__topline">
              <span class="status-badge">${escapeHtml(resource.category)}</span>
              <span class="asa-resource-card__date">
                Updated ${escapeHtml(formatDate(resource.updated_at))}
              </span>
            </div>

            <h3 class="asa-resource-card__title">${escapeHtml(resource.title)}</h3>

            ${
              resource.description
                ? `<p class="asa-resource-card__description">${escapeHtml(resource.description)}</p>`
                : ""
            }

            <p class="asa-resource-card__filename">
              ${escapeHtml(resource.file_name)}
            </p>
          </div>

          <div class="asa-resource-card__actions">
            <a
              class="button-secondary button-secondary--small"
              href="${escapeHtml(resource.storage_path)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open / Download
            </a>
          </div>
        </article>
      `
    )
    .join("");
}

export async function initAsaPublicResources(audience) {
  const containers = document.querySelectorAll("[data-asa-resource-list]");
  const matchingContainers = Array.from(containers).filter(
    (container) => container.dataset.audience === audience
  );

  if (!matchingContainers.length) return;

  matchingContainers.forEach((container) => {
    renderEmpty(container, "Loading ASA resources...");
  });

  try {
    const resources = await portalApi.getPublishedAsaResources({ audience });

    matchingContainers.forEach((container) => {
      renderResources(container, resources);
    });
  } catch (error) {
    matchingContainers.forEach((container) => {
      renderEmpty(
        container,
        error.message || "ASA resources could not be loaded."
      );
    });
  }
}