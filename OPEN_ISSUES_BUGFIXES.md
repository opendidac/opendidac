# OpenDidac — Bugfixes

_Generated on 2026-06-23 — 15 open issues._

> Reported bugs, edge cases, and incorrect behaviour.

## Contents

- [Ovich](#ovich) — 10 issue(s)
- [bchapuis](#bchapuis) — 1 issue(s)
- [binaerbaum](#binaerbaum) — 1 issue(s)
- [ludelafo](#ludelafo) — 1 issue(s)
- [OlivierLmr](#olivierlmr) — 1 issue(s)
- [yves-chevallier](#yves-chevallier) — 1 issue(s)

## Ovich

### ✅ CLOSED #236 — Evaluation Access List edge case

- **Created:** 2024-04-30
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/236

Reproduction:

- Create an evaluation and keep it in the draft phase.
- Join the evaluation as a student using the link.
- Restrict access to the evaluation (with students already in).
- A student who has already joined tries to access it again.

Effects:

- The student is not allowed to enter even if they had already joined the evaluation before the restriction was activated.
- The professor's view presents conflicting information; the student appears both in the registered students list and in the denied students list.
- The professor can use the "add to access list" button to allow the student to enter.
- If the student was manually added to the access list before the evaluation was set to in-progress, they remain in the list of denied students while they still have access to the evaluation (as they are part of the access list - which is ok). In this case, the "add to access list" button does not remove the student from the denied list because they are already in the access list - which is not ok. 


Fix:

DRAFT PHASE: 

We must decide, or let the user decide, what to do with students who have already joined before the restriction was activated. The professor could choose to add them to the access list or to remove them from the evaluation (so they donâ€™t appear in the registered students). This involves deleting all the pre-generated empty answers for the student. Alternatively, we could choose one of these actions by design. Adding them to the access list would be easier to implement and would make sense for most cases.


What do we do when the already registered student is being removed from the access list input field? In this case, it makes more sense to remove the student from the evaluation, or to prevent the removal of the registered student from the access list. A confirmation / alert dialog would be necessary. Note that if the student uses the link later (DRAFT or IN PROGRESS), they will end up in the denied student list and can be allowed to enter using "add to access list".


Another option:  Make the restriction toggle button read-only if someone has already registered for the evaluation. Professors usually join their own evaluation in the draft phase. Implementing this could lead to issues and the necessity to recreate the evaluation if they wish to activate the restricted access later on.

---

### ✅ CLOSED #403 — Analytics - Issue with question having 0 pts.

- **Created:** 2025-03-03
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/403

to be checked

---

### ✅ CLOSED (fixed by #466) #410 — BUG: when adding question to composition

- **Created:** 2025-03-03
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/410

While adding a question to composition, we might lose the selected questions after we activate filter that are not in the filtered list

---

### ✅ CLOSED (fixed by #465) #450 — Multiple Choice Markdown - Comparer Issue

- **Created:** 2025-04-10
- **Labels:** bug
- **URL:** https://github.com/opendidac/opendidac/issues/450

The comparer for multiple choice options, during grading or consultation, seem to not properly color chosen options. The correct chosen option remain red. To be checked

---

### ✅ CLOSED (fixed by #676) #457 — [BUG] Evaluation start over from template -> issue with the warning message

- **Created:** 2025-05-22
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/457

The warning displays saying that the question no longer exist in the bank -> statement untrue

---

### ✅ CLOSED (fixed by #461) #458 — [BUG] Joining evaluation before Registration phase - error

- **Created:** 2025-05-22
- **Labels:** bug
- **URL:** https://github.com/opendidac/opendidac/issues/458

Current State
 
- The "join" link is available in the list of evaluation even when the evaluation is not jet ready for join (before Register)
- If you happen to use the link you cant enter the evaluation anymore, error 500, even when it goes ot the appropriate phase for student joining. 


TO DO:
1) do no display join link for evaluation that are not joinable (before register) 
2) check what causes the error 500 and reinforce the robustness of the backend in relation to this edge case,

---

### ✅ CLOSED (part 1 fixed by #676, part 2 gone) #460 — [BUG] - Start Over - The warning does not seem to always be relevant

- **Created:** 2025-06-02
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/460

1) Sometimes, It displays the warning saying that some / all question no longer exist in the question bank while they do.
To be investigated

2) "evaluation label already exists" displays on some occasions. The label is not supposed to be uniq identifier

---

### ✅ FIXED (PR #677) #588 — TagSelector - Should Refresh when the tags are being edited

- **Created:** 2025-11-06
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/588

_No description provided._

---

### ⏸ KEPT OPEN (analyzed 2026-07-22, low frequency) #602 — Evaluation entry link edge case to fix

> Root cause identified: `Authorization` enforces the professor-must-have-groups
> check on every wrapped page, including student-flow pages under `/users/...`
> (PageDispatch). Fix when prioritized: require groups only when
> `router.pathname.includes('[groupScope]')`; also `UnauthorizedMissingGroups`'s
> create-group success redirect loses the entry link.

- **Created:** 2025-11-18
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/602

Current behavior is broken. A user with the professor role but no groups (e.g., Remy) clicks the evaluation entry link (student flow), but instead of entering the evaluation, they get the "You do not have groups" message and are pushed into the professor/admin flow. If they create a group, they get redirected to the group admin page â€” completely wrong context â€” and must click the link again to enter the evaluation.

---

### ✅ CLOSED (fixed by #648) #623 — Eval Composition (BUG)

- **Created:** 2026-01-12
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/623

When getting into the composition view in an evaluation, the frontend sends put queries to update the grading points with the same amout they already have. 

There is no effect but this should be fixed.

---

## bchapuis

### ✅ CLOSED #525 — The attendance is not purged with the evaluation answers

- **Created:** 2025-09-17
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/525

@Ovich can you check this?

---

## binaerbaum

### ✅ CLOSED (fixed by #466) #455 — [Bug] Add multiple questions to an evaluation using search

- **Created:** 2025-05-21
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/455

Right now when adding questions to an evaluation using the search functionality to find questions, it is not possible to add more than one question (sometimes 2) at a time, because selecting a second question overwrites the previous selection (sometimes it's possible to select 2, but the behavior is inconsistent).

It should ideally be possible to search for a question, select it using by ticking the checkbox, search for another question, select it and so on until the desired number of questions have been selected and then add them all at once.

---

## ludelafo

### ✅ CLOSED (fixed by export rewrite #577/#606/#644) #476 — Exported PDF do not contain all students

- **Created:** 2025-07-09
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/476

When exporting an evaluation, the exported PDF does not contain all students. My evaluation has 18 questions, made by 57 students. As each copy has a front cover, it makes 19 pages per student (each question has its own page). The total number of pages in the exported PDF should be 19 x 57 = 1083 pages. However, the exported PDF only contains 303 pages. Several students are thus missing.

Use-case: some students want to consult their exam and I need to communicate their results to the COMEM+ secretariat. I need an easy way to export their results (ideally, it would be nice to be able to export just one student's results).

Issue related to this one: https://github.com/opendidac/opendidac/issues/424.

---

## OlivierLmr

### ✅ CLOSED (fixed by #679) #619 — Question export does not include tags

- **Created:** 2025-12-22
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/619

It feels unexpected that exporting a question omits the tags. Usually, tags should be exported as well.

It is less annoying to have to remove them if we didn't want them, than to have to re-create them if we wanted them. I also assume that most people will want them included, so will have to re-create them for all questions after import.

---

## yves-chevallier

### ✅ CLOSED (fixed by #680) #295 — Bug: float rank isn't properly exported to CSV. 

- **Created:** 2024-06-17
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/295

Here in the interface:

![image](https://github.com/heigvd-teaching-tools/online-test-platform/assets/52489316/97f7e362-e8fe-435b-a761-96b401acaa40)

Here in the CSV:

![image](https://github.com/heigvd-teaching-tools/online-test-platform/assets/52489316/c39052e3-86e7-4d02-8066-d83775a1002b)

We notice question 4 has 1.33/4, translated into 133 points.

---
