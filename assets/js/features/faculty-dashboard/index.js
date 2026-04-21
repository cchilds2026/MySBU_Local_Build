import {
  createUploadedExam,
  fetchExamPreferenceBySection,
  fetchExamRequestDetail,
  fetchExamRequestsBySection,
  fetchUploadedExamsBySection,
  saveExamPreferenceBySection,
  submitExamFacultyResponse
} from "./api.js";

import {
  createFacultyDashboardState,
  getCourseById,
  getPreferenceByCourseId
} from "./state.js";

import {
  normalizeExamPreference,
  normalizeExamRequestDetail,
  normalizeExamRequestSummary,
  normalizeUploadedExamSummary
} from "./normalizers.js";

import { getCurrentFacultyCourses } from "./course-provider.js";
import { getCurrentFacultyLetters } from "./letter-provider.js";

import {
  getStatusClass,
  renderEmptyState,
  setTabLockState,
  switchToTab
} from "./renderers/ui-core.js";

import {
  renderAllCourseContexts,
  renderCourses
} from "./renderers/course-renderers.js";

import {
  buildLetterModalHtml,
  buildUploadedExamModalHtml,
  renderFacultyTabCounters,
  renderModalList,
  renderUploadedExamToolbar
} from "./renderers/record-renderers.js";

import { initReadOnlyModal } from "./modals/read-only-modal.js";
import { initFacultyUploadExamModal } from "./modals/upload-exam-modal.js";
import {
  buildPreferenceFormMarkup,
  initFacultyPreferenceModal
} from "./modals/preference-modal.js";
import { initFacultyExamModal } from "./modals/faculty-exam-modal.js";
import { renderPreferenceForm } from "./modals/preference-workflow.js";

