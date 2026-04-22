function getCurrentStaffNavHref() {
  const page = document.body?.dataset?.page || "";

  if (page === "asa-staff-portal") {
    return "/pages/asa-staff-portal.html";
  }

  if (page === "asa-student-directory" || page === "asa-student-record") {
    return "/pages/asa-student-directory.html";
  }

  if (page === "asa-exam-operations") {
    return "/pages/asa-exam-operations.html";
  }

  if (page === "asa-staff-access") {
    return "/pages/asa-staff-access.html";
  }

  return "";
}

function updateUtilityNav(activeHref) {
  const navLinks = document.querySelectorAll(
    '.staff-toolbar a[href^="/pages/"]'
  );

  if (!navLinks.length || !activeHref) return;

  navLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const isActive = href === activeHref;

    link.classList.remove("button-primary", "button-secondary");
    link.classList.add(isActive ? "button-primary" : "button-secondary");
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

function updateSidebarNav(activeHref) {
  const sidebarLinks = document.querySelectorAll(
    '.resources-card a[href^="/pages/"]'
  );

  if (!sidebarLinks.length || !activeHref) return;

  sidebarLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const isActive = href === activeHref;

    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

export function initAsaStaffUtilityNav() {
  const activeHref = getCurrentStaffNavHref();
  if (!activeHref) return;

  updateUtilityNav(activeHref);
  updateSidebarNav(activeHref);
}