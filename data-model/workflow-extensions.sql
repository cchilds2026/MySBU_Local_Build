-- ASA Platform - Workflow Extension Schema
-- SQL Server version for database: student_success
-- Schema: asa
--
-- This file extends data-model/schema.sql with workflow-detail tables needed
-- to move intake agreements, student-initiated letter requests, and exam
-- scheduling out of PDFs, spreadsheets, and email.

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
-- INTAKE / AGREEMENT DATA
-- =========================

IF OBJECT_ID('asa.student_intake_packet', 'U') IS NULL
BEGIN
    CREATE TABLE asa.student_intake_packet (
        student_intake_packet_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        student_id UNIQUEIDENTIFIER NOT NULL,
        student_registration_request_id UNIQUEIDENTIFIER NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'started',
        registration_received_at DATETIME2 NULL,
        documentation_received_at DATETIME2 NULL,
        ready_to_schedule_at DATETIME2 NULL,
        intake_scheduled_at DATETIME2 NULL,
        intake_completed_at DATETIME2 NULL,
        navigate_appointment_reference NVARCHAR(255) NULL,
        assigned_staff_user_id NVARCHAR(255) NULL,
        staff_notes NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_asa_student_intake_packet_student FOREIGN KEY (student_id) REFERENCES asa.student(student_id),
        CONSTRAINT FK_asa_student_intake_packet_registration_request FOREIGN KEY (student_registration_request_id) REFERENCES asa.student_registration_request(student_registration_request_id),
        CONSTRAINT CK_asa_student_intake_packet_status CHECK (status IN (
            'started',
            'registration_received',
            'documentation_pending',
            'documentation_received',
            'ready_to_schedule',
            'scheduled',
            'intake_complete',
            'closed',
            'cancelled'
        ))
    );
END;
GO

IF OBJECT_ID('asa.student_agreement', 'U') IS NULL
BEGIN
    CREATE TABLE asa.student_agreement (
        student_agreement_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        student_id UNIQUEIDENTIFIER NOT NULL,
        agreement_type NVARCHAR(100) NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'pending',
        signed_at DATETIME2 NULL,
        expires_at DATETIME2 NULL,
        revoked_at DATETIME2 NULL,
        due_at DATETIME2 NULL,
        document_record_id UNIQUEIDENTIFIER NULL,
        related_accommodation_item_id UNIQUEIDENTIFIER NULL,
        notes NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_asa_student_agreement_student FOREIGN KEY (student_id) REFERENCES asa.student(student_id),
        CONSTRAINT FK_asa_student_agreement_document FOREIGN KEY (document_record_id) REFERENCES asa.documentation_record(documentation_record_id),
        CONSTRAINT FK_asa_student_agreement_accommodation_item FOREIGN KEY (related_accommodation_item_id) REFERENCES asa.accommodation_item(accommodation_item_id),
        CONSTRAINT CK_asa_student_agreement_status CHECK (status IN (
            'pending',
            'signed',
            'expired',
            'revoked',
            'waived'
        ))
    );
END;
GO

-- =========================
-- LETTER REQUEST WORKFLOW
-- =========================

IF OBJECT_ID('asa.accommodation_letter_request', 'U') IS NULL
BEGIN
    CREATE TABLE asa.accommodation_letter_request (
        accommodation_letter_request_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        student_id UNIQUEIDENTIFIER NOT NULL,
        course_section_id UNIQUEIDENTIFIER NOT NULL,
        term_id UNIQUEIDENTIFIER NOT NULL,
        requested_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        requested_by_user_id NVARCHAR(255) NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'requested',
        student_acknowledged BIT NOT NULL DEFAULT 0,
        reviewed_at DATETIME2 NULL,
        reviewed_by_user_id NVARCHAR(255) NULL,
        staff_notes NVARCHAR(MAX) NULL,
        accommodation_letter_id UNIQUEIDENTIFIER NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_asa_accommodation_letter_request_student FOREIGN KEY (student_id) REFERENCES asa.student(student_id),
        CONSTRAINT FK_asa_accommodation_letter_request_section FOREIGN KEY (course_section_id) REFERENCES asa.course_section(course_section_id),
        CONSTRAINT FK_asa_accommodation_letter_request_term FOREIGN KEY (term_id) REFERENCES asa.term(term_id),
        CONSTRAINT FK_asa_accommodation_letter_request_letter FOREIGN KEY (accommodation_letter_id) REFERENCES asa.accommodation_letter(accommodation_letter_id),
        CONSTRAINT CK_asa_accommodation_letter_request_status CHECK (status IN (
            'requested',
            'pending_staff_review',
            'ready_to_send',
            'sent',
            'cancelled',
            'superseded'
        ))
    );
END;
GO

-- =========================
-- EXAM SCHEDULING WORKFLOW
-- =========================

IF COL_LENGTH('asa.exam_request', 'class_exam_date') IS NULL
BEGIN
    ALTER TABLE asa.exam_request ADD class_exam_date DATE NULL;
