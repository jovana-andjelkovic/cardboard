# Component Inventory

> Design system planning surface — created 2026-03-01

---

## 1. Overview

The project uses two distinct styling systems that map onto two distinct UI surfaces. The **Main UI** (card sorting editor) is built with inline Tailwind utility classes and lives in `src/features/editor/` and `src/App.tsx`. The **Wireframe UI** (live wireframe preview) uses a dedicated `wireframe.css` file with `.wf-` prefixed classes and lives in `src/features/wireframe/`.

---

## 2. Main UI Components

### App Shell — `src/App.tsx`

Renders the full application frame: top bar with title/view-toggle/action buttons, and the panel area that switches between split, editor-only, and preview-only views.

**UI elements and Tailwind classes:**

| Element | Classes |
|---|---|
| App root | `h-screen flex flex-col bg-gray-50` |
| Preview-only root | `h-screen bg-gray-100` |
| Top bar | `bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between` |
| Top bar left group | `flex items-center gap-6` |
| Title (display) — wrapper | `group flex items-center gap-1.5 cursor-pointer` |
| Title (display) — `<h1>` | `text-xl font-semibold text-gray-800 group-hover:text-blue-600` |
| Title (display) — edit icon | `w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0` |
| Title (editing) — `<input>` | `text-xl font-semibold text-gray-800 border-b-2 border-blue-500 bg-transparent focus:outline-none w-64` |
| View toggle container | `flex border border-gray-300 rounded overflow-hidden` |
| View toggle button — active | `px-4 py-1.5 text-sm font-medium transition-colors bg-blue-500 text-white` |
| View toggle button — inactive | `px-4 py-1.5 text-sm font-medium transition-colors bg-white text-gray-700 hover:bg-gray-50` |
| Action buttons row | `flex gap-3` |
| Reset button | `px-4 py-2 bg-white text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors` |
| Export button | `px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors` |
| Import button | `px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors` |
| Panel area | `flex-1 overflow-hidden` |
| Split — editor half | `w-1/2 border-r border-gray-200 bg-white overflow-hidden` |
| Split — preview half | `w-1/2 bg-gray-100 overflow-hidden` |
| Full editor view | `h-full bg-white` |
| Full preview view | `h-full bg-gray-100` |

**Interactive states:**
- Title: hover reveals blue colour + edit icon; clicking switches to `<input>`, committed on blur/Enter, cancelled on Escape.
- View toggle buttons: active state = `bg-blue-500 text-white`; inactive hover = `hover:bg-gray-50`.
- Reset/Export/Import: colour-shift on hover only.

---

### EditorPanel — `src/features/editor/EditorPanel.tsx`

DnD context wrapper. Contains the scrollable layout holding the sticky Deck at the top and the GroupsList below. Renders a floating DragOverlay and the SecondaryNavPromptModal.

**UI elements and Tailwind classes:**

| Element | Classes |
|---|---|
| Scrollable container | `h-full overflow-auto` |
| Inner padding | `p-6 space-y-6` |
| Sticky deck wrapper | `sticky top-0 z-10 bg-white pb-4` |
| DragOverlay wrapper | `rotate-3 opacity-90` |

**Interactive states:**
- DragOverlay: card rendered at `rotate-3 opacity-90`, following the pointer.
- Source card: `opacity-0.5` applied via inline style when `isDragging`.

---

### Deck — `src/features/editor/Deck.tsx`

Droppable zone showing unsorted cards. Provides Export .md / Import .md / Add Card controls, an inline add-card form, a responsive cards grid, and import feedback.

**UI elements and Tailwind classes:**

