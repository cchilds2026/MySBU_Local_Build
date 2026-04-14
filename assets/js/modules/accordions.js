export function initAccordions() {
  const triggers = document.querySelectorAll("[data-accordion] .accordion-trigger");

  triggers.forEach((button) => {
    button.addEventListener("click", () => {
      const panelId = button.getAttribute("aria-controls");
      const panel = document.getElementById(panelId);
      if (!panel) return;

      const isExpanded = button.getAttribute("aria-expanded") === "true";
      const nextExpanded = !isExpanded;

      button.setAttribute("aria-expanded", String(nextExpanded));

      if (nextExpanded) {
        panel.hidden = false;
        requestAnimationFrame(() => {
          panel.classList.add("is-open");
        });
      } else {
        panel.classList.remove("is-open");
        panel.hidden = true;
      }
    });
  });
}