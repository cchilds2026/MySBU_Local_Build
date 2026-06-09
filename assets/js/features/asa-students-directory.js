import { portalApi } from "../services/portal-api.js";

function renderEmptyState(container, message) {
  if (!container) return;
  container.innerHTML = `<div class="faculty-empty-state">${message}</div>`;
}

function getDirectoryStatus(student) {
  const lifecycleStatus = String(student.lifecycle_status || "active").toLowerCase();

  if (lifecycleStatus === "archived") {
    return "Archived";
  }

  if (student.student_registration_complete) {
    return "Registered";
  }

  if (Number(student.registration_request_count || 0) > 0) {
    return "In Progress";
  }

  return "No Request";
}

function getAcademicLevelLabel(student) {
  const academicLevel = String(student.academic_level || "undergraduate")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return academicLevel || "Undergraduate";
}

function buildStudentSearchText(student) {
  return [
    student.first_name || "",
    student.last_name || "",
    `${student.first_name || ""} ${student.last_name || ""}`.trim(),
    student.email || "",
    student.institution_student_id || ""
  ]
    .join(" ")
    .toLowerCase();
}

function filterStudents(students, searchTerm) {
  const normalizedSearch = String(searchTerm || "").trim().toLowerCase();
  if (!normalizedSearch) return students;

  return students.filter((student) =>
    buildStudentSearchText(student).includes(normalizedSearch)
  );
}

function renderDirectoryControls(listContainer, state, handlers) {
  let controls = document.getElementById("asa-student-directory-controls");

  if (!controls) {
    controls = document.createElement("div");
    controls.id = "asa-student-directory-controls";
    controls.className = "dashboard-section__header";
    listContainer.parentElement?.insertBefore(controls, listContainer);
  }

  controls.innerHTML = `
    <div>
      <h2>Student Directory</h2>
      <p class="modal-text">
        Student records for ASA staff review and lifecycle management.
      </p>
    </div>

    <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap; justify-content:flex-end;">
      <button
        type="button"
        class="${state.lifecycleStatus === "active" ? "button-primary" : "button-secondary"}"
        data-directory-view="active"
      >
        Active
      </button>

      <button
        type="button"
        class="${state.lifecycleStatus === "archived" ? "button-primary" : "button-secondary"}"
        data-directory-view="archived"
      >
        Archived
      </button>

      <input
        id="asa-directory-search"
        type="search"
        value="${state.searchTerm}"
        placeholder="Search by name, email, or SBU ID"
        aria-label="Search student directory"
        style="min-width: 260px;"
      />
    </div>
  `;

  controls.querySelectorAll("[data-directory-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextView = button.getAttribute("data-directory-view");
      if (!nextView || nextView === state.lifecycleStatus) return;
      handlers.onViewChange(nextView);
    });
  });

  const searchInput = controls.querySelector("#asa-directory-search");
  searchInput?.addEventListener("input", (event) => {
    handlers.onSearchChange(event.target.value || "");
  });
}

function buildStudentRow(student) {
  const status = getDirectoryStatus(student);
  const academicLevel = getAcademicLevelLabel(student);
  const archivedMeta =
    status === "Archived" && student.archive_delete_after_at
      ? ` · Retain until ${student.archive_delete_after_at}`
      : "";

  return `
    <a
      class="record-row record-row--interactive"
      href="/pages/asa-student-record.html?student_id=${encodeURIComponent(student.student_id)}"
    >
      <span>
        <strong>${student.first_name} ${student.last_name}</strong>
        <p>
          ${student.email || "No email"} · SBU ID ${student.institution_student_id || "Not available"} · ${academicLevel} · Requests ${student.registration_request_count || 0}${archivedMeta}
        </p>
      </span>
      <span class="status-badge">${status}</span>
    </a>
  `;
}

function renderStudentList(listContainer, state) {
  const filteredStudents = filterStudents(state.students, state.searchTerm);

  if (!filteredStudents.length) {
    renderEmptyState(
      listContainer,
      state.searchTerm.trim()
        ? "No students matched your search."
        : state.lifecycleStatus === "archived"
          ? "No archived students found."
          : "No active students found."
    );
    return;
  }

  listContainer.innerHTML = filteredStudents.map(buildStudentRow).join("");
}

async function loadDirectoryData(state) {
  state.students = await portalApi.getStudentsDirectory({
    lifecycle_status: state.lifecycleStatus
  });
}

export async function initAsaStudentsDirectory() {
  const listContainer = document.getElementById("asa-staff-student-list");
  if (!listContainer) return;

  const state = {
    lifecycleStatus: "active",
    searchTerm: "",
    students: []
  };

  async function refreshDirectory() {
    renderDirectoryControls(listContainer, state, {
      onViewChange: async (nextView) => {
        state.lifecycleStatus = nextView;
        state.searchTerm = "";
        await refreshDirectory();
      },
      onSearchChange: (nextSearch) => {
        state.searchTerm = nextSearch;
        renderStudentList(listContainer, state);
      }
    });

    try {
      await loadDirectoryData(state);
      renderStudentList(listContainer, state);
    } catch (error) {
      renderEmptyState(
        listContainer,
        `Could not load students directory. ${error.message}`
      );
    }
  }

  await refreshDirectory();
}