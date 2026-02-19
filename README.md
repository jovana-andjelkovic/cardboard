# IA Prototyper

A UX research and prototyping tool where **card sorting IS prototype building**. Drag cards into groups, and those groups simultaneously generate a live wireframe prototype. No separate mapping step — the card sort and the prototype are two views of the same data.

## What This Does

This tool is both:
- **A UX research instrument** for running card sorts with participants
- **A prototyping tool** for validating information architecture in a navigable wireframe

When you sort a card into a navigation group, it instantly appears as a clickable link in the wireframe preview. When you connect a nav group to a page, clicking that link shows the page content. Same data structure, two synchronized views.

## Key Features

✨ **Real-time wireframe generation** — Sort cards in the editor, see the prototype update instantly
🎯 **Card sorting with drag & drop** — Intuitive @dnd-kit powered interface
🔗 **Visual connections** — Link navigation groups to pages with connection mode
📱 **Split view** — See editor and wireframe side-by-side
🔖 **URL-based state** — Share prototypes via URL, no database needed
💾 **JSON export/import** — Save and restore projects as files
🎨 **Lo-fi wireframes** — Intentionally low-fidelity to focus on structure, not design

## Tech Stack

- **React** + **TypeScript** — UI framework
- **Vite** — Build tool and dev server
- **Zustand** — State management
- **@dnd-kit** — Drag and drop
- **lz-string** — URL state compression
- **Tailwind CSS** — Utility styling for the editor
- **Plain CSS** — Separate styling system for wireframes

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/jovana-andjelkovic/ia-prototyper.git
cd ia-prototyper

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## How to Use

### 1. Sort Cards into Groups

- **Deck**: All unsorted cards appear at the top
- **Add Card**: Click "+ Add Card" to create new cards
- **Drag & Drop**: Drag cards from the deck into groups
- **Add Group**: Click "+ Add Group" to create navigation or page groups
- **Group Types**:
  - **Main Navigation** — Top nav bar (only one allowed)
  - **Secondary Nav** — Sidebar navigation
  - **Page** — Content areas

### 2. Create Connections

- Click **"🔗 Edit Connections"** to enter connection mode
- Click a **navigation group** to select it as the source
- Click a **page group** to connect them
- Connections define how navigation works in the wireframe

### 3. View the Wireframe

- Use the **Split/Editor/Preview** toggle to switch views
- **Split** — See editor and wireframe side-by-side (default)
- **Editor** — Full-width card sorting
- **Preview** — Full-width wireframe prototype

Click navigation links in the wireframe to navigate between pages!

### 4. Share or Save

- **URL Sharing** — Copy the URL to share (entire project state is encoded in the hash)
- **Export JSON** — Download project as a .json file
- **Import JSON** — Upload a saved project file
- **Preview-Only Mode** — Add `?mode=preview` to the URL to hide the editor

## Project Structure

```
src/
├── features/
│   ├── editor/           # Card sorting interface
│   │   ├── CardItem.tsx
│   │   ├── Deck.tsx
│   │   ├── GroupZone.tsx
│   │   ├── GroupsList.tsx
│   │   └── EditorPanel.tsx
│   ├── connections/      # Connection management
│   │   ├── ConnectionBadge.tsx
│   │   └── ConnectionPanel.tsx
│   └── wireframe/        # Lo-fi prototype preview
│       ├── WireframePreview.tsx
│       ├── WireframeTopNav.tsx
│       ├── WireframeSidebar.tsx
│       ├── WireframeContentArea.tsx
│       ├── WireframeBlock.tsx
│       ├── WireframeEmptyState.tsx
│       └── wireframe.css
├── store/
│   ├── types.ts          # TypeScript type definitions
│   └── projectStore.ts   # Zustand state management
├── utils/
│   ├── urlState.ts       # URL encoding/decoding
│   └── fileIO.ts         # JSON export/import
└── App.tsx               # Main app shell
```

## Data Model

The entire application state is stored in a single Zustand store:

```typescript
type ProjectState = {
  meta: {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    version: number;
  };
  cards: CardDefinition[];
  groups: Group[];
  connections: Connection[];
  unsortedCardIds: string[];
};
```

### Group Types

- **main-nav** — Top navigation bar (only one)
- **secondary-nav** — Sidebar navigation
- **page** — Content area

### Connections

Connections link navigation groups to pages:
- **From**: `main-nav` or `secondary-nav` group
- **To**: `page` or `secondary-nav` group

## Persistence

**No database. No backend.**

Two persistence mechanisms:

1. **URL Encoding** — Full project state compressed into the URL hash
   - Bookmarkable, shareable, versioned by nature
   - Updates automatically on changes (debounced 500ms)

2. **JSON Export/Import** — Download/upload `.json` files
   - For archival or when URLs get too long

## Wireframe Design Philosophy

The wireframes are **intentionally lo-fi**:
- Monospace font
- Dashed borders
- Gray placeholders
- No color, no polish

This communicates **structure, not design**. The wireframe should be unmistakably a wireframe, not a mockup.

## Development Phases

This project was built in 4 phases:

1. **Phase 1** — Project foundation (Vite + React + Zustand + URL state)
2. **Phase 2** — Card sorting editor with drag & drop
3. **Phase 3** — Connections between navigation and pages
4. **Phase 4** — Live wireframe preview

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

Built with [Claude Code](https://claude.com/claude-code) by Anthropic.
