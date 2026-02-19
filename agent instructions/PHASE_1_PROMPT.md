# Phase 1 Kickoff Prompt for Claude Code

Copy and paste this into Claude Code after initializing your repo with the CLAUDE.md file.

---

## Prompt

Read CLAUDE.md thoroughly — it contains the full project context, data model, and architecture.

Set up the project foundation:

1. **Initialize the project** with Vite + React + TypeScript + Tailwind CSS. Add these dependencies: zustand, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, lz-string, nanoid, react-router-dom. Set up the folder structure as described in CLAUDE.md.

2. **Create the TypeScript types** in `src/store/types.ts` — every type from the data model section of CLAUDE.md. Export them all.

3. **Build the Zustand store** in `src/store/projectStore.ts`:
   - State: a `ProjectState` object
   - Actions:
     - `addCard(label, description?)` — creates a card with nanoid, adds to unsortedCardIds
     - `removeCard(cardId)` — removes from wherever it is (group or unsorted)
     - `updateCard(cardId, updates)` — partial update
     - `addGroup(label, prototypeRole)` — creates a group. If role is main-nav and one already exists, reject.
     - `removeGroup(groupId)` — deletes group, returns its cards to unsortedCardIds. Cannot delete main-nav.
     - `updateGroup(groupId, updates)` — partial update (rename, reorder)
     - `moveCard(cardId, toGroupId, index)` — removes card from current location (unsorted or another group), inserts into target group at index. Auto-sets card's dataType based on target group's prototypeRole.
     - `returnCardToDeck(cardId)` — moves card back to unsortedCardIds
     - `reorderCardInGroup(groupId, fromIndex, toIndex)` — reorder within a group
     - `addConnection(fromGroupId, toGroupId)` — validate: from must be nav, to must be page/secondary-nav
     - `removeConnection(fromGroupId, toGroupId)`
     - `getSnapshot()` — returns the full ProjectState as a plain object (for serialization)
     - `loadSnapshot(state: ProjectState)` — replaces entire store state
   - Initialize with a default main-nav group (label: "Main Navigation", prototypeRole: "main-nav")

4. **URL state encoding** in `src/utils/urlState.ts`:
   - `encodeStateToUrl(state: ProjectState): string` — JSON.stringify → lz-string compressToEncodedURIComponent → set window.location.hash
   - `decodeStateFromUrl(): ProjectState | null` — read hash → lz-string decompressFromEncodedURIComponent → JSON.parse
   - A React hook `useUrlSync()` that subscribes to the Zustand store and debounces URL updates (500ms). On mount, if a hash exists, load from URL.

5. **JSON file export/import** in `src/utils/fileIO.ts`:
   - `exportToFile(state: ProjectState)` — triggers download of a .json file
   - `importFromFile(file: File): Promise<ProjectState>` — reads and parses uploaded .json

6. **Basic layout shell** in `src/App.tsx`:
   - Two-panel split layout (resizable is nice-to-have, fixed 50/50 is fine for now)
   - Left panel: placeholder text "Editor" 
   - Right panel: placeholder text "Preview"
   - Top bar with project title, export button, import button
   - Wire up URL sync hook
   - Add a few sample cards to the store on first load (so we can see the state round-trip through the URL)

After everything is set up, verify:
- `npm run dev` works
- The store initializes with a main-nav group and sample cards
- Exporting and importing a .json file works
- The URL hash updates when store changes, and reloading the page restores state from the URL

---

## Follow-up Phase 2 Prompt (use after Phase 1 is working)

Read CLAUDE.md, specifically Phase 2: Card Sorting Editor.

Build the card sorting editor in the left panel:

1. **Deck component** (`src/features/editor/Deck.tsx`): horizontal scrollable row showing all unsorted cards. Each card is a draggable item (use @dnd-kit). Cards show their label and optionally a truncated description.

2. **Group component** (`src/features/editor/Group.tsx`): a droppable zone that displays its cards in a vertical list. Shows the group label (editable inline on double-click), prototype role as a subtle badge, card count, and a delete button (disabled for main-nav). Cards within are draggable and sortable.

3. **Groups list** (`src/features/editor/GroupsList.tsx`): renders all groups vertically. Has an "Add group" button at the bottom that opens an inline form (label input + role selector dropdown).

4. **Editor panel** (`src/features/editor/EditorPanel.tsx`): composes Deck at top + GroupsList below. Wraps everything in a DndContext from @dnd-kit.

5. **Drag and drop behavior**:
   - Dragging a card from the deck into a group → calls `moveCard`
   - Dragging a card from one group to another → calls `moveCard`
   - Dragging a card out of a group back to the deck area → calls `returnCardToDeck`
   - Reordering within a group → calls `reorderCardInGroup`
   - Visual feedback: dragged card shows a ghost/overlay, drop zones highlight on dragover

Make sure the store updates correctly for every drag operation. Test with the sample cards from Phase 1.
