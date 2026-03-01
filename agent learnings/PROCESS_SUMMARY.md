# IA Prototyper — Process Summary

This document summarises how the IA Prototyper was built: the phases, the working method, and the refinements made across sessions.

---

## How the project was structured

The project was built in two distinct stages: a phased feature build (Phases 1–6), and a UX refinement session that followed.

### Phase-based build (Phases 1–6)

Each phase had a dedicated prompt file in `agent instructions/`. Before writing any code, the agent was instructed to read `CLAUDE.md` and the relevant source files. Each prompt specified:

- What to build (deliverables)
- How to build it (implementation details with code snippets)
- What not to do (gotchas and constraints)
- How to verify it worked (a checklist)

**Phase 1 — Scaffold + Data Layer**
Set up Vite + React + TypeScript + Tailwind + Zustand. Defined all TypeScript types. Built the store. Implemented URL state encoding/decoding with lz-string. No UI yet — just a solid foundation.

**Phase 2 — Card Sorting Editor**
Built the drag-and-drop editor: unsorted card deck, droppable groups, reordering within groups, inline group creation, card creation. First interactive milestone.

**Phase 3 — Connections**
Added the connection system: visual UI for linking nav groups to pages/secondary navs. This was the hardest phase — required disabling drag-and-drop while in connection mode and managing a lot of edge cases.

**Phase 4 — Live Wireframe Preview**
Built the wireframe: top nav bar, optional sidebar, content area with card blocks. Navigable — clicking nav links shows the connected page. Lo-fi aesthetic enforced via a separate `wireframe.css` with `.wf-` classes.

**Phase 5 — Implicit Connections**
Simplified the UX: dropping a card onto main nav now auto-creates a page and a connection. Removed the explicit connection UI in favour of this implicit model. Added the secondary nav promotion modal.

**Phase 6 — Markdown Card Import + UX tooling**
Added markdown import/export (two formats: heading and list), bulk card replacement, project title editing, reset-to-unsorted, and fixed the wireframe preview staleness bug. This phase also introduced the card tooltip system.

---

## Working method

### Always read before changing

Every phase prompt instructed the agent to read relevant files first. In practice: read the store, read the component, understand the existing patterns, then mirror them exactly.

### One concern per prompt

Each phase prompt addressed exactly one feature area. Mixing concerns (e.g. "add drag-and-drop AND the wireframe") leads to longer, harder-to-verify prompts.

### Verification checklists

Each phase prompt ended with a checklist of testable items. This made it easy to confirm whether the implementation was correct before moving on.

### Incremental, non-breaking changes

Changes were made in small steps. New actions were added to the store before components used them. New utilities were created before components imported them. This order prevented broken intermediate states.

### Prompt documents as the source of truth

The phase prompts in `agent instructions/` were updated throughout the UX refinement session to reflect actual implementation decisions. They serve as both instructions for the agent and documentation of what was built and why.

---

## UX refinement session (post Phase 6)

After the initial build, a focused session addressed usability issues:

**Wireframe preview staleness** — The preview was storing stale `Group` object snapshots in local state. Fixed by deriving `activePage` and `activeSecondaryNav` directly from the store's `groups` on every render, using only card IDs in local state.

**Card tooltips** — Added a 200ms-delay tooltip portal on card hover showing full label and description. Used `createPortal` to render at `document.body` level, preventing clipping by overflow containers. Position is calculated from `getBoundingClientRect()` and clamped to the viewport.

**Main nav default position** — Changed from `'top'` to `'left'` as the default.

**Project title editing** — Made the title in the top bar click-to-edit inline, with a pencil icon on hover.

**Markdown round-trip** — Import now replaces all cards (rather than appending), clears groups, and clears the URL hash before setting new state.

**Reset** — Clarified that reset means "move all cards to unsorted" (not "restore sample data"). Fixed by clearing the URL hash before calling `resetProject()`.

**Rename removal** — Removed the ability to rename groups after creation. Simplifies the UI significantly.

**GitHub Pages** — Set up deployment via GitHub Actions on push to `main`, with `base: '/ia-prototyper/'` in `vite.config.ts`.

---

## Key architectural decisions that held up

- **One store, two views.** Editor and wireframe read from the same Zustand store. No duplication, no sync issues.
- **URL hash as save file.** No backend, no database. lz-string compressed state in the hash = instant shareable URLs.
- **`ownerCardId` on groups.** Pages and secondary navs track which card owns them. This enabled cascade delete and eliminated index-based connection fragility.
- **Separate wireframe CSS.** `wireframe.css` with `.wf-` prefixes is completely isolated from Tailwind. Easy to replace or customise later.
- **Portals for overlays.** Any element that might be clipped by a parent container (tooltips, modals) is rendered via `createPortal` into `document.body`.

---

## What the phase prompt format gets right

- Forces reading before writing
- Gives the agent just enough context to implement correctly (no more)
- Code snippets for the tricky parts, algorithm descriptions for the rest
- Explicit "do not" rules to prevent common mistakes
- Verification checklist makes correctness observable

The format scales well. Phases 1–4 were written before any code existed. Phases 5–6 were written with knowledge of the existing codebase and were more specific as a result.
