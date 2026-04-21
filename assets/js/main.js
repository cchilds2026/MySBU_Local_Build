import { initPortalShell } from "./shell/portal-shell.js";
import { initPageModules } from "./shell/page-module-router.js";

async function loadIncludes() {
  const includeNodes = document.querySelectorAll("[data-include]");

  await Promise.all(
    Array.from(includeNodes).map(async (node) => {
      const relativeUrl = node.getAttribute("data-include");
      if (!relativeUrl) return;

      try {
        const resolvedUrl = new URL(relativeUrl, window.location.href).toString();
        const response = await fetch(resolvedUrl);

        if (!response.ok) {
          throw new Error(`Failed include: ${resolvedUrl} (${response.status})`);
        }

        node.innerHTML = await response.text();
      } catch (error) {
        console.error("Include load failed:", error);
      }
    })
  );
}

async function init() {
  await loadIncludes();
  const user = await initPortalShell();
  initPageModules(user);
}

init().catch((error) => {
  console.error("Application bootstrap failed:", error);
});