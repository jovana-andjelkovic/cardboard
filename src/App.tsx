import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from './store/projectStore';
import { useUrlSync } from './utils/urlState';
import { exportToFile, importFromFile } from './utils/fileIO';

type View = 'editor' | 'preview';

function App() {
  // Initialize URL sync
  useUrlSync();

  const [activeView, setActiveView] = useState<View>('editor');

  const getSnapshot = useProjectStore((state) => state.getSnapshot);
  const loadSnapshot = useProjectStore((state) => state.loadSnapshot);
  const addCard = useProjectStore((state) => state.addCard);
  const meta = useProjectStore((state) => state.meta);
  const cards = useProjectStore((state) => state.cards);

  const hasInitialized = useRef(false);

  // Add sample cards on first load (if no cards exist)
  useEffect(() => {
    if (!hasInitialized.current && cards.length === 0) {
      addCard('Home', 'Main landing page');
      addCard('About', 'Company information');
      addCard('Products', 'Product catalog');
      addCard('Contact', 'Get in touch');
      addCard('Blog', 'Latest articles');
      hasInitialized.current = true;
    }
  }, [addCard, cards.length]);

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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold text-gray-800">{meta.title}</h1>

          {/* View toggle */}
          <div className="flex border border-gray-300 rounded overflow-hidden">
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

      {/* Single panel view */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'editor' ? (
          <div className="h-full bg-white overflow-auto">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-700 mb-4">Editor</h2>
              <p className="text-gray-500">Card sorting interface will go here.</p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">Sample cards in store:</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {cards.map((card) => (
                    <li key={card.id}>
                      {card.label} {card.description && `- ${card.description}`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full bg-gray-100 overflow-auto">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-700 mb-4">Preview</h2>
              <p className="text-gray-500">Live wireframe will render here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