export function initFacultyDashboard() {
  const panel = document.getElementById("faculty-dashboard-panel");
  if (!panel) return;

  const dashboardState = createFacultyDashboardState();

  const letterModal = initReadOnlyModal("faculty-letter-modal", "Accommodation Letter");
  const uploadedModal = initReadOnlyModal("faculty-uploaded-modal", "Uploaded Exam");

  const examModal = initFacultyExamModal({
    renderAll,
    fetchExamRequestDetail,
    normalizeExamRequestDetail,
    getPreferenceByCourseId: (courseId) =>
      getPreferenceByCourseId(dashboardState.facultyExamPreferencesCache, courseId),
    getStatusClass,
    submitExamFacultyResponse
  });

  const uploadExamModal = initFacultyUploadExamModal({
    renderAll,
    getSelectedCourseId: () => dashboardState.selectedCourseId,
    getCourseById: (courseId) => getCourseById(dashboardState.facultyCourses, courseId),
    facultyCourseSectionMap: Object.fromEntries(
      dashboardState.facultyCourses.map((course) => [course.id, course.sourceSectionId])
    ),
    createUploadedExam
  });

  const preferenceModal = initFacultyPreferenceModal();

  async function loadFacultyCourses() {
    dashboardState.facultyCourses = await getCurrentFacultyCourses();
  }

  async function loadFacultyLetters() {
    dashboardState.facultyLetters = await getCurrentFacultyLetters();
  }

  async function renderAll() {
    const selectedCourse = getCourseById(
      dashboardState.facultyCourses,
      dashboardState.selectedCourseId
    );

    setTabLockState(panel, Boolean(selectedCourse));
    renderAllCourseContexts(selectedCourse);
    renderUploadedExamToolbar(dashboardState.selectedCourseId, uploadExamModal);

    renderCourses({
      panel,
      selectedCourseId: dashboardState.selectedCourseId,
      facultyCourses: dashboardState.facultyCourses,
      onSelect: async (courseId) => {
        dashboardState.selectedCourseId = courseId;
        await renderAll();
        switchToTab(panel, "faculty-tab-letters");
      }
    });

    renderModalList({
      records: dashboardState.facultyLetters.filter(
        (record) => record.courseId === dashboardState.selectedCourseId
      ),
      listContainer: document.getElementById("faculty-letter-record-list"),
      course: selectedCourse,
      openModal: async (record, course) => {
        if (String(record.status).toLowerCase() === "unread") {
          record.status = "Read";
          await renderAll();
        }

        letterModal.openModal(buildLetterModalHtml(record, course));
      },
      rowDescriptionBuilder: (record) => `Received ${record.receivedAt}`
    });

    const examRequestListContainer = document.getElementById("faculty-exam-request-list");

    if (!dashboardState.selectedCourseId || !selectedCourse) {
      dashboardState.facultyExamRequestsCache = [];
      renderEmptyState(
        examRequestListContainer,
        "Select a course in the My Courses tab to view these records."
      );
    } else {
      try {
        const sourceSectionId = selectedCourse.sourceSectionId;
        const apiExamRequests = sourceSectionId
          ? await fetchExamRequestsBySection(sourceSectionId)
          : [];

        dashboardState.facultyExamRequestsCache = apiExamRequests.map((record) =>
          normalizeExamRequestSummary(record, dashboardState.selectedCourseId)
        );

        renderModalList({
          records: dashboardState.facultyExamRequestsCache,
          listContainer: examRequestListContainer,
          course: selectedCourse,
          openModal: (record, course) => examModal.openModal(record, course),
          rowDescriptionBuilder: (record) =>
            `Student request submitted for ${record.requestedFor} at ${record.requestedTime}`
        });
      } catch (error) {
        dashboardState.facultyExamRequestsCache = [];
        renderEmptyState(
          examRequestListContainer,
          `Could not load exam requests from the API. ${error.message}`
        );
      }
    }

    renderFacultyTabCounters(
      dashboardState.selectedCourseId,
      dashboardState.facultyLetters,
      dashboardState.facultyExamRequestsCache
    );

    const uploadedExamListContainer = document.getElementById("faculty-uploaded-exam-list");

    if (!dashboardState.selectedCourseId || !selectedCourse) {
      dashboardState.facultyUploadedExamsCache = [];
      renderEmptyState(
        uploadedExamListContainer,
        "Select a course in the My Courses tab to view these records."
      );
    } else {
      try {
        const sourceSectionId = selectedCourse.sourceSectionId;
        const apiUploadedExams = sourceSectionId
          ? await fetchUploadedExamsBySection(sourceSectionId)
          : [];

        dashboardState.facultyUploadedExamsCache = apiUploadedExams.map((record) =>
          normalizeUploadedExamSummary(record, dashboardState.selectedCourseId)
        );

        renderModalList({
          records: dashboardState.facultyUploadedExamsCache,
          listContainer: uploadedExamListContainer,
          course: selectedCourse,
          openModal: (record, course) =>
            uploadedModal.openModal(buildUploadedExamModalHtml(record, course)),
          rowDescriptionBuilder: (record) => `Uploaded ${record.uploadedAt}`
        });
      } catch (error) {
        dashboardState.facultyUploadedExamsCache = [];
        renderEmptyState(
          uploadedExamListContainer,
          `Could not load uploaded exams from the API. ${error.message}`
        );
      }
    }

    if (!dashboardState.selectedCourseId || !selectedCourse) {
      dashboardState.facultyExamPreferencesCache = [];
    } else {
      try {
        const sourceSectionId = selectedCourse.sourceSectionId;

        dashboardState.facultyExamPreferencesCache =
          dashboardState.facultyExamPreferencesCache.filter(
            (record) => record.courseId !== dashboardState.selectedCourseId
          );

        if (sourceSectionId) {
          const apiPreference = await fetchExamPreferenceBySection(sourceSectionId);

          if (apiPreference) {
            dashboardState.facultyExamPreferencesCache.push(
              normalizeExamPreference(apiPreference, dashboardState.selectedCourseId)
            );
          }
        }
      } catch (error) {
        dashboardState.facultyExamPreferencesCache =
          dashboardState.facultyExamPreferencesCache.filter(
            (record) => record.courseId !== dashboardState.selectedCourseId
          );
      }
    }

    renderPreferenceForm({
      course: selectedCourse,
      preferenceModal,
      dashboardState,
      getPreferenceByCourseId,
      getStatusClass,
      renderEmptyState,
      buildPreferenceFormMarkup,
      facultyCourseSectionMap: Object.fromEntries(
        dashboardState.facultyCourses.map((course) => [course.id, course.sourceSectionId])
      ),
      normalizeExamPreference,
      saveExamPreferenceBySection
    });
  }

  Promise.all([loadFacultyCourses(), loadFacultyLetters()])
    .then(renderAll)
    .catch((error) => {
      console.error("Failed to initialize faculty dashboard:", error);
    });
}