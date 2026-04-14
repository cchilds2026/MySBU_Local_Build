BEGIN TRANSACTION;
GO

-- =========================================
-- DEMO WORKFLOW SEED DATA FOR ASA SCHEMA
-- =========================================
-- Safe to run repeatedly for local prototype seeding.
-- This script inserts:
-- - faculty exam preferences
-- - exam requests
-- - faculty responses
-- - staff actions
-- - uploaded exams
-- - documentation records
-- - accommodation profiles/items/letters

-- =========================================
-- 1) FACULTY EXAM PREFERENCES
-- =========================================

IF NOT EXISTS (
    SELECT 1
    FROM asa.faculty_exam_preference p
    JOIN asa.course_section cs
        ON p.course_section_id = cs.course_section_id
    WHERE cs.source_section_id = 'SEC-PSY101-01'
)
BEGIN
    INSERT INTO asa.faculty_exam_preference (
        course_section_id,
        provided_to_asa_method,
        return_method,
        calculator_policy,
        notes_sheet_allowed,
        notes_sheet_details,
        preferred_contact_method,
        preferred_contact_value,
        additional_information,
        updated_by_user_id
    )
    VALUES (
        (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-PSY101-01'),
        'upload',
        'interoffice_mail',
        'scientific',
        1,
        'One handwritten 8.5 x 11 sheet, front only.',
        'email',
        'psycfaculty@sbu.edu',
        'Default to the department email for routine coordination.',
        'BONAS\cchilds'
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM asa.faculty_exam_preference p
    JOIN asa.course_section cs
        ON p.course_section_id = cs.course_section_id
    WHERE cs.source_section_id = 'SEC-ENG220-01'
)
BEGIN
    INSERT INTO asa.faculty_exam_preference (
        course_section_id,
        provided_to_asa_method,
        return_method,
        calculator_policy,
        notes_sheet_allowed,
        notes_sheet_details,
        preferred_contact_method,
        preferred_contact_value,
        additional_information,
        updated_by_user_id
    )
    VALUES (
        (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-ENG220-01'),
        'email',
        'scan_email',
        'none',
        0,
        '',
        'email',
        'mreed@sbu.edu',
        'Email completed materials back as PDF plus Word file when applicable.',
        'BONAS\cchilds'
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM asa.faculty_exam_preference p
    JOIN asa.course_section cs
        ON p.course_section_id = cs.course_section_id
    WHERE cs.source_section_id = 'SEC-FYE100-01'
)
BEGIN
    INSERT INTO asa.faculty_exam_preference (
        course_section_id,
        provided_to_asa_method,
        return_method,
        calculator_policy,
        notes_sheet_allowed,
        notes_sheet_details,
        preferred_contact_method,
        preferred_contact_value,
        additional_information,
        updated_by_user_id
    )
    VALUES (
        (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-FYE100-01'),
        'deliver_office',
        'pickup',
        'none',
        0,
        '',
        'phone',
        '(716) 555-0188',
        'Call for any day-of changes.',
        'BONAS\cchilds'
    );
END;
GO

-- =========================================
-- 2) EXAM REQUESTS
-- =========================================

IF NOT EXISTS (
    SELECT 1
    FROM asa.exam_request
    WHERE student_id = (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0001')
      AND course_section_id = (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-PSY101-01')
      AND requested_exam_date = '2026-05-08'
)
BEGIN
    INSERT INTO asa.exam_request (
        student_id,
        course_section_id,
        submitted_at,
        requested_exam_date,
        requested_start_time,
        student_notes,
        workflow_status,
        staff_status,
        created_by_user_id
    )
    VALUES (
        (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0001'),
        (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-PSY101-01'),
        '2026-04-14T10:15:00',
        '2026-05-08',
        '10:00 AM',
        'Student requested reduced-distraction space and 1.5x extended time.',
        'faculty_review',
        'received_by_asa',
        'student:jordan.williams@sbu.edu'
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM asa.exam_request
    WHERE student_id = (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0001')
      AND course_section_id = (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-ENG220-01')
      AND requested_exam_date = '2026-05-05'
)
BEGIN
    INSERT INTO asa.exam_request (
        student_id,
        course_section_id,
        submitted_at,
        requested_exam_date,
        requested_start_time,
        student_notes,
        workflow_status,
        staff_status,
        created_by_user_id
    )
    VALUES (
        (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0001'),
        (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-ENG220-01'),
        '2026-04-13T13:00:00',
        '2026-05-05',
        '1:00 PM',
        'Student confirmed regular class date and approved exam timing.',
        'faculty_approved',
        'scheduled',
        'student:jordan.williams@sbu.edu'
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM asa.exam_request
    WHERE student_id = (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0002')
      AND course_section_id = (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-FYE100-01')
      AND requested_exam_date = '2026-05-12'
)
BEGIN
    INSERT INTO asa.exam_request (
        student_id,
        course_section_id,
        submitted_at,
        requested_exam_date,
        requested_start_time,
        student_notes,
        workflow_status,
        staff_status,
        created_by_user_id
    )
    VALUES (
        (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0002'),
        (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-FYE100-01'),
        '2026-04-10T09:20:00',
        '2026-05-12',
        '2:00 PM',
        'Student requested standard approved testing accommodations for seminar assessment.',
        'completed',
        'completed',
        'student:casey.martin@sbu.edu'
    );
END;
GO

-- =========================================
-- 3) FACULTY RESPONSES
-- =========================================

IF NOT EXISTS (
    SELECT 1
    FROM asa.exam_request_faculty_response
    WHERE exam_request_id = (
        SELECT er.exam_request_id
        FROM asa.exam_request er
        JOIN asa.student s ON er.student_id = s.student_id
        JOIN asa.course_section cs ON er.course_section_id = cs.course_section_id
        WHERE s.source_student_id = 'STU-0001'
          AND cs.source_section_id = 'SEC-ENG220-01'
          AND er.requested_exam_date = '2026-05-05'
    )
)
BEGIN
    INSERT INTO asa.exam_request_faculty_response (
        exam_request_id,
        provided_to_asa_method,
        return_method,
        approved_exam_date,
        approved_start_time,
        duration_minutes,
        calculator_policy,
        notes_sheet_allowed,
        notes_sheet_details,
        preferred_contact_method,
        preferred_contact_value,
        additional_information,
        approved_time_diff_acknowledged,
        submitted_at,
        submitted_by_user_id
    )
    VALUES (
        (
            SELECT er.exam_request_id
            FROM asa.exam_request er
            JOIN asa.student s ON er.student_id = s.student_id
            JOIN asa.course_section cs ON er.course_section_id = cs.course_section_id
            WHERE s.source_student_id = 'STU-0001'
              AND cs.source_section_id = 'SEC-ENG220-01'
              AND er.requested_exam_date = '2026-05-05'
        ),
        'email',
        'scan_email',
        '2026-05-05',
        '1:00 PM',
        90,
        'none',
        0,
        '',
        'email',
        'mreed@sbu.edu',
        'Essay exam should open directly in Microsoft Word.',
        0,
        '2026-04-13T15:30:00',
        'faculty:mreed@sbu.edu'
    );
END;
GO

-- =========================================
-- 4) STAFF ACTION HISTORY
-- =========================================

IF NOT EXISTS (
    SELECT 1
    FROM asa.exam_request_staff_action
    WHERE exam_request_id = (
        SELECT er.exam_request_id
        FROM asa.exam_request er
        JOIN asa.student s ON er.student_id = s.student_id
        JOIN asa.course_section cs ON er.course_section_id = cs.course_section_id
        WHERE s.source_student_id = 'STU-0001'
          AND cs.source_section_id = 'SEC-PSY101-01'
          AND er.requested_exam_date = '2026-05-08'
    )
      AND action_type = 'received'
)
BEGIN
    INSERT INTO asa.exam_request_staff_action (
        exam_request_id,
        action_type,
        from_status,
        to_status,
        staff_notes,
        acted_at,
        acted_by_user_id
    )
    VALUES (
        (
            SELECT er.exam_request_id
            FROM asa.exam_request er
            JOIN asa.student s ON er.student_id = s.student_id
            JOIN asa.course_section cs ON er.course_section_id = cs.course_section_id
            WHERE s.source_student_id = 'STU-0001'
              AND cs.source_section_id = 'SEC-PSY101-01'
              AND er.requested_exam_date = '2026-05-08'
        ),
        'received',
        'submitted',
        'received_by_asa',
        'Exam request entered into ASA queue pending faculty approval.',
        '2026-04-14T10:45:00',
        'BONAS\cchilds'
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM asa.exam_request_staff_action
    WHERE exam_request_id = (
        SELECT er.exam_request_id
        FROM asa.exam_request er
        JOIN asa.student s ON er.student_id = s.student_id
        JOIN asa.course_section cs ON er.course_section_id = cs.course_section_id
        WHERE s.source_student_id = 'STU-0001'
          AND cs.source_section_id = 'SEC-ENG220-01'
          AND er.requested_exam_date = '2026-05-05'
    )
      AND action_type = 'scheduled'
)
BEGIN
    INSERT INTO asa.exam_request_staff_action (
        exam_request_id,
        action_type,
        from_status,
        to_status,
        staff_notes,
        acted_at,
        acted_by_user_id
    )
    VALUES (
        (
            SELECT er.exam_request_id
            FROM asa.exam_request er
            JOIN asa.student s ON er.student_id = s.student_id
            JOIN asa.course_section cs ON er.course_section_id = cs.course_section_id
            WHERE s.source_student_id = 'STU-0001'
              AND cs.source_section_id = 'SEC-ENG220-01'
              AND er.requested_exam_date = '2026-05-05'
        ),
        'scheduled',
        'received_by_asa',
        'scheduled',
        'Exam packet received and entered into scheduling queue.',
        '2026-04-15T09:15:00',
        'BONAS\cchilds'
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM asa.exam_request_staff_action
    WHERE exam_request_id = (
        SELECT er.exam_request_id
        FROM asa.exam_request er
        JOIN asa.student s ON er.student_id = s.student_id
        JOIN asa.course_section cs ON er.course_section_id = cs.course_section_id
        WHERE s.source_student_id = 'STU-0002'
          AND cs.source_section_id = 'SEC-FYE100-01'
          AND er.requested_exam_date = '2026-05-12'
    )
      AND action_type = 'completed'
)
BEGIN
    INSERT INTO asa.exam_request_staff_action (
        exam_request_id,
        action_type,
        from_status,
        to_status,
        staff_notes,
        acted_at,
        acted_by_user_id
    )
    VALUES (
        (
            SELECT er.exam_request_id
            FROM asa.exam_request er
            JOIN asa.student s ON er.student_id = s.student_id
            JOIN asa.course_section cs ON er.course_section_id = cs.course_section_id
            WHERE s.source_student_id = 'STU-0002'
              AND cs.source_section_id = 'SEC-FYE100-01'
              AND er.requested_exam_date = '2026-05-12'
        ),
        'completed',
        'scheduled',
        'completed',
        'Student completed the seminar assessment in the ASA testing room.',
        '2026-05-12T16:40:00',
        'BONAS\cchilds'
    );
END;
GO

-- =========================================
-- 5) UPLOADED EXAMS
-- =========================================

IF NOT EXISTS (
    SELECT 1
    FROM asa.uploaded_exam
    WHERE course_section_id = (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-PSY101-01')
      AND file_name = 'psy101-midterm-packet.pdf'
)
BEGIN
    INSERT INTO asa.uploaded_exam (
        course_section_id,
        uploaded_by_user_id,
        title,
        file_name,
        storage_path,
        mime_type,
        delivery_method,
        class_exam_date,
        class_exam_time,
        notes,
        uploaded_at
    )
    VALUES (
        (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-PSY101-01'),
        'faculty:lturner@sbu.edu',
        'PSY-101 Midterm Packet',
        'psy101-midterm-packet.pdf',
        '/demo-storage/exams/psy101-midterm-packet.pdf',
        'application/pdf',
        'PDF exam packet',
        '2026-05-08',
        '10:00 AM',
        'Includes instructor cover page and answer sheet instructions.',
        '2026-04-18T11:10:00'
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM asa.uploaded_exam
    WHERE course_section_id = (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-ENG220-01')
      AND file_name = 'eng220-essay-prompt.docx'
)
BEGIN
    INSERT INTO asa.uploaded_exam (
        course_section_id,
        uploaded_by_user_id,
        title,
        file_name,
        storage_path,
        mime_type,
        delivery_method,
        class_exam_date,
        class_exam_time,
        notes,
        uploaded_at
    )
    VALUES (
        (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-ENG220-01'),
        'faculty:mreed@sbu.edu',
        'ENG-220 In-Class Essay Prompt',
        'eng220-essay-prompt.docx',
        '/demo-storage/exams/eng220-essay-prompt.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Word document',
        '2026-05-05',
        '1:00 PM',
        'Instructor requests exam to open directly in Microsoft Word.',
        '2026-04-15T14:25:00'
    );
END;
GO

-- =========================================
-- 6) DOCUMENTATION RECORDS
-- =========================================

IF NOT EXISTS (
    SELECT 1
    FROM asa.documentation_record
    WHERE student_id = (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0001')
      AND file_name = 'provider-documentation.pdf'
)
BEGIN
    INSERT INTO asa.documentation_record (
        student_id,
        file_name,
        storage_path,
        mime_type,
        documentation_type,
        status,
        uploaded_at,
        reviewed_at,
        reviewed_by_user_id,
        review_notes
    )
    VALUES (
        (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0001'),
        'provider-documentation.pdf',
        '/demo-storage/docs/provider-documentation.pdf',
        'application/pdf',
        'Clinical Documentation',
        'On File',
        '2026-04-02T09:00:00',
        '2026-04-03T11:15:00',
        'BONAS\cchilds',
        'Documentation reviewed and sufficient for current accommodations.'
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM asa.documentation_record
    WHERE student_id = (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0002')
      AND file_name = 'housing-support-documentation.pdf'
)
BEGIN
    INSERT INTO asa.documentation_record (
        student_id,
        file_name,
        storage_path,
        mime_type,
        documentation_type,
        status,
        uploaded_at,
        review_notes
    )
    VALUES (
        (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0002'),
        'housing-support-documentation.pdf',
        '/demo-storage/docs/housing-support-documentation.pdf',
        'application/pdf',
        'Housing Support',
        'Received',
        '2026-04-01T13:20:00',
        'Pending formal review.'
    );
END;
GO

-- =========================================
-- 7) ACCOMMODATION PROFILES
-- =========================================

IF NOT EXISTS (
    SELECT 1
    FROM asa.accommodation_profile
    WHERE student_id = (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0001')
      AND status = 'Active'
)
BEGIN
    INSERT INTO asa.accommodation_profile (
        student_id,
        effective_start_date,
        effective_end_date,
        status
    )
    VALUES (
        (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0001'),
        '2026-01-15',
        '2026-12-20',
        'Active'
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM asa.accommodation_profile
    WHERE student_id = (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0002')
      AND status = 'Active'
)
BEGIN
    INSERT INTO asa.accommodation_profile (
        student_id,
        effective_start_date,
        effective_end_date,
        status
    )
    VALUES (
        (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0002'),
        '2026-01-15',
        '2026-12-20',
        'Active'
    );
END;
GO

-- =========================================
-- 8) ACCOMMODATION ITEMS
-- =========================================

IF NOT EXISTS (
    SELECT 1
    FROM asa.accommodation_item ai
    JOIN asa.accommodation_profile ap
        ON ai.accommodation_profile_id = ap.accommodation_profile_id
    JOIN asa.student s
        ON ap.student_id = s.student_id
    WHERE s.source_student_id = 'STU-0001'
      AND ai.accommodation_code = 'EXT_TIME'
)
BEGIN
    INSERT INTO asa.accommodation_item (
        accommodation_profile_id,
        accommodation_code,
        accommodation_name,
        details
    )
    VALUES
    (
        (SELECT ap.accommodation_profile_id
         FROM asa.accommodation_profile ap
         JOIN asa.student s ON ap.student_id = s.student_id
         WHERE s.source_student_id = 'STU-0001' AND ap.status = 'Active'),
        'EXT_TIME',
        'Extended Time on Exams',
        '1.5x approved testing time.'
    ),
    (
        (SELECT ap.accommodation_profile_id
         FROM asa.accommodation_profile ap
         JOIN asa.student s ON ap.student_id = s.student_id
         WHERE s.source_student_id = 'STU-0001' AND ap.status = 'Active'),
        'RDT',
        'Reduced Distraction Testing',
        'Testing in ASA-approved reduced-distraction environment.'
    ),
    (
        (SELECT ap.accommodation_profile_id
         FROM asa.accommodation_profile ap
         JOIN asa.student s ON ap.student_id = s.student_id
         WHERE s.source_student_id = 'STU-0001' AND ap.status = 'Active'),
        'NOTE_SUPPORT',
        'Note-Taking Support',
        'Eligible for note support coordination.'
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM asa.accommodation_item ai
    JOIN asa.accommodation_profile ap
        ON ai.accommodation_profile_id = ap.accommodation_profile_id
    JOIN asa.student s
        ON ap.student_id = s.student_id
    WHERE s.source_student_id = 'STU-0002'
      AND ai.accommodation_code = 'ACCESS_SEAT'
)
BEGIN
    INSERT INTO asa.accommodation_item (
        accommodation_profile_id,
        accommodation_code,
        accommodation_name,
        details
    )
    VALUES
    (
        (SELECT ap.accommodation_profile_id
         FROM asa.accommodation_profile ap
         JOIN asa.student s ON ap.student_id = s.student_id
         WHERE s.source_student_id = 'STU-0002' AND ap.status = 'Active'),
        'ACCESS_SEAT',
        'Accessible Seating',
        'Priority accessible classroom seating.'
    ),
    (
        (SELECT ap.accommodation_profile_id
         FROM asa.accommodation_profile ap
         JOIN asa.student s ON ap.student_id = s.student_id
         WHERE s.source_student_id = 'STU-0002' AND ap.status = 'Active'),
        'LECTURE_REC',
        'Lecture Recording',
        'Lecture recording approved where applicable.'
    );
END;
GO

-- =========================================
-- 9) ACCOMMODATION LETTERS
-- =========================================

IF NOT EXISTS (
    SELECT 1
    FROM asa.accommodation_letter
    WHERE student_id = (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0001')
      AND course_section_id = (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-ENG220-01')
)
BEGIN
    INSERT INTO asa.accommodation_letter (
        student_id,
        course_section_id,
        term_id,
        status,
        sent_at,
        generated_content_snapshot,
        sent_to_email
    )
    VALUES (
        (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0001'),
        (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-ENG220-01'),
        (SELECT term_id FROM asa.term WHERE source_term_id = 'TERM-2026SP'),
        'Sent',
        '2026-04-12T08:30:00',
        'Jordan Williams accommodation notice for ENG-220. Approved accommodations: Extended Time on Exams, Reduced Distraction Testing, Note-Taking Support.',
        'mreed@sbu.edu'
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM asa.accommodation_letter
    WHERE student_id = (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0001')
      AND course_section_id = (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-PSY101-01')
)
BEGIN
    INSERT INTO asa.accommodation_letter (
        student_id,
        course_section_id,
        term_id,
        status,
        sent_at,
        generated_content_snapshot,
        sent_to_email
    )
    VALUES (
        (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0001'),
        (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-PSY101-01'),
        (SELECT term_id FROM asa.term WHERE source_term_id = 'TERM-2026SP'),
        'Sent',
        '2026-04-11T10:05:00',
        'Jordan Williams accommodation notice for PSY-101. Approved accommodations: Extended Time on Exams, Reduced Distraction Testing.',
        'lturner@sbu.edu'
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM asa.accommodation_letter
    WHERE student_id = (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0002')
      AND course_section_id = (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-FYE100-01')
)
BEGIN
    INSERT INTO asa.accommodation_letter (
        student_id,
        course_section_id,
        term_id,
        status,
        sent_at,
        generated_content_snapshot,
        sent_to_email
    )
    VALUES (
        (SELECT student_id FROM asa.student WHERE source_student_id = 'STU-0002'),
        (SELECT course_section_id FROM asa.course_section WHERE source_section_id = 'SEC-FYE100-01'),
        (SELECT term_id FROM asa.term WHERE source_term_id = 'TERM-2026SP'),
        'Sent',
        '2026-04-08T09:40:00',
        'Casey Martin accommodation notice for FYE-100. Approved accommodations: Accessible Seating, Lecture Recording.',
        'amorris@sbu.edu'
    );
END;
GO

-- =========================================
-- 10) AUDIT EVENTS
-- =========================================

IF NOT EXISTS (
    SELECT 1
    FROM asa.audit_event
    WHERE entity_type = 'exam_request'
      AND action = 'seed_insert'
)
BEGIN
    INSERT INTO asa.audit_event (
        entity_type,
        entity_id,
        action,
        old_value_json,
        new_value_json,
        acted_by_user_id
    )
    SELECT
        'exam_request',
        er.exam_request_id,
        'seed_insert',
        NULL,
        CONCAT(
            '{',
            '"workflow_status":"', er.workflow_status, '",',
            '"staff_status":"', er.staff_status, '"',
            '}'
        ),
        'BONAS\cchilds'
    FROM asa.exam_request er;
END;
GO

COMMIT TRANSACTION;
GO