# Project Learnings & Technical Notes

This document captures the key decisions, patterns, and insights from building the IA Prototyper.

## Core Architecture Decisions

### 1. One Data Model, Two Views

**Decision:** The editor and wireframe preview read from the same Zustand store. No data duplication.

**Why it worked:**
- Real-time synchronization comes for free
- Single source of truth prevents inconsistencies
- Zustand's selector-based subscriptions ensure efficient re-renders
- Both views update automatically when store changes

**Key insight:** Separating the data model from the UI completely allows multiple representations of the same information without complexity.

### 2. No Backend, No Database

**Decision:** Entire app state lives client-side, persisted via URL hash and JSON export.

**Why it worked:**
- Zero infrastructure cost
- Instant sharing (copy URL = share prototype)
- Version control through URLs (each change = new URL)
- Works offline
- No auth or user management complexity

**Key insight:** For prototyping tools, client-side state with URL encoding is often sufficient and dramatically simpler than a backend.

### 3. Index-Based Connection Mapping (Approach A)

**Decision:** Connections map from groups to groups, not individual cards. First card in nav → first connection, second card → second connection, etc.

**Why it works:**
- Simple to implement and reason about
- Avoids expanding the data model prematurely
- Good enough for v1 (most nav structures are linear anyway)

**Future improvement:** Upgrade to card-level connections (add `fromCardId` to Connection type) for more flexibility. But index-based mapping was the right choice to ship faster.

### 4. Phased Development

**Decision:** Build in 4 sequential phases instead of attempting everything at once.

**Why it worked:**
- Phase 1: Foundation (store, types, URL state) — solid base
- Phase 2: Editor (drag & drop) — core UX
- Phase 3: Connections — logic layer
- Phase 4: Wireframe — visual output

Each phase builds on the previous. Testing was easier. Progress was visible.

**Key insight:** Breaking a complex project into clear phases with explicit verification steps prevents scope creep and maintains momentum.

## Technical Patterns

### Zustand Store Organization

**Pattern:** Actions, state, and UI state in one store, but UI state doesn't persist.

```typescript
interface ProjectState {
  meta: { ... },
  cards: CardDefinition[],
  groups: Group[],
  connections: Connection[],
  unsortedCardIds: string[]
}

interface UIState {
  isConnectionMode: boolean,
  selectedSourceGroupId: string | null
}

type ProjectStore = ProjectState & ProjectActions & UIState
```

**Why:**
- UI state (connection mode, selected source) is ephemeral — shouldn't persist in URL
- `loadSnapshot()` preserves UI state when restoring from URL
- Keeps persistent data separate from transient UI concerns

### URL State Encoding

**Pattern:** lz-string compression + window.location.hash + debouncing

```typescript
const useUrlSync = () => {
  // On mount: decode from URL hash and load into store
  // On store change: debounce (500ms) → encode → update hash
}
```

**Why it worked:**
- lz-string compression keeps URLs manageable
- Hash changes don't trigger page reload
- 500ms debounce prevents URL spam on rapid changes
- Round-trip testing ensured data integrity

**Key insight:** Debouncing is critical. Without it, every keystroke would create a new URL hash.

### Drag & Drop with @dnd-kit

**Pattern:** DndContext wraps the editor, each card/group is draggable/droppable, collision detection determines where drops land.

**Key learnings:**
- `useDraggable` for cards
- `useDroppable` for groups and deck
- `useSortable` for reordering within groups
- `DragOverlay` for visual feedback during drag
- **Disable DndContext in connection mode** to prevent accidental drags while clicking to connect

**Gotcha:** Make sure to stop propagation on button clicks inside groups when in connection mode, otherwise clicking "rename" or "delete" triggers connection logic.

### Connection Mode Toggle

**Pattern:** Boolean flag in store (`isConnectionMode`) that conditionally renders different behaviors.

**In connection mode:**
- DndContext disabled
- Groups become clickable (not draggable)
- Visual styling changes (borders highlight/dim based on validity)
- Escape key clears selection

**In normal mode:**
- DndContext active
- Groups are droppable zones
- Connection badges show existing connections

**Key insight:** A mode toggle is cleaner than trying to support both interactions simultaneously. Clear separation of concerns.

### Validation in Store Actions

**Pattern:** Validate before mutating state. Log warnings but don't throw errors.

```typescript
addConnection: (fromGroupId, toGroupId) => {
  // Validate: from must be nav, to must be page/secondary-nav
  if (!isValid) {
    console.warn('Invalid connection');
    return; // Don't mutate state
  }
  // Proceed with mutation
}
```

**Why:**
- Prevents invalid state from entering the store
- Console warnings help debugging
- Silent failures prevent user-facing errors (though this could be improved with toast notifications)

### CSS Separation for Wireframes

**Decision:** Wireframes use plain CSS (wireframe.css) with `.wf-` prefixed classes. No Tailwind.

**Why:**
- Wireframe styling will be customizable later
- Complete isolation from the tool's UI styling
- Easier to extract/replace the entire wireframe styling system
- Forces intentional lo-fi aesthetic (monospace, dashed borders)

**Key insight:** When building a tool that generates output with a distinct visual language, keep output styles separate from tool styles.

