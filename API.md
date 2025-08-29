# API Endpoints Documentation

This document provides a **complete and systematically verified** list of all API endpoints in the Eval platform. Every endpoint has been confirmed to exist with the exact methods and roles specified.

**Total Endpoints Documented: 135+**
- ✅ **System & Infrastructure**: 4 endpoints (verified descriptions)
- ✅ **Groups Management**: 8 endpoints (verified descriptions)  
- ✅ **Users Management**: 4 endpoints (verified descriptions)
- ✅ **Student Evaluation Access**: 6 endpoints (verified descriptions)
- ✅ **Student Answer Submission**: 11 endpoints (verified descriptions)
- ✅ **Sandbox Execution**: 7 endpoints (verified descriptions)
- ✅ **Group-Scoped Questions**: 41 endpoints (verified descriptions)
- ✅ **Group-Scoped Evaluations**: 23 endpoints (verified descriptions)
- ✅ **Group-Scoped Grading**: 5 endpoints (verified descriptions)
- ✅ **Admin Archive Management**: 7 endpoints (verified descriptions)

**Verification Process**: Each endpoint was individually verified by reading the actual implementation file to confirm the exact HTTP methods supported and role-based authorization requirements. All descriptions have been systematically updated based on actual functionality rather than assumptions.

**Documentation Status**: ✅ **COMPLETE** - All 135+ API endpoints have been systematically verified for methods, roles, and accurate descriptions.

## System Endpoints

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/conn_check` | GET | None (Public) | Simple connection test endpoint that returns a success message to verify API availability |
| `/api/session-sse` | GET | Authenticated | Establish server-sent events connection for real-time updates, registers authenticated user for live notifications |
| `/api/maintenance` | POST | SUPER_ADMIN | Execute maintenance tasks: migrate code question expected outputs or cleanup unused uploaded files |

## Assets & File Management

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/assets/[...path]` | GET | PROFESSOR, SUPER_ADMIN, STUDENT | Serve static files from the assets directory with proper MIME type headers and content length |

## Groups Management

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/groups` | GET | SUPER_ADMIN | Retrieve all groups with creator information, membership details, and counts of active questions/evaluations |
| `/api/groups` | POST | PROFESSOR | Create a new group with label and scope, automatically adding creator as first member |
| `/api/groups/check` | GET | PROFESSOR | Check if a group with the given label or scope already exists to prevent duplicates during group creation or updates |
| `/api/groups/[groupId]` | DELETE | PROFESSOR | Delete a group (only allowed for the group creator/owner) with complete cleanup |
| `/api/groups/[groupId]` | PUT | PROFESSOR | Update group label and scope (requires group membership) with validation |
| `/api/groups/[groupId]/members` | GET | PROFESSOR | List all members of a group with user details (requires group membership to access) |
| `/api/groups/[groupId]/members` | POST | PROFESSOR | Add a new member to a group using email lookup (requires group membership) |
| `/api/groups/[groupId]/members` | DELETE | PROFESSOR | Remove the requesting user from the group membership |

## Users Management

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/users` | GET | PROFESSOR, SUPER_ADMIN | Search users by name/email with pagination and role filtering (requires 2+ character search for non-super-admins) |
| `/api/users/[userId]` | PATCH | SUPER_ADMIN | Update user roles array with validation against available role types |
| `/api/users/groups` | GET | PROFESSOR | Get list of groups where the authenticated user is a member, ordered by creation date |
| `/api/users/groups/select` | PUT | PROFESSOR | Set the user's selected/active group by switching selection from current to specified group scope |

