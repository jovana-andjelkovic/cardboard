import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useProjectStore } from '../../store/projectStore';
import { CardItem } from './CardItem';

export const Deck = () => {
  const cards = useProjectStore((state) => state.cards);
  const unsortedCardIds = useProjectStore((state) => state.unsortedCardIds);
  const addCard = useProjectStore((state) => state.addCard);

  const [isAdding, setIsAdding] = useState(false);
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

  const handleAddCard = () => {
    if (newLabel.trim()) {
      addCard(newLabel.trim(), newDescription.trim() || undefined);
      setNewLabel('');
      setNewDescription('');
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setNewLabel('');
    setNewDescription('');
    setIsAdding(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-50 border-2 border-dashed rounded-lg p-4 ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          {unsortedCards.length === 0 ? (
            'All cards sorted ✓'
          ) : (
            `${unsortedCards.length} card${unsortedCards.length === 1 ? '' : 's'} unsorted`
          )}
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            + Add Card
          </button>
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
