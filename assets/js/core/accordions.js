function setAccordionState(trigger, panel, isExpanded) {
  const accordionItem = trigger.closest(".accordion-item");

  trigger.setAttribute("aria-expanded", String(isExpanded));
  panel.hidden = !isExpanded;
  panel.classList.toggle("is-open", isExpanded);

  if (accordionItem) {
    accordionItem.classList.toggle("is-open", isExpanded);
  }
}

export function initAccordions(root = document) {
  const accordions = root.querySelectorAll("[data-accordion]");

  accordions.forEach((accordion) => {
    const triggers = accordion.querySelectorAll(".accordion-trigger");

    triggers.forEach((trigger) => {
      if (trigger.dataset.accordionInitialized === "true") return;

      const panelId = trigger.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;

      if (!panel) return;

      const initiallyExpanded = trigger.getAttribute("aria-expanded") === "true";
      setAccordionState(trigger, panel, initiallyExpanded);

      trigger.dataset.accordionInitialized = "true";

      trigger.addEventListener("click", () => {
        const isExpanded = trigger.getAttribute("aria-expanded") === "true";
        setAccordionState(trigger, panel, !isExpanded);
      });
    });
  });
}
