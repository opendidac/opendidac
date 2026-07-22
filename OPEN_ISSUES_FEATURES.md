# OpenDidac — New Features

_Generated on 2026-06-23 — 63 open issues._

> New capabilities, question types, exports/imports, and additions.

## Triage status

Legend: ✅ Resolved · 🟡 Partially done · 🔵 Still relevant · ⛔ Irrelevant/obsolete · ❔ Needs review

- [x] [#346 — Teacher-only notes on questions](#346--teacher-only-notes-on-questions-) — ✅ Resolved by professor-only Scratch Pad
- [x] [#347 — MCQ "sign off all identical" grading helper](#347--mcq-sign-off-all-identical-grading-helper) — 🔵 Still relevant (not done)
- [x] [#480 — Export evaluation to PDF for students with special needs](#480--export-evaluation-to-pdf-for-students-with-special-needs) — 🔵 Still relevant (not done)
- [x] [#482 — Detailed grading criteria](#482--detailed-grading-criteria-) — 🔵 Still relevant (not done; partial workaround — discuss with creator)
- [x] [#505 — Student questions field during training](#505--student-questions-field-during-training) — 🔵 Still relevant (not done)
- [x] [#550 — Add sorting options of questions](#550--add-sorting-options-of-questions) — 🔵 Still relevant (not done)
- [x] [#579 — Ability to reorder test cases and files in coding questions](#579--ability-to-reorder-test-cases-and-files-in-coding-questions) — 🔵 Still relevant (not done)
- [x] [#580 — Overwrite duplicates on question import](#580--overwrite-duplicates-on-question-import) — ⛔ Won't do (decided against; ID-based dedup not feasible)
- [x] [#581 — Export all student answers in JSON](#581--export-all-student-answers-in-json) — ⛔ Irrelevant (workaround: grading page already fed by a single endpoint)
- [x] [#582 — Import student grades and comments from JSON](#582--import-student-grades-and-comments-from-json) — ⛔ Irrelevant (implied AI-automation use case conflicts with sensitive-data standards)
- [x] [#583 — Question versionning](#583--question-versionning) — 🔵 Still relevant (code-heavy / adds complexity — to be discussed)
- [x] [#585 — Add MCQ grading policy "relative negative points"](#585--add-mcq-grading-policy-relative-negative-points) — 🔵 Still relevant (not done)
- [x] [#600 — Prevent changing coefficients once purged](#600--prevent-changing-coefficients-once-purged-) — ✅ Resolved (composition locks inputs once purged)
- [x] [#618 — Adding tags by batch](#618--adding-tags-by-batch-) — 🔵 Still relevant (discuss implementation approach)
- [x] [#622 — See connected users from admin pannel](#622--see-connected-users-from-admin-pannel) — 🔵 Still relevant (not done)
- [x] [#630 — Student UX : landing page with all existing evaluations](#630--student-ux--landing-page-with-all-existing-evaluations) — 🔵 Still relevant (not done)
- [x] [#638 — Batch update questions](#638--batch-update-questions-) — ❔ Needs review (relevance unclear; overlaps #618 — likely duplicate/superset)
- [x] [#646 — Store history of student changes and allow playback by professor](#646--store-history-of-student-changes-and-allow-playback-by-professor) — 🔵 Still relevant (not done; see #428)
- [x] [#355 — Create a simple landing page for the project](#355--create-a-simple-landing-page-for-the-project) — ⛔ Irrelevant
- [x] [#421 — Import and export questions in a file format](#421--import-and-export-questions-in-a-file-format-) — ✅ Resolved (done in #337 / PR #511) — **closed on GitHub**
- [x] [#425 — Possibilité de produire un pdf par étudiant](#425--possibilité-de-produire-un-pdf-par-étudiant-) — 🔵 Still relevant (commented impl. suggestion on GitHub)
- [x] [#426 — Trouver une possibilité d'inclure les annotations dans les pdfs](#426--trouver-une-possibilité-dinclure-les-annotations-dans-les-pdfs-) — ✅ Resolved (annotations rendered in PDF export) — **closed on GitHub**
- [x] [#427 — Intégrer la solution dans les pdfs générés](#427--intégrer-la-solution-dans-les-pdfs-générés-) — ✅ Resolved (solutions section in PDF export) — **closed on GitHub**
- [x] [#428 — Ajouter un historique des modifications](#428--ajouter-un-historique-des-modifications-) — 🔵 Still relevant (scope unclear: question mgmt vs student answering — clarification requested; see #646)
- [x] [#429 — Enregistrer un timelaps de l'écran de l'étudiant](#429--enregistrer-un-timelaps-de-lécran-de-létudiant-) — 🔵 Still relevant (not done)
- [x] [#430 — Ajouter une question Visual Studio Code](#430--ajouter-une-question-visual-studio-code-) — 🔵 Still relevant (POC exists; security concerns to resolve)
- [x] [#477 — Archivage des évaluations et examens](#477--archivage-des-évaluations-et-examens-) — 🟡 Partial (archive/purge/PDF + deadlines done; notifications stubbed, no auto-execution) — **closed on GitHub** (cron/notification gap noted)
- [x] [#519 — Presenting the archival process to the archivist](#519--presenting-the-archival-process-to-the-archivist) — ⛔ Irrelevant — **closed on GitHub** (no comment)
- [x] [#528 — How do we ensure that professors terminate the grading and mark all evaluations as finished](#528--how-do-we-ensure-that-professors-terminate-the-grading-and-mark-all-evaluations-as-finished-) — ⛔ Irrelevant — **closed on GitHub** (archival not gated on finished phase)
- [x] [#280 — Group management](#280--group-management) — ✅ Resolved by question import/export (#337) — **closed on GitHub**
- [x] [#281 — Evaluation export in CSV format](#281--evaluation-export-in-csv-format) — 🔵 Still relevant (validated: SWITCH edu-ID returns given_name/family_name; lazy per-login migration proposed)
- [x] [#282 — Access mode and group of students](#282--access-mode-and-group-of-students) — 🔵 Still relevant (not done; see #149, #283)
- [x] [#283 — Schedule management](#283--schedule-management) — 🔵 Still relevant (not done; see #282)
- [x] [#285 — autograding ratio with test cases passed](#285--autograding-ratio-with-test-cases-passed) — 🔵 Still relevant (not done)
- [x] [#287 — Grading success rate red, blue green limits](#287--grading-success-rate-red-blue-green-limits) — 🔵 Still relevant (feature exists; just tune thresholds/colors)
- [x] [#632 — Dry run or import/export](#632--dry-run-or-importexport) — ✅ Resolved by "Start-over an existing evaluation" — **closed on GitHub** (reopen if insufficient)
- [x] [#633 — Détection du changement de contexte](#633--détection-du-changement-de-contexte-) — ✅ Resolved by desktop-app-required restriction (prevention over detection) — **closed on GitHub**
- [x] [#634 — Indicateur de taux d'écriture de code](#634--indicateur-de-taux-décriture-de-code-) — 🔵 Still relevant (interesting; anti-paste / code-writing-rate detection)
- [x] [#141 — New Code Question Type](#141--new-code-question-type) — ✅ Resolved by the Code Reading question type — **closed on GitHub**
- [x] [#270 — Question "Stats" popper](#270--question-stats-popper) — ⛔ Irrelevant — **closed on GitHub** (no comment)
- [x] [#400 — Evaluation Composition: Chose between deterministic ordering or shuffle](#400--evaluation-composition-chose-between-deterministic-ordering-or-shuffle-) — ⛔ Irrelevant — **closed on GitHub** (no comment)
- [x] [#401 — Code Question - Docker cotnainer entrypoint](#401--code-question---docker-cotnainer-entrypoint) — ⛔ Irrelevant — **closed on GitHub** (no comment)
- [x] [#404 — (PRG2 exam feedback) CodeCheck - Run student proposal from the grading comparer](#404--prg2-exam-feedback-codecheck---run-student-proposal-from-the-grading-comparer) — 🔵 Still relevant (not done)
- [x] [#405 — (PRG2 Exam feedback) - Evaluation in offline mode](#405--prg2-exam-feedback---evaluation-in-offline-mode) — 🔵 Still relevant (not done)
- [x] [#601 — Desktop App - Add arch and other minority distributions](#601--desktop-app---add-arch-and-other-minority-distributions) — ⛔ Irrelevant — **closed on GitHub** (no comment)
- [x] [#144 — Add search field during grading](#144--add-search-field-during-grading) — 🔵 Still relevant (not done)
- [x] [#146 — Student name / github account](#146--student-name--github-account) — ✅ Resolved (GitHub auth dropped; SWITCH edu-ID gives real name) — **closed on GitHub** (see #281)
- [x] [#147 — isolate questions intended for use in an assessment (formal evaluation)](#147--isolate-questions-intended-for-use-in-an-assessment-formal-evaluation) — 🔵 Still relevant (not done)

## Contents

- [OlivierLmr](#olivierlmr) — 18 issue(s)
- [bchapuis](#bchapuis) — 11 issue(s)
- [pierrebressy](#pierrebressy) — 9 issue(s)
- [Ovich](#ovich) — 7 issue(s)
- [fmhanna](#fmhanna) — 4 issue(s)
- [yves-chevallier](#yves-chevallier) — 4 issue(s)
- [daniel-rossier](#daniel-rossier) — 3 issue(s)
- [binaerbaum](#binaerbaum) — 2 issue(s)
- [babouin](#babouin) — 1 issue(s)
- [gmbreguet](#gmbreguet) — 1 issue(s)
- [grafolytics](#grafolytics) — 1 issue(s)
- [Nortalle](#nortalle) — 1 issue(s)
- [Perdjesk](#perdjesk) — 1 issue(s)

## OlivierLmr

### #346 — Teacher-only notes on questions ✅ RESOLVED

- **Created:** 2024-12-05
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/346
- **Relevance (code review):** ✅ **Likely resolved.** Covered by the professor-only **Scratch Pad** added Oct 2025: `Question.scratchpad` field (`web/prisma/schema.prisma:153`, migration `20251006102433_professor_only_scratchpad`) and UI `web/components/question/ScratchPad.js` ("Professor-only Scratch Pad — content will never be shared with students"). It lives on the `Question` model, so it works for all question types incl. MCQ — exactly the request. Commented on the issue proposing closure.

Having a field, similar to the Solution tab, on *all* questions, meant for teacher-only notes, never visible to students even when solutions are shared after grading.

Motivation :

Everything except tags are public when writing a question. Some information, however, might sometimes be intended for teachers only:

- ideas for improvements to question for next year
- grading policy details (this is worth 2pts, this costs 0.5pts, etc)

Currently, these need to be in the solutions field, and thus public when sharing the solution with students. In addition, _**this is only true when a solution field exists**_!! There is simply no way to store such information on MCQ, for example.

I currently have to use a separate word document listing these details. This is bad for collaboration, future use, and convenience.

---

### #347 — MCQ "sign off all identical" grading helper 🔵 STILL RELEVANT

- **Created:** 2024-12-05
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/347

For multiple choice questions, there are often only very few different distinct combinations that were actually answered by students.

Currently, during grading, such a combination that is answered by k students needs to be manually checked and signed off k times. (Unless our policy allows us to let the system auto-sign-off, which is rarely the case)

It would be very convenient if, when hitting sign-off on one student's answer, it could auto-sign-off all identical answers. Maybe after a popup asks us permission, to be safe and explicit.

---

### #480 — Export evaluation to PDF for students with special needs 🔵 STILL RELEVANT

- **Created:** 2025-08-05
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/480

Some students need to have access to a paper version of their exam due to special needs. Note that they will most likely still answer in the webapp: what they need is to be able to annotate/highlight parts of the question statements in order to be able to fully understand what they need to do and structure their thoughts. This is something that some other students (without official accomodations) might also benefit from.

For this, we would need to be able to export an evaluation to a PDF format that contains all questions with statement (and template code if any), and (optionally?) blank spaces after each question for the student to answer on paper.

---

### #482 — Detailed grading criteria 🔵 STILL RELEVANT

- **Created:** 2025-08-05
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/482
- **Relevance (review):** 🔵 Not implemented. Some professors approximate this by writing criteria as free text in the solution/scratch-pad panels, but that doesn't provide the structured, auto-computed scoring requested (and depends on #481 for storage). **Action: discuss scope/priority with the creator (OlivierLmr)** — confirm whether a lightweight free-text criteria list with per-criterion points would suffice vs. full auto-computation.

It is common, when grading a question, to have many different criteria, of the form `+X pts if ...` or `-Y pts if ...`.

Currently,

- this is impossible to store in OpenDidac (see https://github.com/opendidac/opendidac/issues/481)
- it is a lot of cognitive load during grading if the grading scheme is complex (has lots of criteria), which is both tiring and makes errors more likely.

---

I suggest introducing grading criteria on the question itself. It would be a pane in the question edition view, where the teacher can add/remove a criteria, defined by a description and a number of points (which can be negative). During grading, they can specify for each the number of points received by the student. The student's grade is then computed automatically. During grading, the teacher can also add or remove additionnal points for specific situations.

---

### #505 — Student questions field during training 🔵 STILL RELEVANT

- **Created:** 2025-09-02
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/505

During training-typed evaluations, it would be nice for students to have a field for each question in which they can write a question for the professor. The professor would then see a small icon next to that student's question in the evaluation's question list view.

When observing a student's question/answer, the professor would be able to see the question, write an answer, and submit it. The submitted answer would then appear on the student's interface, live or later after the grading phase.

---

### #550 — Add sorting options of questions 🔵 STILL RELEVANT

- **Created:** 2025-10-14
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/550

Allow sorting by "created at", "updated at", and "last used".

---

### #579 — Ability to reorder test cases and files in coding questions 🔵 STILL RELEVANT

- **Created:** 2025-10-30
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/579

_No description provided._

---

### #580 — Overwrite duplicates on question import ⛔ IRRELEVANT (WON'T DO)

- **Created:** 2025-11-04
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/580
- **Relevance (review):** ⛔ Decided against when import/export was implemented — duplicates are intentionally not handled on import. The proposed ID-based detection isn't feasible: a question `id` is always globally unique (regardless of group), so it can never match across instances. Detecting it would require redefining the key as a composite `group_questionId`, and deciding question equivalence in general is non-trivial. Candidate for closing as "won't fix".

Upon importing questions, there should be an option to replace already existing questions.

One way to do this would be to export the question IDs in the JSON, and check whether questions with that ID already exist upon import. If they do, offer the option to "replace existing questions" or "import as new questions"

---

### #581 — Export all student answers in JSON ⛔ IRRELEVANT

- **Created:** 2025-11-04
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/581
- **Relevance (review):** ⛔ Feature not implemented, but considered low-value: the grading page is already fed by a single endpoint that returns all student answers for the evaluation, so exporting the JSON is an easy workaround. Candidate for closing.

For an entire evaluation, one should export all student answers as json. Include the question statement

---

### #582 — Import student grades and comments from JSON ⛔ IRRELEVANT

- **Created:** 2025-11-04
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/582
- **Relevance (review):** ⛔ Not implemented and not desired as-is. The main use case would be AI-assisted grading automation (compute grades/comments externally, then bulk-import), which would require exporting student data to external tools — incompatible with the platform's sensitive-data handling standards. Candidate for closing.

Allow uploading a JSON on an evaluation that contains student grades and comments on all questions. It should also contain the addendum, and annotations on coding questions.

A template JSON should be downloadable, including all questions and students with default grades and empty comments. Questions IDs should be used, and statements don't need to be included.

---

### #583 — Question versionning 🔵 STILL RELEVANT

- **Created:** 2025-11-04
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/583
- **Relevance (review):** 🔵 Still relevant, but considered code-heavy and a significant source of complexity (linear version history, version-on-import, save-as-version in the editor). Partly leans on the import-replace mechanism from #580 (marked won't-do). **To be discussed** before committing to it.

Have versions of questions as a linear history.

- Imported questions that replaced existing ones should represent new versions.
- Upon importing, the questions that changed and created a new version should show this information
- In the question editor, one should be able to save the current state as a new version

---

### #585 — Add MCQ grading policy "relative negative points" 🔵 STILL RELEVANT

- **Created:** 2025-11-04
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/585

If `t` fields are true (should be checked) and `f` are false, then

- Checking a true field should give `1/t` points,
- Checking a false field should remove `1/t` points.

This is the policy used by Moodle

---

### #600 — Prevent changing coefficients once purged ✅ RESOLVED

- **Created:** 2025-11-17
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/600
- **Relevance (code review):** ✅ Done. In `web/components/evaluations/evaluation/phases/EvaluationComposition.js`, `editMode` is derived from `isPurged` (`evaluation.purgedAt`): `EDIT_MODE.none` once purged means nothing is editable. The coefficient and points inputs (`CoefficientEditor`) are gated behind `canEditFully` / `canEditGrading`, so they are disabled after data purge. Candidate for closing.

_No description provided._

---

### #618 — Adding tags by batch 🔵 STILL RELEVANT

- **Created:** 2025-12-22
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/618
- **Relevance (review):** 🔵 Still relevant. **Action: discuss how this should be implemented** — e.g. multi-select in the question list + "add tag to selection", or applying a tag to the current (pinned) search results. Agree on the UX/scope before building.

To prevent people from wanting to create groups per professor/exam/year, we added pinned searches, with the intention that tags could then serve the same purpose.

However, existing question banks might not be using tags in a useful way for pinned search. Similarly, one might want to create, after-the-fact, a new "group" of questions by giving them all the same tag. For this use case, batch addition of tags would be great.

---

### #622 — See connected users from admin pannel 🔵 STILL RELEVANT

- **Created:** 2026-01-08
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/622

When deciding whether to deploy to prod, we have to check manually in the logs which users are connected to guess whether it is safe. The only other safe solution is to deploy at night or over the week-end.

It would be useful to have a way, in the admin pannel, to see all connected professors, and all ongoing evaluations (i.e. started <3h ago, or having recent student answer changes).

---

### #630 — Student UX : landing page with all existing evaluations. 🔵 STILL RELEVANT

- **Created:** 2026-01-28
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/630

_No description provided._

---

### #638 — Batch update questions ❔ NEEDS REVIEW

- **Created:** 2026-02-19
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/638
- **Relevance (review):** ❔ Relevance unclear. Strongly overlaps #618 (Adding tags by batch) — the concrete need stated here is also batch-tagging, with "batch update" as a more general framing. Likely a duplicate/superset of #618; consider consolidating the two before deciding.

At least adding tags, as a way to continue improving question management, and to help people update their question bank to be working best with the pinned seacrhes, which is less useful if the question bank does not make good use of tags.

---

### #646 — Store history of student changes and allow playback by professor 🔵 STILL RELEVANT

- **Created:** 2026-02-24
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/646

Each update to a question by the student could be logged, and the professor could then see a fastforward playback of all changes by the student, to "humanly" detect suspicious behavior.

---

## bchapuis

### #355 — Create a simple landing page for the project ⛔ IRRELEVANT

- **Created:** 2025-01-08
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/355

The landing page should be built with a static site generator that also enable the documenation of the project (e.g. docusorus with mdx).

The landing page should contain the following information:
- Overall description
- Key features
- testimonials
- key numbers
- partners and funding (TODO: @bchapuis)
- demonstration web app (connect with github, create a small template).

---

### #421 — Import and export questions in a file format ✅ RESOLVED (CLOSED)

- **Created:** 2025-03-07
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/421
- **Relevance (code review):** ✅ Done. JSON import/export of questions was delivered alongside the "copy a question from a group to another" work — issue #337 / PR #511 (merged 2025-09-03), which introduced `web/core/questionsImportExport` and the import dialog (later extended, e.g. to include the professor scratch pad). **Commented and closed on GitHub.**

We should introduce the ability to import and export questions as multiple instances of the platform are now available.

---

### #425 — PossibilitÃ© de produire un pdf par Ã©tudiant 🔵 STILL RELEVANT

- **Created:** 2025-03-07
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/425

A l'heure actuelle, nous produisons un pdf pour tous les Ã©tudiants

---

### #426 — Trouver une possibilitÃ© d'inclure les annotations dans les pdfs ✅ RESOLVED (CLOSED)

- **Relevance (code review):** ✅ Done. The professor PDF export fetches the code-file annotation (`selectForProfessorExport` → `SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING`, with `annotation: true` in `web/core/question/select/modules/studentAnswers/code.ts:33`) and the template `web/core/evaluation/export/templates/studentAnswerCodeWriting.hbs` renders a "Professor's Annotated Version" block when an annotation exists. Annotated code is therefore included in the export.

- **Created:** 2025-03-07
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/426

_No description provided._

---

### #427 — IntÃ©grer la solution dans les pdfs gÃ©nÃ©rÃ©s ✅ RESOLVED (CLOSED)

- **Relevance (code review):** ✅ Done. `main.hbs` renders a prof-only "Questions and Solutions" section (`questionsWithSolutions` via `questionWithSolution.hbs`, official answers fetched through `SELECT_OFFICIAL_ANSWERS`). The official solution is included in the generated PDF.

- **Created:** 2025-03-07
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/427

_No description provided._

---

### #428 — Ajouter un historique des modifications 🔵 STILL RELEVANT

- **Created:** 2025-03-07
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/428
- **Relevance (review):** 🔵 Still relevant, but scope is ambiguous (no description). Needs clarification: **question management** (professor edit history) vs **student answering** (answer-change history). If the latter, overlaps #646. Clarification comment posted on the issue.

_No description provided._

---

### #429 — Enregistrer un timelaps de l'Ã©cran de l'Ã©tudiant 🔵 STILL RELEVANT

- **Created:** 2025-03-07
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/429

_No description provided._

---

### #430 — Ajouter une question Visual Studio Code 🔵 STILL RELEVANT

- **Created:** 2025-03-07
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/430
- **Relevance (review):** 🔵 Still relevant. A proof of concept exists: https://github.com/opendidac/vscode-workspace-launcher. The POC README documents concerns to resolve before integration — e.g. an AI agent could access the workspace over SSH. Comment with POC link posted on the issue.

_No description provided._

---

### #477 — Archivage des Ã©valuations et examens 🟡 PARTIAL (CLOSED)

- **Relevance (code review):** 🟡 Mostly built, not fully. ✅ PDF-generation (export engine), ✅ cleanup/purge (`purge-data.js`, `core/evaluation/purge.js`), ✅ deadline scheduling via `archivalDeadline` + phases (`ACTIVE → MARKED_FOR_ARCHIVAL → ARCHIVED → PURGED`) and `MarkForArchivalForm` presets (incl. 1 month). ❌ Professor notification + week-before reminder is **stubbed** — `mark-for-archival.js:77` only logs *"Would notify evaluation owner about archival schedule…"*. ❌ No automated scheduled execution (no cron; archival/purge is admin-driven). Keep open for the notification + auto-execution parts.

- **Created:** 2025-07-29
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/477

- DÃ©velopper une procÃ©dure de gÃ©nÃ©ration pdf
- DÃ©velopper un procÃ©dure de nettoyage
- Informer les professeurs avec un Ã©chÃ©ancier (donner un mois de dÃ©lai avec un rappel une semaine avant lâ€™exÃ©cution de la procÃ©dure).
- ExÃ©cuter les procÃ©dure (exÃ©cuter la procÃ©dure selon lâ€™Ã©chÃ©ancier).

---

### #519 — Presenting the archival process to the archivist ⛔ IRRELEVANT (CLOSED)

- **Created:** 2025-09-16
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/519

Schedule a presentation and discuss/review the overall archival process with the archivist.

---

### #528 — How do we ensure that professors terminate the grading and mark all evaluations as finished ⛔ IRRELEVANT (CLOSED)

- **Relevance (review):** ⛔ Closed. The premise (that this is needed for archival) doesn't hold — `mark-for-archival.js` only checks `archivalPhase === ACTIVE` and never the grading/finished phase, so any evaluation with student data can be archived/purged regardless. Noted on the issue that it can be reopened if it was about something else (e.g. nudging professors to complete grading).

- **Created:** 2025-09-24
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/528

_No description provided._

---

## pierrebressy

### #280 — Group management ✅ RESOLVED (CLOSED)

- **Relevance (review):** ✅ Closed. Sharing questions/collections between groups is covered by question import/export and "copy a question from a group to another" (#337 / PR #511).

- **Created:** 2024-06-06
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/280

To add the possibility to share questions and collections between groups

---

### #281 — Evaluation export in CSV format 🔵 STILL RELEVANT

- **Created:** 2024-06-06
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/281
- **Relevance (code review):** 🔵 Not done, but validated. SWITCH edu-ID returns separated names via OIDC `given_name`/`family_name` (confirmed by dumping `OAuthProfile` at login). The `User` model stores only a single `name`; splitting it retroactively is unsafe (names can have >2 components). **Approach:** populate new `firstName`/`lastName` from the SWITCH profile on a per-login (lazy) migration basis, then use separated columns in the CSV/GAPS export. Validation code (claims request + profile dump + firstName/lastName mapping) is currently in `web/pages/api/auth/[...nextauth].js` (debug `console.log` to be removed). Also consolidates #561.

To split the `name` column in `first name` and `last name` in order to sort by `last name` easily when entering grades into GAPS.

---

### #282 — Access mode and group of students 🔵 STILL RELEVANT

- **Created:** 2024-06-06
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/282

To manage the students and specific measures (regarding the duration of evaluations) :

1. to create a classroom (with emails students)
2. to create some groups in a classroom (one group with no adaptation measure, and another group with)
3. setup the access mode to one group

---

### #283 — Schedule management 🔵 STILL RELEVANT

- **Created:** 2024-06-06
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/283

1. to display the HH:MM:SS in the timer
2. to setup a specific time for a group in a classroom
3. to add a checkbox in order to end the evaluation automatically when the remaining time is 0
4. to add a checkbox in order to end the evaluation when the duration is over but depending the real starting time for each student
5. to setup the date + time for an automatic scheduled evaluation

---

### #285 — autograding ratio with test cases passed 🔵 STILL RELEVANT

- **Created:** 2024-06-06
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/285

To allow a % of the total points for autograding for each passed test case.

---

### #287 — Grading success rate red, blue green limits 🔵 STILL RELEVANT

- **Created:** 2024-06-06
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/287
- **Relevance (code review):** 🔵 The color-coded success rate already exists — `SuccessRate` (PageGrading) renders `PiePercent`, which has thresholds `colors = { 0: '#d32f2f', 40: '#0288d1', 70: '#2e7d32' }` (red <40, blue 40–69, green ≥70) in `web/components/feedback/PiePercent.js:24`. The issue only asks to **tune** these: red `<50`, green `≥66.67`, middle band blue→orange. Small change to the `colors` map; confirm exact target thresholds before applying.

RED: < 50%
GREEN: >=66.67%
BLUE -> ORANGE?

---

### #632 — Dry run or import/export ✅ RESOLVED (CLOSED)

- **Relevance (code review):** ✅ Closed. Covered by the "Start-over an existing evaluation" creation mode in `web/components/evaluations/list/AddEvaluationDialog.js` (lines 70–71), which reuses a validated evaluation as a template. Noted on the issue that it can be reopened if insufficient.

- **Created:** 2026-01-30
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/632

**Contexte** : Lors de la composition d'une Ã©preuve, je suis amenÃ© Ã  vÃ©rifier que tout est correct (ordre des questions, points, contenu) en effectuant moi-mÃªme l'Ã©preuve ou en donnant le lien Ã  un assistant puis en la corrigeant.

**Constat** : Une fois l'Ã©preuve validÃ©e, il n'est pas possible de la "reprendre" telle quelle pour les Ã©tudiants et il faut alors la composer Ã  nouveau avec l'incertitude que cela comporte.

** Demande** : 
- soit pouvoir exporter l'Ã©preuve et pouvoir la rÃ©importer
- soit avoir une option "Dry run" lors de la composition pour valider l'Ã©preuve

---

### #633 — DÃ©tection du changement de contexte ✅ RESOLVED (CLOSED)

- **Relevance (code review):** ✅ Addressed by the **desktop-app-required** restriction (`web/components/users/evaluations/security/EvaluationRestrictionGuard.js:29`), which forces students into the locked-down desktop app (no browser tabs/extensions) — preventing context switching rather than detecting it. Pending decision to comment/close on GitHub.

- **Created:** 2026-01-30
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/633

** Contexte** : lors du dÃ©roulement d'un test (dans un navigateur web), le contrÃ´le de ce que fait l'Ã©tudiant est primordial, surtout si l'on ne veut pas qu'il utilise d'autres outils (LLM ou autre).

** Constat** : l'Ã©tudiant peut changer d'onglet ou d'application, procÃ©der Ã  diverses commandes pour l'aider et revenir au test.

** Demande** : 
- dÃ©tecter les changements d'onglets ou de basculement vers une autre application
- lors du retour sur le test, bloquer temporairement toute action
- avertir le professeur / surveillant sur la plateforme
- offrir le choix au professeur surveillant d'autoriser ou non l'Ã©tudiant Ã  continuer l'Ã©preuve.

---

### #634 — Indicateur de taux d'Ã©criture de code 🔵 STILL RELEVANT

- **Created:** 2026-01-30
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/634

** Contexte** : on considÃ¨re une question dans laquelle l'Ã©tudiant doit fournir une rÃ©ponse sous la forme de code.

** Constat** : lors de l'Ã©criture de la rÃ©ponse, l'Ã©tudiant peut copier-coller une rÃ©ponse venant d'un autre outil ce qui n'est pas autorisÃ©

** Demande** : 
- calculer le "taux" d'Ã©criture de code (en moyenne 200 caractÃ¨res par minutes)
- alerter le professeur. ou surveillant sur la plateforme si le taux dÃ©passe un certain seuil ave potentiel blocage de l'interface de l'Ã©tudiant.

---

## Ovich

### #141 — New Code Question Type ✅ RESOLVED (CLOSED)

- **Relevance (code review):** ✅ Closed. Implemented as the `codeReading` question type (`CodeReading` + `CodeReadingSnippet` with `snippet`/`output`, `studentOutputTest`, execution context — schema 243–286). Student guesses the output, auto-graded against stored output.

- **Created:** 2023-11-15
- **Labels:** enhancement
- **URL:** https://github.com/opendidac/opendidac/issues/141

@bchapuis 

The inspiration comes from a short discussion with Guy Michel and the fact we had alot of this type of questions in early modules such as prg1, prg2, asd1 and asd2. 

The idea is to introduce a different kind of code question "Static Code Analysis". We might consider adding an additional step in the wizard to chose between the existing code question with codecheck, we could call "Code Challenge". The selection would be made as next step after we chose the language. 

The basic idea is to introduce the new code question type where the student must think and guess the output of the particular mini program. We 

Here is an example:


![Image](https://github.com/heigvd-teaching-tools/online-test-platform/assets/4007098/c1aa4b6a-4018-4c4a-8bcd-6d45aba00269)


The professor would be able to write a number of "rows" with code on the left and output on the right. The sandbox would not be involved when student is writing out what he thinks is an output. However, the sandbox might come in handly during the redaction of the question to store the output so the automated grading system can check the student output against the expected output. 

The professor might chose to "ignore the endline character" as i guess it would be a common case of error made by students.

---

### #270 — Question "Stats" popper ⛔ IRRELEVANT (CLOSED)

- **Created:** 2024-05-24
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/270

Add a "UserHelpPopper" that opens a popper in a question with following informations:
- the creator of the question
- Question usage history in evaluations with points that were setup 
- (Eventually) Analytics widgets that present the overall student success with that question. These data-driven insights might help to make precise question weighting decision that is based on historical data.

---

### #400 — Evaluation Composition: Chose between deterministic ordering or shuffle. ⛔ IRRELEVANT (CLOSED)

- **Created:** 2025-03-03
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/400

_No description provided._

---

### #401 — Code Question - Docker cotnainer entrypoint ⛔ IRRELEVANT (CLOSED)

- **Created:** 2025-03-03
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/401

possibility to update the container entrypoint, withEntry point allows to write a custom entry point command, it enough to just add an optional field in Setup

---

### #404 — (PRG2 exam feedback) CodeCheck - Run student proposal from the grading comparer 🔵 STILL RELEVANT

- **Created:** 2025-03-03
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/404

_No description provided._

---

### #405 — (PRG2 Exam feedback) - Evaluation in offline mode 🔵 STILL RELEVANT

- **Created:** 2025-03-03
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/405

Remains to clarify with the PRG2 team regarding of how the offline mode should work. 

- Downloading the composition requires network access
- Progression tracking would be limited
- Submitting answers also require network acess

@daniel-rossier @bchapuis

---

### #601 — Desktop App - Add arch and other minority distributions ⛔ IRRELEVANT (CLOSED)

- **Created:** 2025-11-18
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/601

rpm package can be manipulated to work in other distributions, such as Linux Arch, but it requires additional steps by the user.

We might consider adding some more documentation or preparing few other distributions

---

## fmhanna

### #144 — Add search field during grading 🔵 STILL RELEVANT

- **Created:** 2023-11-16
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/144

To maximize the benefits of having online evaluations, it would be very handy to be able to search some text among all students' answers.

---

### #146 — Student name / github account ✅ RESOLVED (CLOSED)

- **Created:** 2023-11-16
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/146
- **Relevance (review):** ✅ Closed. GitHub is no longer an auth provider — students authenticate via **SWITCH edu-ID**, which supplies their real name and institutional email, so identity maps to the real person. Separated first/last name is tracked in #281.

Students github accounts do not necessarly use their heig-vd email addresses nor their real first/last name.
It is necessary that student give their first and last name as they would do on a paper evaluation.
This would make it easier to download notes and know who did what exactly.

---

### #147 — isolate questions intended for use in an assessment (formal evaluation) 🔵 STILL RELEVANT

- **Created:** 2023-11-16
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/147

Currently, evaluation questions are accessible by all profs in a group.
If we do not add tags, other profs do not know that a question is intended to be used in a future assessment and theirfor must not be used before.
It is necessary to isolate theses questions form others (and perhaps add visibility restrictions)

---

### #149 — Evaluation (jam session) conditions for students with adptation mesures 

- **Created:** 2023-11-16
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/149

Some students have adaptation mesures such as +15% of time during evaluations.
Currently, we must create an individual jam session with exactly the same questions for them (and send the link seperately).

---

## yves-chevallier

### #226 — Import questions from CyberLearn/Moodle

- **Created:** 2024-04-26
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/226

I am not a Moodle user, but I showed the online-test-platform to my colleagues some would happily jump in if they can easily migrate from CyberLearn. 

I know we can export questions in XML, the task would be to understand the format and provide an importer. 

The same way it can be useful to provide an exporter for a online-test-platform question bank.

---

### #239 — Confirm question before submit

- **Created:** 2024-05-02
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/239

Some students told me that prior to the next question they have to submit and confirm their choice. They think this step isn't useful.

---

### #290 — New question type : multiple short answers

- **Created:** 2024-06-11
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/290

I am missing the type of question where the student has to answer short questions. 

For instance, a question involving some code. The short answers would be:

- What is the minimum value that function `foo` can return? ____  
- What is the maximum value that function `foo` can return? ____  
- What is the exit status of this program? ____
- How much memory in bytes the variable `s` uses? ____

Here an example of how I could implement such kind of question: 

![image](https://github.com/heigvd-teaching-tools/online-test-platform/assets/52489316/1d840a34-1526-4113-84ef-1abc76032997)

It is quite cumbersome.

---

### #296 — Let students access an eval to review their results

- **Created:** 2024-06-17
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/296

I did a quiz during the class. I want my students to review their results, Is there a button to allow them to see their results and the questions?

Currently my solution is to create a Word documents and do a screenshot for each question. 

![image](https://github.com/heigvd-teaching-tools/online-test-platform/assets/52489316/e6b4a4a0-c06b-4b4c-ae22-7f9a5a50c519)

---

## daniel-rossier

### #384 — (training) Access to solutions during a training session

- **Created:** 2025-02-20
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/384

It would be highly beneficial to allow access to solutions during a training-style evaluation, even before its completion.

**Proposed Enhancement**

Add an option to enable or disable solution access at any time during the evaluation.
This flexibility would allow instructors to provide solutions upfront when needed, giving students more freedom in their learning process.

**Use Case**

In some scenarios, exercises may be designed with solutions available from the start, enabling students to learn at their own pace rather than waiting until the end of the evaluation.

Would it be possible to implement this feature?

---

### #385 — (training) Setting a template in training evaluation

- **Created:** 2025-02-20
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/385

Allow instructors to define a structured response template for essay-style questions, just as is possible for coding questions.

For example, if a question consists of multiple sub-questions, a template could be pre-filled as follows:

a)


b)


c)

---

### #448 — Retrieve the number of marks when creating a new evaluation from another one

- **Created:** 2025-04-03
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/448

When you create a new evaluation based on a previous one, the number of marks is not copied.
I did that right before the PRG2 evaluation, and the students get 0 pts in all questions.

---

## binaerbaum

### #454 — Have the ability to unarchive a question

- **Created:** 2025-05-21
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/454

Currently once a question has been archived, there is no way to reverse this process (without resorting to a hack of copying it).
Archiving, contrary to permanent deletion should ideally be reversible.

---

### #456 — See where a question was used

- **Created:** 2025-05-21
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/456

It would be helpful to know in which evaluations a given question was used.

This would allow us to see if a question was already given to students as part of a training, test or exam (or not at all).

---

## babouin

### #451 — Mise Ã  disposition du bouton 'ADD FILE' pour les Ã©tudiants

- **Created:** 2025-05-01
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/451

Serait-il possible de permettre aux Ã©tudiants d'ajouter des fichiers dans les questions de codage (au moins en Java) ?

Le bouton existe dÃ©jÃ  lors de la crÃ©ation des questions et serait pratique dans la partie rÃ©ponses afin de pouvoir poser des questions oÃ¹ les Ã©tudiants doivent crÃ©er le code et le structurer en classes/packages eux-mÃªmes.

---

## gmbreguet

### #560 — compile ANNOTATED code

- **Created:** 2025-10-20
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/560

While correcting an evaluation, it would be occasionally handy to be able to compile a student code after corrector's annotation.
This way, we could check again if test cases pass differently.

Honestly, not essential but handy.

Thanks for the hard work !

---

## grafolytics

### #85 — Enhancement proposal: Add Markdown import/export

- **Created:** 2023-10-17
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/85

(This is just a proposal that needs to be prioritised against all the other enhancement proposals.) As an educator I want to be able to edit quizzes outside the platform in a text editor in a compact, easy-to-read format. The proposal is to define a convention on top of Markdown that allows to import/export a whole quiz in a single file.

I have developed this format to author Moodle quizzes outside of Moodle.

Here is an example of such a file:

```
# Cloud Computing (CLD) practice quiz

## Chapter Infrastructure-as-Code

### IaC motivation (2p, multichoice)

What can be achieved by adopting Infrastructure as Code over traditional approaches? Select the correct statement(s).

* (true) To automate the process of provisioning and managing infrastructure.
* (true) To improve the security of cloud infrastructure.
* (true) To increase the scalability of cloud infrastructure.
* (false) To obtain cloud resources cheaper.

### Terraform state file (4p, essay)

The Terraform state file creates an issue when several DevOps engineers jointly manage the same cloud infrastructure. Explain the issue and a way to resolve it.

## Chapter Database-as-a-Service 

### Sharding (3p, shortanswer)

You deploy a NoSQL database on 3 servers. When the database is deployed on a single server it provides 2 TB storage space to applications and it is able to support 1000 requests per second (read or write). You deploy the database with sharding and no data replication.

What is the total storage capacity of the database? {{{6'?000 ?[Tt][Bb]}}}
```

---

## Nortalle

### #446 — Ajout du support PHP

- **Created:** 2025-03-25
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/446

J'aimerais proposer l'ajout du langage PHP comme langage supportÃ© dans l'outil d'Ã©valuation OpenDidac. 

PHP est largement utilisÃ©, notamment dans l'enseignement du dÃ©veloppement web du cÃ´tÃ© de St-Rock. Son intÃ©gration permettrait aux Ã©tudiantÂ·es d'avoir un retour plus efficace et adaptÃ© lorsqu'ils ou elles soumettent des exercices ou des projets rÃ©alisÃ©s en PHP.

---

## Perdjesk

### #242 — Connection healthiness to backend shown in frontend

- **Created:** 2024-05-06
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/242

Provide a UX that give feedback about the connectivity healthiness to the backend server in continuous. In case the connectivity is broken after a defined timeout show a visible warning to the user.

It is in cases of evaluation that a candidate must be able to determine whether the connection is healthy and react in case the connection is broken and the evaluation might be impacted.

---