| Element | Classes |
|---|---|
| Droppable zone (default) | `bg-gray-50 border-2 border-dashed rounded-lg p-4 border-gray-300` |
| Droppable zone (card over) | `bg-gray-50 border-2 border-dashed rounded-lg p-4 border-blue-400 bg-blue-50` |
| Header row | `flex items-center justify-between mb-3` |
| Card count heading | `text-sm font-semibold text-gray-700` |
| Actions row | `flex items-center gap-2` |
| Import feedback text | `text-xs text-green-600 font-medium` |
| Export .md button | `px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 transition-colors` |
| Import .md button | `px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 transition-colors` |
| Add Card button | `px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors` |
| Add card form wrapper | `mb-4 p-3 bg-white border border-gray-300 rounded-lg` |
| Label input | `w-full px-2 py-1 text-sm border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500` |
| Description input | `w-full px-2 py-1 text-xs border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500` |
| Form buttons row | `flex gap-2` |
| Add (submit) button | `px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600` |
| Cancel button | `px-3 py-1 text-xs font-medium bg-gray-300 text-gray-700 rounded hover:bg-gray-400` |
| Cards grid | `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3` |
| Empty deck message | `text-center py-8 text-gray-400 text-sm` |

**Interactive states:**
- Drop target: border and background shift to blue when a card is hovering (`isOver`).
- Add Card button toggles the inline form.
- Import feedback fades after 3 s.
- Inputs: `focus:ring-2 focus:ring-blue-500`.

---

### CardItem — `src/features/editor/CardItem.tsx`

Draggable card chip. Renders a type-indicator dot (when inside a group), card label, and truncated description. Shows a positioned tooltip on hover after a 200 ms delay; tooltip is portal-rendered to `document.body` to avoid clipping.

**UI elements and Tailwind classes:**

| Element | Classes |
|---|---|
| Card container | `relative bg-white border border-gray-300 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing` |
| Card container (dragging) | above + `opacity: 0.5` via inline style |
| Tooltip container | `bg-gray-900 text-white text-xs rounded-lg p-2.5 shadow-lg pointer-events-none` |
| Tooltip arrow (above card, pointing down) | `absolute top-full left-4 border-4 border-transparent border-t-gray-900` |
| Tooltip arrow (below card, pointing up) | `absolute bottom-full left-4 border-4 border-transparent border-b-gray-900` |
| Tooltip label | `font-semibold leading-snug` |
| Tooltip description | `mt-1 text-gray-300 leading-snug` |
| Card body row | `flex items-start gap-2` |
| Type dot — link (nav group) | `w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-blue-500` |
| Type dot — content-block (page group) | `w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-orange-500` |
| Label | `font-medium text-gray-900 text-sm truncate` |
| Description | `text-xs text-gray-500 mt-0.5 truncate` |

**Interactive states:**
- Resting: `shadow-sm`; hover: `shadow-md`.
- Cursor: `cursor-grab`; while pressed: `active:cursor-grabbing`.
- Dragging: source card goes to `opacity-0.5`; DragOverlay copy shows at `rotate-3 opacity-90`.
- Tooltip: appears after 200 ms hover, hidden immediately on leave or mousedown.

---

### GroupZone — `src/features/editor/GroupZone.tsx`

Droppable group card. Renders a header (title, role badge, card count, contextual action buttons, optional owner annotation) and a drop zone body listing sortable cards.

**UI elements and Tailwind classes:**

