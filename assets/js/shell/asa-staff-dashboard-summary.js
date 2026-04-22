function activateTabById(targetId) {
  if (!targetId) return;

  const targetPanel = document.getElementById(targetId);
  if (!targetPanel) return;

  const tabPanel = targetPanel.closest(".tab-panel");
  if (!tabPanel) return;

  const tabButtons = tabPanel.querySelectorAll(".tab-panel__tab");
  const tabContents = tabPanel.querySelectorAll(".tab-panel__content");

  tabButtons.forEach((button) => {
    const buttonTargetId = button.getAttribute("data-tab-target");
    const isActive = buttonTargetId === targetId;

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });

  tabContents.forEach((content) => {
    const isActive = content.id === targetId;
    content.classList.toggle("is-active", isActive);
    content.hidden = !isActive;
  });

  targetPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function initAsaStaffDashboardSummary() {
  const summaryButtons = document.querySelectorAll("[data-summary-target]");

  summaryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-summary-target");
      activateTabById(targetId);
    });
  });
}