END;
GO

IF COL_LENGTH('asa.exam_request', 'class_exam_time') IS NULL
BEGIN
    ALTER TABLE asa.exam_request ADD class_exam_time NVARCHAR(50) NULL;
END;
GO

IF COL_LENGTH('asa.exam_request', 'guidelines_acknowledged_at') IS NULL
BEGIN
    ALTER TABLE asa.exam_request ADD guidelines_acknowledged_at DATETIME2 NULL;
END;
GO

IF OBJECT_ID('asa.testing_room', 'U') IS NULL
BEGIN
    CREATE TABLE asa.testing_room (
        testing_room_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        room_code NVARCHAR(50) NOT NULL,
        room_name NVARCHAR(255) NOT NULL,
        location_description NVARCHAR(500) NULL,
        capacity INT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        notes NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_asa_testing_room_code UNIQUE (room_code),
        CONSTRAINT CK_asa_testing_room_capacity CHECK (capacity IS NULL OR capacity > 0)
    );
END;
GO

IF OBJECT_ID('asa.exam_schedule_assignment', 'U') IS NULL
BEGIN
    CREATE TABLE asa.exam_schedule_assignment (
        exam_schedule_assignment_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        exam_request_id UNIQUEIDENTIFIER NOT NULL,
        testing_room_id UNIQUEIDENTIFIER NULL,
        assigned_staff_user_id NVARCHAR(255) NULL,
        scheduled_start_at DATETIME2 NOT NULL,
        scheduled_end_at DATETIME2 NULL,
        outlook_event_integration_event_id UNIQUEIDENTIFIER NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'draft',
        staff_notes NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_asa_exam_schedule_assignment_request FOREIGN KEY (exam_request_id) REFERENCES asa.exam_request(exam_request_id) ON DELETE CASCADE,
        CONSTRAINT FK_asa_exam_schedule_assignment_room FOREIGN KEY (testing_room_id) REFERENCES asa.testing_room(testing_room_id),
        CONSTRAINT FK_asa_exam_schedule_assignment_integration_event FOREIGN KEY (outlook_event_integration_event_id) REFERENCES asa.integration_event(integration_event_id),
        CONSTRAINT CK_asa_exam_schedule_assignment_status CHECK (status IN (
            'draft',
            'scheduled',
            'rescheduled',
            'completed',
            'cancelled',
            'no_show'
        )),
        CONSTRAINT CK_asa_exam_schedule_assignment_time CHECK (scheduled_end_at IS NULL OR scheduled_end_at > scheduled_start_at)
    );
END;
GO

-- =========================
-- INDEXES
-- =========================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_student_intake_packet_student' AND object_id = OBJECT_ID('asa.student_intake_packet'))
    CREATE INDEX IX_asa_student_intake_packet_student ON asa.student_intake_packet(student_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_student_intake_packet_status' AND object_id = OBJECT_ID('asa.student_intake_packet'))
    CREATE INDEX IX_asa_student_intake_packet_status ON asa.student_intake_packet(status);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_student_agreement_student' AND object_id = OBJECT_ID('asa.student_agreement'))
    CREATE INDEX IX_asa_student_agreement_student ON asa.student_agreement(student_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_student_agreement_type_status' AND object_id = OBJECT_ID('asa.student_agreement'))
    CREATE INDEX IX_asa_student_agreement_type_status ON asa.student_agreement(agreement_type, status);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_accommodation_letter_request_student' AND object_id = OBJECT_ID('asa.accommodation_letter_request'))
    CREATE INDEX IX_asa_accommodation_letter_request_student ON asa.accommodation_letter_request(student_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_accommodation_letter_request_section' AND object_id = OBJECT_ID('asa.accommodation_letter_request'))
    CREATE INDEX IX_asa_accommodation_letter_request_section ON asa.accommodation_letter_request(course_section_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_accommodation_letter_request_status' AND object_id = OBJECT_ID('asa.accommodation_letter_request'))
    CREATE INDEX IX_asa_accommodation_letter_request_status ON asa.accommodation_letter_request(status);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_testing_room_active' AND object_id = OBJECT_ID('asa.testing_room'))
    CREATE INDEX IX_asa_testing_room_active ON asa.testing_room(is_active, room_name);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_exam_schedule_assignment_request' AND object_id = OBJECT_ID('asa.exam_schedule_assignment'))
    CREATE INDEX IX_asa_exam_schedule_assignment_request ON asa.exam_schedule_assignment(exam_request_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_exam_schedule_assignment_room_time' AND object_id = OBJECT_ID('asa.exam_schedule_assignment'))
    CREATE INDEX IX_asa_exam_schedule_assignment_room_time ON asa.exam_schedule_assignment(testing_room_id, scheduled_start_at);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_asa_exam_schedule_assignment_status' AND object_id = OBJECT_ID('asa.exam_schedule_assignment'))
    CREATE INDEX IX_asa_exam_schedule_assignment_status ON asa.exam_schedule_assignment(status);
GO
