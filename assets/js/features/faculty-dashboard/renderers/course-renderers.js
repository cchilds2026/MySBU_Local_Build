import { getStatusClass } from "./ui-core.js";

export function renderCourseContext(course, element) {
  if (!element) return;

  if (!course) {
    element.innerHTML = `
      <div class="faculty-context-banner faculty-context-banner--empty">
        No course selected.
      </div>
    `;
    return;
  }

  element.innerHTML = `
    <div class="faculty-context-banner">
      Showing records for <strong>${course.code}: ${course.title}</strong> · ${course.semester}
    </div>
  `;
}

export function renderAllCourseContexts(course) {
  renderCourseContext(course, document.getElementById("faculty-course-context-letters"));
  renderCourseContext(course, document.getElementById("faculty-course-context-exams"));
  renderCourseContext(course, document.getElementById("faculty-course-context-uploaded"));
  renderCourseContext(course, document.getElementById("faculty-course-context-preferences"));

  const selectionBanner = document.getElementById("faculty-course-selection-banner");
  if (!selectionBanner) return;

  selectionBanner.textContent = course
    ? `Selected course: ${course.code}: ${course.title}. The other faculty tabs are now unlocked.`
    : "Select a course to unlock the rest of the faculty dashboard.";
}

export function renderCourses({
  panel,
  selectedCourseId,
  facultyCourses,
  onSelect
}) {
  const courseList = panel.querySelector("#faculty-course-list");
  if (!courseList) return;

  courseList.innerHTML = "";

  facultyCourses.forEach((course) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "record-row record-row--interactive faculty-course-card";
    button.setAttribute("aria-pressed", String(selectedCourseId === course.id));

    if (selectedCourseId === course.id) {
      button.classList.add("faculty-course-card--selected");
    }

    button.innerHTML = `
      <span>
        <strong>${course.code}: ${course.title}</strong>
        <p>${course.semester} · ${course.enrollment} enrolled students</p>
      </span>
      <span class="${getStatusClass(course.status)}">${course.status}</span>
    `;

    button.addEventListener("click", () => onSelect(course.id));

    courseList.appendChild(button);
  });
}