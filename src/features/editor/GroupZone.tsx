import { useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProjectStore } from '../../store/projectStore';
import { CardItem } from './CardItem';
import { ConfirmPopover } from './ConfirmPopover';
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
  const groups = useProjectStore((state) => state.groups);
  const removeGroup = useProjectStore((state) => state.removeGroup);
  const addSecondaryNavToPage = useProjectStore((state) => state.addSecondaryNavToPage);

  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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

  // Find the owner card for display
  const ownerCard = group.ownerCardId
    ? cards.find(c => c.id === group.ownerCardId)
    : undefined;

  const isSecondaryNavPage = group.prototypeRole === 'page' &&
    group.ownerCardId != null &&
    groups.some(g => g.prototypeRole === 'secondary-nav' && g.cardIds.includes(group.ownerCardId!));

  const isOwnedPage = group.prototypeRole === 'page' && group.ownerCardId;
  const ownerLabel = ownerCard?.label ?? 'this nav item';
  const deleteMessage = isOwnedPage
    ? `This will remove "${ownerLabel}" from the main nav and delete this page and all its content.`
    : `Delete "${group.label}"? All cards will return to the deck.`;

  const handleDeleteConfirm = () => {
    removeGroup(group.id);
    setConfirmingDelete(false);
  };

  const roleBadgeStyles = {
    'main-nav': 'bg-blue-100 text-blue-700 border-blue-300',
    'secondary-nav': 'bg-green-100 text-green-700 border-green-300',
    'page': 'bg-orange-100 text-orange-700 border-orange-300',
  };

  const roleBadgeStyle = roleBadgeStyles[group.prototypeRole];

  return (
    <>
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-300 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 truncate">
              {group.label}
            </h3>

            <span className={`px-2 py-0.5 text-xs font-medium border rounded flex-shrink-0 ${roleBadgeStyle}`}>
              {group.prototypeRole}
            </span>

            <span className="text-xs text-gray-500 flex-shrink-0">
              {groupCards.length} card{groupCards.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {/* "Add secondary nav" button for page groups */}
            {group.prototypeRole === 'page' && !isSecondaryNavPage && (
              <button
                onClick={() => addSecondaryNavToPage(group.id)}
                className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                title="Add secondary nav section"
              >
                + Secondary nav
              </button>
            )}

            {group.prototypeRole !== 'main-nav' && (
              <button
                ref={deleteButtonRef}
                onClick={() => setConfirmingDelete(true)}
                className="p-1 text-red-500 hover:text-red-700 text-xs"
                title="Delete group"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Owner annotation */}
        {ownerCard && group.prototypeRole !== 'main-nav' && (
          <div className="mt-1">
            <span className="text-xs text-gray-400">via {ownerCard.label}</span>
          </div>
        )}
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

    {confirmingDelete && deleteButtonRef.current && (
      <ConfirmPopover
        anchor={deleteButtonRef.current.getBoundingClientRect()}
        message={deleteMessage}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmingDelete(false)}
      />
    )}
    </>
  );
};
