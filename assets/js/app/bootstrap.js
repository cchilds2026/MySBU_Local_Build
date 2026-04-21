import { initIncludes } from "../core/include.js";
import { bindContacts } from "../modules/contact-bindings.js";
import { initAccordions } from "../modules/accordions.js";
import { initTabs } from "../modules/tabs.js";
import { pageRegistry } from "./page-registry.js";

function getCurrentPageKey() {
  if (document.body?.dataset?.page) {
    return document.body.dataset.page;
  }

  const pageRoot = document.querySelector("[data-page]");
  return pageRoot?.dataset?.page || "";
}

export async function bootstrapApp() {
  await initIncludes();

  bindContacts();
  initAccordions();
  initTabs();

  const pageKey = getCurrentPageKey();
  const pageInitializer = pageRegistry[pageKey];

  if (typeof pageInitializer === "function") {
    await pageInitializer();
  }
}