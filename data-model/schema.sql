-- ASA Platform - Initial Canonical Schema
-- SQL Server version for database: student_success
-- Schema: asa

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.schemas
    WHERE name = 'asa'
)
BEGIN
    EXEC('CREATE SCHEMA asa');
END;
GO

-- =========================
-- REFERENCE / IMPORTED DATA
-- =========================

IF OBJECT_ID('asa.student', 'U') IS NULL
BEGIN
    CREATE TABLE asa.student (
        student_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        source_system NVARCHAR(50) NOT NULL,
        source_student_id NVARCHAR(100) NOT NULL,
        institution_student_id NVARCHAR(100) NULL,
        first_name NVARCHAR(100) NOT NULL,
        last_name NVARCHAR(100) NOT NULL,
        email NVARCHAR(255) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        last_imported_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_asa_student_source UNIQUE (source_system, source_student_id)
    );
END;
GO

IF OBJECT_ID('asa.instructor', 'U') IS NULL
BEGIN
    CREATE TABLE asa.instructor (
        instructor_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        source_system NVARCHAR(50) NOT NULL,
        source_instructor_id NVARCHAR(100) NOT NULL,
        first_name NVARCHAR(100) NOT NULL,
        last_name NVARCHAR(100) NOT NULL,
        email NVARCHAR(255) NULL,
        phone NVARCHAR(50) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        last_imported_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_asa_instructor_source UNIQUE (source_system, source_instructor_id)
    );
END;
GO

IF OBJECT_ID('asa.term', 'U') IS NULL
BEGIN
    CREATE TABLE asa.term (
        term_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        source_system NVARCHAR(50) NOT NULL,
        source_term_id NVARCHAR(100) NOT NULL,
        term_code NVARCHAR(50) NOT NULL,
        term_name NVARCHAR(255) NOT NULL,
        start_date DATE NULL,
        end_date DATE NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_asa_term_source UNIQUE (source_system, source_term_id)
    );
END;
GO

IF OBJECT_ID('asa.course', 'U') IS NULL
BEGIN
    CREATE TABLE asa.course (
        course_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        source_system NVARCHAR(50) NOT NULL,
        source_course_id NVARCHAR(100) NOT NULL,
        subject_code NVARCHAR(50) NOT NULL,
        course_number NVARCHAR(50) NOT NULL,
        course_title NVARCHAR(255) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_asa_course_source UNIQUE (source_system, source_course_id)
    );
END;
GO

IF OBJECT_ID('asa.course_section', 'U') IS NULL
BEGIN
    CREATE TABLE asa.course_section (
        course_section_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        source_system NVARCHAR(50) NOT NULL,
        source_section_id NVARCHAR(100) NOT NULL,
        course_id UNIQUEIDENTIFIER NOT NULL,
        term_id UNIQUEIDENTIFIER NOT NULL,
        section_code NVARCHAR(50) NOT NULL,
        primary_instructor_id UNIQUEIDENTIFIER NULL,
        meeting_pattern NVARCHAR(255) NULL,
        exam_date DATE NULL,
        exam_time NVARCHAR(50) NULL,
        last_imported_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_asa_course_section_source UNIQUE (source_system, source_section_id),
        CONSTRAINT FK_asa_course_section_course FOREIGN KEY (course_id) REFERENCES asa.course(course_id),
        CONSTRAINT FK_asa_course_section_term FOREIGN KEY (term_id) REFERENCES asa.term(term_id),
        CONSTRAINT FK_asa_course_section_instructor FOREIGN KEY (primary_instructor_id) REFERENCES asa.instructor(instructor_id)
    );
END;
GO

IF OBJECT_ID('asa.enrollment', 'U') IS NULL
BEGIN
    CREATE TABLE asa.enrollment (
        enrollment_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        student_id UNIQUEIDENTIFIER NOT NULL,
        course_section_id UNIQUEIDENTIFIER NOT NULL,
        enrollment_status NVARCHAR(50) NOT NULL,
        last_imported_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_asa_enrollment_student_section UNIQUE (student_id, course_section_id),
        CONSTRAINT FK_asa_enrollment_student FOREIGN KEY (student_id) REFERENCES asa.student(student_id),
        CONSTRAINT FK_asa_enrollment_section FOREIGN KEY (course_section_id) REFERENCES asa.course_section(course_section_id)
    );
