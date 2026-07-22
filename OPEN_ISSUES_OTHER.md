# OpenDidac — Other / Uncategorized

_Generated on 2026-06-23 — 13 open issues._

> Docs, infra, research, security checks, and items not fitting the above.

## Contents

- [bchapuis](#bchapuis) — 5 issue(s)
- [Ovich](#ovich) — 4 issue(s)
- [OlivierLmr](#olivierlmr) — 2 issue(s)
- [pierrebressy](#pierrebressy) — 1 issue(s)
- [yves-chevallier](#yves-chevallier) — 1 issue(s)

## bchapuis

### #354 — Building a community around eval

- **Created:** 2025-01-08
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/354

We are currently overwhelmed by technical small technical improvement. To make the project sustainable, we need to foster external contributions and to get more funding. To do so, we have to prioritize the aspects of the projet that will enable us to achieve these goals.

In order to build a community around eval, we need to improve several aspects of the project.
- [ ] Rename the organisation from heigvd-teaching-tools to opendidac.
- [ ] Rename the repository from online-test-platform to opendidac.
- [ ] #355
- [ ] Create a getting started to install opendidac with a simple OAuth provider (e.g. github, google ou keycloak; we freeze switch eduid for now).
- [ ] Improve documation for newcomers (high level description with some relevant technical details).

---

### #394 — Create a video demonstration of the platform

- **Created:** 2025-03-03
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/394

- Create a multi choice question
- Create a code question
- Create a collection and explain the concept
- Create an evaluation and explain the concept
- Etc.

---

### #530 — Create a Readme for the github organization

- **Created:** 2025-09-24
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/530

_No description provided._

---

### #567 — Update the readme of the project

- **Created:** 2025-10-21
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/567

Check the consistency of the readme and of the documentation.

For instance, we should replace all the occurences of Eval by OpenDidac.

---

### #604 — Write a description of opendidac

- **Created:** 2025-11-20
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/604

The document should target a general audience of professors beyond computer science (e.g. haute Ã©cole de gestion).

It should describe the features of opendidact and include visual examples (screenshots) allowing to understand the platform.

It should contain descriptions of the measures we envision for securing online platforms at the age of ai (e.g. controlling IPs with a dedicated router, providing computers to the students, wrapping the application with electron and controlling the client).

---

## Ovich

### #259 — XSS Checkup

- **Created:** 2024-05-16
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/259

- [ ] Systematically sanitize every student input
- [ ] Find solution for the web question

---

### #420 — Deploy Eval in secured VM instance

- **Created:** 2025-03-07
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/420

Data handling 
- Dump current database into the secured instance
- Delete unrelated data from the secured instance (keep PRG and reds related groups)
- Keep only questions, remove evaluations

---

### #578 — Evaluate the impact of Atlas AI

- **Created:** 2025-10-29
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/578

- Try detecting the browser, see what it sends
- Warn the professor when Atlas is used
- Or prevent the connection completly

It can be intresting to let the possibility to use Atlas in the platform for research and development usecases

---

### #608 — Code Question Slip - PRG1 TE2

- **Created:** 2025-11-24
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/608

Again, for nth time, the slip has happen in code question management. 

The question has been copied in evaluation with test cases that have not been updated

We need more warnings during question editing and composition to point out:
- solution files newer than template files
- test cases older than solution files.
- maybe more...

---

## OlivierLmr

### #614 — Make OpenDidac accessible outside HEIG-VD

- **Created:** 2025-12-04
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/614

In order to allow making demos and letting external parties play around with the tool, we need it to be accessible without the VPN.

One solution could be to task with SI to have it be deployed on a VM that is public.

â†’ Would Switch edu-ID work in this context?

---

### #645 — Define MVP features for public deployment

- **Created:** 2026-02-24
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/645

Towards a public deployment on cloudflare, what heig-vd-specific or too-detailed features should we strip?

Because we might even start from scratch, we focus here on features more than implementation or architecture.

---

## pierrebressy

### #286 — grading and code check

- **Created:** 2024-06-06
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/286

It's not possible to run the code check when grading. Could be cool.

---

## yves-chevallier

### #289 — Executing script with no Input?

- **Created:** 2024-06-10
- **Labels:** —
- **URL:** https://github.com/opendidac/opendidac/issues/289

I realized my example doesn't work because the script is called with `Input` fed to stdin. 

![image](https://github.com/heigvd-teaching-tools/online-test-platform/assets/52489316/1ab96ce9-11f1-49e0-839c-137240a5e6d8)

Is there a workaround?

My goal is to ask students to list some known syscalls they must be able to find at least N names. 

I also tried that should work, but it doesn't

```
cat > /dev/null && grep -Fxf /src/answers.txt /src/syscalls.txt 
```

One way very cumbersome is to write a Python script:

```python
import sys
import re
a = '/src/syscalls'
b = '/src/answer'

with open(a) as f:
    u = set([re.sub(r'\s', '', line) for line in f])

with open(b) as f:
    v = set([re.sub(r'\s', '', line) for line in f])

print("PASS" if len(u.intersection(v)) >= 5 else "FAIL", end='')
```

As the exit status cannot be checked, I used the above workaround.

How can I use Perl onliners or bash things to check my files? Any hint?

---
