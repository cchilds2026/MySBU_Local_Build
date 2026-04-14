import { getStaffAllowlist, setStaffAllowlist, getPrototypeUser } from "../core/state.js";

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

export function initAsaStaffAccessForm() {
  const form = document.getElementById("asa-staff-access-form");
  const list = document.getElementById("asa-staff-access-list");
  if (!form || !list) return;

  const message = document.getElementById("asa-staff-access-message");
  const acknowledgment = document.getElementById("asa-access-acknowledgment");
  const currentUser = getPrototypeUser();

  function renderStaffAllowlist() {
    const allowlist = getStaffAllowlist();

    list.innerHTML = allowlist
      .map((user) => {
        const disableRemove = user.email.toLowerCase() === currentUser.email.toLowerCase();

        return `
          <article class="staff-access-row">
            <div>
              <strong>${user.name}</strong>
              <p>${user.email} · Equal staff privileges</p>
            </div>
            <button
              class="button-secondary"
              type="button"
              data-remove-staff-email="${user.email}"
              ${disableRemove ? "disabled" : ""}
            >
              Remove
            </button>
          </article>
        `;
      })
      .join("");
  }

  renderStaffAllowlist();

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-staff-email]");
    if (!button) return;

    const email = button.getAttribute("data-remove-staff-email");
    if (!email) return;

    const nextAllowlist = getStaffAllowlist().filter(
      (user) => user.email.toLowerCase() !== email.toLowerCase()
    );

    setStaffAllowlist(nextAllowlist);
    renderStaffAllowlist();
    clearMessage(message);
    showAcknowledgment(acknowledgment);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      clearMessage(message);
      hideAcknowledgment(acknowledgment);
    }, 0);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    clearMessage(message);
    hideAcknowledgment(acknowledgment);

    if (!form.checkValidity()) {
      showMessage(message, "error", "Please complete all required fields before adding a new staff user.");
      form.reportValidity();
      return;
    }

    const nameField = document.getElementById("asa-access-name");
    const emailField = document.getElementById("asa-access-email");

    const name = nameField ? nameField.value.trim() : "";
    const email = emailField ? emailField.value.trim().toLowerCase() : "";

    if (!email.endsWith("@sbu.edu")) {
      showMessage(message, "error", "Please enter a valid SBU email address ending in @sbu.edu.");
      return;
    }

    const allowlist = getStaffAllowlist();
    const alreadyExists = allowlist.some((user) => user.email.toLowerCase() === email);

    if (alreadyExists) {
      showMessage(message, "error", "That user already has ASA staff access in the prototype allowlist.");
      return;
    }

    allowlist.push({
      name,
      email,
      accessLevel: "asa_staff"
    });

    setStaffAllowlist(allowlist);
    renderStaffAllowlist();

    form.reset();

    window.setTimeout(() => {
      clearMessage(message);
      showAcknowledgment(acknowledgment);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  });
}