import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProjectStore } from '../../store/projectStore';
import { CardItem } from './CardItem';
import type { Group, CardDefinition } from '../../store/types';

interface SortableCardProps {
  card: CardDefinition;
  group: Group;
}

const SortableCard = ({ card, group }: SortableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
      groupId: group.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardItem card={card} group={group} />
    </div>
  );
};

interface GroupZoneProps {
  group: Group;
}

export const GroupZone = ({ group }: GroupZoneProps) => {
  const cards = useProjectStore((state) => state.cards);
  const updateGroup = useProjectStore((state) => state.updateGroup);
  const removeGroup = useProjectStore((state) => state.removeGroup);

  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(group.label);

  const { setNodeRef, isOver } = useDroppable({
    id: group.id,
    data: {
      type: 'group',
      group,
    },
  });

  const groupCards = group.cardIds
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  const handleRename = () => {
    if (editLabel.trim() && editLabel !== group.label) {
      updateGroup(group.id, { label: editLabel.trim() });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`Delete "${group.label}"? All cards will return to the deck.`)) {
      removeGroup(group.id);
    }
  };

  const roleBadgeStyles = {
    'main-nav': 'bg-blue-100 text-blue-700 border-blue-300',
    'secondary-nav': 'bg-green-100 text-green-700 border-green-300',
    'page': 'bg-orange-100 text-orange-700 border-orange-300',
  };

  const roleBadgeStyle = roleBadgeStyles[group.prototypeRole];

  return (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-300 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') {
                  setEditLabel(group.label);
                  setIsEditing(false);
                }
              }}
              className="px-2 py-1 text-sm font-semibold border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
              autoFocus
            />
          ) : (
            <h3
              className="text-sm font-semibold text-gray-800 truncate cursor-pointer hover:text-blue-600"
              onDoubleClick={() => setIsEditing(true)}
              title="Double-click to rename"
            >
              {group.label}
            </h3>
          )}

          <span
            className={`px-2 py-0.5 text-xs font-medium border rounded ${roleBadgeStyle}`}
          >
            {group.prototypeRole}
          </span>

          <span className="text-xs text-gray-500">
            {groupCards.length} card{groupCards.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-500 hover:text-gray-700 text-xs"
              title="Rename group"
            >
              ✎
            </button>
          )}
          {group.prototypeRole !== 'main-nav' && (
            <button
              onClick={handleDelete}
              className="p-1 text-red-500 hover:text-red-700 text-xs"
              title="Delete group"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`p-4 min-h-[120px] ${
          isOver ? 'bg-blue-50 border-2 border-blue-400 border-dashed' : ''
        }`}
      >
        {groupCards.length > 0 ? (
          <SortableContext items={groupCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {groupCards.map((card) => (
                <SortableCard key={card.id} card={card} group={group} />
              ))}
            </div>
          </SortableContext>
        ) : (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg py-12 text-gray-400 text-sm">
            Drop cards here
          </div>
        )}
      </div>
    </div>
  );
};