| Element | Classes |
|---|---|
| Group container | `bg-white border border-gray-300 rounded-lg overflow-hidden` |
| Header | `bg-gray-50 border-b border-gray-300 px-4 py-3` |
| Header inner row | `flex items-center justify-between` |
| Header left side | `flex items-center gap-2 flex-1 min-w-0` |
| Group title | `text-sm font-semibold text-gray-800 truncate` |
| Role badge — main-nav | `px-2 py-0.5 text-xs font-medium border rounded flex-shrink-0 bg-blue-100 text-blue-700 border-blue-300` |
| Role badge — secondary-nav | `px-2 py-0.5 text-xs font-medium border rounded flex-shrink-0 bg-green-100 text-green-700 border-green-300` |
| Role badge — page | `px-2 py-0.5 text-xs font-medium border rounded flex-shrink-0 bg-orange-100 text-orange-700 border-orange-300` |
| Card count | `text-xs text-gray-500 flex-shrink-0` |
| Header actions | `flex items-center gap-1 ml-2 flex-shrink-0` |
| Add Secondary Nav button | `px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors` |
| Delete button | `p-1 text-red-500 hover:text-red-700 text-xs` |
| Owner annotation | `text-xs text-gray-400` (inside `mt-1` wrapper) |
| Drop zone (default) | `p-4 min-h-[120px]` |
| Drop zone (card over) | `p-4 min-h-[120px] bg-blue-50 border-2 border-blue-400 border-dashed` |
| Cards list | `space-y-2` |
| Empty drop placeholder | `h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg py-12 text-gray-400 text-sm` |

**Interactive states:**
- Drop zone: highlights blue when a card is over.
- Add Secondary Nav button: indigo ghost; visible only on page-role groups that don't already have a secondary nav.
- Delete button: red ghost; hidden on main-nav groups.

---

### GroupsList — `src/features/editor/GroupsList.tsx`

Two-column paired layout: left column holds the main-nav GroupZone + a nav-position toggle; a thin connector line separates it from the right column of page GroupZones. Secondary nav groups appear indented below their parent page. An orphaned-groups section appears at the bottom when needed.

**UI elements and Tailwind classes:**

| Element | Classes |
|---|---|
| Root wrapper | plain `<div>` |
| Two-column flex | `flex gap-0 items-start` |
| Left column | `w-56 flex-shrink-0` |
| Column header row | `flex items-center justify-between mb-2 px-1` |
| Column label text | `text-xs font-semibold text-gray-500 uppercase tracking-wide` |
| Nav position toggle container | `flex border border-gray-300 rounded overflow-hidden` |
| Nav position button — active | `px-2 py-0.5 text-xs transition-colors bg-gray-600 text-white` |
| Nav position button — inactive | `px-2 py-0.5 text-xs transition-colors bg-white text-gray-500 hover:bg-gray-50` |
| Connector line wrapper | `flex flex-col items-center self-stretch pt-8 px-3` |
| Connector line | `w-px flex-1 bg-gray-200` |
| Right column | `flex-1 min-w-0` |
| Pages column label | `text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1` |
| Empty pages message | `text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center` |
| Pages list | `space-y-4` |
| Secondary nav indent wrapper | `mt-2 ml-6 space-y-2` |
| Secondary nav indent connector | `absolute -left-3 top-4 w-3 h-px bg-gray-300` |
| Sec-nav page indent wrapper | `mt-2 ml-6 space-y-2` |
| Orphaned groups section | `mt-6` |
| Orphaned groups label | `text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1` |
| Orphaned groups list | `space-y-4` |
| No main nav message | `text-sm text-gray-500 text-center py-8` |
| Orphaned nav card placeholder | `text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg p-4` |

**Interactive states:**
- Nav position toggle: active button = dark `bg-gray-600 text-white`; inactive hover = `hover:bg-gray-50`.

---

### SecondaryNavPromptModal — `src/features/editor/SecondaryNavPromptModal.tsx`

Fixed-position modal. Rendered conditionally when a main-nav card is dropped into a page group. Offers two choices: keep the card as a Content Block or promote it to Secondary Nav.

**UI elements and Tailwind classes:**

| Element | Classes |
|---|---|
| Fixed overlay | `fixed inset-0 z-50 flex items-center justify-center` |
| Backdrop | `absolute inset-0 bg-black/30` |
| Modal container | `relative bg-white border border-gray-200 rounded-xl shadow-lg p-6 max-w-sm w-full mx-4` |
| Modal title | `text-sm font-semibold text-gray-900 mb-2` |
| Modal description | `text-sm text-gray-600 mb-5` |
| Card name emphasis | `font-medium` (inline `<span>`) |
| Buttons row | `flex gap-2 justify-end` |
| Content Block button | `px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors` |
| Secondary Nav button | `px-4 py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors` |

