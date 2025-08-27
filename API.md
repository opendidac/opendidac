# OpenDidac API Endpoints Reference

This document provides a comprehensive overview of all API endpoints available in the OpenDidac educational platform. The platform supports various user roles with different levels of access to manage questions, evaluations, grading, and administrative functions.

## Table of Contents
- [Authentication & System](#authentication--system)
- [Users Management](#users-management)
- [Groups Management](#groups-management)
- [Admin - Archive Management](#admin---archive-management)
- [Group-Scoped - Questions](#group-scoped---questions)
- [Group-Scoped - Code Questions](#group-scoped---code-questions)
- [Group-Scoped - Database Questions](#group-scoped---database-questions)
- [Group-Scoped - Multiple Choice Questions](#group-scoped---multiple-choice-questions)
- [Group-Scoped - Evaluations](#group-scoped---evaluations)
- [Group-Scoped - Grading](#group-scoped---grading)
- [Group-Scoped - File Management](#group-scoped---file-management)
- [Student - Evaluation Access](#student---evaluation-access)
- [Student - Answer Submission](#student---answer-submission)
- [Sandbox Execution](#sandbox-execution)

## Authentication & System

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/conn_check` | GET | None (Public) | Health check endpoint for monitoring service availability and connectivity status |
| `/api/session-sse` | GET | Authenticated | Server-sent events endpoint for real-time session monitoring and automatic logout on session invalidation |
| `/api/maintenance` | POST | SUPER_ADMIN | Execute system maintenance operations including sandbox updates and cleanup of unused uploaded files |
| `/api/auth/[...nextauth]` | GET, POST | None (Public) | NextAuth.js authentication endpoints handling login, logout, callback, and session management |
| `/api/assets/[...path]` | GET | None (Public) | Static asset serving for uploaded files, images, and other media content with proper content-type headers |

## Users Management

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/users` | GET | PROFESSOR, SUPER_ADMIN | Search and paginate through users with filtering by role, name, or email for user selection and management |
| `/api/users/[userId]` | PATCH | SUPER_ADMIN | Update user role assignments (STUDENT, PROFESSOR, SUPER_ADMIN, ARCHIVIST) with validation of role permissions |
| `/api/users/groups` | GET | PROFESSOR, SUPER_ADMIN | Retrieve list of groups that the authenticated user belongs to with membership details |
| `/api/users/groups/select` | POST | PROFESSOR, SUPER_ADMIN | Set the user's active/selected group for group-scoped operations and navigation |

## Groups Management

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/groups` | GET | SUPER_ADMIN | List all groups in the system with member counts, creation details, and activity statistics for administrative oversight |
| `/api/groups` | POST | PROFESSOR | Create new educational groups with unique labels and scopes for organizing courses or class sections |
| `/api/groups/check` | GET | PROFESSOR | Validate group name/scope availability during creation or editing to prevent conflicts |
| `/api/groups/[groupId]` | DELETE | PROFESSOR | Delete a group and all associated content (questions, evaluations) - restricted to group creators |
| `/api/groups/[groupId]` | PUT | PROFESSOR | Update group metadata (label, scope) with uniqueness validation across the system |
| `/api/groups/[groupId]/members` | GET | PROFESSOR | List all members of a specific group with their roles and membership details |
| `/api/groups/[groupId]/members` | POST | PROFESSOR | Add new members to a group by user ID with duplicate membership prevention |
| `/api/groups/[groupId]/members` | DELETE | PROFESSOR | Remove members from a group (self-removal or admin removal with proper authorization) |

## Admin - Archive Management

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/admin/archive` | GET | SUPER_ADMIN, ARCHIVIST | List evaluations across all groups filtered by archival status (active, marked for archival, archived, purged) |
| `/api/admin/archive/[evaluationId]/mark-for-archival` | POST | SUPER_ADMIN, ARCHIVIST | Mark evaluation for future archival with optional deadline setting and notification scheduling |
| `/api/admin/archive/[evaluationId]/archive-immediately` | POST | SUPER_ADMIN, ARCHIVIST | Immediately archive evaluation data while preserving metadata and making content read-only |
| `/api/admin/archive/[evaluationId]/archive` | POST | SUPER_ADMIN, ARCHIVIST | Complete the archival process for evaluations marked for archival with full data preservation |
| `/api/admin/archive/[evaluationId]/purge-data` | POST | SUPER_ADMIN, ARCHIVIST | Permanently delete evaluation data while keeping minimal metadata for audit trails |
| `/api/admin/archive/[evaluationId]/purge-without-archive` | POST | SUPER_ADMIN, ARCHIVIST | Directly purge evaluation without archival step for immediate permanent deletion |
| `/api/admin/archive/[evaluationId]/back-to-active` | POST | SUPER_ADMIN, ARCHIVIST | Restore archived or marked evaluations back to active status with full functionality |

## Group-Scoped - Questions

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/[groupScope]/questions` | GET | PROFESSOR | List questions within a group with filtering by type, status, tags, and search capabilities |
| `/api/[groupScope]/questions` | POST | PROFESSOR | Create new questions of various types (multiple choice, essay, code, database, web) with full configuration |
| `/api/[groupScope]/questions/tags` | GET | PROFESSOR | Retrieve all available tags for questions within the group for categorization and filtering |
| `/api/[groupScope]/questions/tags` | POST | PROFESSOR | Create new tags for question categorization and organization within the group scope |
| `/api/[groupScope]/questions/[questionId]` | GET | PROFESSOR | Get complete question details including content, configuration, and type-specific settings |
| `/api/[groupScope]/questions/[questionId]` | PUT | PROFESSOR | Update question content, settings, points, and type-specific configurations with validation |
| `/api/[groupScope]/questions/[questionId]` | DELETE | PROFESSOR | Permanently delete questions that are not part of any active evaluations |
| `/api/[groupScope]/questions/[questionId]/copy` | POST | PROFESSOR | Create copies of questions within the same or different groups with dependency resolution |
| `/api/[groupScope]/questions/[questionId]/archive` | POST | PROFESSOR | Archive questions to hide them from active use while preserving them in existing evaluations |
| `/api/[groupScope]/questions/[questionId]/unarchive` | POST | PROFESSOR | Restore archived questions back to active status for reuse in new evaluations |
| `/api/[groupScope]/questions/[questionId]/tags` | GET | PROFESSOR | Get all tags assigned to a specific question for organization and filtering |
| `/api/[groupScope]/questions/[questionId]/tags` | POST | PROFESSOR | Add tags to questions for improved categorization and search capabilities |
| `/api/[groupScope]/questions/[questionId]/tags` | DELETE | PROFESSOR | Remove tags from questions when reorganizing or updating categorization |

## Group-Scoped - Code Questions

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/[groupScope]/questions/[questionId]/code` | GET | PROFESSOR | Get code question configuration including language, type (reading/writing), and execution settings |
| `/api/[groupScope]/questions/[questionId]/code` | PUT | PROFESSOR | Update code question settings, language selection, and switch between reading/writing modes |
| `/api/[groupScope]/questions/[questionId]/code/sandbox` | GET | PROFESSOR | Retrieve sandbox execution environment configuration including Docker image and setup scripts |
| `/api/[groupScope]/questions/[questionId]/code/sandbox` | PUT | PROFESSOR | Configure sandbox environment with custom Docker images, dependencies, and pre-execution setup |
| `/api/[groupScope]/questions/[questionId]/code/code-writing` | GET | PROFESSOR | Get code writing question details including template files, solution files, and test cases |
| `/api/[groupScope]/questions/[questionId]/code/code-writing` | PUT | PROFESSOR | Update code writing configuration, enable/disable code checking, and modify execution settings |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/files/[nature]` | GET | PROFESSOR | List template or solution files for code writing questions with file metadata and permissions |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/files/[nature]` | POST | PROFESSOR | Create new template or solution files with proper ordering and permission settings |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/files/[nature]/pull` | POST | PROFESSOR | Bulk import template files from solution files to maintain consistency across question variants |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/files/[nature]/[fileId]` | GET | PROFESSOR | Get specific file content, metadata, and student permission settings for code questions |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/files/[nature]/[fileId]` | PUT | PROFESSOR | Update file content, path, and student permissions (view/edit/hidden) for code exercises |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/files/[nature]/[fileId]` | DELETE | PROFESSOR | Remove files from code questions with dependency checking and cleanup |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/tests` | GET | PROFESSOR | List all test cases for code writing questions with input/output specifications and execution commands |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/tests` | POST | PROFESSOR | Create new test cases with input data, expected output, and custom execution parameters |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/tests/[index]` | GET | PROFESSOR | Get specific test case details including execution command, input, and expected output |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/tests/[index]` | PUT | PROFESSOR | Update test case parameters, input/output data, and execution settings with validation |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/tests/[index]` | DELETE | PROFESSOR | Remove test cases from code questions with reordering of remaining test indices |
| `/api/[groupScope]/questions/[questionId]/code/code-reading` | GET | PROFESSOR | Get code reading question configuration including context files and output testing settings |
| `/api/[groupScope]/questions/[questionId]/code/code-reading` | PUT | PROFESSOR | Update code reading settings, context execution environment, and student output testing options |
| `/api/[groupScope]/questions/[questionId]/code/code-reading/snippets` | GET | PROFESSOR | List code snippets for reading comprehension with expected outputs and ordering |
| `/api/[groupScope]/questions/[questionId]/code/code-reading/snippets` | POST | PROFESSOR | Create new code snippets with expected outputs for student analysis and comprehension |
| `/api/[groupScope]/questions/[questionId]/code/code-reading/snippets/[snippetId]` | GET | PROFESSOR | Get specific code snippet content and expected output for reading questions |
| `/api/[groupScope]/questions/[questionId]/code/code-reading/snippets/[snippetId]` | PUT | PROFESSOR | Update code snippet content, expected output, and ordering within the question |
| `/api/[groupScope]/questions/[questionId]/code/code-reading/snippets/[snippetId]` | DELETE | PROFESSOR | Remove code snippets with proper reordering and dependency cleanup |

## Group-Scoped - Database Questions

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/[groupScope]/questions/[questionId]/database` | GET | PROFESSOR | Get database question configuration including Docker image, database schema, and query settings |
| `/api/[groupScope]/questions/[questionId]/database` | PUT | PROFESSOR | Update database question settings, change database engine, and configure execution environment |
| `/api/[groupScope]/questions/[questionId]/database/queries` | GET | PROFESSOR | List solution queries for database questions with execution order and expected results |
| `/api/[groupScope]/questions/[questionId]/database/queries` | POST | PROFESSOR | Create new solution queries with SQL content, description, and output validation settings |
| `/api/[groupScope]/questions/[questionId]/database/queries/[queryId]` | GET | PROFESSOR | Get specific database query details including SQL content, linting rules, and expected output |
| `/api/[groupScope]/questions/[questionId]/database/queries/[queryId]` | PUT | PROFESSOR | Update query SQL content, enable/disable linting, and modify output validation parameters |
| `/api/[groupScope]/questions/[questionId]/database/queries/[queryId]` | DELETE | PROFESSOR | Remove database queries with proper cleanup and reordering of remaining queries |

## Group-Scoped - Multiple Choice Questions

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/[groupScope]/questions/[questionId]/multiple-choice` | GET | PROFESSOR | Get multiple choice configuration including grading policy, selection limits, and comment settings |
| `/api/[groupScope]/questions/[questionId]/multiple-choice` | PUT | PROFESSOR | Update grading policy (all-or-nothing vs gradual), enable student comments, and set selection limits |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/options` | GET | PROFESSOR | List all answer options with correctness status, ordering, and content for multiple choice questions |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/options` | POST | PROFESSOR | Create new answer options with text content and correctness marking for multiple choice questions |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/options` | PUT | PROFESSOR | Bulk update multiple choice options including text, correctness, and ordering modifications |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/order` | PUT | PROFESSOR | Reorder answer options for multiple choice questions to change presentation sequence |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/grading-policy/gradual-credit` | PUT | PROFESSOR | Configure gradual credit grading with partial points for partially correct multiple choice answers |

## Group-Scoped - Evaluations

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/[groupScope]/evaluations` | GET | PROFESSOR | List evaluations within group with filtering by phase, status, and date ranges for management overview |
| `/api/[groupScope]/evaluations` | POST | PROFESSOR | Create new evaluations with configuration for timing, access control, and initial settings |
| `/api/[groupScope]/evaluations/[evaluationId]` | GET | PROFESSOR | Get complete evaluation details including questions, timing, access settings, and student participation |
| `/api/[groupScope]/evaluations/[evaluationId]` | PUT | PROFESSOR | Update evaluation settings, timing, access control, and grading configuration with validation |
| `/api/[groupScope]/evaluations/[evaluationId]` | DELETE | PROFESSOR | Delete evaluations that haven't started yet with complete cleanup of associated data |
| `/api/[groupScope]/evaluations/[evaluationId]/phase` | POST | PROFESSOR | Progress evaluation through phases (composition → registration → in progress → grading → finished) |
| `/api/[groupScope]/evaluations/[evaluationId]/purge` | POST | PROFESSOR | Clean up evaluation data while preserving structure for reuse or archival |
| `/api/[groupScope]/evaluations/[evaluationId]/export` | GET | PROFESSOR | Export evaluation results in CSV or PDF format with customizable data fields and formatting |
| `/api/[groupScope]/evaluations/[evaluationId]/composition` | GET | PROFESSOR | Get evaluation question composition with ordering, points distribution, and question details |
| `/api/[groupScope]/evaluations/[evaluationId]/composition` | PUT | PROFESSOR | Update evaluation composition by adding/removing questions and adjusting point values |
| `/api/[groupScope]/evaluations/[evaluationId]/composition/order` | PUT | PROFESSOR | Reorder questions within evaluation to change presentation sequence for students |
| `/api/[groupScope]/evaluations/[evaluationId]/questions` | GET | PROFESSOR | List questions included in evaluation with points, order, and addendum information |
| `/api/[groupScope]/evaluations/[evaluationId]/questions/[questionId]` | POST | PROFESSOR | Add questions to evaluation with point allocation and optional addendum instructions |
| `/api/[groupScope]/evaluations/[evaluationId]/questions/[questionId]` | DELETE | PROFESSOR | Remove questions from evaluation composition with point recalculation |
| `/api/[groupScope]/evaluations/[evaluationId]/attendance` | GET | PROFESSOR | Get student attendance information including registration status and access attempts |
| `/api/[groupScope]/evaluations/[evaluationId]/attendance/denied` | GET | PROFESSOR | List students who were denied access due to IP restrictions or access list limitations |
| `/api/[groupScope]/evaluations/[evaluationId]/progress` | GET | PROFESSOR | Monitor real-time student progress including question completion and time remaining |
| `/api/[groupScope]/evaluations/[evaluationId]/results` | GET | PROFESSOR | Get comprehensive evaluation results with scores, statistics, and completion analysis |
| `/api/[groupScope]/evaluations/[evaluationId]/students/allow` | POST | PROFESSOR | Grant access to students who were previously denied due to access restrictions |
| `/api/[groupScope]/evaluations/[evaluationId]/students/denied` | GET | PROFESSOR | View detailed information about students denied access with reasons and timestamps |
| `/api/[groupScope]/evaluations/[evaluationId]/students/[studentEmail]/status` | PUT | PROFESSOR | Update individual student status (mark as finished, reset progress, modify permissions) |
| `/api/[groupScope]/evaluations/[evaluationId]/consult/[userEmail]` | GET | PROFESSOR | View specific student's answers and responses for grading and consultation purposes |

## Group-Scoped - Grading

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/[groupScope]/gradings` | GET | PROFESSOR | List student answers requiring grading with filtering by question type, status, and evaluation |
| `/api/[groupScope]/gradings/annotations` | GET | PROFESSOR | List grading annotations and comments across all student submissions for review |
| `/api/[groupScope]/gradings/annotations` | POST | PROFESSOR | Create grading annotations on student code files or other submission types for feedback |
| `/api/[groupScope]/gradings/annotations/[annotationId]` | GET | PROFESSOR | Get specific annotation details including content, position, and associated student work |
| `/api/[groupScope]/gradings/annotations/[annotationId]` | PUT | PROFESSOR | Update annotation content, modify feedback, or change annotation positioning |
| `/api/[groupScope]/gradings/annotations/[annotationId]` | DELETE | PROFESSOR | Remove grading annotations when feedback is no longer relevant or needs correction |

## Group-Scoped - File Management

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/[groupScope]/upload` | POST | PROFESSOR | Upload files for use in questions, evaluation materials, or course content with size and type validation |

## Student - Evaluation Access

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/users/evaluations/[evaluationId]/join` | POST | STUDENT | Join an evaluation by providing access credentials and agreeing to evaluation conditions |
| `/api/users/evaluations/[evaluationId]/take` | GET | STUDENT | Access evaluation taking interface with questions, timing, and submission capabilities |
| `/api/users/evaluations/[evaluationId]/status` | GET | STUDENT | Get evaluation status including remaining time, completion progress, and submission status |
| `/api/users/evaluations/[evaluationId]/consult` | GET | STUDENT | View own submitted answers and feedback after evaluation completion (if enabled) |
| `/api/users/evaluations/[evaluationId]/dispatch` | GET | STUDENT | Get evaluation dispatch information including next steps and result availability |

## Student - Answer Submission

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers` | GET | STUDENT | Retrieve current answer state for a specific question during evaluation |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers` | PUT | STUDENT | Update answer content for any question type with automatic saving and validation |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/submit` | POST | STUDENT | Submit final answer for a question with completion marking and score calculation |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/multi-choice` | PUT | STUDENT | Update multiple choice selections with validation against selection limits and question constraints |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/multi-choice/options` | POST | STUDENT | Select or deselect multiple choice options with real-time validation and feedback |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-writing/[fileId]` | GET | STUDENT | Get code file content for editing during code writing question attempts |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-writing/[fileId]` | PUT | STUDENT | Update code file content with syntax validation and automatic saving for code questions |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-reading/check` | POST | STUDENT | Validate code reading answers against expected outputs with immediate feedback |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-reading/[snippetId]` | PUT | STUDENT | Submit predicted output for code reading snippets with validation and scoring |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/database/[queryId]` | GET | STUDENT | Get database query execution results and output for verification and debugging |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/database/[queryId]` | PUT | STUDENT | Update SQL query content with syntax validation and execution testing |

## Sandbox Execution

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/sandbox/image/pull` | POST | PROFESSOR | Pull Docker images for sandbox execution environments with progress tracking and error handling |
| `/api/sandbox/[questionId]/code-writing/[nature]` | POST | PROFESSOR | Execute code in sandbox environment for testing solution or template files with full output capture |
| `/api/sandbox/[questionId]/code-reading` | POST | PROFESSOR | Run code reading context execution to generate expected outputs for student comparison |
| `/api/sandbox/[questionId]/database` | POST | PROFESSOR | Execute database queries in isolated environment for testing and validation purposes |
| `/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/code/code-writing` | POST | STUDENT | Execute student code submissions in secure sandbox with test case validation and scoring |
| `/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/database` | POST | STUDENT | Run student database queries with result capture, validation, and security restrictions |
| `/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/database/console` | POST | STUDENT | Interactive database console access for query development and testing during evaluations |

---

## Role Legend

| Role | Description | Access Level |
|------|-------------|--------------|
| **SUPER_ADMIN** | System administrators with full access | Complete system control and user management |
| **ARCHIVIST** | Data archival specialists | Archive management and data lifecycle operations |
| **PROFESSOR** | Course instructors and content creators | Course content, evaluation management, and grading |
| **STUDENT** | Evaluation participants | Evaluation taking and answer submission |
| **None (Public)** | No authentication required | Basic system functions and authentication |
| **Authenticated** | Any logged-in user | Basic session and profile operations |

## Security Notes

- **Group Scope Validation**: All `/api/[groupScope]/...` endpoints automatically validate user membership in the specified group
- **Evaluation Timing**: Student endpoints enforce evaluation time windows and access restrictions
- **File Upload Security**: Uploaded files are scoped to groups with size limits and type validation
- **Sandbox Isolation**: Code execution happens in isolated Docker containers with resource limits
- **Rate Limiting**: Public endpoints implement rate limiting to prevent abuse
- **Session Management**: Real-time session monitoring prevents concurrent logins and ensures session security

## Error Handling

All endpoints return standardized error responses:
- `400` - Bad Request (validation errors, missing parameters)
- `401` - Unauthorized (authentication required or insufficient permissions)
- `403` - Forbidden (access denied for authenticated user)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resources, constraint violations)
- `500` - Internal Server Error (system errors, database issues)

Last Updated: January 2025 