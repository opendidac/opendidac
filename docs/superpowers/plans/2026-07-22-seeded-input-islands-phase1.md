# Seeded Input Islands — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `useCtrlState` with the seeded-input-islands pattern in the input components and the 8 existing hook call sites, so the approach can be tested and approved before converting the remaining editors.

**Architecture:** Input components own their content. Data flows out live via `onChange`; data flows in only through `defaultValue`, applied at mount or when `contentKey` changes. Monaco uses per-`path` models (undo/cursor preserved per key, survives unmount). During phase 1 the editors are dual-mode: the legacy `code`/`rawContent` props keep working for unconverted consumers.

**Tech Stack:** React 19.2 (`useEffectEvent`), Next.js 16 (pages router), `@monaco-editor/react` 4.7, `@uiw/react-md-editor`, MUI, SWR, vitest + jsdom.

**Spec:** `docs/superpowers/specs/2026-07-22-seeded-input-islands-design.md`

## Global Constraints

- Branch: `672-cursor-jump-fixes`. Commit after every task with trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- New source files start with the project's Apache 2.0 license header (copy the exact 15-line header from `web/hooks/useCtrlState.ts`).
- `contentKey` values must be globally unique per editor instance — namespace them `domain:${id}` (e.g. `file-content:abc`, `sql-query:q1`). Two mounted editors sharing a path share one Monaco model.
- Legacy props (`code` on `InlineMonacoEditor`, `rawContent` on `MarkdownEditor`) must keep working unchanged — 9 consumers are not converted in this phase.
- All commands run from `web/`: `C:\HEIGVD\opendidac\opendidac\web`.
- Verification per task: `npm run lint` must pass. Task 11 adds `npm run type-check` and the full manual checklist.

---

### Task 1: `useSeededState` hook + tests

**Files:**
- Create: `web/hooks/useSeededState.ts`
- Test: `web/hooks/useSeededState.test.tsx`

**Interfaces:**
- Produces: `useSeededState<T>(seed: T, key: React.Key): [T, Dispatch<SetStateAction<T>>]` — plain `useState` semantics, but state re-seeds from `seed` only when `key` changes; same-key `seed` changes are ignored.

- [ ] **Step 1: Install the testing library**

```bash
npm install --save-dev @testing-library/react
```

- [ ] **Step 2: Write the failing test**

`web/hooks/useSeededState.test.tsx` (license header, then):

```tsx
import { renderHook, act } from '@testing-library/react'
import { useSeededState } from './useSeededState'

describe('useSeededState', () => {
  it('seeds from the initial value', () => {
    const { result } = renderHook(() => useSeededState('hello', 'k1'))
    expect(result.current[0]).toBe('hello')
  })

  it('updates via the setter like useState', () => {
    const { result } = renderHook(() => useSeededState('a', 'k1'))
    act(() => result.current[1]('b'))
    expect(result.current[0]).toBe('b')
    act(() => result.current[1]((prev) => prev + 'c'))
    expect(result.current[0]).toBe('bc')
  })

  it('ignores seed changes while the key is unchanged', () => {
    const { result, rerender } = renderHook(
      ({ seed, k }) => useSeededState(seed, k),
      { initialProps: { seed: 'typed', k: 'k1' } },
    )
    act(() => result.current[1]('user input'))
    rerender({ seed: 'server refetch', k: 'k1' })
    expect(result.current[0]).toBe('user input')
  })

  it('re-seeds with the latest seed when the key changes', () => {
    const { result, rerender } = renderHook(
      ({ seed, k }) => useSeededState(seed, k),
      { initialProps: { seed: 'file A', k: 'a' } },
    )
    act(() => result.current[1]('edited A'))
    rerender({ seed: 'file B', k: 'b' })
    expect(result.current[0]).toBe('file B')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run hooks/useSeededState.test.tsx`
Expected: FAIL — cannot resolve `./useSeededState`

- [ ] **Step 4: Write the hook**

`web/hooks/useSeededState.ts` (license header, then):

