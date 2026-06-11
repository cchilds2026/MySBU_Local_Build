export function initAccordions(root = document) {
  const accordions = root.querySelectorAll("[data-accordion]");

  accordions.forEach((accordion) => {
    const triggers = accordion.querySelectorAll(".accordion-trigger");

    triggers.forEach((trigger) => {
      if (trigger.dataset.accordionInitialized === "true") return;

      const panelId = trigger.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;

      if (!panel) return;

      trigger.dataset.accordionInitialized = "true";

      trigger.addEventListener("click", () => {
        const isExpanded = trigger.getAttribute("aria-expanded") === "true";
        const nextExpanded = !isExpanded;

        trigger.setAttribute("aria-expanded", String(nextExpanded));
        panel.hidden = !nextExpanded;
      });
    });
  });
}