**Interactive states:**
- Backdrop click dismisses (same as "Content Block").
- Escape / blur not wired — modal is keyboard-inaccessible currently.

---

## 3. Wireframe UI Components

All wireframe components import `./wireframe.css` and use only `.wf-` prefixed classes. No Tailwind is used.

---

### WireframePreview — `src/features/wireframe/WireframePreview.tsx`

Top-level wireframe shell. Renders either a top-nav layout or a left-nav layout depending on `mainNavPosition`. In left-nav mode it renders the nav directly; in top-nav mode it delegates to `WireframeTopNav`. Always renders `WireframeContentArea` and optionally `WireframeSidebar`.

**`.wf-` classes used:**

| Class | Applied to |
|---|---|
| `wf-shell` | Root container (both modes) |
| `wf-shell--leftnav` | Modifier on root when `mainNavPosition === 'left'` |
| `wf-leftnav` | Left nav panel |
| `wf-leftnav-header` | Left nav header section |
| `wf-leftnav-title` | Project title inside left nav |
| `wf-leftnav-links` | Container for left nav link items |
| `wf-leftnav-link` | Individual left nav link |
| `wf-leftnav-link--active` | Active modifier on left nav link |
| `wf-leftnav-body` | Content area beside left nav panel |
| `wf-content-row` | Horizontal flex wrapper for sidebar + content (both modes) |

---

### WireframeTopNav — `src/features/wireframe/WireframeTopNav.tsx`

Horizontal nav bar rendered in top-nav mode. Shows project title on the left and main nav links on the right.

**`.wf-` classes used:**

| Class | Applied to |
|---|---|
| `wf-topnav` | Bar container |
| `wf-topnav-title` | Project title text |
| `wf-topnav-links` | Flex row of links |
| `wf-topnav-link` | Individual nav link |
| `wf-topnav-link--active` | Active modifier on nav link |

---

### WireframeSidebar — `src/features/wireframe/WireframeSidebar.tsx`

Secondary navigation sidebar. Rendered when the active main-nav page has a secondary-nav group attached.

**`.wf-` classes used:**

| Class | Applied to |
|---|---|
| `wf-sidebar` | Sidebar container |
| `wf-sidebar-link` | Individual sidebar link |
| `wf-sidebar-link--active` | Active modifier on sidebar link |

---

### WireframeContentArea — `src/features/wireframe/WireframeContentArea.tsx`

Main content column. Renders the active page title followed by a list of `WireframeBlock` components, or an empty state.

**`.wf-` classes used:**

| Class | Applied to |
|---|---|
| `wf-content` | Content wrapper |
| `wf-page-title` | Page title heading |

---

### WireframeBlock — `src/features/wireframe/WireframeBlock.tsx`

Lo-fi content block representing a single card placed on a page. Shows block title, optional description, and four placeholder lines of varying widths to simulate text content.

**`.wf-` classes used:**

| Class | Applied to |
|---|---|
| `wf-block` | Block container |
| `wf-block-title` | Block title |
| `wf-block-description` | Block description (conditional) |
| `wf-placeholder-lines` | Container for all placeholder lines |
| `wf-placeholder-line` | Base class for each placeholder line |
| `wf-placeholder-line--full` | 100% width modifier |
| `wf-placeholder-line--85` | 85% width modifier |
| `wf-placeholder-line--92` | 92% width modifier |
| `wf-placeholder-line--60` | 60% width modifier |

---

### WireframeEmptyState — `src/features/wireframe/WireframeEmptyState.tsx`

Centred empty-state panel. Accepts a `type` prop that maps to one of four messages: `no-cards-sorted`, `no-connections`, `no-page-connected`, `empty-page`.