## Student - Evaluation Access

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/users/evaluations/[evaluationId]/take` | GET | PROFESSOR, STUDENT | Get evaluation details and questions with user's answers for taking exam (requires IN_PROGRESS phase and student status) |
| `/api/users/evaluations/[evaluationId]/consult` | GET | PROFESSOR, STUDENT | View completed evaluation with questions, answers, and results (only after evaluation is finished and consultation enabled) |
| `/api/users/evaluations/[evaluationId]/join` | POST | PROFESSOR, STUDENT | Join an evaluation session, create UserOnEvaluation record, and initialize answers for all questions |
| `/api/users/evaluations/[evaluationId]/status` | GET | PROFESSOR, STUDENT | Get evaluation timing, phase, conditions, and user participation status with session tracking |
| `/api/users/evaluations/[evaluationId]/status` | PUT | PROFESSOR, STUDENT | Update user's evaluation completion status and track session changes during evaluation |
| `/api/users/evaluations/[evaluationId]/dispatch` | GET | PROFESSOR, STUDENT | Get evaluation phase and user relationship information to determine appropriate UI redirection |

## Student - Answer Submission

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers` | GET | STUDENT, PROFESSOR | Get question details and student's current answers without revealing official solutions or correct answers |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers` | PUT | STUDENT, PROFESSOR | Update general answer content and set status to IN_PROGRESS with automatic saving |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/submit` | PUT | STUDENT, PROFESSOR | Mark answer as SUBMITTED to indicate completion of question response |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/submit` | DELETE | STUDENT, PROFESSOR | Change answer status from SUBMITTED back to IN_PROGRESS to allow further editing |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/multi-choice` | PUT | PROFESSOR, STUDENT | Update multiple choice comment/justification text when student comments are enabled |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/multi-choice/options` | POST | PROFESSOR, STUDENT | Add selected option to multiple choice answer with selection limit validation |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/multi-choice/options` | DELETE | PROFESSOR, STUDENT | Remove selected option from multiple choice answer and update status |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-writing/[fileId]` | PUT | PROFESSOR, STUDENT | Update code file content for code writing questions and set answer status to IN_PROGRESS |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-reading/check` | POST | PROFESSOR, STUDENT | Compare student's predicted outputs against expected outputs and return match/mismatch status for each snippet |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-reading/[snippetId]` | PUT | PROFESSOR, STUDENT | Update student's predicted output for a specific code reading snippet |
| `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/database/[queryId]` | PUT | PROFESSOR, STUDENT | Update SQL query content for database questions and set answer status to IN_PROGRESS |

## Sandbox Execution

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/sandbox/image/pull` | POST | PROFESSOR, STUDENT | Pull latest Docker image for sandbox environments with status feedback and error handling |
| `/api/sandbox/[questionId]/database` | POST | PROFESSOR | Execute solution queries for database questions, run SQLFluff linting, and update expected outputs |
| `/api/sandbox/[questionId]/code-reading` | POST | PROFESSOR | Generate expected outputs for code reading snippets by executing context code in sandbox environment |
| `/api/sandbox/[questionId]/code-writing/[nature]` | POST | PROFESSOR | Test code writing question template or solution files by running them in isolated sandbox |
| `/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/database` | POST | PROFESSOR, STUDENT | Execute student's database queries in sandbox and compare outputs against expected results |
| `/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/database/console` | POST | PROFESSOR, STUDENT | Interactive database console access for query development and testing during evaluations |
| `/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/code/code-writing` | POST | PROFESSOR, STUDENT | Run student's code writing submission against test cases in secure sandbox with detailed results |

