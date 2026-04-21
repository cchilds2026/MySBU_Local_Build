export function normalizeExamPreference(record, selectedCourseId) {
  return {
    id: record.faculty_exam_preference_id,
    courseId: selectedCourseId,
    title: `${record.subject_code}-${record.course_number} Exam Delivery Preference`,
    status: "Saved",
    deliveryMethod: record.provided_to_asa_method || "",
    returnMethod: record.return_method || "",
    calculatorAllowed: record.calculator_policy || "",
    notesSheet: record.notes_sheet_allowed ? "yes" : "no",
    notesSheetDetails: record.notes_sheet_details || "",
    preferredContactMethod: record.preferred_contact_method || "",
    preferredContactValue: record.preferred_contact_value || "",
    additionalInformation: record.additional_information || ""
  };
}

export function mapWorkflowStatusToFacultyBadge(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "faculty_approved") return "Approved";
  if (normalized === "faculty_review") return "Review";
  if (normalized === "no_show") return "No Show";
  if (normalized === "received_by_asa") return "Received";
  if (normalized === "scheduled") return "Scheduled";
  if (normalized === "completed") return "Completed";
  if (normalized === "cancelled") return "Cancelled";

  return status || "Review";
}

export function normalizeExamRequestSummary(record, selectedCourseId) {
  return {
    id: record.exam_request_id,
    examRequestId: record.exam_request_id,
    courseId: selectedCourseId,
    title: `${record.subject_code}-${record.course_number} Exam Request`,
    submittedAt: record.submitted_at,
    requestedFor: record.requested_exam_date,
    requestedTime: record.requested_start_time,
    status: mapWorkflowStatusToFacultyBadge(record.workflow_status),
    studentName: `${record.student_first_name} ${record.student_last_name}`,
    studentEmail: record.student_email,
    notes: record.student_notes || "",
    facultyResponse: null
  };
}

export function normalizeExamRequestDetail(record, selectedCourseId) {
  return {
    id: record.exam_request_id,
    examRequestId: record.exam_request_id,
    courseId: selectedCourseId,
    title: `${record.subject_code}-${record.course_number} Exam Request`,
    submittedAt: record.submitted_at,
    requestedFor: record.requested_exam_date,
    requestedTime: record.requested_start_time,
    status: mapWorkflowStatusToFacultyBadge(record.workflow_status),
    studentName: `${record.student_first_name} ${record.student_last_name}`,
    studentEmail: record.student_email,
    notes: record.student_notes || "",
    facultyResponse: record.exam_request_faculty_response_id
      ? {
          deliveryMethod: record.provided_to_asa_method || "",
          returnMethod: record.return_method || "",
          approvedExamDate: record.approved_exam_date || "",
          approvedExamTime: record.approved_start_time || "",
          examDuration: record.duration_minutes ? String(record.duration_minutes) : "",
          calculatorAllowed: record.calculator_policy || "",
          notesSheet: record.notes_sheet_allowed ? "yes" : "no",
          notesSheetDetails: record.notes_sheet_details || "",
          preferredContactMethod: record.preferred_contact_method || "",
          preferredContactValue: record.preferred_contact_value || "",
          additionalInformation: record.additional_information || ""
        }
      : null
  };
}

export function normalizeUploadedExamSummary(record, selectedCourseId) {
  return {
    id: record.uploaded_exam_id,
    courseId: selectedCourseId,
    title: record.title,
    uploadedAt: record.uploaded_at,
    status: "On File",
    fileName: record.file_name,
    deliveryMethod: record.delivery_method,
    notes: record.notes || "",
    classExamDate: record.class_exam_date || "",
    classExamTime: record.class_exam_time || ""
  };
}