## Component Architecture

### Composition Pattern

**Pattern:** Small, focused components composed into larger containers.

```
EditorPanel (manages DnD context)
  ├── Deck (droppable, contains cards)
  │   └── CardItem (draggable)
  └── GroupsList (container)
      └── GroupZone (droppable, sortable)
          └── SortableCard → CardItem
```

**Why it worked:**
- Each component has one responsibility
- Easy to test individual pieces
- React.memo on CardItem prevents unnecessary re-renders
- Zustand selectors in each component subscribe only to needed data

### Prop Drilling vs Store Access

**Pattern:** Small components use props, container components read from store.

**Example:**
- `CardItem` receives `card` as prop (no store access)
- `GroupZone` reads store directly for cards, groups, actions
- `EditorPanel` orchestrates by passing handlers down

**Why:**
- Keeps leaf components pure and reusable
- Containers handle business logic and state
- Easier to test components in isolation

## Design Philosophy

### Lo-Fi Wireframes

**Decision:** Wireframes must look intentionally unfinished.

**Visual rules:**
- Monospace font
- Dashed borders
- Gray placeholders
- No color, no polish, no imagery

**Why:**
- Communicates structure, not design
- Participants focus on IA, not visual design
- Sets expectations: this is a wireframe, not a mockup
- Prevents premature design discussions

**Key insight:** The aesthetic is a feature, not a bug. Lo-fi reduces cognitive load and focuses attention on information architecture.

### Two-Panel Layout

**Decision:** Split view by default (editor left, wireframe right) with toggle for single-panel views.

**Why:**
- Immediate visual feedback while editing
- See cause and effect (drag card → see wireframe update)
- Mobile/narrow screens can use tabbed view
- Preview-only mode for sharing with stakeholders

**Key insight:** The side-by-side view is the "aha moment" — seeing the prototype update in real-time makes the connection between card sorting and IA structure visceral.

## Edge Cases Handled

1. **Empty main-nav group:** Show only project title, no links
2. **Cards but no connections:** Nav visible but clicking shows "No page connected"
3. **Connection to secondary-nav with no pages:** Sidebar appears but shows empty state
4. **Active page deleted:** Fall back gracefully, clear selection
5. **Duplicate connections:** Prevented in `addConnection` validation
6. **Self-connections:** Prevented in `addConnection` validation
7. **Deleting a group:** Cards return to deck, connections removed automatically
8. **More cards than connections:** Extra cards show "No page connected" when clicked

## Performance Considerations

1. **React.memo on CardItem:** Prevents re-renders when dragging other cards
2. **Zustand selectors:** Each component subscribes only to needed data
3. **Debounced URL updates:** 500ms delay prevents hash spam
4. **Index-based connection lookup:** O(n) lookups are fine for typical IA scale (dozens, not thousands)

## Future Improvements

### Near-term enhancements
- [ ] Card-level connections (upgrade from index-based to explicit fromCardId)
- [ ] Toast notifications for validation errors instead of console warnings
- [ ] Undo/redo functionality
- [ ] Keyboard shortcuts (e.g., Cmd+E for editor, Cmd+P for preview)
- [ ] Search/filter cards in the deck
- [ ] Bulk operations (select multiple cards, move them together)

### Long-term features
- [ ] Multiple card data types (table, chart, form, list, hero, media)
- [ ] Customizable wireframe styling (fonts, colors, spacing)
- [ ] Collaboration mode (real-time multi-user editing)
- [ ] Analytics (track which cards participants struggle to categorize)
- [ ] Export to Markdown, Figma, or HTML
- [ ] Route-based navigation in wireframe (react-router for shareable deep links)

## What We Got Right

1. **Phased approach:** Each phase was shippable and testable
2. **URL encoding:** Sharing is instant, no backend needed
3. **Zustand:** Perfect fit for this app (simple, powerful, no boilerplate)
4. **@dnd-kit:** Smooth drag & drop with minimal configuration
5. **Lo-fi aesthetic:** Forces focus on structure, not design
6. **Separation of concerns:** Editor, connections, wireframe are independent
7. **Real-time sync:** Two views, one store = automatic updates

## What We'd Do Differently

1. **Card-level connections from the start:** Would've saved the index-based workaround
2. **Toast notifications:** Better UX than console warnings for validation errors
3. **Undo/redo early:** Should've been in Phase 1 (history is harder to retrofit)
4. **Component library:** Could've used shadcn/ui for buttons, dialogs, inputs (mentioned in CLAUDE.md but skipped for speed)

## Key Takeaways

1. **Start simple, add complexity only when needed.** Index-based connections were good enough for v1.
2. **Visual feedback is everything.** The split view makes the tool intuitive.
3. **Client-side state is underrated.** No backend doesn't mean "toy project" — it means fast, shareable, and simple.
4. **Lo-fi is a feature.** Intentionally rough wireframes keep focus on structure.
5. **Phased development works.** Clear phases with verification steps prevent overwhelm.
6. **One data model, multiple views.** Zustand + selectors made this trivial.

---

Built in 4 phases, ~120k tokens, one session. This project demonstrates that complex UX tools can be built quickly with the right architecture and clear phases.