**`.wf-` classes used:**

| Class | Applied to |
|---|---|
| `wf-empty` | Outer container |
| `wf-empty-title` | Title text |
| `wf-empty-message` | Descriptive message text |

---

### Full `.wf-` Class Reference

| Class | Current style values |
|---|---|
| `.wf-shell` | `height: 100%; display: flex; flex-direction: column; background-color: #ffffff; font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace` |
| `.wf-shell--leftnav` | `flex-direction: row` |
| `.wf-topnav` | `background-color: #f0f0f0; border-bottom: 1px solid #ddd; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between` |
| `.wf-topnav-title` | `font-size: 14px; font-weight: bold; color: #333` |
| `.wf-topnav-links` | `display: flex; gap: 16px` |
| `.wf-topnav-link` | `font-size: 13px; color: #555; cursor: pointer; padding: 4px 8px; border-radius: 2px; transition: background-color 0.15s` |
| `.wf-topnav-link:hover` | `background-color: #e8e8e8` |
| `.wf-topnav-link--active` | `text-decoration: underline; color: #222; font-weight: 500` |
| `.wf-content-row` | `display: flex; flex: 1; overflow: hidden` |
| `.wf-sidebar` | `width: 200px; background-color: #ffffff; border-right: 1px solid #e0e0e0; overflow-y: auto; flex-shrink: 0` |
| `.wf-sidebar-link` | `display: block; padding: 8px 16px; font-size: 13px; color: #555; cursor: pointer; border-left: 3px solid transparent; transition: all 0.15s` |
| `.wf-sidebar-link:hover` | `background-color: #f8f8f8` |
| `.wf-sidebar-link--active` | `color: #222; font-weight: 600; border-left-color: #666; background-color: #fafafa` |
| `.wf-content` | `flex: 1; overflow-y: auto; padding: 24px` |
| `.wf-page-title` | `font-size: 18px; font-weight: bold; color: #333; margin-bottom: 24px` |
| `.wf-block` | `border: 1px dashed #999; background-color: #fafafa; padding: 16px; margin-bottom: 16px; min-height: 120px` |
| `.wf-block-title` | `font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px` |
| `.wf-block-description` | `font-size: 12px; color: #666; margin-bottom: 12px` |
| `.wf-placeholder-lines` | `display: flex; flex-direction: column; gap: 6px` |
| `.wf-placeholder-line` | `height: 10px; background-color: #d0d0d0; border-radius: 2px` |
| `.wf-placeholder-line--full` | `width: 100%` |
| `.wf-placeholder-line--85` | `width: 85%` |
| `.wf-placeholder-line--92` | `width: 92%` |
| `.wf-placeholder-line--60` | `width: 60%` |
| `.wf-empty` | `display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 48px; text-align: center; color: #888` |
| `.wf-empty-title` | `font-size: 16px; font-weight: 600; color: #666; margin-bottom: 8px` |
| `.wf-empty-message` | `font-size: 13px; color: #999; max-width: 400px` |
| `.wf-leftnav` | `width: 200px; background-color: #f0f0f0; border-right: 1px solid #ddd; display: flex; flex-direction: column; flex-shrink: 0` |
| `.wf-leftnav-header` | `padding: 16px; border-bottom: 1px solid #ddd; display: flex; flex-direction: column; gap: 8px` |
| `.wf-leftnav-title` | `font-size: 14px; font-weight: bold; color: #333` |
| `.wf-leftnav-links` | `flex: 1; overflow-y: auto; padding: 8px 0` |
| `.wf-leftnav-link` | `display: block; padding: 8px 16px; font-size: 13px; color: #555; cursor: pointer; border-left: 3px solid transparent; transition: all 0.15s` |
| `.wf-leftnav-link:hover` | `background-color: #e8e8e8` |
| `.wf-leftnav-link--active` | `color: #222; font-weight: 500; border-left-color: #666; background-color: #e0e0e0` |
| `.wf-leftnav-body` | `flex: 1; display: flex; flex-direction: column; overflow: hidden` |
| `.wf-nav-toggle` | `font-size: 11px; color: #888; background: none; border: 1px dashed #ccc; border-radius: 2px; padding: 2px 6px; cursor: pointer; font-family: inherit; text-align: left; align-self: flex-start` |
| `.wf-nav-toggle:hover` | `color: #555; border-color: #999` |

