from __future__ import annotations

from query_modules.shared import (
    get_mock_current_faculty_user,
    rows_to_dicts,
)

from query_modules.faculty import (
    get_asa_letter_approval_by_id,
    get_asa_letter_approvals,
    get_asa_letter_approvals_by_status,
    get_faculty_course_debug_summary,
    get_faculty_courses,
    get_faculty_courses_by_instructor_email,
    get_faculty_letter_debug_summary,
    get_faculty_letters_by_instructor_email,
    get_instructor_emails,
    update_asa_letter_approval_status,
)

from query_modules.exam_requests import (
    delete_exam_request,
    get_exam_request_by_id,
    get_exam_requests,
    get_exam_requests_by_course,
    update_exam_request_staff_status,
    upsert_exam_request_faculty_response,
)

from query_modules.faculty_preferences import (
    get_faculty_exam_preference_by_section,
    get_faculty_exam_preferences,
    upsert_faculty_exam_preference,
)

from query_modules.uploaded_exams import (
    create_uploaded_exam,
    delete_uploaded_exam,
    get_uploaded_exams,
    get_uploaded_exams_by_section,
)

from query_modules.student_portal import (
    archive_student_record,
    create_current_user_student_registration_request,
    delete_student_record,
    delete_student_registration_request,
    get_current_user_student_registration_requests,
    get_current_user_student_registration_status,
    get_documentation_queue_items,
    get_latest_current_user_student_registration_request,
    get_registered_student_detail,
    get_registered_students_directory,
    get_student_by_email,
    get_student_portal_profile_by_student_id,
    get_student_registration_request_by_id,
    get_student_registration_requests,
    get_student_registration_requests_by_status,
    restore_student_record,
    update_student_academic_level,
    update_student_registration_request_docs_status,
    update_student_registration_request_status,
    upsert_current_user_student_registration_status,
)

from query_modules.asa_resources import (
    archive_asa_resource,
    create_asa_resource,
    get_asa_resources_admin,
    get_published_asa_resources,
    publish_asa_resource,
    update_asa_resource,
)

from query_modules.asa_inbox import (
    get_asa_inbox_items,
)