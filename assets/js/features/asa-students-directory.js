import { portalApi } from "../services/portal-api.js";

function renderEmptyState(container, message) {
  if (!container) return;
  container.innerHTML = `<div class="faculty-empty-state">${message}</div>`;
}

function getDirectoryStatus(student) {
  if (student.student_registration_complete) {
    return "Registered";
  }

  if (Number(student.registration_request_count || 0) > 0) {
    return "In Progress";
  }

  return "No Request";
}

export async function initAsaStudentsDirectory() {
  const listContainer = document.getElementById("asa-staff-student-list");
  if (!listContainer) return;

  try {
    const students = await portalApi.getStudentsDirectory();

    if (!students.length) {
      renderEmptyState(listContainer, "No students found.");
      return;
    }

    listContainer.innerHTML = "";

    students.forEach((student) => {
      const link = document.createElement("a");
      link.className = "record-row record-row--interactive";
      link.href = `/pages/asa-student-record.html?student_id=${encodeURIComponent(student.student_id)}`;

      link.innerHTML = `
        <span>
          <strong>${student.first_name} ${student.last_name}</strong>
          <p>
            ${student.email || "No email"} · Requests ${student.registration_request_count || 0}
          </p>
        </span>
        <span class="status-badge">${getDirectoryStatus(student)}</span>
      `;

      listContainer.appendChild(link);
    });
  } catch (error) {
    renderEmptyState(listContainer, `Could not load students directory. ${error.message}`);
  }
}