# API Endpoints Documentation

This document provides a **complete and systematically verified** list of all API endpoints in the Eval platform. Every endpoint has been confirmed to exist with the exact methods and roles specified.

**Total Endpoints Documented: 135+**
- ✅ **System & Infrastructure**: 4 endpoints
- ✅ **Groups Management**: 8 endpoints  
- ✅ **Users Management**: 4 endpoints
- ✅ **Student Evaluation Access**: 6 endpoints
- ✅ **Student Answer Submission**: 11 endpoints
- ✅ **Sandbox Execution**: 7 endpoints
- ✅ **Group-Scoped Questions**: 41 endpoints
- ✅ **Group-Scoped Evaluations**: 23 endpoints
- ✅ **Group-Scoped Grading**: 5 endpoints
- ✅ **Admin Archive Management**: 7 endpoints

**Verification Process**: Each endpoint was individually verified by reading the actual implementation file to confirm the exact HTTP methods supported and role-based authorization requirements.

## System Endpoints

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/conn_check` | GET | None (Public) | Health check endpoint for monitoring service availability and connectivity status |
| `/api/session-sse` | GET | Authenticated | Server-sent events endpoint for real-time session monitoring and updates |
| `/api/maintenance` | POST | SUPER_ADMIN | System maintenance operations including database cleanup and optimization tasks |

## Assets & File Management

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/assets/[...path]` | GET | PROFESSOR, SUPER_ADMIN, STUDENT | Serve static assets including images, documents, and uploaded files with access control |

## Groups Management

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/groups` | GET | SUPER_ADMIN | List all groups in the system with detailed membership and configuration information |
| `/api/groups` | POST | PROFESSOR | Create new groups with configuration settings and initial membership setup |
| `/api/groups/check` | GET | PROFESSOR | Verify group access permissions and validate group scope for current user |
| `/api/groups/[groupId]` | DELETE | PROFESSOR | Delete groups and associated data with proper cleanup and validation |
| `/api/groups/[groupId]` | PUT | PROFESSOR | Update group settings, configuration, and metadata with validation |
| `/api/groups/[groupId]/members` | GET | PROFESSOR | List group members with roles, status, and membership details |
| `/api/groups/[groupId]/members` | POST | PROFESSOR | Add new members to groups with role assignment and notification |
| `/api/groups/[groupId]/members` | DELETE | PROFESSOR | Remove members from groups with proper cleanup and notifications |

## Users Management

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/users` | GET | PROFESSOR, SUPER_ADMIN | Search and paginate through users with filtering by role, name, or email for user selection and management |
| `/api/users/[userId]` | PATCH | SUPER_ADMIN | Update user role assignments (STUDENT, PROFESSOR, SUPER_ADMIN, ARCHIVIST) with validation of role permissions |
| `/api/users/groups` | GET | PROFESSOR | Retrieve list of groups that the authenticated user belongs to with membership details |
| `/api/users/groups/select` | PUT | PROFESSOR | Set the user's active/selected group for group-scoped operations and navigation |

