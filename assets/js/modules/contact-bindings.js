import { contacts } from "../data/contacts.js";

function getValue(path) {
  return path.split(".").reduce((acc, key) => acc?.[key], contacts);
}

export function bindContacts() {
  document.querySelectorAll("[data-contact-text]").forEach((node) => {
    const value = getValue(node.dataset.contactText);
    if (value) node.textContent = value;
  });

  document.querySelectorAll("[data-contact-email]").forEach((node) => {
    const value = getValue(node.dataset.contactEmail);
    if (value) {
      node.textContent = value;
      node.setAttribute("href", `mailto:${value}`);
    }
  });

  document.querySelectorAll("[data-contact-link]").forEach((node) => {
    const value = getValue(node.dataset.contactLink);
    if (value) node.setAttribute("href", value);
  });
}