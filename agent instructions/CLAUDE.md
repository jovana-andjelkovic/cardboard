# IA Prototyper

## What This Is

A UX research and prototyping tool where **card sorting IS prototype building**. Users drag cards (representing app features/content) into groups, and those groups simultaneously generate a live wireframe prototype. No separate mapping step — the card sort and the prototype are two views of the same data.

This is both a **UX research instrument** (for running card sorts with participants) and a **prototyping tool** (for validating information architecture in a navigable wireframe).

## Core Concept

There are two synchronized views of one data structure:

- **Editor view**: Card sorting interface. Drag cards from an unsorted deck into groups. Each group has a prototype role (main nav, secondary nav, or page).
- **Preview view**: Live wireframe that updates in real time as cards move. Nav groups render as navigation links, page groups render as content blocks.

Sorting a card IS building the prototype. There is no intermediate step.

## Tech Stack

- **React + TypeScript** — UI framework
- **Vite** — build tool and dev server
- **Zustand** — state management (single store shared between editor and preview)
- **@dnd-kit/core + @dnd-kit/sortable** — drag and drop
- **lz-string** — URL state compression for saving/sharing
- **Tailwind CSS** — utility styling (temporary, will be customized later — do NOT over-invest in visual polish, focus on mechanics)
- **shadcn/ui** — UI components for the tool chrome (buttons, dialogs, inputs)

## Data Model

This is the source of truth. Both the editor and wireframe preview read from and write to this same structure.

```typescript
// === Core Types ===

type PrototypeRole = 'main-nav' | 'secondary-nav' | 'page';

// v2 — not implemented yet, but design the CardDefinition type to accommodate this later
type CardDataType =
  | 'link'           // auto-assigned when card is in a nav group
  | 'content-block'  // auto-assigned when card is in a page group
  // v2 types (future):
  // | 'table' | 'chart' | 'form' | 'list' | 'hero' | 'media'
  ;

type CardDefinition = {
  id: string;
  label: string;
  description?: string;
  // dataType is DERIVED from placement, not manually set (in v1)
  // v2 will allow manual override
};

type Group = {
  id: string;
  label: string;
  cardIds: string[];           // ordered list of card IDs in this group
  prototypeRole: PrototypeRole;
  order: number;               // position in the wireframe
  linkedFrom?: string;         // ID of nav group that links to this page/secondary-nav
};

type Connection = {
  fromGroupId: string;   // always a nav group
  toGroupId: string;     // a page or secondary-nav group
};

type ProjectState = {
  meta: {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    version: number;       // increments on meaningful changes
  };
  cards: CardDefinition[];
  groups: Group[];
  connections: Connection[];
  unsortedCardIds: string[];  // cards not yet placed in any group
};
```

## Rendering Rules

The wireframe generator uses these rules to render the prototype:

| Card placement | Wireframe rendering | Visual style |
|---|---|---|
| In a `main-nav` group | Top navigation bar link | Gray pill or tab, underline on active |
| In a `secondary-nav` group | Sidebar link | Indented text, left border accent |
| In a `page` group | Content block on the page | Dashed border rectangle with label + placeholder content lines |

**Navigation behavior:**
- Clicking a main-nav link shows the page connected to that nav item
- If a main-nav item connects to a secondary-nav group, the sidebar appears with those links
- Secondary-nav links show their connected pages
- The wireframe should be fully navigable — it's a real (lo-fi) app

## Saving & Persistence Strategy

**No database. No backend. No auth.**

The entire `ProjectState` is the save file. Two save mechanisms:

1. **URL encoding**: Compress `ProjectState` with lz-string, encode into URL hash. The URL IS the save. Bookmarkable, shareable, versioned by nature (each change = new URL).

2. **JSON file export/import**: Download `ProjectState` as `.json`, upload to restore. For when URLs get too long or for archival.

URL should update on meaningful changes (debounced, not on every micro-interaction). Use `window.location.hash` so it doesn't trigger page reloads.

## Constraints & Principles

### Architecture Rules
- **One data structure, two views.** Editor and preview MUST read from the same Zustand store. Never duplicate state.
- **Groups have exactly one prototype role.** A group is either main-nav, secondary-nav, or page. Not multiple.
- **Only one main-nav group** can exist. Multiple secondary-nav and page groups are allowed.
- **Connections flow from nav → page/secondary-nav.** A nav item links TO a page. Not the reverse.
- **Card data type is derived from placement in v1.** Cards in nav groups are links. Cards in page groups are content blocks. Do not build a type selector yet.