END;
GO

-- =========================
-- APPLICATION WORKFLOW DATA
-- =========================

IF OBJECT_ID('asa.exam_request', 'U') IS NULL
BEGIN
    CREATE TABLE asa.exam_request (
        exam_request_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        student_id UNIQUEIDENTIFIER NOT NULL,
        course_section_id UNIQUEIDENTIFIER NOT NULL,
        submitted_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        requested_exam_date DATE NOT NULL,
        requested_start_time NVARCHAR(50) NOT NULL,
        student_notes NVARCHAR(MAX) NULL,
        workflow_status NVARCHAR(50) NOT NULL DEFAULT 'submitted',
        staff_status NVARCHAR(50) NOT NULL DEFAULT 'received_by_asa',
        created_by_user_id NVARCHAR(255) NULL,
        cancelled_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_asa_exam_request_student FOREIGN KEY (student_id) REFERENCES asa.student(student_id),
        CONSTRAINT FK_asa_exam_request_section FOREIGN KEY (course_section_id) REFERENCES asa.course_section(course_section_id),
        CONSTRAINT CK_asa_exam_request_workflow_status CHECK (workflow_status IN (
            'submitted',
            'faculty_review',
            'faculty_approved',
            'received_by_asa',
            'scheduled',
            'completed',
            'no_show',
            'cancelled'
        )),
        CONSTRAINT CK_asa_exam_request_staff_status CHECK (staff_status IN (
            'received_by_asa',
            'scheduled',
            'completed',
            'no_show',
            'cancelled'
        ))
    );
END;
GO

IF OBJECT_ID('asa.exam_request_faculty_response', 'U') IS NULL
BEGIN
    CREATE TABLE asa.exam_request_faculty_response (
        exam_request_faculty_response_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        exam_request_id UNIQUEIDENTIFIER NOT NULL,
        provided_to_asa_method NVARCHAR(100) NOT NULL,
        return_method NVARCHAR(100) NOT NULL,
        approved_exam_date DATE NULL,
        approved_start_time NVARCHAR(50) NULL,
        duration_minutes INT NULL,
        calculator_policy NVARCHAR(100) NULL,
        notes_sheet_allowed BIT NULL,
        notes_sheet_details NVARCHAR(MAX) NULL,
        preferred_contact_method NVARCHAR(50) NULL,
        preferred_contact_value NVARCHAR(255) NULL,
        additional_information NVARCHAR(MAX) NULL,
        approved_time_diff_acknowledged BIT NOT NULL DEFAULT 0,
        submitted_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        submitted_by_user_id NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_asa_exam_request_faculty_response_request UNIQUE (exam_request_id),
        CONSTRAINT FK_asa_exam_request_faculty_response_request FOREIGN KEY (exam_request_id) REFERENCES asa.exam_request(exam_request_id) ON DELETE CASCADE,
        CONSTRAINT CK_asa_exam_request_faculty_response_duration CHECK (duration_minutes IS NULL OR duration_minutes BETWEEN 5 AND 180),
        CONSTRAINT CK_asa_exam_request_faculty_response_contact_method CHECK (preferred_contact_method IS NULL OR preferred_contact_method IN ('email', 'phone'))
    );
END;
GO

IF OBJECT_ID('asa.exam_request_staff_action', 'U') IS NULL
BEGIN
    CREATE TABLE asa.exam_request_staff_action (
        exam_request_staff_action_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        exam_request_id UNIQUEIDENTIFIER NOT NULL,
        action_type NVARCHAR(100) NOT NULL,
        from_status NVARCHAR(50) NULL,
        to_status NVARCHAR(50) NULL,
        staff_notes NVARCHAR(MAX) NULL,
        acted_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        acted_by_user_id NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_asa_exam_request_staff_action_request FOREIGN KEY (exam_request_id) REFERENCES asa.exam_request(exam_request_id) ON DELETE CASCADE
    );
