import { renderDepartmentProfile } from "../components/department-profile.js";
import { renderServiceCatalog } from "../components/service-catalog.js";
import { departments, getDepartmentById } from "../data/departments/index.js";
import { getServicesByDepartment, searchServices } from "../data/service-catalog.js";

function getSelectedDepartmentId() {
  const select = document.getElementById("component-library-department-select");
  return select?.value || "asa";
}

function populateDepartmentSelect() {
  const select = document.getElementById("component-library-department-select");
  if (!select) return;

  select.innerHTML = departments
    .map(
      (department) => `
        <option value="${department.id}">
          ${department.shortName} - ${department.name}
        </option>
      `
    )
    .join("");

  select.value = "asa";
}

function renderShowcase() {
  const departmentId = getSelectedDepartmentId();
  const searchInput = document.getElementById("component-library-service-search");
  const department = getDepartmentById(departmentId);
  const profileContainer = document.getElementById("component-library-department-profile");
  const serviceContainer = document.getElementById("component-library-service-list");
  const searchTerm = searchInput?.value || "";

  const departmentServices = searchTerm
    ? searchServices(searchTerm).filter((service) => service.departmentId === departmentId)
    : getServicesByDepartment(departmentId);

  renderDepartmentProfile(profileContainer, department);
  renderServiceCatalog(serviceContainer, departmentServices);
}

export function initComponentLibraryShowcase() {
  const page = document.getElementById("component-library-page");
  if (!page) return;

  populateDepartmentSelect();
  renderShowcase();

  document
    .getElementById("component-library-department-select")
    ?.addEventListener("change", renderShowcase);

  document
    .getElementById("component-library-service-search")
    ?.addEventListener("input", renderShowcase);
}