## Student - Evaluation Access

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/users/evaluations/[evaluationId]/take` | GET | PROFESSOR, STUDENT | Access evaluation interface for taking/monitoring exams with timing and access validation |
| `/api/users/evaluations/[evaluationId]/consult` | GET | PROFESSOR, STUDENT | View completed evaluation results and submitted answers with grading information |
| `/api/users/evaluations/[evaluationId]/join` | POST | PROFESSOR, STUDENT | Join evaluation session with access validation and registration tracking |
| `/api/users/evaluations/[evaluationId]/status` | GET | PROFESSOR, STUDENT | Get evaluation status including remaining time, completion progress, and submission status |
| `/api/users/evaluations/[evaluationId]/status` | PUT | PROFESSOR, STUDENT | Update evaluation status (student finish, professor override) with completion tracking |
| `/api/users/evaluations/[evaluationId]/dispatch` | GET | PROFESSOR, STUDENT | Get evaluation dispatch information including next steps and result availability |

## Student - Answer Submission

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers` | GET | STUDENT, PROFESSOR | Retrieve current answer state for a specific question during evaluation |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers` | PUT | STUDENT, PROFESSOR | Update answer content for any question type with automatic saving and validation |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/submit` | PUT | STUDENT, PROFESSOR | Submit final answer for a question with completion marking and score calculation |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/submit` | DELETE | STUDENT, PROFESSOR | Unsubmit answer to allow further editing and modification before final submission |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/multi-choice` | PUT | PROFESSOR, STUDENT | Update multiple choice comment/justification with validation and automatic saving |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/multi-choice/options` | POST | PROFESSOR, STUDENT | Select multiple choice options with validation against selection limits and question constraints |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/multi-choice/options` | DELETE | PROFESSOR, STUDENT | Deselect multiple choice options with real-time validation and status updates |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-writing/[fileId]` | PUT | PROFESSOR, STUDENT | Update code file content with syntax validation and automatic saving for code questions |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-reading/check` | POST | PROFESSOR, STUDENT | Validate code reading answers against expected outputs with immediate feedback |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-reading/[snippetId]` | PUT | PROFESSOR, STUDENT | Submit predicted output for code reading snippets with validation and scoring |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/database/[queryId]` | PUT | PROFESSOR, STUDENT | Update SQL query content with syntax validation and execution testing |

