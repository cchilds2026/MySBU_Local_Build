export function initTabs() {
  document.addEventListener("click", (event) => {
    const tabButton = event.target.closest(".tab-panel__tab");
    if (!tabButton) return;

    const tabPanel = tabButton.closest(".tab-panel");
    const tabList = tabButton.closest(".tab-panel__tabs");
    if (!tabPanel || !tabList) return;

    const targetId = tabButton.getAttribute("data-tab-target");
    if (!targetId) return;

    const buttons = tabList.querySelectorAll(".tab-panel__tab");
    const panels = tabPanel.querySelectorAll(".tab-panel__content");

    buttons.forEach((button) => {
      const isActive = button === tabButton;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach((panel) => {
      const isActive = panel.id === targetId;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  });
}