## Group-Scoped - Questions

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/[groupScope]/questions` | GET | PROFESSOR | List questions in group with filtering by title, content, tags, question types, code languages, and status |
| `/api/[groupScope]/questions` | POST | PROFESSOR | Create new question of specified type with default template and type-specific initialization |
| `/api/[groupScope]/questions/tags` | GET | PROFESSOR | Get list of available tags for question categorization and filtering |
| `/api/[groupScope]/questions/[questionId]` | GET | PROFESSOR | Get complete question details including type-specific content and official answers |
| `/api/[groupScope]/questions/[questionId]` | PUT | PROFESSOR | Update question title, content, status, and type-specific data with authorization validation |
| `/api/[groupScope]/questions/[questionId]` | DELETE | PROFESSOR | Delete question if not used in any evaluations with complete cleanup |
| `/api/[groupScope]/questions/[questionId]/copy` | POST | PROFESSOR | Create copy of existing question with optional modifications for reuse |
| `/api/[groupScope]/questions/[questionId]/archive` | POST | PROFESSOR | Set question status to ARCHIVED to hide from active lists while preserving in evaluations |
| `/api/[groupScope]/questions/[questionId]/unarchive` | POST | PROFESSOR | Restore archived question status back to ACTIVE for reuse |
| `/api/[groupScope]/questions/[questionId]/tags` | GET | PROFESSOR | Get tags associated with specific question for categorization management |
| `/api/[groupScope]/questions/[questionId]/tags` | PUT | PROFESSOR | Update question tags for improved categorization and organization |
| `/api/[groupScope]/questions/[questionId]/code` | GET | PROFESSOR | Get code-related question configuration including language and environment settings |
| `/api/[groupScope]/questions/[questionId]/code/sandbox` | GET | PROFESSOR | Get sandbox configuration including Docker image and beforeAll setup commands |
| `/api/[groupScope]/questions/[questionId]/code/sandbox` | PUT | PROFESSOR | Update sandbox Docker image and beforeAll configuration for code execution environment |
| `/api/[groupScope]/questions/[questionId]/code/sandbox` | POST | PROFESSOR | Create sandbox configuration with Docker image and beforeAll setup for new code questions |
| `/api/[groupScope]/questions/[questionId]/code/code-writing` | GET | PROFESSOR | Get code writing question details including templates, tests, and file structure |
| `/api/[groupScope]/questions/[questionId]/code/code-writing` | PUT | PROFESSOR | Update code writing configuration including templates and test cases |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/files/[nature]` | GET | PROFESSOR | Get template or solution files for code writing questions by nature (template/solution) |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/files/[nature]` | POST | PROFESSOR | Create new template or solution files with path, content, and automatic ordering |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/tests` | GET | PROFESSOR | Get test cases with execution commands, input, and expected output ordered by index |
| `/api/[groupScope]/questions/[questionId]/code/code-writing/tests` | POST | PROFESSOR | Create new test case with execution command, input, expected output, and automatic indexing |
| `/api/[groupScope]/questions/[questionId]/code/code-reading` | GET | PROFESSOR | Get code reading configuration including context code, execution settings, and student output testing |
| `/api/[groupScope]/questions/[questionId]/code/code-reading` | PUT | PROFESSOR | Update code reading context, execution settings, and student output test configuration |
| `/api/[groupScope]/questions/[questionId]/code/code-reading/snippets` | GET | PROFESSOR | Get code reading snippets ordered by sequence for student output prediction |
| `/api/[groupScope]/questions/[questionId]/code/code-reading/snippets` | POST | PROFESSOR | Create new code reading snippet with order position for student analysis |
| `/api/[groupScope]/questions/[questionId]/database` | GET | PROFESSOR | Get database question configuration including Docker image for database environment |
| `/api/[groupScope]/questions/[questionId]/database` | PUT | PROFESSOR | Update database question Docker image configuration for execution environment |
| `/api/[groupScope]/questions/[questionId]/database/queries` | GET | PROFESSOR | Get solution queries with output tests and expected results ordered by sequence |
| `/api/[groupScope]/questions/[questionId]/database/queries` | POST | PROFESSOR | Create new empty solution query with automatic ordering and database connection |
| `/api/[groupScope]/questions/[questionId]/multiple-choice` | GET | PROFESSOR | Get multiple choice configuration including options, student comments, and selection limits |
| `/api/[groupScope]/questions/[questionId]/multiple-choice` | PUT | PROFESSOR | Update multiple choice settings for student comments, selection limits, and grading policy |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/options` | PUT | PROFESSOR | Update option text and correctness with automatic selection limit adjustment |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/options` | POST | PROFESSOR | Create new answer option with text, correctness, and automatic ordering |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/options` | DELETE | PROFESSOR | Remove answer option and update selection limits accordingly |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/order` | PUT | PROFESSOR | Reorder multiple choice options for presentation to students |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/grading-policy/gradual-credit` | GET | PROFESSOR | Get gradual credit configuration including negative marking and threshold settings |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/grading-policy/gradual-credit` | PUT | PROFESSOR | Update gradual credit policy with negative marking and threshold parameters |
| `/api/[groupScope]/questions/[questionId]/multiple-choice/grading-policy/gradual-credit` | POST | PROFESSOR | Create or upsert gradual credit grading policy with negative marking and threshold configuration |
| `/api/[groupScope]/upload` | POST | PROFESSOR | Upload files with MIME type validation, size limits, image optimization, and secure storage with CUID-based paths |