> Note: `.wf-nav-toggle` is defined in `wireframe.css` but not currently used in any component.

---

## 4. Shared Patterns

### Button variants

Five distinct button styles appear across the Main UI:

| Variant | Where used | Key classes |
|---|---|---|
| **Primary blue** | Add Card, Add (form submit), Export (App), View toggle (active) | `bg-blue-500 text-white rounded hover:bg-blue-600` |
| **Secondary gray** | Export .md, Import .md | `bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200` |
| **Ghost / dark** | Import (App), nav position (active) | `bg-gray-700 text-white rounded hover:bg-gray-800` or `bg-gray-600 text-white` |
| **Destructive red** | Reset (App), Delete group | `text-red-600 border border-red-300 hover:bg-red-50` / `text-red-500 hover:text-red-700` |
| **Indigo** | Secondary Nav (modal), Add Secondary Nav (ghost) | `bg-indigo-500 text-white rounded-lg hover:bg-indigo-600` / `text-indigo-600 hover:bg-indigo-50` |

### Input styles

| Style | Classes |
|---|---|
| Standard text input | `border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500` |
| Inline title input | `border-b-2 border-blue-500 bg-transparent focus:outline-none` |

### Badge / tag variants (role badges)

| Role | Classes |
|---|---|
| main-nav | `bg-blue-100 text-blue-700 border-blue-300 border rounded` |
| secondary-nav | `bg-green-100 text-green-700 border-green-300 border rounded` |
| page | `bg-orange-100 text-orange-700 border-orange-300 border rounded` |

### Colour palette

**Editor (Tailwind classes → effective values):**

| Usage | Tailwind token | Approx. hex |
|---|---|---|
| App background | `gray-50` | #f9fafb |
| Top bar / card surface | `white` | #ffffff |
| Borders (most) | `gray-200` / `gray-300` | #e5e7eb / #d1d5db |
| Headings / strong text | `gray-900` / `gray-800` | #111827 / #1f2937 |
| Secondary text | `gray-500` / `gray-600` | #6b7280 / #4b5563 |
| Muted / placeholder | `gray-400` | #9ca3af |
| Primary action | `blue-500` | #3b82f6 |
| Primary hover | `blue-600` | #2563eb |
| Focus ring | `blue-500` | #3b82f6 |
| Destructive | `red-500` / `red-600` | #ef4444 / #dc2626 |
| Destructive bg tint | `red-50` | #fef2f2 |
| Indigo action | `indigo-500` | #6366f1 |
| Main-nav badge bg | `blue-100` | #dbeafe |
| Secondary-nav badge bg | `green-100` | #dcfce7 |
| Page badge bg | `orange-100` | #ffedd5 |
| Type dot — link | `blue-500` | #3b82f6 |
| Type dot — content | `orange-500` | #f97316 |
| Tooltip | `gray-900` | #111827 |
| Dark button | `gray-700` | #374151 |

**Wireframe (CSS hex values):**

| Usage | Hex |
|---|---|
| Shell background | `#ffffff` |
| Top nav / left nav background | `#f0f0f0` |
| Nav border | `#ddd` |
| Nav title / heading text | `#333` |
| Nav link text | `#555` |
| Nav link hover bg (top/left) | `#e8e8e8` |
| Active link text | `#222` |
| Active link border | `#666` |
| Left nav active bg | `#e0e0e0` |
| Sidebar border | `#e0e0e0` |
| Sidebar link hover bg | `#f8f8f8` |
| Sidebar active bg | `#fafafa` |
| Page title / block title | `#333` |
| Block description | `#666` |
| Block border | `#999` |
| Block bg | `#fafafa` |
| Placeholder line | `#d0d0d0` |
| Empty state text | `#888` / `#999` |
| Empty state title | `#666` |
| Nav toggle border | `#ccc` |

