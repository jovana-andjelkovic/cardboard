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

  const getSnapshot = useProjectStore((state) => state.getSnapshot);
  const loadSnapshot = useProjectStore((state) => state.loadSnapshot);
  const meta = useProjectStore((state) => state.meta);

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
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold text-gray-800">{meta.title}</h1>

          {/* View toggle */}
          <div className="flex border border-gray-300 rounded overflow-hidden">
            <button
              onClick={() => setActiveView('split')}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                activeView === 'split'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setActiveView('editor')}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                activeView === 'editor'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveView('preview')}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                activeView === 'preview'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Export
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors"
          >
            Import
          </button>
        </div>
      </div>

      {/* Panel view */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'split' ? (
          <div className="h-full flex">
            {/* Left: Editor */}
            <div className="w-1/2 border-r border-gray-200 bg-white overflow-hidden">
              <EditorPanel />
            </div>
            {/* Right: Wireframe */}
            <div className="w-1/2 bg-gray-100 overflow-hidden">
              <WireframePreview />
            </div>
          </div>
        ) : activeView === 'editor' ? (
          <div className="h-full bg-white">
            <EditorPanel />
          </div>
        ) : (
          <div className="h-full bg-gray-100">
            <WireframePreview />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