### UX Rules
- **Editor is the primary interface.** The preview is secondary — a validation tool, not the main workspace.
- **Drag and drop must feel responsive.** Use dnd-kit's collision detection and smooth animations. This is the core interaction.
- **The wireframe should look intentionally lo-fi.** Dashed borders, gray backgrounds, system/mono fonts, placeholder text lines. It should be obvious this is a wireframe, not a design.
- **Don't over-style the tool itself.** Functional and clear is enough for now. Styling will be customized later. Focus all effort on the mechanics.

### Technical Rules
- **No backend calls.** Everything runs client-side.
- **No localStorage for primary persistence.** URL and file export are the save mechanisms. localStorage can be used for ephemeral UI state (panel sizes, last-open view) but never for project data.
- **Keep bundle small.** No heavy dependencies beyond what's listed in the tech stack.

## Phase Plan

### Phase 1: Scaffold + Data Layer
- Vite + React + TS + Tailwind + Zustand setup
- Define all TypeScript types from the data model above
- Build the Zustand store with actions: addCard, removeCard, createGroup, moveCardToGroup, reorderCard, createConnection, removeConnection, updateGroupLabel, setGroupRole
- Implement URL state encoding/decoding with lz-string (round-trip test: encode state → put in URL → decode → verify identical)
- Basic app shell with two-panel layout placeholder

### Phase 2: Card Sorting Editor
- Unsorted card deck at top of editor panel
- Droppable group zones below
- Create new group with role selector (main-nav / secondary-nav / page)
- Drag cards from deck to groups and between groups
- Reorder cards within groups
- Rename groups inline
- Delete groups (cards return to unsorted deck)
- "Add card" button for creating new cards on the fly
- URL updates on changes (debounced)

### Phase 3: Live Wireframe Preview
- Split-screen or toggle between editor and preview
- Wireframe shell: top nav bar, optional sidebar, content area
- Main-nav group → top bar links
- Secondary-nav group → sidebar links (visible when connected nav item is active)
- Page group → content area with cards as blocks
- Navigation works: clicking nav links shows connected pages
- Real-time updates as editor changes

### Phase 4: Connections UI
- Visual way to link nav groups to page/secondary-nav groups
- Click nav item → click target group to connect
- Show connections in editor (lines, badges, or a connections panel)
- Connections drive wireframe navigation (which page shows when you click a nav link)

### Phase 5: Session Management & Export
- JSON export/import for project state
- Share link generation (copy URL button)
- Markdown export for engineer handover (nav structure, page layouts, routes)
- JSON route map export

## File Structure

```
src/
├── types/
│   └── index.ts              # All TypeScript types
├── store/
│   └── project-store.ts      # Zustand store
├── lib/
│   ├── url-state.ts          # lz-string encode/decode
│   └── export.ts             # Markdown/JSON export generators
├── components/
│   ├── app-shell.tsx          # Main layout (editor + preview panels)
│   ├── editor/
│   │   ├── card-deck.tsx      # Unsorted cards area
│   │   ├── group-zone.tsx     # A single droppable group
│   │   ├── card-item.tsx      # Individual draggable card
│   │   ├── group-list.tsx     # All groups container
│   │   └── add-card-dialog.tsx
│   ├── wireframe/
│   │   ├── wireframe-shell.tsx    # Top nav + sidebar + content layout
│   │   ├── nav-bar.tsx            # Main navigation bar
│   │   ├── sidebar-nav.tsx        # Secondary navigation sidebar
│   │   ├── page-content.tsx       # Page content area with blocks
│   │   └── content-block.tsx      # Individual content block (lo-fi card)
│   ├── connections/
│   │   └── connection-editor.tsx  # UI for linking nav → pages
│   └── shared/
│       ├── share-button.tsx
│       └── export-dialog.tsx
├── hooks/
│   ├── use-url-sync.ts        # Sync store ↔ URL hash
│   └── use-wireframe-nav.ts   # Navigation state for wireframe preview
├── App.tsx
└── main.tsx
```

## Notes for Claude Code

- When in doubt about a UX decision, favor simplicity. This is a tool for UX researchers — they'll have opinions about the interface. Keep it functional and get out of the way.
- The drag-and-drop quality matters more than visual polish. Spend time on dnd-kit configuration — collision detection, drag overlays, smooth drop animations.
- Test URL encoding early and often. If the URL can't round-trip the state, nothing else matters.
- The wireframe preview should use completely separate CSS from the editor. The editor can look like a normal app. The wireframe must look like a wireframe — dashed borders, grays, monospace labels.
- Do not add features not in the current phase. The phases are sequential for a reason.
