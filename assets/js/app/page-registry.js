import { initHomeRouting } from "../modules/home-routing.js";
import { initStaffGates } from "../modules/staff-gates.js";
import { initExamRequestForm } from "../modules/exam-request.js";
import { initAccommodationLetterForm } from "../modules/accommodation-letter.js";
import { initStudentRegistrationForm } from "../modules/student-registration.js";
import { initUploadDocumentationForm } from "../modules/upload-documentation.js";
import { renderAsaIntakeQueue } from "../modules/asa-intake-queue.js";
import { initAsaIntakeForm } from "../modules/asa-intake.js";
import { initAsaStaffAccessForm } from "../modules/asa-staff-access.js";
import { initFacultyDashboard } from "../modules/faculty-dashboard.js";
import { initAsaStaffDashboard } from "../modules/asa-staff-dashboard.js";
import { initAsaStaffExamRequests } from "../asa-staff-exams.js";
import { initStudentExamRecords } from "../modules/student-exam-records.js";
import { initStudentLetterRecords } from "../modules/student-letter-records.js";
import { initStudentDocumentRecords } from "../modules/student-document-records.js";

export const pageRegistry = {
  home() {
    initHomeRouting();
  },

  "student-portal"() {
    initStudentLetterRecords();
    initStudentExamRecords();
    initStudentDocumentRecords();
  },

  "request-exam"() {
    initExamRequestForm();
  },

  "request-accommodation-letter"() {
    initAccommodationLetterForm();
  },

  "student-registration"() {
    initStudentRegistrationForm();
  },

  "upload-documentation"() {
    initUploadDocumentationForm();
  },

  "asa-intake-form"() {
    renderAsaIntakeQueue();
    initAsaIntakeForm();
  },

  "asa-staff-access"() {
    initAsaStaffAccessForm();
  },

  "faculty-portal"() {
    initFacultyDashboard();
  },

  async "asa-staff-portal"() {
    initAsaStaffDashboard();
    await initAsaStaffExamRequests();
  },

  "graduate-portal"() {}
};