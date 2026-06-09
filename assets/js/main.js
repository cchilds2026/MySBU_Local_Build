import { initIncludes } from "./core/include.js";
import { initPortalShell } from "./shell/portal-shell.js";
import { initPageModules } from "./shell/page-module-router.js";

async function init() {
  await initIncludes();
  const user = await initPortalShell();
  await initPageModules(user);
}

init().catch((error) => {
  console.error("Application bootstrap failed:", error);
});