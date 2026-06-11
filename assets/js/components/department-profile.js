import { escapeHtml } from "./html.js";

function renderList(items = []) {
  if (!items.length) return "";

  return `
    <ul class="component-tag-list">
      ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function renderContacts(contacts = []) {
  if (!contacts.length) return "";

  return contacts
    .map(
      (contact) => `
        <article class="contact-card component-showcase-card">
          <h3>${escapeHtml(contact.label)}</h3>
          <p>${escapeHtml(contact.location || "")}</p>
          <p><a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></p>
          <p>${escapeHtml(contact.phone || "")}</p>
        </article>
      `
    )
    .join("");
}

export function renderDepartmentProfile(container, department) {
  if (!container || !department) return;

  container.innerHTML = `
    <section class="component-showcase-panel">
      <p class="eyebrow">Department profile</p>
      <h2>${escapeHtml(department.name)}</h2>
      <p class="component-showcase-lede">
        ${escapeHtml(department.chatbotSummary)}
      </p>

      <div class="component-showcase-grid">
        <article class="component-showcase-card">
          <h3>Audiences</h3>
          ${renderList(department.audiences)}
        </article>

        <article class="component-showcase-card">
          <h3>Service categories</h3>
          ${renderList(department.serviceCategories)}
        </article>

        <article class="component-showcase-card">
          <h3>Reusable components</h3>
          ${renderList(department.reusableComponents)}
        </article>

        <article class="component-showcase-card">
          <h3>Custom workflows</h3>
          ${renderList(department.customWorkflows)}
        </article>
      </div>

      <div class="component-showcase-grid component-showcase-grid--contacts">
        ${renderContacts(department.contacts)}
      </div>
    </section>
  `;
}