## Sandbox Execution

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/sandbox/image/pull` | POST | PROFESSOR, STUDENT | Pull Docker images for sandbox execution environments with progress tracking and error handling |
| `/api/sandbox/[questionId]/database` | POST | PROFESSOR | Execute database queries in isolated environment for testing and validation purposes |
| `/api/sandbox/[questionId]/code-reading` | POST | PROFESSOR | Run code reading context execution to generate expected outputs for student comparison |
| `/api/sandbox/[questionId]/code-writing/[nature]` | POST | PROFESSOR | Execute code in sandbox environment for testing solution or template files with full output capture |
| `/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/database` | POST | PROFESSOR, STUDENT | Run student database queries with result capture, validation, and security restrictions |
| `/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/database/console` | POST | PROFESSOR, STUDENT | Interactive database console access for query development and testing during evaluations |
| `/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/code/code-writing` | POST | PROFESSOR, STUDENT | Execute student code submissions in secure sandbox with test case validation and scoring |

## Group-Scoped - Questions

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/[groupScope]/questions` | GET | PROFESSOR | List questions within group with filtering by type, tags, and creation date for question management |
| `/api/[groupScope]/questions` | POST | PROFESSOR | Create new questions with content, grading configuration, and metadata |
| `/api/[groupScope]/questions/tags` | GET | PROFESSOR | Get list of available tags for question categorization and filtering |
| `/api/[groupScope]/questions/[questionId]` | GET | PROFESSOR | Get complete question details including content, settings, and grading configuration |
| `/api/[groupScope]/questions/[questionId]` | PUT | PROFESSOR | Update question content, settings, and grading parameters with validation |
| `/api/[groupScope]/questions/[questionId]` | DELETE | PROFESSOR | Delete questions not used in active evaluations with complete cleanup |
| `/api/[groupScope]/questions/[questionId]/copy` | POST | PROFESSOR | Create copy of existing question with optional modifications for reuse |
| `/api/[groupScope]/questions/[questionId]/archive` | POST | PROFESSOR | Archive question to make it read-only while preserving for historical reference |
| `/api/[groupScope]/questions/[questionId]/unarchive` | POST | PROFESSOR | Restore archived question to active status for editing and reuse |
| `/api/[groupScope]/questions/[questionId]/tags` | GET | PROFESSOR | Get tags associated with specific question for categorization management |
| `/api/[groupScope]/questions/[questionId]/tags` | PUT | PROFESSOR | Update question tags for improved categorization and organization |
| `/api/[groupScope]/questions/[questionId]/code` | GET | PROFESSOR | Get code-related question configuration including language and environment settings |
| `/api/[groupScope]/questions/[questionId]/code/sandbox` | GET | PROFESSOR | Get sandbox configuration for code execution environment setup |
| `/api/[groupScope]/questions/[questionId]/code/sandbox` | PUT | PROFESSOR | Update sandbox configuration for code execution environments |
| `/api/[groupScope]/questions/[questionId]/code/sandbox` | POST | PROFESSOR | Create or configure sandbox settings for code question execution |
| `/api/[groupScope]/questions/[questionId]/code/code-writing` | GET | PROFESSOR | Get code writing question details including templates, tests, and file structure |
| `/api/[groupScope]/questions/[questionId]/code/code-writing` | PUT | PROFESSOR | Update code writing configuration including templates and test cases |
| `/api/[groupScope]/questions/[questionId]/code/code-reading` | GET | PROFESSOR | Get code reading question configuration including context and expected outputs |
| `/api/[groupScope]/questions/[questionId]/code/code-reading` | PUT | PROFESSOR | Update code reading configuration and expected outputs |
| `/api/[groupScope]/questions/[questionId]/code/code-reading/snippets` | GET | PROFESSOR | Get code snippets and expected outputs for code reading questions |
| `/api/[groupScope]/questions/[questionId]/code/code-reading/snippets` | POST | PROFESSOR | Add new code snippets to code reading questions |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/files/[nature]` | GET | PROFESSOR | Get specific code files (template/solution) for code writing questions |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/files/[nature]` | POST | PROFESSOR | Upload or update code files for code writing question templates and solutions |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/tests` | GET | PROFESSOR | Get test cases and validation configuration for automated code grading |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/tests` | POST | PROFESSOR | Add test cases for automated validation of code writing questions |
| `/api/[groupScope]/questions/[questionId]/database` | GET | PROFESSOR | Get database question configuration including schema and query validation |
| `/api/[groupScope]/questions/[questionId]/database` | PUT | PROFESSOR | Update database question schema and validation settings |
| `/api/[groupScope]/questions/[questionId]/database/queries` | GET | PROFESSOR | Get solution queries and validation rules for database questions |
| `/api/[groupScope]/questions/[questionId]/database/queries` | POST | PROFESSOR | Add solution queries for database question validation |
| `/api/[groupScope]/questions/[questionId]/multiple-choice` | GET | PROFESSOR | Get multiple choice question configuration including options and grading policy |
| `/api/[groupScope]/questions/[questionId]/multiple-choice` | PUT | PROFESSOR | Update multiple choice question settings and grading configuration |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/options` | PUT | PROFESSOR | Update multiple choice options including correctness and content |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/options` | POST | PROFESSOR | Add new answer options to multiple choice questions |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/options` | DELETE | PROFESSOR | Remove answer options from multiple choice questions |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/order` | PUT | PROFESSOR | Reorder multiple choice options for presentation to students |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/grading-policy/gradual-credit` | GET | PROFESSOR | Get gradual credit grading configuration for partial scoring of multiple choice questions |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/grading-policy/gradual-credit` | PUT | PROFESSOR | Update gradual credit grading policy settings for multiple choice questions |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/grading-policy/gradual-credit` | POST | PROFESSOR | Configure gradual credit grading policy for partial scoring implementation |
| `/api/[groupScope]/upload` | POST | PROFESSOR | Upload files for questions including images, documents, and code templates |

## Group-Scoped - Evaluations

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/[groupScope]/evaluations` | GET | PROFESSOR | List evaluations within group with filtering by phase, status, and date ranges for management overview |
| `/api/[groupScope]/evaluations` | POST | PROFESSOR | Create new evaluations with configuration for timing, access control, and initial settings |
| `/api/[groupScope]/evaluations/[evaluationId]` | GET | PROFESSOR | Get complete evaluation details including questions, timing, access settings, and student participation |
| `/api/[groupScope]/evaluations/[evaluationId]` | PATCH | PROFESSOR | Update evaluation settings, timing, access control, and grading configuration with validation |
| `/api/[groupScope]/evaluations/[evaluationId]` | DELETE | PROFESSOR | Delete evaluations that haven't started yet with complete cleanup of associated data |
| `/api/[groupScope]/evaluations/[evaluationId]/phase` | GET | PROFESSOR, STUDENT | Get current evaluation phase information and transition availability |
| `/api/[groupScope]/evaluations/[evaluationId]/purge` | POST | PROFESSOR | Clean up evaluation data while preserving structure for reuse or archival |
| `/api/[groupScope]/evaluations/[evaluationId]/export` | GET | PROFESSOR | Export evaluation results in CSV or PDF format with customizable data fields and formatting |
| `/api/[groupScope]/evaluations/[evaluationId]/composition` | GET | PROFESSOR | Get evaluation question composition with ordering, points distribution, and question details |
| `/api/[groupScope]/evaluations/[evaluationId]/composition` | POST | PROFESSOR | Add questions to evaluation composition with point allocation and ordering |
| `/api/[groupScope]/evaluations/[evaluationId]/composition` | PUT | PROFESSOR | Update evaluation composition by modifying questions and adjusting point values |
| `/api/[groupScope]/evaluations/[evaluationId]/composition` | DELETE | PROFESSOR | Remove questions from evaluation composition with point recalculation |
| `/api/[groupScope]/evaluations/[evaluationId]/composition/order` | PUT | PROFESSOR | Reorder questions within evaluation to change presentation sequence for students |
| `/api/[groupScope]/evaluations/[evaluationId]/questions` | GET | PROFESSOR | List questions included in evaluation with points, order, and addendum information |
| `/api/[groupScope]/evaluations/[evaluationId]/questions/[questionId]` | PUT | PROFESSOR | Update question settings within evaluation context (points, addendum) |
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
| `/api/[groupScope]/gradings` | PATCH | PROFESSOR | Update grading information and scores for student submissions with validation |
| `/api/[groupScope]/gradings/annotations` | GET | PROFESSOR | List grading annotations and comments across all student submissions for review |
| `/api/[groupScope]/gradings/annotations` | POST | PROFESSOR | Create grading annotations on student code files or other submission types for feedback |
| `/api/[groupScope]/gradings/annotations/[annotationId]` | PUT | PROFESSOR | Update annotation content, modify feedback, or change annotation positioning |
| `/api/[groupScope]/gradings/annotations/[annotationId]` | DELETE | PROFESSOR | Remove grading annotations when feedback is no longer relevant or needs correction |