### Spacing scale in use

**Main UI (Tailwind):** `p-1`, `p-2`, `p-3`, `p-4`, `p-6`, `px-2`, `px-3`, `px-4`, `px-6`, `py-0.5`, `py-1`, `py-1.5`, `py-2`, `py-3`, `py-4`, `py-8`, `py-12`, `gap-1`, `gap-1.5`, `gap-2`, `gap-3`, `gap-6`, `mt-0.5`, `mt-1`, `mt-2`, `mt-6`, `mb-2`, `mb-3`, `mb-4`, `mb-5`, `ml-2`, `ml-6`, `space-y-2`, `space-y-4`, `space-y-6`.

**Wireframe CSS:** `4px`, `6px`, `8px`, `12px`, `16px`, `24px`, `48px` (padding/margin/gap values).

### Typography scale in use

**Main UI (Tailwind):**

| Role | Classes |
|---|---|
| App title | `text-xl font-semibold` |
| Section label | `text-xs font-semibold uppercase tracking-wide` |
| Group title | `text-sm font-semibold` |
| Card label | `text-sm font-medium` |
| Card description | `text-xs` |
| Button (standard) | `text-sm font-medium` |
| Button (small) | `text-xs font-medium` |
| Badge | `text-xs font-medium` |

**Wireframe CSS:**

| Role | Value |
|---|---|
| Nav title / page title | `14px bold` / `18px bold` |
| Block title | `14px bold` |
| Nav links | `13px` |
| Block description | `12px` |
| Empty state title | `16px 600` |
| Empty state message | `13px` |
| Font family | `ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace` |

### Interactive states (cross-cutting)

| Pattern | Where |
|---|---|
| Hover shadow lift | CardItem: `shadow-sm` → `hover:shadow-md` |
| Focus ring | Deck inputs, App title input: `focus:ring-2 focus:ring-blue-500` |
| Opacity on drag | Source card: `opacity-0.5`; DragOverlay clone: `opacity-90` |
| Tilt on drag | DragOverlay: `rotate-3` |
| Drop target highlight | Deck + GroupZone: blue border + blue-50 bg when `isOver` |
| Active toggle state | View toggle, nav position toggle: filled bg on active |
| Hover bg on nav links | Wireframe nav links: hover bg shift (`#e8e8e8`, `#f8f8f8`, `#e0e0e0`) |
| Active left-border | Sidebar + left nav: `border-left: 3px solid #666` on active link |
| Underline active | Top nav active link: `text-decoration: underline` |

---

## 5. Design System TODOs

- [ ] Define token names for the two colour systems (editor Tailwind tokens vs. wireframe hex values)
- [ ] Decide whether Wireframe UI should adopt Tailwind or keep a dedicated CSS file
- [ ] Define component naming convention (e.g. `<Button variant="primary">`, `<Badge role="main-nav">`)
- [ ] Identify which components should become shared primitives (Button, Badge, Input, EmptyState)
- [ ] Decide on typography scale and font choices for Main UI (currently uses system sans-serif via Tailwind defaults)
- [ ] Audit keyboard accessibility — SecondaryNavPromptModal lacks Escape handling and focus trap
- [ ] Decide whether `.wf-nav-toggle` (defined in CSS but unused) should be removed or wired up
- [ ] Establish consistent border-radius convention (`rounded` vs `rounded-lg` vs `rounded-xl` are all in use)
- [ ] Normalise button padding — small buttons use `px-3 py-1`, standard use `px-4 py-2`, with variants in between
