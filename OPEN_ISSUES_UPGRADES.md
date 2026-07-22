# OpenDidac — Upgrades & Improvements

_Generated on 2026-06-23 — 21 open issues._

> Enhancements, refactors, dependency updates, UX/CI improvements.

## Contents

- [Ovich](#ovich) — 7 issue(s)
- [OlivierLmr](#olivierlmr) — 5 issue(s)
- [Perdjesk](#perdjesk) — 2 issue(s)
- [bchapuis](#bchapuis) — 1 issue(s)
- [dorian-ch](#dorian-ch) — 1 issue(s)
- [fmhanna](#fmhanna) — 1 issue(s)
- [gmbreguet](#gmbreguet) — 1 issue(s)
- [ludelafo](#ludelafo) — 1 issue(s)
- [pierrebressy](#pierrebressy) — 1 issue(s)
- [yves-chevallier](#yves-chevallier) — 1 issue(s)

## Ovich

### #402 — Code File Manager -> unclear that pull from solution erase all the files

- **Created:** 2025-03-03
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/402

_No description provided._

---

### #431 — Code Question - Instead of Template use comment sections directly in Solution

- **Created:** 2025-03-07
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/431

The professors usually slip on the synchronisation problems between the solution and the template code

The idea i to delimit the code that is not part of the template by a standard comment (or token) 

The difficulty would be to migrate the existing questions to this new standard.

---

### #597 — Middleware Refactoring: Unified Context Object Pattern

- **Created:** 2025-11-14
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/597

## Problem

Previously, each middleware used separate arguments, making middleware chaining complex, difficult to maintain, and prone to errors. Middlewares passed different parameters (e.g., `req`, `res`, `prisma`, `evaluation`) in varying orders, leading to inconsistent signatures and making it hard to track dependencies between middlewares. Handlers had to manually validate the presence of required dependencies, and errors from missing middleware calls were only discovered at runtime.

## Solution

Refactor all middlewares to use a unified context object pattern. Each middleware now accepts two arguments: `(handler, args = {})` and returns a function that takes a single context object `(ctx)`. The context object (`ctx`) contains all shared state like `req`, `res`, `prisma`, `evaluation`, `roles`, etc., while middleware-specific configuration is passed via the `args` object (e.g., `{ roles: [...] }`, `{ phases: [...] }`). Each middleware validates its dependencies (e.g., `withRestrictions` checks for `prisma` and `evaluation`) and adds its own properties to the context before passing it to the next handler.

**Entry Point Bridge**: `withMethodHandler` serves as the bridge between Next.js's native `(req, res)` signature and our context object pattern. It receives `(req, res)` from Next.js, creates the initial context object `{ req, res }`, and passes it to the middleware chain. This makes `withMethodHandler` the required entry point for all API routes, ensuring a consistent interface between Next.js and our middleware system.

## Benefits

This approach provides several advantages: **Consistency** - all middlewares follow the same signature pattern; **Type Safety** - dependencies are validated early with clear error messages; **Maintainability** - the middleware chain is easier to read and understand; **Reduced Duplication** - handlers no longer need to validate dependencies or query data already fetched by middlewares; **Better Error Messages** - missing dependencies produce helpful errors like "Did you call withPrisma middleware?" instead of undefined property access. Additionally, this unified pattern will make the API migration to TypeScript much easier, as all middlewares share consistent type signatures.

## Typescript migration

This approach will also make the migration to typescript of the api much easier

## API migration

**Future-Proof Architecture**: The context object pattern decouples our middleware system from Next.js's  By having `withMethodHandler` as the single bridge between Next.js and our middleware chain, migrating to another API framework (e.g., Express, Fastify, or a custom server) would only require updating the entry point bridge. All middlewares and handlers remain unchanged, making the codebase more portable and reducing migration effort significantly.

---

### #599 — Middleware migration functional testing log

- **Created:** 2025-11-17
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/599

- question import / export does not include tags -> problem with pinned tags -> after import the list does not change as the new question do not cary the tags: solution: import export with tags (to be discussed as its generally used between groups)

# desktop app restriction message: 
- desktop app restriction off
- already in registration phase
- the student has joined and is in waiting state (web)
- the professor changes the restriction to on
- the student gets the api error response   "This evaluation requires the OpenDidac desktop application"
- the student does not get the restriction "frontend" message that explains him what to do.  "Desktop Application Required" with instructions to download and use the special link


# Creating tags

While adding non existant tags on a question (new tag creation), the list in tag selector (filters) does not refresh. 

# Eval in exam mode -> consultation disabled

The users are being hinted about the exam grading status, (consultations disabled)

-> consultation mode active : while in grading student see "evaluation is being graded", when grading done he enters the consult page
-> consultation mode disabled (exam) : while in grading student see "evaluation is being graded", when grading done  "Consultation is disabled"

the fact that we transition from evaluation is being graded to Consultation is disabled hints the student that the grading process is finished

---

### #607 — Remove back button from the app download page

- **Created:** 2025-11-24
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/607

this page audience are mostly student, it does not make sens to have a button that points to /

---

### #611 — Automate desktop app build and release distribution

- **Created:** 2025-11-27
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/611

## Automated Release Process for OpenDidac Desktop

The release process is now automated to enable rapid response during exams and TEs in case of incident in these high stake moments. 

## Previous Process:

Manual, multi-step workflow involving building, tag management, release creation, and migration between repositories.

## Current Solution:

Two automated GitHub Actions workflows (to be run sequentially) 
- Build and Publish to Private Repository
- Distribute Release to Public Repository

They will do all the tag and release management and make sure the latest code updates are delivered and available for download from the /downloads page on the main app. 

## Tag Management:

We reuse tag v1.0.0 to maintain compatibility with existing download links on the OpenDidac platform. Changing the version would require updating links in the main application.
Both workflows handle tag deletion and recreation automatically, eliminating manual steps and reducing deployment time.

The setup of PAT token is necessary, The necessary scopes are documented in the readme

---

### #620 — Coefficient endpoints require change after migration to typescript is merged

- **Created:** 2026-01-05
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/620

_No description provided._

---

## OlivierLmr

### #345 — Improved grading policies : grading points + weights

- **Created:** 2024-12-05
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/345

I would believe welcome the ability to have two layers of point attributions per question : points needed for grading (during question modification), and question weight (during eval composition).

Here's the reasoning :

- Very often, if not always, the number of points assigned to a question depends on the question itself, independently of the test it is used in. For instance, a question with 3 parts, rated respectively 2pts, 1pt and 4pts, would be graded on 7 points, and another with 10 parts would be graded over 10 points. The "meaning" of what 1pt is worth is thus not uniform over the entire question set, and solely dependent on the question itself.
- When composing an exam, assuming the 10 points question is intended to be worth just as much as the 7 points question, we're in trouble. Either we butcher what we thought was a fair intra-question grading policy (taking this 7pts question : change them to 3pts, 2pts, 5pts, which is not the same), or we have to award decimal points that might have to be approximate (make the 7points question worth 10, and award 1.42pts per original point).

My proposed solution :

- On question creation/modification, the grading policy can be set with a number of points that can be arbitrary, as convenient for the specific question.
- On eval composition, a weight can be assigned to each question, initially 1 everywhere, meaning every question is worth the same (even if their grading schemes need different numbers of points). This way my two questions graded on 7 and 10 points would be worth the same amount, and it would be easy to modify the respective weights of each.

As nice side-effects, this would

- clarify the distinction between a question floating in the database, and its "instantiation" in the context of other questions,
- work towards storing some information about "how to grade this question".

---

### #483 — Update project dependencies

- **Created:** 2025-08-05
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/483

_No description provided._

---

### #494 — Improvements to question management

- **Created:** 2025-08-12
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/494

Many issues relate to difficulties managing questions:

- https://github.com/opendidac/opendidac/issues/337
- https://github.com/opendidac/opendidac/issues/388 and https://github.com/opendidac/opendidac/issues/456
- https://github.com/opendidac/opendidac/issues/397

The feeling seems to be that having a flat collection of questions is hard to manage and reason about. This forces some to create groups as ways to compartmentalize things, leading to needs like https://github.com/opendidac/opendidac/issues/337

We need to improve the Questions page to allow more convenient question management.

---

### #584 — Switch to UUIDs instead of CUID

- **Created:** 2025-11-04
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/584

If CUIDs are not guaranteed to be globally unique across instances, switch to UUIDs

---

### #603 — Improve Desktop-restricted student workflow

- **Created:** 2025-11-18
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/603

For desktop-restricted evaluations, only html links should be shared with students. Having to copy opendidac links in a browser to open the opendidac app is confusing.

The workflow should be the following

- Professor creates evaluation with desktop restriction.
- OpenDidac shares an html link only. We could consider adding the option to get the opendidac link also.
- This link shows the download instructions and a clickable opendidac link.

---

## Perdjesk

### #183 — CI Multiplatforms (smoketest version)

- **Created:** 2024-03-11
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/183

The project must support development on the following platform:
* Windows 
** Nodejs with CMD shell
* Macos
* Linux

The dependency are:
* Nodejs
* Docker

CI tests:
* build artifacts (container images)
* build application
* run prisma migrations
* run all scripts in package.json successfully

Context:
An issue was raised during development because the nodejs package.json 'scripts' are executed on Windows with CMD shell and one Macos with ZSH shell.
The behavior is thus platform dependent.

---

### #184 — CI Light version initial

- **Created:** 2024-03-11
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/184

A CI job for every PR and main:
* the application build is passing (npm run build)
* code formatting is checked

---

## bchapuis

### #397 — Redesign questions to allow grouping by statement

- **Created:** 2025-03-03
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/397

This is might seem like a rather big change in the current model, but it would fundamentally remain quite similar.

## The problem

We often have multiple questions that share the same problem statement. As examples:

> __Consider the following Binary Search Tree__
> a) Which of the following nodes are leaves (MCQ)
> b) Which of the following nodes are unbalanced (MCQ)
> c) How would such a tree be represented in memory (open question)

> __Provide a high-level description of a distributed algorithm capable of finding the shortest route between two processes in a distributed system. Then,__
> a) What is its communication complexity ?
> b) What is its time complexity, as a function of the number N of processes, and an upper bound on the duration of transit of a message ?
> c) What assumptions did you have to make on the network in order to solve the problem?

In the current version of eval, we have two main options to implement such questions, each with its inefficiencies.
1. Create one question per subquestion, reusing the same problem statement.
    - The problem statement is now duplicated ; later modifications to it require modifying all of them, potentially forgetting some.
    - What was conceptually one question with multiple subparts is now spread in the system without any way of relating them together. This makes it complicated to create new collections with it, since individual questions might no longer make sense alone. One has to make sure none is forgotten, and all are added in the right order.
    - It may not be clear to students that the problem statements are identical, and they might lose time reading through it again, worrying they missed a difference. One solution to this is to add a sentence saying "this is a continuation of question xxx", but this is even less elegant. We now introduce even more implicit dependencies between questions, and may use question names that will be changed or overwritten in the future.
2. Create one single question for all subquestions, and change it all into an open question.
    - While this has worked for my second example since all questions were open ended, this is problematic in the first scenario: MCQs, true/false, essays, code questions, must all be merged into one type. If one subquestion is a code question, we have two options: ask students to answer in comments of a code question, or write code in an essay question. Neither is elegant nor practical.

## The proposal

I propose the following model to solve this problem in the least intrusive way:
- Creating a question remains unchanged, choosing from the different existing types.
- While editing a question,
    - A button on the right-hand side of the screen allows adding a new "answer field".
    - When clicked, the user can choose the type of answer field, similarly to when creating a new question. This field will then be added at the bottom of the right pane, similarly to how there can be multiple answer fields in a code-reading question.
    - At the top of each answer field, a short description can be given.
    - The potential "Setup", "Solution", "Template" tabs still remain, per answer field, and behave in the exact same way.
- In the students view, the answer fields follow one another vertically, again like the fields of a code-reading question. Each answer field is preceded by that field's description.
- In the grading view, parts of a question are graded separately, so as to allow keeping the current interface with the grading at the bottom.

I am open to discussing this or brainstorming other ways to solve this problem, of course !

---

## dorian-ch

### #334 — Order tags by name in dropdown 

- **Created:** 2024-10-15
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/334

Tags have no particular order. An alphabetical order would improve the UX. 

![image](https://github.com/user-attachments/assets/b7e5d0b3-f198-4451-a5c3-36fb1c577256)

---

## fmhanna

### #145 — Enhance grading comments

- **Created:** 2023-11-16
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/145

The actual grading comments box is limited in visible hight and not realy pratical to use.
The right side of the grading page (currently it showes the solution on the right of student's answer) could be used to add comments.
It would be also very helapful to be able to comment students' answers directly in the answer (with comments highlited or starting with some prefix)

---

## gmbreguet

### #340 — Question removal process should be ARCHIVE => DELETE

- **Created:** 2024-11-19
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/340

Today, questions can be simply "remove" and thus disappear completely from user's scope.
This is rather dangerous and frustrating.

Instead, just like evaluations, the removal process should first "archive" the question, up to the owner/user to delete it.

---

## ludelafo

### #610 — Improve the UI when there are more questions that the available width space

- **Created:** 2025-11-26
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/610

When there are numerous questions in an evaluation, the user interface can be misleading to display that they are more questions than currently displayed.

A screenshot to illustrate:

<img width="1332" height="73" alt="Image" src="https://github.com/user-attachments/assets/118e33b6-2e62-4127-adc5-b1591c96ef9b" />

The evaluation has 16 questions, but the interface only displays 10 questions. The arrow next to "Q10" is available to switch to the next question, but it doesn't express the fact there are more questions that 10.

Would adding a ping animation such as available with Tailwind would help? Demo: <https://tailwindcss.com/docs/animation#adding-a-ping-animation>. Or writing "Q1/Q16"?

A few students had this problem in an evaluation done this morning. A rework of the UI would be necessary to avoid this issue in the future.

---

## pierrebressy

### #284 — submitting answer not mandatory

- **Created:** 2024-06-06
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/284

As the submit is not mandatory, the students don't use it.
- To add a 'submit all' ?
- To remove the submit button ?

Same for the end evaluation button

---

## yves-chevallier

### #220 — Observations and Potential Enhancements for Test Cases

- **Created:** 2024-04-26
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/220

During my first use of `eval` platform, I identified several areas for potential improvement regarding the test cases:

## Clarity of Test Cases as Interactive Elements

It has come to my attention that students may not always realize they can click on the test-case labels to view results. It is not immediately clear that items labeled `TEST CASE N` function as interactive buttons.

  ![image](https://github.com/heigvd-teaching-tools/online-test-platform/assets/52489316/01443b40-0d46-476f-8350-0e45e9e01b47)

## Issues with Input Handling in `Input`:

The current setup seems to strip double quotes from the output and does not properly escape newline characters (`\n`). For this `script.py`

```python
import sys
for line in sys.stdin:
    print(line)
```

We notice that the `"` are removed from the output. Also, `\n` cannot be escaped properly:

![image](https://github.com/heigvd-teaching-tools/online-test-platform/assets/52489316/d8f52759-2bdb-4415-b44a-bb2a1cec7c9f)

## Capture and Utilization of Exit Status

Capturing the exit status effectively is crucial, yet it does not function seamlessly out-of-the-box. For instance, using the following in `script.py`:

```python
import sys
s = sys.stdin.read()
print("garbage")
assert('foo' in s)    
```

I can retrieve the exit status with Exec set to python `/src/script.py > /dev/null 2>&1; echo $?`, but this workaround is not super user-friendly, especially for students unfamiliar with such commands.

## UI Limitation in the Exec Field

The width of the 'Exec' field appears truncated in the current UI setup:

![image](https://github.com/heigvd-teaching-tools/online-test-platform/assets/52489316/b2a36bfd-969a-45bc-8b3b-2ff06ac2a37e)

## Argument Support for Test Cases

In my scenarios, it is preferable for students to input arguments directly rather than standard input. Here's how I've structured the test setup:

1. Create a `src/script.py` for the student, the student would implement a function.
2. Create a `src/__main__.py` for the teacher for the test cases: 

### Problem Statement

La classe `Vocabulary` est initialisÃ©e avec une liste de mots. 
Ajouter la mÃ©thode `start_with` qui prend en paramÃ¨tre une lettre. 
Cette mÃ©thode retourne tous les mots qui commencent par cette lettre. 

#### Exemple

```python
>>> v = Vocabulary(["Hello", "Bonjour", "Comment", "John", "Maison", "Hotel"])
>>> print(v.start_with('H'))
['Hello', 'Hotel']
```

#### Indice

- `assert("abc".startswith('a') == True)`

#### Tests

- Le premier argument passÃ© au programme dans `Exec` est la lettre recherchÃ©e
- Input est la chaÃ®ne passÃ©e au constructeur de `Vocabulary`

### `src/script.py` (solution)

```python
class Vocabulary:
    def __init__(self, words):
        self._words = words

    def start_with(self, letter):
        return [w for w in self._words if w.startswith(letter)]
```

### `src/__main__.py`

```python
import sys
import json
try:
    from .script import Vocabulary
except ImportError:
    print("Cannot import class vocabulary")
    exit(1)
 
s = sys.stdin.read().replace("'", '"')
v = Vocabulary(json.loads(s))
print(v.start_with(sys.argv[1]))
```

### Test cases

For the test cases I have this:

![image](https://github.com/heigvd-teaching-tools/online-test-platform/assets/52489316/3a2b4e43-2fa6-48ac-961b-86766c160568)

It can be rather confusing for the student to see the content of the `__main__.py` and also confusing to see in `Exec` the value `python -m src H`

### Proposal for Simplification

One approach to simplify this might be to label the test cases, conceal the exec, input, and output fields, and merely display PASS or FAIL.

| Test cases | Result |
| ---------- | ------ |
| Use of a comprehension | FAIL |
| Entries starting with `H` | PASS |
| No entries starting with `V` | PASS |

With this method, we can obscure the intricacies of the test cases and solely show the desired outcomes.

## Autograding Enhancement

Currently, if only one out of five tests succeeds, the student scores zero points. A proposed enhancement could involve a checkbox to award a percentage of the total points based on the number of successful tests. For instance, passing 2 out of 5 tests could yield 40% of the points. An additional field could specify the percentage awarded for each passed test.

---
