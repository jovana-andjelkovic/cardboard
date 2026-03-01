# Agent Skills — IA Prototyper

Techniques and patterns observed to work well when using Claude Code on this project.

---

## Prompt writing

### Give the agent a reading list, not just a task

Starting a prompt with "Before making any changes, read X, Y, Z" consistently produces better results than jumping straight to the task. The agent mirrors existing patterns rather than inventing new ones.

```
Before starting, read `CLAUDE.md` thoroughly. Then read
`src/store/projectStore.ts` (especially `addCard`) and
`src/features/editor/Deck.tsx` before making any changes.
```

### Specify what NOT to do

Constraints are as important as requirements. Explicit prohibitions prevent the agent from making reasonable-but-wrong choices.

Examples from this project:
- "Do not use `document.createElement('input')` in Deck.tsx — use `useRef` instead"
- "No deduplication — importing the same file twice should append duplicate cards"
- "The parser must never throw — return `[]` for any unrecognisable input"

### Include code snippets for tricky parts

For non-obvious implementations (e.g. a Zustand action with a specific mutation shape, an algorithm with edge cases), providing the actual code in the prompt removes ambiguity. Describe algorithms in prose, give snippets for structure.

### End with a verification checklist

A list of 15–25 testable items makes it easy to confirm the implementation is correct. Items should be specific and binary (pass/fail), not vague.

```markdown
- [ ] `parseMarkdownCards('')` returns `[]` without throwing
- [ ] `bulkAddCards([])` is a no-op — store version does not increment
- [ ] Importing the same file twice appends duplicate cards
```

---

## Implementation patterns

### Store actions before component usage

When adding new functionality:
1. Add the action to the store interface
2. Implement the action in the store
3. Add the selector in the component
4. Use it in the component

This order prevents TypeScript errors from broken intermediate states.

### Derive, don't store

Storing derived values in component state causes staleness bugs. If a value can be computed from the store's current state, compute it at render time.

**Bad:** `const [activePage, setActivePage] = useState<Group | null>(null)` — goes stale when store updates.

**Good:** `const activePage = groups.find(g => g.ownerCardId === activeMainNavCardId)` — always fresh.

### Portals for anything that can be clipped

Any overlay element (tooltip, modal, dropdown) that lives inside a component with a constrained container should be rendered via `createPortal(el, document.body)`. Position it using `getBoundingClientRect()` with viewport clamping.

```typescript
const rect = cardRef.current.getBoundingClientRect();
let left = rect.left;
if (left + TOOLTIP_WIDTH > window.innerWidth - 8) {
  left = window.innerWidth - TOOLTIP_WIDTH - 8;
}
```

### Clear the URL hash before destructive state changes

The URL hash holds compressed state. When resetting or replacing state, clear the hash first — before calling the store action. The debounced URL sync takes 500ms to overwrite it, so a reload in that window would restore the old state.

```typescript
window.location.hash = '';
resetProject();
```

### Combine refs when dnd-kit is involved

`useDraggable`'s `setNodeRef` needs the DOM element. If you also need the element for position calculation, combine them:

```typescript
const cardRef = useRef<HTMLDivElement | null>(null);
const setRefs = (el: HTMLDivElement | null) => {
  setNodeRef(el);       // for dnd-kit
  cardRef.current = el; // for getBoundingClientRect
};
```

---

## Working with the agent

### Update prompt docs as you go

When the implementation diverges from the prompt (by design or discovery), update the prompt document to match. The prompts in `agent instructions/` serve as living documentation of what was built and why.

### Keep changes small and sequential

When the agent makes a change, confirm it works before asking for the next one. Stacking multiple unverified changes makes it harder to isolate which change caused a problem.

### Name the problem, not the solution

"Reset is not working" is more useful than "change the reset function to do X". The agent can read the code and diagnose the root cause. Naming the symptom often leads to a better fix than prescribing the solution.

### "Update the doc to reflect the changes" is a valid task

After any implementation change, asking the agent to update the relevant prompt or documentation file keeps everything in sync. The agent can compare the current code against the doc and update only what changed.

---

## File organisation

### `agent instructions/` — phase prompts

One file per phase. Each file is a complete, self-contained implementation brief. Updated to reflect the actual implementation as the project evolves.

### `agent learnings/` — this folder

Post-session summaries and skill notes. Not instructions for the agent — observations about what worked.

### `LEARNINGS.md` — technical architecture notes

Captures key decisions, patterns, and gotchas at the code level. Useful for onboarding or revisiting the project after a gap.

### `CLAUDE.md` — always-loaded context

Short, high-level project brief that the agent reads on every session. Contains the data model, tech stack, constraints, and design philosophy. Keep it concise — lines after ~200 are truncated.