```ts
import { useEffect, useState, useEffectEvent } from 'react'
import type { Dispatch, SetStateAction } from 'react'

/**
 * useState that re-seeds from `seed` ONLY when `key` changes.
 *
 * Same-key `seed` changes are ignored by design: an async refetch (SWR
 * revalidation) can never clobber what the user is typing. The key must
 * therefore encode EVERY identity whose change should reload the content
 * (file id, question id, participant id, discard counter, ...).
 */
export function useSeededState<T>(
  seed: T,
  key: React.Key,
): [T, Dispatch<SetStateAction<T>>] {
  const getSeed = useEffectEvent(() => seed)
  const [value, setValue] = useState<T>(seed)

  useEffect(() => {
    setValue(getSeed())
    // getSeed is an effect event — stable, must not be a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [value, setValue]
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run hooks/useSeededState.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add hooks/useSeededState.ts hooks/useSeededState.test.tsx package.json package-lock.json
git commit -m "feat: add useSeededState hook (seeded input islands, #672)"
```

---

### Task 2: `InlineMonacoEditor` seeded mode

**Files:**
- Modify: `web/components/input/InlineMonacoEditor.js`

**Interfaces:**
- Produces: new props `contentKey` (string, presence switches to seeded mode) and `defaultValue` (string). Legacy `code` prop unchanged when `contentKey` is absent.
- Seeded mode passes `path`/`defaultValue`/`saveViewState`/`keepCurrentModel` to `@monaco-editor/react` — one Monaco model per `contentKey`, content and undo history survive unmount/remount (e.g. `QueryEditor`'s `hidden` toggle).

- [ ] **Step 1: Add the mode switch**

Replace the component signature and the `<Editor>` invocation (lines 38–88):

```jsx
const InlineMonacoEditor = ({
  code,
  contentKey,
  defaultValue,
  language = 'javascript',
  readOnly = false,
  onChange,
  minHeight = 100,
  editorOptions = {},
}) => {
  const seeded = contentKey != null
  const [editor, setEditor] = useState(null)
  const [contentHeight, setContentHeight] = useState(100)
  const editorMount = (editor, _monaco) => {
    setEditor(editor)
    setContentHeight(getContentHeight(editor, minHeight))
  }

  useEffect(() => {
    if (editor) {
      const newContentHeight = getContentHeight(editor, minHeight)
      editor.setScrollPosition({ scrollTop: 0 })
      setContentHeight(newContentHeight)
    }
  }, [code, contentKey, editor, minHeight])

  const onContentChange = useCallback(
    (newContent) => {
      const newContentHeight = getContentHeight(editor, minHeight)
      setContentHeight(newContentHeight)
      editor.setScrollPosition({ scrollTop: 0 })
      onChange(newContent)
    },
    [editor, onChange, minHeight],
  )

  return (
    <Stack
      minHeight={contentHeight}
      height={contentHeight}
      width="100%"
      position="relative"
    >
      <Editor
        height={contentHeight}
        width="100%"
        language={language}
        {...(seeded
          ? {
              path: String(contentKey),
              defaultValue: defaultValue ?? '',
              saveViewState: true,
              keepCurrentModel: true,
            }
          : { value: code })}
        options={{ ...defaultOptions, ...editorOptions, readOnly }}
        onChange={onContentChange}
        onMount={editorMount}
      />
    </Stack>
  )
}
```

Everything else in the file (imports, `getContentHeight`, `defaultOptions`) is unchanged.

- [ ] **Step 2: Verify legacy consumers unaffected**

Run: `npm run lint`
Expected: no errors. Then `npm run dev`, open any code question — editors still work in legacy mode (no `contentKey` passed anywhere yet).

- [ ] **Step 3: Commit**

```bash
git add components/input/InlineMonacoEditor.js
git commit -m "feat: seeded (uncontrolled, per-path model) mode for InlineMonacoEditor (#672)"
```

---

### Task 3: `MarkdownEditor` seeded mode

**Files:**
- Modify: `web/components/input/markdown/MarkdownEditor.js`

**Interfaces:**
- Consumes: `useSeededState` from Task 1.
- Produces: new props `contentKey` + `defaultValue` on `MarkdownEditor`. Legacy `rawContent` prop unchanged when `contentKey` is absent (including its resync-on-prop-change behavior).

- [ ] **Step 1: Thread the new props through `MarkdownEditor`**

Add the import at the top of the file:

```js
import { useSeededState } from '@/hooks/useSeededState'
```

Change the `MarkdownEditor` signature and the `AutoResizeEditor` invocation (lines 122–167):

```jsx
const MarkdownEditor = ({
  title,
  groupScope,
  readOnly = false,
  withUpload = false,
  rawContent = '',
  contentKey,
  defaultValue,
  onChange,
  onHeightChange,
}) => {
```

and inside the JSX, replace `content={rawContent}` with:

```jsx
            contentKey={contentKey}
            content={contentKey != null ? (defaultValue ?? '') : rawContent}
```

- [ ] **Step 2: Seed `ContentEditor`'s state**

In `ContentEditor` (line 194): add `contentKey` to the destructured props:

```jsx
const ContentEditor = ({
  groupScope,
  withUpload = false,
  readOnly,
  editorProps,
  previewOptions,
  commands,
  extraCommands,
  content: initial,
  contentKey,
  onChange,
  onHeightChange,
  onError,
}) => {
```

Replace the state + resync effect (lines 209, 213–215):

```jsx
  // Seeded mode: reset only when contentKey changes. Legacy mode
  // (contentKey undefined): key falls back to the content itself, which
  // reproduces the old "resync whenever the prop changes" behavior.
  const [content, setContent] = useSeededState(initial, contentKey ?? initial)
```

Delete the old `const [content, setContent] = useState(initial)` and the old
`useEffect(() => { setContent(initial) }, [initial])`. Remove `useState` from the
react import only if no longer used (it is still used for `uploadStatus` — keep it).

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors. In the dev app, edit a question's problem statement (legacy mode still) — typing works as before.

- [ ] **Step 4: Commit**

```bash
git add components/input/markdown/MarkdownEditor.js
git commit -m "feat: seeded mode for MarkdownEditor (#672)"
```

---

### Task 4: `SeededTextField` component

**Files:**
- Create: `web/components/input/SeededTextField.js`
- Test: `web/components/input/SeededTextField.test.jsx`

**Interfaces:**
- Consumes: `useSeededState` (Task 1).
- Produces: `<SeededTextField contentKey defaultValue onChange(string) {...TextFieldProps} />` — an MUI TextField that cannot be clobbered by same-key prop updates (SWR refetch during typing).

- [ ] **Step 1: Write the failing test**

`web/components/input/SeededTextField.test.jsx` (license header, then):

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import SeededTextField from './SeededTextField'

describe('SeededTextField', () => {
  it('renders the seed and reports changes', () => {
    const onChange = vi.fn()
    render(
      <SeededTextField contentKey="q1" defaultValue="hello" onChange={onChange} />,
    )
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('hello')
    fireEvent.change(input, { target: { value: 'hello!' } })
    expect(input).toHaveValue('hello!')
    expect(onChange).toHaveBeenCalledWith('hello!')
  })

  it('keeps user input when the seed changes under the same key', () => {
    const { rerender } = render(
      <SeededTextField contentKey="q1" defaultValue="a" />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'typed' } })
    rerender(<SeededTextField contentKey="q1" defaultValue="server" />)
    expect(screen.getByRole('textbox')).toHaveValue('typed')
  })

  it('re-seeds when the key changes', () => {
    const { rerender } = render(
      <SeededTextField contentKey="q1" defaultValue="a" />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'typed' } })
    rerender(<SeededTextField contentKey="q2" defaultValue="b" />)
    expect(screen.getByRole('textbox')).toHaveValue('b')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/input/SeededTextField.test.jsx`
Expected: FAIL — cannot resolve `./SeededTextField`

- [ ] **Step 3: Write the component**

`web/components/input/SeededTextField.js` (license header, then):

```jsx
import { TextField } from '@mui/material'
import { useSeededState } from '@/hooks/useSeededState'

/**
 * MUI TextField that owns its content (seeded input island).
 * `defaultValue` is applied at mount and whenever `contentKey` changes;
 * same-key updates are ignored, so async refetches cannot clobber typing.
 * The latest value flows out through onChange(string).
 */
const SeededTextField = ({
  contentKey,
  defaultValue = '',
  onChange,
  ...textFieldProps
}) => {
  const [value, setValue] = useSeededState(defaultValue, contentKey)

  return (
    <TextField
      {...textFieldProps}
      value={value}
      onChange={(e) => {
        setValue(e.target.value)
        onChange && onChange(e.target.value)
      }}
    />
  )
}

export default SeededTextField
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/input/SeededTextField.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/input/SeededTextField.js components/input/SeededTextField.test.jsx
git commit -m "feat: add SeededTextField (#672)"
```

---

### Task 5: Migrate `FileEditor.tsx`

**Files:**
- Modify: `web/components/question/type_specific/code/FileEditor.tsx`

- [ ] **Step 1: Replace the hook usage**

Replace the import of `useCtrlState` with:

```tsx
import { useSeededState } from '@/hooks/useSeededState'
```

Replace the two hook calls (lines 49–55):

```tsx
  const contentKey = file?.id ?? file?.path ?? 'no-file'

  // Live local state: `language` below derives from the path while typing.
  const [path, setPath] = useSeededState(file?.path ?? '', contentKey)
```

(The content hook call is deleted — Monaco owns content now.)

- [ ] **Step 2: Update the JSX**

Path field (lines 85–95) — only the setter name changes:

```tsx
                onChange={(e) => {
                  const next = e.target.value
                  setPath(next)
                  if (file) onChange({ ...file, path: next })
                }}
```

Monaco (lines 102–111):

```tsx
      <InlineMonacoEditor
        contentKey={`file-content:${contentKey}`}
        defaultValue={file?.content ?? ''}
        language={language}
        readOnly={readonlyContent}
        minHeight={100}
        onChange={(next: string) => {
          if (file) onChange({ ...file, content: next })
        }}
      />
```

- [ ] **Step 3: Verify**

Run: `npm run lint` — no errors.
Manual: open a code-writing question, type in a template file — no cursor jump; edit the path — syntax highlighting follows; switch between files — each file shows its own content and keeps its own undo history.

- [ ] **Step 4: Commit**

```bash
git add components/question/type_specific/code/FileEditor.tsx
git commit -m "refactor: FileEditor on seeded input islands (#672)"
```

---

### Task 6: Migrate `QueryEditor.js`

**Files:**
- Modify: `web/components/question/type_specific/database/QueryEditor.js`

- [ ] **Step 1: Replace hook with seeded editor**

Delete the `useCtrlState` import and the hook call (lines 20, 29–32). Replace the `InlineMonacoEditor` block (lines 83–97):

```jsx
      {!hidden && (
        <InlineMonacoEditor
          contentKey={`sql-query:${query.id}`}
          defaultValue={query.content}
          language={'sql'}
          readOnly={readOnly}
          onChange={(sql) => {
            onChange({
              ...query,
              content: sql,
            })
          }}
        />
      )}
```

The old `if (sql === getValue()) return` guard existed because controlled mode fires
`onChange` on programmatic writes; seeded mode only fires on user edits, so it is
dropped. The `hidden` toggle is now safe: `keepCurrentModel` preserves the model
across unmount/remount.

- [ ] **Step 2: Verify**

Run: `npm run lint` — no errors.
Manual: database question — type SQL (no jump), collapse/expand the query (hidden toggle) — typed content survives.

- [ ] **Step 3: Commit**

```bash
git add components/question/type_specific/database/QueryEditor.js
git commit -m "refactor: QueryEditor on seeded input islands (#672)"
```

---

### Task 7: Migrate `WebEditor.js` (collapse double state)

**Files:**
- Modify: `web/components/question/type_specific/web/WebEditor.js`

- [ ] **Step 1: Rewrite both components**

Replace the `useCtrlState` import (line 21) with:

```js
import { useEffect, useRef } from 'react'
```

Replace the `WebEditor` body (lines 23–98):

```jsx
const WebEditor = ({
  id = 'web',
  title,
  readOnly = false,
  web: initial,
  onChange,
}) => {
  // Only fields the user touched; untouched fields fall back to the latest
  // server value when assembling the onChange payload.
  const edits = useRef({})

  useEffect(() => {
    edits.current = {}
  }, [id])

  const handleChange = (field, value) => {
    edits.current[field] = value
    if (onChange) {
      onChange({
        html: edits.current.html ?? initial?.html ?? '',
        css: edits.current.css ?? initial?.css ?? '',
        js: edits.current.js ?? initial?.js ?? '',
      })
    }
  }

  return (
    <Stack spacing={0} pt={0} position={'relative'} pb={24}>
      {title && (
        <Stack p={1}>
          <Typography variant="body1">{title}</Typography>
        </Stack>
      )}

      <WebEditorInput
        id={`${id}-html`}
        language={'html'}
        code={initial?.html || ''}
        readOnly={readOnly}
        onChange={(code) => handleChange('html', code)}
      />
      <WebEditorInput
        id={`${id}-css`}
        language={'css'}
        code={initial?.css || ''}
        readOnly={readOnly}
        onChange={(code) => handleChange('css', code)}
      />
      <WebEditorInput
        id={`${id}-js`}
        language={'javascript'}
        code={initial?.js || ''}
        readOnly={readOnly}
        onChange={(code) => handleChange('js', code)}
      />
    </Stack>
  )
}
```

Replace `WebEditorInput` (lines 100–148) — it becomes presentational:

```jsx
const WebEditorInput = ({ id, language, code, readOnly, onChange }) => {
  const theme = useTheme()

  return (
    <Stack spacing={1} position={'relative'}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        p={1}
        pt={2}
        position={'sticky'}
        top={0}
        zIndex={1}
        bgcolor={theme.palette.background.paper}
      >
        <Image
          src={`/svg/languages/${language}.svg`}
          alt={language}
          width={24}
          height={24}
        />
        <Typography variant="button">{language}</Typography>
      </Stack>
      <InlineMonacoEditor
        contentKey={`web:${id}`}
        defaultValue={code}
        language={language}
        readOnly={readOnly}
        onChange={onChange}
      />
    </Stack>
  )
}
```

(The `width="100%"` and `options={{ readOnly }}` props on the old invocation were
redundant — `readOnly` is already forwarded and width is the editor default.)

- [ ] **Step 2: Verify**

Run: `npm run lint` — no errors.
Manual: web question — type in each of html/css/js (no jumps), confirm saves carry
all three fields (edit only html, save → css/js unchanged on reload).

- [ ] **Step 3: Commit**

```bash
git add components/question/type_specific/web/WebEditor.js
git commit -m "refactor: WebEditor on seeded input islands, single state layer (#672)"
```

---

### Task 8: Migrate `MultipleChoice.js` + fix stale preview

**Files:**
- Modify: `web/components/question/type_specific/MultipleChoice.js`

- [ ] **Step 1: Replace the hook usage in `MultipleChoiceOptionUpdate`**

Replace the `useCtrlState` import (line 33) with:

```js
import { useSeededState } from '@/hooks/useSeededState'
```

Replace the hook call (lines 157–164):

```jsx
  // Live local copy of the option text: preview mode renders it, and the
  // correct-toggle needs the latest text when saving.
  const [text, setText] = useSeededState(
    option?.text || '',
    `${questionId}-multiple-choice-option-text-${option.id}`,
  )
```

- [ ] **Step 2: Update the consumers of `text`**

In `onChangeOption` (lines 204–212) nothing changes — `setText(newText)` now updates
live state (rerenders are safe: the markdown editor is seeded).

Correct-toggle (line 249) — `getText()` no longer exists:

```jsx
          onChangeOption(option.id, text, !isCorrect)
```

Markdown editor (lines 266–273):

```jsx
            <MarkdownEditor
              title={`Option ${option.order + 1} (markdown)`}
              contentKey={`mc-option:${questionId}:${option.id}`}
              defaultValue={option?.text || ''}
              onChange={(value) => {
                onChangeOption(option.id, value, isCorrect)
              }}
              withUpload={false}
            />
```

The preview branch (line 263) is unchanged code but now shows **live** text — this
closes tracked issue 1 (stale preview).

- [ ] **Step 3: Fix the reorder remount hazard**

In the parent `MultipleChoice` options list (line 115), replace `key={index}` with:

```jsx
                key={option.id}
```

(With index keys, reordering reassigns component state across options; with id keys
plus per-option `contentKey`s, every remount reseeds from the parent's live
`options` state, which `onOptionChange` keeps current.)

- [ ] **Step 4: Verify**

Run: `npm run lint` — no errors.
Manual: multiple-choice question — type in an option (no jump), toggle preview
immediately → **latest text shown**; reorder options → texts stay with their
options; toggle correct on a freshly-edited option → text preserved in save.

- [ ] **Step 5: Commit**

```bash
git add components/question/type_specific/MultipleChoice.js
git commit -m "refactor: MultipleChoice on seeded islands; fix stale preview + reorder keys (#672)"
```

---

### Task 9: Migrate `QuestionUpdate.js` + `QuestionTitleField.js`

**Files:**
- Modify: `web/components/question/QuestionUpdate.js`
- Modify: `web/components/evaluations/evaluation/phases/composition/QuestionTitleField.js`

- [ ] **Step 1: `QuestionUpdate.js` — replace hooks**

Replace the `useCtrlState` import (line 22) with:

```js
import SeededTextField from '@/components/input/SeededTextField'
```

Delete both hook calls (lines 61–72). The JSX below only renders when `question` is
loaded (`question && (...)`), so the seeds are always the loaded values — the old
"loading/loaded" key dance is unnecessary.

Title field (lines 202–214):

```jsx
                  <SeededTextField
                    id={`question-${question.id}-title`}
                    label="Title"
                    variant="outlined"
                    fullWidth
                    focused
                    contentKey={`question-title:${question.id}`}
                    defaultValue={question.title || ''}
                    onChange={(value) => {
                      onPropertyChange(question, 'title', value)
                    }}
                  />
```

Markdown editor (lines 222–232):

```jsx
                <MarkdownEditor
                  id={`question-${question.id}`}
                  groupScope={groupScope}
                  withUpload
                  title="Problem Statement"
                  contentKey={`question-content:${question.id}`}
                  defaultValue={question.content || ''}
                  onChange={(newContent) => {
                    onPropertyChange(question, 'content', newContent)
                  }}
                />
```

- [ ] **Step 2: `QuestionTitleField.js` — replace hook**

Replace the `useCtrlState` import (line 19) with:

```js
import { useSeededState } from '@/hooks/useSeededState'
```

Replace the hook call (lines 28–29) — live state is needed for the
`isTitleChanged` comparison, so it keeps a local state rather than
`SeededTextField`:

```jsx
  const [localTitle, setLocalTitle] = useSeededState(currentTitle, id)
```

`handleTitleChange` and the JSX are unchanged (`setLocalTitle` has the same shape).

- [ ] **Step 3: Verify**

Run: `npm run lint` — no errors.
Manual: edit a question title and statement rapidly — the save snackbar fires, no
character loss, no cursor jump; in evaluation composition, rename a question row.

- [ ] **Step 4: Commit**

```bash
git add components/question/QuestionUpdate.js components/evaluations/evaluation/phases/composition/QuestionTitleField.js
git commit -m "refactor: QuestionUpdate and QuestionTitleField on seeded islands (#672)"
```

---

### Task 10: Migrate `StudentFileAnnotationWrapper.js` (+ `AnnotationContext` loading gate)

**Files:**
- Modify: `web/context/AnnotationContext.js`
- Modify: `web/components/evaluations/grading/annotation/StudentFileAnnotationWrapper.js`

**Interfaces:**
- Produces: `useAnnotation()` additionally returns `isLoading` (boolean) — true in grading mode until the annotation fetch resolves. Consultation mode is synchronous (`isLoading` always false).

Why: `keepCurrentModel` means a `contentKey` must never need re-seeding with
different content. In grading, the annotation loads via SWR *after* mount, so the
editor must not mount until the fetch resolves — then the seed
(`annotation?.content ?? original.content`) is correct at mount, participant
switches change `original.id` (new key), and the mid-typing creation of an
annotation id does NOT change the key (no cursor jump on first keystroke).

- [ ] **Step 1: `AnnotationContext.js` — synchronous init + isLoading**

Change the state initialization (lines 115–116):

```jsx
  const [annotation, setAnnotation] = useState(immutableAnnotation ?? null)
  const [state, setState] = useState(stateBasedOnAnnotation(immutableAnnotation))
```

Add below (after the `postInProgress` ref):

```jsx
  // Grading mode fetches the annotation after mount; consumers must not
  // seed editors until it resolves. Consultation mode is synchronous.
  const isLoading = !readOnly && contextAnnotation === undefined
```

Add `isLoading` to the provider value (lines 227–234):

```jsx
      value={{
        readOnly,
        state,
        annotation,
        change,
        discard,
        isLoading,
      }}
```

- [ ] **Step 2: `StudentFileAnnotationWrapper.js` — key-only seeding**

Update the context destructure (line 110):

```jsx
  const { readOnly, state, annotation, change, discard, isLoading } =
    useAnnotation()
```

Delete the `useCtrlState` import (line 27) and the entire block from the hook call
through the view-mode sync effect (lines 121–161), replacing it with:

```jsx
  const [discardVersion, setDiscardVersion] = useState(0)

  const contentKey = `annotation:${original.id ?? original.path}:${discardVersion}`

  const onChange = (content) => {
    change(content)
  }
```

Remove `useEffectEvent` and `useRef` from the react import (line 26) — they are no
longer used:

```jsx
import { useEffect, useState } from 'react'
```

`handleDiscard` stays as is (bumps `discardVersion` → new key → reseed from
`original.content` since `annotation` is null after `discard()`).

Add the loading gate right before the `return` (after `language` is computed):

```jsx
  if (isLoading) return null
```

Left panel editor (lines 201–208):

```jsx
            <InlineMonacoEditor
              contentKey={contentKey}
              defaultValue={annotation?.content ?? original.content}
              readOnly={readOnly}
              onChange={onChange}
              language={language}
            />
```

(The `key={discardVersion}` prop is dropped — the contentKey covers it. The DIFF
right-panel and read-only original editor stay in legacy `code` mode: read-only,
no jump risk, and they must reflect live values.)

- [ ] **Step 3: Verify**

Run: `npm run lint` — no errors.
Manual (grading view): annotate a student file from scratch — **first keystroke
does not jump the cursor** (annotation id creation); switch participants back and
forth — each shows their own annotation (regression check #669/#671); switch to
DIFF and back — latest typed content still in the editor; discard → original
content restored.

- [ ] **Step 4: Commit**

```bash
git add context/AnnotationContext.js components/evaluations/grading/annotation/StudentFileAnnotationWrapper.js
git commit -m "refactor: annotation editor on seeded islands with loading gate (#672)"
```

---

### Task 11: Migrate `EvaluationComposition.js`, delete `useCtrlState`, final verification

**Files:**
- Modify: `web/components/evaluations/evaluation/phases/EvaluationComposition.js`
- Delete: `web/hooks/useCtrlState.ts`

- [ ] **Step 1: `EvaluationComposition.js` — plain seeded state + ref mirror**

Replace the `useCtrlState` import with:

```js
import { useSeededState } from '@/hooks/useSeededState'
```

Replace the hook call (lines 157–161):

```jsx
  const [questions, setQuestions] = useSeededState(
    composition ?? [],
    `${evaluationId}-composition`,
  )

  // Latest questions for event handlers that must read post-update state
  // (drag-end fires after onChangeOrder's setState).
  const questionsRef = useRef(questions)
  questionsRef.current = questions
```

Add `useRef` to the react import if missing. The merge effect (lines 168–200) and
all `setQuestions` callbacks are unchanged — `useSeededState`'s setter is a plain
`useState` setter, and the merge updater already returns `prev` untouched only via
new arrays (state updates rerender — same behavior as `setValueControlled`).

Drag-end handler (line 359):

```jsx
            onHandleDragEnd={async () => {
              await saveReOrder(questionsRef.current)
            }}
```

- [ ] **Step 2: Delete the old hook**

```bash
git rm hooks/useCtrlState.ts
```

Then verify nothing references it:

Run: `git grep -n "useCtrlState"`
Expected: no matches.

- [ ] **Step 3: Full verification**

Run: `npm run lint`
Expected: no errors.

Run: `npm run type-check`
Expected: no errors.

Run: `npx vitest run`
Expected: all tests pass (including the two new suites).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: EvaluationComposition on seeded state; remove useCtrlState (#672)"
```

---

## Manual Test Checklist (user approval gate)

Run `npm run dev` and verify, typing fast in each case and watching for cursor/focus jumps:

- [ ] Code-writing question: template/solution file content + path field; file switching keeps per-file undo history
- [ ] Database question: SQL editing; collapse/expand a query keeps typed content
- [ ] Web question: html/css/js editing; partial edits save all three fields
- [ ] Multiple choice: option text editing; **preview toggle shows latest text**; reorder keeps texts with options; correct-toggle right after typing
- [ ] Question update: title + problem statement while debounced saves fire
- [ ] Evaluation composition: rename question rows, reorder, change points
- [ ] Grading: annotate from scratch (first keystroke), switch participants (#669/#671 regression), DIFF round-trip, discard
- [ ] Student consultation view: annotated files display correctly (read-only)
- [ ] Unconverted editors (student answer editor, essay, snippets) still work in legacy mode
