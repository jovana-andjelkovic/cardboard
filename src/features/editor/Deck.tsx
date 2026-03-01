import { useState, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useProjectStore } from '../../store/projectStore';
import { CardItem } from './CardItem';
import { ConfirmPopover } from './ConfirmPopover';
import { parseMarkdownCards } from '../../utils/markdownImport';
import { exportCardsToMarkdown } from '../../utils/fileIO';

export const Deck = () => {
  const cards = useProjectStore((state) => state.cards);
  const unsortedCardIds = useProjectStore((state) => state.unsortedCardIds);
  const addCard = useProjectStore((state) => state.addCard);
  const bulkAddCards = useProjectStore((state) => state.bulkAddCards);
  const replaceAllCards = useProjectStore((state) => state.replaceAllCards);
  const getSnapshot = useProjectStore((state) => state.getSnapshot);
  const resetProject = useProjectStore((state) => state.resetProject);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const { setNodeRef, isOver } = useDroppable({
    id: 'deck',
    data: {
      type: 'deck',
    },
  });

  const unsortedCards = unsortedCardIds
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  const hasSortedCards = cards.length > unsortedCardIds.length;

  const handleAddCard = () => {
    if (newLabel.trim()) {
      addCard(newLabel.trim(), newDescription.trim() || undefined);
      setNewLabel('');
      setNewDescription('');
      setIsAdding(false);
    }
  };

  const handleMarkdownImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const parsed = parseMarkdownCards(text);

    window.location.hash = '';
    replaceAllCards(parsed);

    setImportFeedback(
      parsed.length === 0
        ? 'No cards found in file'
        : `${parsed.length} card${parsed.length === 1 ? '' : 's'} added`
    );

    // Reset input so the same file can be re-imported if the user edits it
    e.target.value = '';

    setTimeout(() => setImportFeedback(null), 3000);
  };

  const handleResetConfirm = () => {
    window.location.hash = '';
    resetProject();
    setConfirmingReset(false);
  };

  const handleCancel = () => {
    setNewLabel('');
    setNewDescription('');
    setIsAdding(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-lg p-4 ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,text/markdown"
        className="hidden"
        onChange={handleMarkdownImport}
      />
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          {unsortedCards.length === 0 ? (
            'All cards sorted ✓'
          ) : (
            `${unsortedCards.length} card${unsortedCards.length === 1 ? '' : 's'} unsorted`
          )}
        </h3>
        {!isAdding && (
          <div className="flex items-center gap-2">
            {importFeedback && (
              <span className="text-xs text-green-600 font-medium">{importFeedback}</span>
            )}
            {hasSortedCards && (
              <button
                ref={resetButtonRef}
                onClick={() => setConfirmingReset(true)}
                className="px-3 py-1 text-xs font-medium bg-white text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
              >
                Reset cards
              </button>
            )}
            {confirmingReset && resetButtonRef.current && (
              <ConfirmPopover
                anchor={resetButtonRef.current.getBoundingClientRect()}
                message="Reset all cards to unsorted? Groups and connections will be cleared."
                confirmLabel="Reset"
                onConfirm={handleResetConfirm}
                onCancel={() => setConfirmingReset(false)}
              />
            )}
            <div className="relative group">
              <button
                onClick={() => exportCardsToMarkdown(getSnapshot())}
                className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
              >
                Export cards
              </button>
              <div className="absolute top-full right-0 mt-1.5 z-20 hidden group-hover:block w-60 bg-gray-900 text-white text-xs rounded-lg p-2.5 shadow-lg pointer-events-none">
                <div className="font-semibold mb-1">Downloads a .md file</div>
                <div className="text-gray-300 leading-relaxed">Each card is exported as a heading and optional description:
                  <div className="mt-1.5 font-mono bg-gray-800 rounded p-1.5 text-gray-200 leading-relaxed">
                    ## Card label<br />
                    Card description
                  </div>
                </div>
              </div>
            </div>
            <div className="relative group">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
              >
                Import cards
              </button>
              <div className="absolute top-full right-0 mt-1.5 z-20 hidden group-hover:block w-60 bg-gray-900 text-white text-xs rounded-lg p-2.5 shadow-lg pointer-events-none">
                <div className="font-semibold mb-1">Loads cards from a .md file</div>
                <div className="text-gray-300 leading-relaxed">Accepts two formats:
                  <div className="mt-1.5 font-mono bg-gray-800 rounded p-1.5 text-gray-200 leading-relaxed">
                    ## Card label<br />
                    Description
                  </div>
                  <div className="mt-1 font-mono bg-gray-800 rounded p-1.5 text-gray-200">
                    - Label: Description
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsAdding(true)}
              className="px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              + Add Card
            </button>
          </div>
        )}
      </div>

      {/* Add card form */}
      {isAdding && (
        <div className="mb-4 p-3 bg-white border border-gray-300 rounded-lg">
          <input
            type="text"
            placeholder="Card label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCard();
              if (e.key === 'Escape') handleCancel();
            }}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCard();
              if (e.key === 'Escape') handleCancel();
            }}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddCard}
              className="px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-xs font-medium bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cards grid */}
      {unsortedCards.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {unsortedCards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </div>
      ) : (
        !isAdding && (
          <div className="text-center py-8 text-gray-400 text-sm">
            All cards have been sorted into groups
          </div>
        )
      )}
    </div>
  );
};
