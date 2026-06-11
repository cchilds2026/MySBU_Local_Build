import { getDepartmentById } from "../data/departments/index.js";
import { escapeAttribute, escapeHtml } from "./html.js";

function renderServiceCard(service) {
  const department = getDepartmentById(service.departmentId);
  const departmentName = department?.shortName || service.departmentId.toUpperCase();
  const keywords = Array.isArray(service.keywords) ? service.keywords.slice(0, 5) : [];

  return `
    <article class="service-card" data-service-id="${escapeAttribute(service.id)}">
      <div class="service-card__header">
        <span class="status-badge">${escapeHtml(departmentName)}</span>
        <span class="status-badge status-badge--pending">${escapeHtml(service.serviceType)}</span>
      </div>

      <h3>${escapeHtml(service.title)}</h3>
      <p>${escapeHtml(service.summary)}</p>

      <dl class="service-card__meta">
        <div>
          <dt>Category</dt>
          <dd>${escapeHtml(service.category)}</dd>
        </div>
        <div>
          <dt>Fulfillment</dt>
          <dd>${escapeHtml(service.fulfillmentModel)}</dd>
        </div>
        <div>
          <dt>Sitefinity route</dt>
          <dd><code>${escapeHtml(service.sitefinityPath)}</code></dd>
        </div>
      </dl>

      <ul class="service-card__keywords" aria-label="Search keywords">
        ${keywords.map((keyword) => `<li>${escapeHtml(keyword)}</li>`).join("")}
      </ul>
    </article>
  `;
}

export function renderServiceCatalog(container, services) {
  if (!container) return;

  if (!Array.isArray(services) || !services.length) {
    container.innerHTML = `<div class="faculty-empty-state">No services match the current filter.</div>`;
    return;
  }

  container.innerHTML = services.map(renderServiceCard).join("");
}