END;
GO

IF OBJECT_ID('asa.faculty_exam_preference', 'U') IS NULL
BEGIN
    CREATE TABLE asa.faculty_exam_preference (
        faculty_exam_preference_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        course_section_id UNIQUEIDENTIFIER NOT NULL,
        provided_to_asa_method NVARCHAR(100) NULL,
        return_method NVARCHAR(100) NULL,
        calculator_policy NVARCHAR(100) NULL,
        notes_sheet_allowed BIT NULL,
        notes_sheet_details NVARCHAR(MAX) NULL,
        preferred_contact_method NVARCHAR(50) NULL,
        preferred_contact_value NVARCHAR(255) NULL,
        additional_information NVARCHAR(MAX) NULL,
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_by_user_id NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_asa_faculty_exam_preference_section UNIQUE (course_section_id),
        CONSTRAINT FK_asa_faculty_exam_preference_section FOREIGN KEY (course_section_id) REFERENCES asa.course_section(course_section_id) ON DELETE CASCADE,
        CONSTRAINT CK_asa_faculty_exam_preference_contact_method CHECK (preferred_contact_method IS NULL OR preferred_contact_method IN ('email', 'phone'))
    );
END;
GO

IF OBJECT_ID('asa.uploaded_exam', 'U') IS NULL
BEGIN
    CREATE TABLE asa.uploaded_exam (
        uploaded_exam_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        course_section_id UNIQUEIDENTIFIER NOT NULL,
        uploaded_by_user_id NVARCHAR(255) NULL,
        title NVARCHAR(255) NOT NULL,
        file_name NVARCHAR(255) NOT NULL,
        storage_path NVARCHAR(500) NOT NULL,
        mime_type NVARCHAR(255) NULL,
        delivery_method NVARCHAR(100) NULL,
        class_exam_date DATE NULL,
        class_exam_time NVARCHAR(50) NULL,
        notes NVARCHAR(MAX) NULL,
        uploaded_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_asa_uploaded_exam_section FOREIGN KEY (course_section_id) REFERENCES asa.course_section(course_section_id) ON DELETE CASCADE
    );
END;
GO

IF OBJECT_ID('asa.documentation_record', 'U') IS NULL
BEGIN
    CREATE TABLE asa.documentation_record (
        documentation_record_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        student_id UNIQUEIDENTIFIER NOT NULL,
        file_name NVARCHAR(255) NOT NULL,
        storage_path NVARCHAR(500) NOT NULL,
        mime_type NVARCHAR(255) NULL,
        documentation_type NVARCHAR(100) NULL,
        status NVARCHAR(50) NOT NULL,
        uploaded_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        reviewed_at DATETIME2 NULL,
        reviewed_by_user_id NVARCHAR(255) NULL,
        review_notes NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_asa_documentation_record_student FOREIGN KEY (student_id) REFERENCES asa.student(student_id)
    );
END;
GO

IF OBJECT_ID('asa.accommodation_profile', 'U') IS NULL
BEGIN
    CREATE TABLE asa.accommodation_profile (
        accommodation_profile_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        student_id UNIQUEIDENTIFIER NOT NULL,
        effective_start_date DATE NULL,
        effective_end_date DATE NULL,
        status NVARCHAR(50) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_asa_accommodation_profile_student FOREIGN KEY (student_id) REFERENCES asa.student(student_id)
    );
END;
GO

IF OBJECT_ID('asa.accommodation_item', 'U') IS NULL
BEGIN
    CREATE TABLE asa.accommodation_item (
        accommodation_item_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        accommodation_profile_id UNIQUEIDENTIFIER NOT NULL,
        accommodation_code NVARCHAR(100) NOT NULL,
        accommodation_name NVARCHAR(255) NOT NULL,
        details NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_asa_accommodation_item_profile FOREIGN KEY (accommodation_profile_id) REFERENCES asa.accommodation_profile(accommodation_profile_id) ON DELETE CASCADE
    );