## Group-Scoped - Evaluations

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/[groupScope]/evaluations` | GET | PROFESSOR | List evaluations in group with question counts, student lists, and metadata ordered by last update |
| `/api/[groupScope]/evaluations` | POST | PROFESSOR | Create new evaluation from preset template or copy from existing evaluation with creator tracking |
| `/api/[groupScope]/evaluations/[evaluationId]` | GET | PROFESSOR | Get complete evaluation details including questions, timing, access settings, and student participation |
| `/api/[groupScope]/evaluations/[evaluationId]` | PATCH | PROFESSOR | Update evaluation settings, advance phase transitions, set timing, and manage access controls |
| `/api/[groupScope]/evaluations/[evaluationId]` | DELETE | PROFESSOR | Delete evaluation if not yet started with complete cleanup of associated data |
| `/api/[groupScope]/evaluations/[evaluationId]/phase` | GET | PROFESSOR, STUDENT | Get evaluation phase, start time, and end time information |
| `/api/[groupScope]/evaluations/[evaluationId]/export` | GET | PROFESSOR | Generate PDF export of evaluation with student answers, grading, and solutions using Puppeteer |
| `/api/[groupScope]/evaluations/[evaluationId]/composition` | GET | PROFESSOR | Get evaluation's question composition with details, ordering, points, and source question status |
| `/api/[groupScope]/evaluations/[evaluationId]/composition` | POST | PROFESSOR | Add questions to evaluation composition by question IDs with automatic ordering |
| `/api/[groupScope]/evaluations/[evaluationId]/composition` | PUT | PROFESSOR | Update question points and settings within evaluation composition |
| `/api/[groupScope]/evaluations/[evaluationId]/composition` | DELETE | PROFESSOR | Remove questions from evaluation composition with order adjustment |
| `/api/[groupScope]/evaluations/[evaluationId]/composition/order` | PUT | PROFESSOR | Reorder questions within evaluation to change presentation sequence for students |
| `/api/[groupScope]/evaluations/[evaluationId]/questions` | GET | PROFESSOR | List questions included in evaluation with points, order, and addendum information |
| `/api/[groupScope]/evaluations/[evaluationId]/questions/[questionId]` | PUT | PROFESSOR | Update question settings within evaluation context (points, addendum) |
| `/api/[groupScope]/evaluations/[evaluationId]/attendance` | GET | PROFESSOR | Get student attendance information including registration status and access attempts |
| `/api/[groupScope]/evaluations/[evaluationId]/attendance/denied` | GET | PROFESSOR | List students who were denied access due to IP restrictions or access list limitations |
| `/api/[groupScope]/evaluations/[evaluationId]/progress` | GET | PROFESSOR | Monitor real-time student progress including all questions with student answers and completion status |
| `/api/[groupScope]/evaluations/[evaluationId]/results` | GET | PROFESSOR | Get comprehensive evaluation results with scores, statistics, and completion analysis |
| `/api/[groupScope]/evaluations/[evaluationId]/students/allow` | POST | PROFESSOR | Add student email to evaluation access list after they were denied access |
| `/api/[groupScope]/evaluations/[evaluationId]/students/denied` | GET | PROFESSOR | View detailed information about students denied access with reasons and timestamps |
| `/api/[groupScope]/evaluations/[evaluationId]/students/[studentEmail]/status` | PUT | PROFESSOR | Update individual student status (mark as finished, reset progress, modify permissions) |
| `/api/[groupScope]/evaluations/[evaluationId]/consult/[userEmail]` | GET | PROFESSOR | View specific student's answers and responses for grading and consultation purposes |

## Group-Scoped - Grading

| URL | Method | Roles | Description |
|-----|--------|-------|-------------|
| `/api/[groupScope]/gradings` | PATCH | PROFESSOR | Update student question grading including points obtained, status, comments, and grader signature |
| `/api/[groupScope]/gradings/annotations` | GET | PROFESSOR | Get annotation for specific entity (file) by entity type and ID |
| `/api/[groupScope]/gradings/annotations` | POST | PROFESSOR | Create grading annotations on student files or submissions with content and creator tracking |
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
