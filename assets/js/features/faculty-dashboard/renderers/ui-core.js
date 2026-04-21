export function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "read") {
    return "status-badge status-badge--read";
  }

  if (normalized === "no show") {
    return "status-badge status-badge--no-show";
  }

  if (
    normalized === "approved" ||
    normalized === "saved" ||
    normalized === "on file" ||
    normalized === "scheduled" ||
    normalized === "completed" ||
    normalized === "received"
  ) {
    return "status-badge status-badge--success";
  }

  if (
    normalized === "pending" ||
    normalized === "unread" ||
    normalized === "review"
  ) {
    return "status-badge status-badge--pending";
  }

  return "status-badge";
}

export function renderEmptyState(container, message) {
  if (!container) return;
  container.innerHTML = `<div class="faculty-empty-state">${message}</div>`;
}

export function setTabLockState(panel, isUnlocked) {
  const gatedTabs = panel.querySelectorAll('.tab-panel__tab[data-requires-course="true"]');

  gatedTabs.forEach((tab) => {
    tab.disabled = !isUnlocked;
    tab.setAttribute("aria-disabled", String(!isUnlocked));
  });
}

export function switchToTab(panel, targetId) {
  const tabButton = panel.querySelector(`.tab-panel__tab[data-tab-target="${targetId}"]`);
  const tabButtons = panel.querySelectorAll(".tab-panel__tab");
  const tabPanels = panel.querySelectorAll(".tab-panel__content");

  if (!tabButton || tabButton.disabled) return;

  tabButtons.forEach((button) => {
    const isActive = button === tabButton;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });

  tabPanels.forEach((tabPanel) => {
    const isActive = tabPanel.id === targetId;
    tabPanel.classList.toggle("is-active", isActive);
    tabPanel.hidden = !isActive;
  });
}

export function updateTabCounter(elementId, count) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = String(count);
  element.hidden = count < 1;
}