END;
GO

IF OBJECT_ID('asa.accommodation_letter', 'U') IS NULL
BEGIN
    CREATE TABLE asa.accommodation_letter (
        accommodation_letter_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        student_id UNIQUEIDENTIFIER NOT NULL,
        course_section_id UNIQUEIDENTIFIER NOT NULL,
        term_id UNIQUEIDENTIFIER NOT NULL,
        status NVARCHAR(50) NOT NULL,
        sent_at DATETIME2 NULL,
        generated_content_snapshot NVARCHAR(MAX) NULL,
        sent_to_email NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_asa_accommodation_letter_student FOREIGN KEY (student_id) REFERENCES asa.student(student_id),
        CONSTRAINT FK_asa_accommodation_letter_section FOREIGN KEY (course_section_id) REFERENCES asa.course_section(course_section_id),
        CONSTRAINT FK_asa_accommodation_letter_term FOREIGN KEY (term_id) REFERENCES asa.term(term_id)
    );
END;
GO

-- =========================
-- AUDIT / INTEGRATION DATA
-- =========================

IF OBJECT_ID('asa.audit_event', 'U') IS NULL
BEGIN
    CREATE TABLE asa.audit_event (
        audit_event_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        entity_type NVARCHAR(100) NOT NULL,
        entity_id UNIQUEIDENTIFIER NOT NULL,
        action NVARCHAR(100) NOT NULL,
        old_value_json NVARCHAR(MAX) NULL,
        new_value_json NVARCHAR(MAX) NULL,
        acted_by_user_id NVARCHAR(255) NULL,
        acted_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID('asa.integration_event', 'U') IS NULL
BEGIN
    CREATE TABLE asa.integration_event (
        integration_event_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        entity_type NVARCHAR(100) NOT NULL,
        entity_id UNIQUEIDENTIFIER NOT NULL,
        integration_name NVARCHAR(100) NOT NULL,
        action_type NVARCHAR(100) NOT NULL,
        external_reference_id NVARCHAR(255) NULL,
        status NVARCHAR(50) NOT NULL,
        requested_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        completed_at DATETIME2 NULL,
        error_message NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- =========================
-- IMPORT PIPELINE TABLES
-- =========================

IF OBJECT_ID('asa.import_batch', 'U') IS NULL
BEGIN
    CREATE TABLE asa.import_batch (
        import_batch_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        source_system NVARCHAR(100) NOT NULL,
        batch_name NVARCHAR(255) NULL,
        received_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        processed_at DATETIME2 NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'received',
        notes NVARCHAR(MAX) NULL
    );
END;
GO

IF OBJECT_ID('asa.import_file', 'U') IS NULL
BEGIN
    CREATE TABLE asa.import_file (
        import_file_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        import_batch_id UNIQUEIDENTIFIER NOT NULL,
        file_name NVARCHAR(255) NOT NULL,
        file_type NVARCHAR(100) NULL,
        storage_path NVARCHAR(500) NULL,
        row_count INT NULL,
        processed_at DATETIME2 NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'received',
        CONSTRAINT FK_asa_import_file_batch FOREIGN KEY (import_batch_id) REFERENCES asa.import_batch(import_batch_id) ON DELETE CASCADE
    );
END;
GO

IF OBJECT_ID('asa.import_error', 'U') IS NULL
BEGIN
    CREATE TABLE asa.import_error (
        import_error_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        import_batch_id UNIQUEIDENTIFIER NULL,
        import_file_id UNIQUEIDENTIFIER NULL,
        entity_type NVARCHAR(100) NULL,
        row_identifier NVARCHAR(255) NULL,
        error_message NVARCHAR(MAX) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_asa_import_error_batch FOREIGN KEY (import_batch_id) REFERENCES asa.import_batch(import_batch_id) ON DELETE CASCADE,
        CONSTRAINT FK_asa_import_error_file FOREIGN KEY (import_file_id) REFERENCES asa.import_file(import_file_id) ON DELETE CASCADE
    );
END;
GO

-- =========================
-- INDEXES
-- =========================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_student_source' AND object_id = OBJECT_ID('asa.student'))
    CREATE INDEX IX_asa_student_source ON asa.student(source_system, source_student_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_instructor_source' AND object_id = OBJECT_ID('asa.instructor'))
    CREATE INDEX IX_asa_instructor_source ON asa.instructor(source_system, source_instructor_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_term_source' AND object_id = OBJECT_ID('asa.term'))
    CREATE INDEX IX_asa_term_source ON asa.term(source_system, source_term_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_course_source' AND object_id = OBJECT_ID('asa.course'))
    CREATE INDEX IX_asa_course_source ON asa.course(source_system, source_course_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_course_section_source' AND object_id = OBJECT_ID('asa.course_section'))
    CREATE INDEX IX_asa_course_section_source ON asa.course_section(source_system, source_section_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_enrollment_student' AND object_id = OBJECT_ID('asa.enrollment'))
    CREATE INDEX IX_asa_enrollment_student ON asa.enrollment(student_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_enrollment_section' AND object_id = OBJECT_ID('asa.enrollment'))
    CREATE INDEX IX_asa_enrollment_section ON asa.enrollment(course_section_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_exam_request_student' AND object_id = OBJECT_ID('asa.exam_request'))
    CREATE INDEX IX_asa_exam_request_student ON asa.exam_request(student_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_exam_request_section' AND object_id = OBJECT_ID('asa.exam_request'))
    CREATE INDEX IX_asa_exam_request_section ON asa.exam_request(course_section_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_exam_request_workflow_status' AND object_id = OBJECT_ID('asa.exam_request'))
    CREATE INDEX IX_asa_exam_request_workflow_status ON asa.exam_request(workflow_status);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_exam_request_staff_status' AND object_id = OBJECT_ID('asa.exam_request'))
    CREATE INDEX IX_asa_exam_request_staff_status ON asa.exam_request(staff_status);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_exam_request_staff_action_request' AND object_id = OBJECT_ID('asa.exam_request_staff_action'))
    CREATE INDEX IX_asa_exam_request_staff_action_request ON asa.exam_request_staff_action(exam_request_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_uploaded_exam_section' AND object_id = OBJECT_ID('asa.uploaded_exam'))
    CREATE INDEX IX_asa_uploaded_exam_section ON asa.uploaded_exam(course_section_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_documentation_student' AND object_id = OBJECT_ID('asa.documentation_record'))
    CREATE INDEX IX_asa_documentation_student ON asa.documentation_record(student_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_accommodation_profile_student' AND object_id = OBJECT_ID('asa.accommodation_profile'))
    CREATE INDEX IX_asa_accommodation_profile_student ON asa.accommodation_profile(student_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_accommodation_letter_student' AND object_id = OBJECT_ID('asa.accommodation_letter'))
    CREATE INDEX IX_asa_accommodation_letter_student ON asa.accommodation_letter(student_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_accommodation_letter_section' AND object_id = OBJECT_ID('asa.accommodation_letter'))
    CREATE INDEX IX_asa_accommodation_letter_section ON asa.accommodation_letter(course_section_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_audit_event_entity' AND object_id = OBJECT_ID('asa.audit_event'))
    CREATE INDEX IX_asa_audit_event_entity ON asa.audit_event(entity_type, entity_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_integration_event_entity' AND object_id = OBJECT_ID('asa.integration_event'))
    CREATE INDEX IX_asa_integration_event_entity ON asa.integration_event(entity_type, entity_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_import_batch_source' AND object_id = OBJECT_ID('asa.import_batch'))
    CREATE INDEX IX_asa_import_batch_source ON asa.import_batch(source_system, status);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_import_file_batch' AND object_id = OBJECT_ID('asa.import_file'))
    CREATE INDEX IX_asa_import_file_batch ON asa.import_file(import_batch_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_import_error_batch' AND object_id = OBJECT_ID('asa.import_error'))
    CREATE INDEX IX_asa_import_error_batch ON asa.import_error(import_batch_id);
GO