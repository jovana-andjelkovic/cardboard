import { useState, useRef, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useProjectStore } from '../../store/projectStore';
import { CardItem } from './CardItem';
import { ConfirmPopover } from './ConfirmPopover';
import { parseMarkdownCards } from '../../utils/markdownImport';
import { exportCardsToMarkdown, cardsToMarkdownString } from '../../utils/fileIO';

export const Deck = () => {
  const cards = useProjectStore((state) => state.cards);
  const unsortedCardIds = useProjectStore((state) => state.unsortedCardIds);
  const replaceAllCards = useProjectStore((state) => state.replaceAllCards);
  const removeCard = useProjectStore((state) => state.removeCard);
  const updateCard = useProjectStore((state) => state.updateCard);
  const reconcileCards = useProjectStore((state) => state.reconcileCards);
  const getSnapshot = useProjectStore((state) => state.getSnapshot);
  const resetProject = useProjectStore((state) => state.resetProject);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState('');

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
  const parsedBulkCards = isEditing ? parseMarkdownCards(bulkText) : [];

  const diffSummary = useMemo(() => {
    if (!isEditing) return null;
    const added = Math.max(0, parsedBulkCards.length - cards.length);
    const updated = parsedBulkCards.slice(0, cards.length).filter((nc, i) => {
      const existing = cards[i];
      return nc.label !== existing.label || nc.description !== existing.description;
    }).length;
    return { added, updated };
  }, [isEditing, parsedBulkCards, cards]);

  const hasChanges = diffSummary
    ? diffSummary.added > 0 || diffSummary.updated > 0
    : false;

  const handleMarkdownImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const parsed = parseMarkdownCards(text);

    history.replaceState(null, '', window.location.pathname + window.location.search);
    replaceAllCards(parsed);

    setImportFeedback(
      parsed.length === 0
        ? 'No cards found in file'
        : `${parsed.length} card${parsed.length === 1 ? '' : 's'} added`
    );

    e.target.value = '';
    setTimeout(() => setImportFeedback(null), 3000);
  };

  const handleResetConfirm = () => {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    resetProject();
    setConfirmingReset(false);
  };

  const handleOpenEditor = () => {
    setBulkText(cardsToMarkdownString(cards));
    setIsEditing(true);
  };

  const handleSave = () => {
    reconcileCards(parsedBulkCards);
    setBulkText('');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setBulkText('');
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-lg p-4 ${
        isOver ? 'border-[#047C66] bg-[#047C66]/10' : 'border-gray-300 bg-gray-50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,text/markdown"
        className="hidden"
        onChange={handleMarkdownImport}
      />
      <div className={`flex items-center justify-between ${unsortedCards.length === 0 ? '' : 'mb-3'}`}>
        <h3 className="text-sm font-semibold text-gray-700">
          {unsortedCards.length === 0 ? (
            'All cards are sorted'
          ) : (
            `${unsortedCards.length} unsorted card${unsortedCards.length === 1 ? '' : 's'}`
          )}
        </h3>
        {!isEditing && (
          <div className="flex items-center gap-2">
            {importFeedback && (
              <span className="text-xs text-green-600 font-medium">{importFeedback}</span>
            )}
            {hasSortedCards && (
              <button
                ref={resetButtonRef}
                onClick={() => setConfirmingReset(true)}
                className="btn-secondary px-3 py-1 text-xs font-medium rounded text-red-600"
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
                className="btn-secondary px-3 py-1 text-xs font-medium rounded"
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
                className="btn-secondary px-3 py-1 text-xs font-medium rounded"
              >
                Import cards
              </button>
              <div className="absolute top-full right-0 mt-1.5 z-20 hidden group-hover:block w-60 bg-gray-900 text-white text-xs rounded-lg p-2.5 shadow-lg pointer-events-none">
                <div className="font-semibold mb-1">Loads cards from a .md file</div>
                <div className="text-orange-300 text-xs mb-1.5">This will replace all existing cards and reset groups.</div>
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
              onClick={handleOpenEditor}
              className="btn-cta px-3 py-1 text-xs font-medium rounded"
            >
              Edit Cards
            </button>
          </div>
        )}
      </div>

      {/* Edit cards form */}
      {isEditing && (
        <div className="mb-4 p-3 bg-white border border-gray-300 rounded-lg">
          <textarea
            placeholder={`## Card label\nOptional description\n\n## Another card\nAnother description`}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleCancel();
            }}
            rows={10}
            className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded mb-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            autoFocus
          />
          <p className="text-xs text-gray-400 mb-2">
            Cards are matched by position. Edit labels or descriptions freely — sorting is preserved. New cards added at the end go to unsorted.
          </p>
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="btn-cta px-3 py-1 text-xs font-medium rounded disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save changes
            </button>
            <button
              onClick={handleCancel}
              className="btn-secondary px-3 py-1 text-xs font-medium rounded"
            >
              Cancel
            </button>
            {diffSummary && (diffSummary.added > 0 || diffSummary.updated > 0) && (
              <span className="text-xs text-gray-500 ml-1">
                {[
                  diffSummary.added > 0 && `+${diffSummary.added} added`,
                  diffSummary.updated > 0 && `${diffSummary.updated} updated`,
                ].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Cards grid */}
      {unsortedCards.length > 0 ? (
        <div className="max-h-[30vh] overflow-y-auto -mr-4 pr-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {unsortedCards.map((card) => (
            <div key={card.id} className={editingCardId === card.id ? 'col-span-full' : ''}>
              <CardItem
                card={card}
                isEditing={editingCardId === card.id}
                onStartEdit={() => setEditingCardId(card.id)}
                onRemove={() => removeCard(card.id)}
                onEdit={(label, description) => {
                  updateCard(card.id, { label, description });
                  setEditingCardId(null);
                }}
                onCancelEdit={() => setEditingCardId(null)}
              />
            </div>
          ))}
        </div>
        </div>
      ) : (
        !isEditing && (
          <div className="text-center py-4 text-gray-400 text-sm">
            No more cards left!
          </div>
        )
      )}
    </div>
  );
};