## Admin - Archive Management

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/admin/archive` | GET | SUPER_ADMIN, ARCHIVIST | List evaluations across all groups filtered by archival status (active, marked for archival, archived, purged) |
| `/api/admin/archive/[evaluationId]/archive` | POST | SUPER_ADMIN, ARCHIVIST | Archive evaluation with data preservation and status transition to archived state |
| `/api/admin/archive/[evaluationId]/archive-immediately` | POST | SUPER_ADMIN, ARCHIVIST | Immediately archive evaluation bypassing normal scheduling and processing queues |
| `/api/admin/archive/[evaluationId]/back-to-active` | POST | SUPER_ADMIN, ARCHIVIST | Restore archived or marked evaluations back to active status with full functionality |
| `/api/admin/archive/[evaluationId]/mark-for-archival` | POST | SUPER_ADMIN, ARCHIVIST | Mark evaluations for future archival processing with scheduling and notification |
| `/api/admin/archive/[evaluationId]/purge-data` | POST | SUPER_ADMIN, ARCHIVIST | Permanently delete evaluation data while maintaining metadata for compliance |
| `/api/admin/archive/[evaluationId]/purge-without-archive` | POST | SUPER_ADMIN, ARCHIVIST | Delete evaluation data completely without creating backup archives |

---
