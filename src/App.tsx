import { useState, useEffect } from 'react';
import { useProjectStore } from './store/projectStore';
import { useUrlSync } from './utils/urlState';
import { exportToFile, importFromFile } from './utils/fileIO';
import { EditorPanel } from './features/editor/EditorPanel';
import { WireframePreview } from './features/wireframe/WireframePreview';

type View = 'split' | 'editor' | 'preview';

function App() {
  // Initialize URL sync
  useUrlSync();

  // Check URL params for preview-only mode
  const urlParams = new URLSearchParams(window.location.search);
  const isPreviewOnlyMode = urlParams.get('mode') === 'preview';

  const [activeView, setActiveView] = useState<View>(isPreviewOnlyMode ? 'preview' : 'split');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const getSnapshot = useProjectStore((state) => state.getSnapshot);
  const loadSnapshot = useProjectStore((state) => state.loadSnapshot);
  const setTitle = useProjectStore((state) => state.setTitle);
  const meta = useProjectStore((state) => state.meta);

  const handleTitleClick = () => {
    setTitleDraft(meta.title);
    setIsEditingTitle(true);
  };

  const handleTitleCommit = () => {
    setTitle(titleDraft);
    setIsEditingTitle(false);
  };

  // Export handler
  const handleExport = () => {
    const state = getSnapshot();
    exportToFile(state);
  };

  // Import handler
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const state = await importFromFile(file);
          loadSnapshot(state);
        } catch (error) {
          alert('Failed to import file: ' + (error as Error).message);
        }
      }
    };
    input.click();
  };

  // Hide top bar in preview-only mode
  if (isPreviewOnlyMode) {
    return (
      <div className="h-screen bg-gray-100">
        <WireframePreview />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Panel view */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'split' ? (
          <div className="h-full flex">
            {/* Left: Editor */}
            <div className="w-1/2 border-r border-gray-200 bg-gray-50 overflow-hidden">
              <EditorPanel />
            </div>
            {/* Right: Wireframe */}
            <div className="w-1/2 bg-gray-100 overflow-hidden">
              <WireframePreview />
            </div>
          </div>
        ) : activeView === 'editor' ? (
          <div className="h-full bg-gray-50">
            <EditorPanel />
          </div>
        ) : (
          <div className="h-full bg-gray-100">
            <WireframePreview />
          </div>
        )}
      </div>

      {/* Floating bottom toolbar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-xl backdrop-saturate-150 border border-white/50 rounded-lg shadow-xl px-4 py-2 flex items-center gap-6 max-w-[calc(100vw-96px)]">
        {/* View toggle */}
        <div className="btn-group flex gap-px flex-shrink-0">
          <button
            onClick={() => setActiveView('split')}
            className={`px-3 py-1 text-sm font-medium ${
              activeView === 'split' ? 'btn-cta' : 'btn-secondary'
            }`}
          >
            Split
          </button>
          <button
            onClick={() => setActiveView('editor')}
            className={`px-3 py-1 text-sm font-medium ${
              activeView === 'editor' ? 'btn-cta' : 'btn-secondary'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveView('preview')}
            className={`px-3 py-1 text-sm font-medium ${
              activeView === 'preview' ? 'btn-cta' : 'btn-secondary'
            }`}
          >
            Preview
          </button>
        </div>

        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

        {/* Title */}
        <div className="flex justify-center min-w-0">
          {isEditingTitle ? (
            <input
              autoFocus
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleCommit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleCommit();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
              className="text-sm font-semibold text-gray-800 border-b-2 border-emerald-600 bg-transparent focus:outline-none max-w-full text-center"
            />
          ) : (
            <div
              className="group relative flex items-center cursor-pointer min-w-0"
              onClick={handleTitleClick}
              title="Click to rename"
            >
              <h1 className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 truncate">
                {meta.title}
              </h1>
              <svg
                className="absolute left-full ml-1 w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.757l8.61-8.61Z" />
              </svg>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

        {/* Action buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleImport}
            className="btn-secondary px-3 py-1 text-sm font-semibold rounded"
          >
            Load project
          </button>
          <button
            onClick={handleExport}
            className="btn-cta px-3 py-1 text-sm font-semibold rounded"
          >
            Save project
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
