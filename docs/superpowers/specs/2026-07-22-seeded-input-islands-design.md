# Seeded Input Islands — Design Spec

**Date:** 2026-07-22
**Branch:** `672-cursor-jump-fixes`
**Issue:** [#672 — Cursor Jump Fixes](https://github.com/opendidac/opendidac/issues/672)
**Status:** Approved by Ovich (chat), pending spec review

## Problem

Text inputs (Monaco editors, the markdown editor, and some MUI TextFields) suffer
recurring focus/cursor jumps and stale-content bugs. The current mitigation,
`web/hooks/useCtrlState.ts`, works but relies on implicit contracts that call sites
must uphold by discipline. The project's history shows the cost: #650 (infinite
render), #669/#671 (stale content on participant switch), and a live stale-preview
bug in `MultipleChoice.js` are all violations of those unstated rules.

Root cause analysis:

- **Editors (Monaco, MDEditor):** the jump happens whenever content is pushed *into*
  the editor via a live `value` prop. Data flowing *out* is always safe.
- **MUI TextFields:** controlled DOM inputs do not lose focus on rerender; their
  bugs come from (a) SWR round-trip clobber — a debounced save triggers a refetch
  whose response overwrites the field mid-typing — or (b) genuine remounts
  (unstable `key`s, components defined inside render bodies).

## Requirements (agreed)

1. Input state stays isolated in the input component; outside consumers (preview
   panels, saves, validation) receive updates live via `onChange`.
2. The only inward path to a mounted input is an identity change (`contentKey`).
   No in-place programmatic writes are needed.
3. The solution must be solid, easy to implement at call sites, and must not depend
   on call-site discipline or implicit contracts.

## Design

**One rule everywhere:** an input component owns its content. Data flows out live
via `onChange`; data flows in only through `defaultValue`, applied at mount or when
`contentKey` changes. No input component exposes a live `value` prop — the unsafe
wiring becomes unexpressible in the API.

### 1. Shared primitive — `useSeededState(initial, key)`

The useful half of `useCtrlState`: `useState` seeded from `initial`, plus a reset
effect that fires only when `key` changes (reads the latest `initial` via
`useEffectEvent`, as today). No ref, no dual setters, no frozen value. ~15 lines,
unit-testable. Lives in `web/hooks/useSeededState.ts`.

### 2. Input components

**`InlineMonacoEditor`** (`web/components/input/InlineMonacoEditor.js`)

- Props: `contentKey`, `defaultValue`, `language`, `readOnly`, `minHeight`,
  `editorOptions`, `onChange`. The `value`/`code` prop is deleted.
- Implementation: pass `path={contentKey}` and `defaultValue` to
  `@monaco-editor/react`. The library maintains one Monaco model per path;
  switching `contentKey` swaps models natively — content reseeds, undo history and
  cursor position are preserved per key, no remount, no flicker.
- Handle model lifecycle: configure model disposal/`saveViewState` so long sessions
  with many keys do not leak memory.

**`MarkdownEditor`** (`web/components/input/markdown/MarkdownEditor.js`)

- Props gain `contentKey` + `defaultValue`, replacing `rawContent`.
- Internal content state moves to `useSeededState(defaultValue, contentKey)`,
  removing the current resync-on-every-prop-change effect that makes it
  clobberable.

**`SeededTextField`** (`web/components/input/SeededTextField.js`, new)

- Thin MUI TextField wrapper: `contentKey`, `defaultValue`, `onChange(string)`,
  all other props spread to `TextField` (labels, validation, adornments work
  unchanged).
- Internally controlled via `useSeededState` — safe for DOM inputs; eliminates the
  SWR-clobber class for title/path/label/settings fields.

### 3. Consumers

Parents that need a live value (e.g. MultipleChoice preview toggle, web question
preview panel) keep an ordinary `useState` fed by `onChange` — no special rules.
Heavy consumers (iframe previews) may debounce their own updates.

### 4. Migration and cleanup

1. Convert the 8 existing `useCtrlState` call sites:
   `FileEditor.tsx`, `QueryEditor.js`, `WebEditor.js` (collapse its double-wrapped
   state to a single layer), `MultipleChoice.js`, `QuestionUpdate.js`,
   `QuestionTitleField.js`, `StudentFileAnnotationWrapper.js` (its
   `discardVersion` key-bump mechanism carries over unchanged),
   `EvaluationComposition.js` (not an input — moves to plain `useState` + its
   existing merge effect).
2. Delete `useCtrlState.ts`.
3. Convert the remaining editor sites from the #672 list:
   `AnswerEditor.js` (student answers — highest stakes), `Essay.js`,
   `SnippetEditor.js`, `OutputEditor.js`, `QueryUpdatePanel.js`, `FieldEditor.js`,
   `Addendum.js`, `EvaluationSettings.js`, `StudentQueryConsole.js`.
   Consult/Compare components are read-only and stay as-is.
4. TextField audit: sweep `TextField` usages whose `value` is fed by SWR data;
   convert clobberable ones to `SeededTextField`. While sweeping, flag any
   component-defined-inside-render or unstable-`key` remount bugs for structural
   fixes (a wrapper cannot fix a remount).

### 5. How the tracked issues resolve

(From `CURSOR_JUMP_HOOK_ISSUES.md`.)

| # | Issue | Resolution |
|---|-------|------------|
| 1 | Stale MultipleChoice preview | Preview reads parent state fed by `onChange` |
| 2 | Remount reseeds stale content | No stale seed exists; Monaco models preserve state across key switches |
| 3 | Invisible freeze contract | Enforced by API shape — no live `value` prop exists |
| 4 | WebEditor double-wrapped state | Outer layer becomes plain state; inner becomes the new editor |
| 5 | Reference-equality bail-out | Gone with the hook; composition list uses plain `useState` |
| 6 | Key invariant undocumented | Documented on the `contentKey` prop of three components |
| 7 | Remaining unconverted inputs | Migration list above; conversions are one-line prop changes |

## Edge cases

- **Monaco model disposal:** avoid leaks when many `contentKey`s are visited in one
  session.
- **StrictMode double-effects:** the seed reset is idempotent — verified by design.
- **Debounced saves vs. key change:** audit existing `useDebouncedCallback` sites
  for `.flush()` on unmount / before `contentKey` changes away. Current behavior is
  identical, so this is an improvement opportunity, not a regression risk.
- **SWR revalidation while typing:** same-key `defaultValue` changes are ignored by
  design; external/multi-tab edits do not propagate into a mounted input. Accepted
  trade-off, unchanged from today.

## Testing

- Unit tests for `useSeededState` (seed, reset-on-key, ignore same-key updates).
- Manual scenarios per component class:
  - Type in Monaco / markdown / TextField during a debounced-save + SWR refetch —
    no cursor jump, no revert.
  - Switch entity (file, question, participant) — content reloads.
  - MultipleChoice: type, toggle preview — preview shows latest text.
  - Web question: type, observe preview panel updates.
  - Grading: switch participants and DIFF/annotation modes — no stale content
    (regression check for #669/#671).
