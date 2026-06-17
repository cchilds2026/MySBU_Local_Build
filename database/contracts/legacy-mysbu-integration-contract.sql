/*
  Legacy MySBU / Ektron integration contract

  Purpose:
  - Defines the stable SQL shape the ASA app will query.
  - Lets IT/DBA map ektron_mysbuINT tables later without changing Flask or frontend code.
  - Keeps ektron_mysbuINT read-only from the app.

  Expected production source:
  - [ektron_mysbuINT] on the same SQL Server instance as [student_success]

  Production instruction:
  - IT/DBA should replace the SELECT body in asa.v_legacy_mysbu_form_submission
    with the correct ektron_mysbuINT table/view joins.
  - Do not grant INSERT, UPDATE, DELETE, or DDL permissions to the ASA app against ektron_mysbuINT.
*/

USE [student_success];
GO

IF SCHEMA_ID(N'asa') IS NULL
BEGIN
    EXEC(N'CREATE SCHEMA asa');
END
GO

IF OBJECT_ID(N'asa.legacy_mysbu_form_submission_mock', N'U') IS NULL
BEGIN
    CREATE TABLE asa.legacy_mysbu_form_submission_mock (
        legacy_submission_id NVARCHAR(100) NOT NULL PRIMARY KEY,
        source_system NVARCHAR(100) NOT NULL CONSTRAINT DF_legacy_mysbu_source_system DEFAULT ('mock'),
        source_form_name NVARCHAR(200) NOT NULL,
        submitted_at DATETIME2 NULL,
        student_identifier NVARCHAR(50) NULL,
        student_email NVARCHAR(255) NULL,
        student_first_name NVARCHAR(100) NULL,
        student_last_name NVARCHAR(100) NULL,
        raw_status NVARCHAR(100) NULL,
        source_url NVARCHAR(500) NULL,
        raw_payload NVARCHAR(MAX) NULL
    );
END
GO

CREATE OR ALTER VIEW asa.v_legacy_mysbu_form_submission AS
SELECT
    legacy_submission_id,
    source_system,
    source_form_name,
    submitted_at,
    student_identifier,
    student_email,
    student_first_name,
    student_last_name,
    raw_status,
    source_url,
    raw_payload
FROM asa.legacy_mysbu_form_submission_mock;
GO

/*
  IT/DBA production mapping template:

  CREATE OR ALTER VIEW asa.v_legacy_mysbu_form_submission AS
  SELECT
      CAST(<ektron primary key> AS NVARCHAR(100)) AS legacy_submission_id,
      'ektron_mysbuINT' AS source_system,
      CAST(<form title/name> AS NVARCHAR(200)) AS source_form_name,
      CAST(<submitted datetime> AS DATETIME2) AS submitted_at,
      CAST(<SBU ID / username / Colleague ID> AS NVARCHAR(50)) AS student_identifier,
      CAST(<student email> AS NVARCHAR(255)) AS student_email,
      CAST(<student first name> AS NVARCHAR(100)) AS student_first_name,
      CAST(<student last name> AS NVARCHAR(100)) AS student_last_name,
      CAST(<legacy status> AS NVARCHAR(100)) AS raw_status,
      CAST(<source URL if available> AS NVARCHAR(500)) AS source_url,
      CAST(<raw form payload if useful> AS NVARCHAR(MAX)) AS raw_payload
  FROM [ektron_mysbuINT].[dbo].[<table_or_view>] AS e
  WHERE <filters to only include relevant MySBU/ASA form records>;
*/
