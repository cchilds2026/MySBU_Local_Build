export function initHomeRouting() {
  const asaStaffPortalLink = document.getElementById("asa-staff-portal-link");
  const demoToggleButton = document.getElementById("home-demo-toggle");

  if (!asaStaffPortalLink || !demoToggleButton) return;

  const STORAGE_KEY = "mysbuHomeDemoVisible";

  let isDemoVisible = sessionStorage.getItem(STORAGE_KEY) === "true";

  function renderDemoState() {
    asaStaffPortalLink.hidden = !isDemoVisible;
    asaStaffPortalLink.setAttribute("aria-hidden", String(!isDemoVisible));

    demoToggleButton.textContent = isDemoVisible
      ? "Hide Demo Portal"
      : "Show Demo Portal";

    demoToggleButton.setAttribute("aria-pressed", String(isDemoVisible));
  }

  demoToggleButton.addEventListener("click", () => {
    isDemoVisible = !isDemoVisible;
    sessionStorage.setItem(STORAGE_KEY, String(isDemoVisible));
    renderDemoState();
  });

  renderDemoState();
}