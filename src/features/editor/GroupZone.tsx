import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProjectStore } from '../../store/projectStore';
import { CardItem } from './CardItem';
import { ConnectionBadge } from '../connections/ConnectionBadge';
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
  onConnectionClick?: (groupId: string) => void;
}

export const GroupZone = ({ group, onConnectionClick }: GroupZoneProps) => {
  const cards = useProjectStore((state) => state.cards);
  const groups = useProjectStore((state) => state.groups);
  const updateGroup = useProjectStore((state) => state.updateGroup);
  const removeGroup = useProjectStore((state) => state.removeGroup);
  const isConnectionMode = useProjectStore((state) => state.isConnectionMode);
  const selectedSourceGroupId = useProjectStore((state) => state.selectedSourceGroupId);

  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(group.label);

  // Connection mode states
  const isSelectedSource = selectedSourceGroupId === group.id;
  const selectedSourceGroup = groups.find((g) => g.id === selectedSourceGroupId);

  // Determine if this group is a valid source (can initiate connections)
  const isValidSource =
    group.prototypeRole === 'main-nav' || group.prototypeRole === 'secondary-nav';

  // Determine if this group is a valid target for the selected source
  const isValidTarget =
    selectedSourceGroup &&
    selectedSourceGroupId !== group.id &&
    (group.prototypeRole === 'page' || group.prototypeRole === 'secondary-nav');

  const isInvalidTarget = isConnectionMode && selectedSourceGroupId && !isValidTarget && !isSelectedSource;

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

  const handleClick = () => {
    if (isConnectionMode && onConnectionClick) {
      onConnectionClick(group.id);
    }
  };

  // Conditional styling based on connection mode
  let borderClass = 'border-gray-300';
  let cursorClass = '';
  let opacityClass = '';

  if (isConnectionMode) {
    if (isSelectedSource) {
      borderClass = 'border-indigo-500 border-2';
    } else if (isValidTarget) {
      borderClass = 'border-indigo-300 border-2 border-dashed';
      cursorClass = 'cursor-pointer';
    } else if (isInvalidTarget) {
      opacityClass = 'opacity-50';
    } else if (isValidSource && !selectedSourceGroupId) {
      borderClass = 'border-blue-400 border-dashed';
      cursorClass = 'cursor-pointer';
    }
  }

  return (
    <div
      className={`bg-white border rounded-lg overflow-hidden transition-all ${borderClass} ${cursorClass} ${opacityClass}`}
      onClick={handleClick}
    >
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
          {!isEditing && !isConnectionMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1 text-gray-500 hover:text-gray-700 text-xs"
              title="Rename group"
            >
              ✎
            </button>
          )}
          {group.prototypeRole !== 'main-nav' && !isConnectionMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-1 text-red-500 hover:text-red-700 text-xs"
              title="Delete group"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Connection Badge (shown in normal mode) */}
      {!isConnectionMode && (
        <div className="px-4">
          <ConnectionBadge groupId={group.id} />
        </div>
      )}

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
