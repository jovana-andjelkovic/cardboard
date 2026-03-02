import { useRef, useState } from 'react';
import { useDroppable, useDndContext } from '@dnd-kit/core';
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
  const connections = useProjectStore((state) => state.connections);
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

  const { active } = useDndContext();
  const activeDragCardId = active?.id as string | undefined;
  const activeSourceGroupId = active?.data?.current?.groupId as string | undefined;
  const activeSourceGroup = activeSourceGroupId ? groups.find(g => g.id === activeSourceGroupId) : null;
  const isDraggingFromMainNav = activeSourceGroup?.prototypeRole === 'main-nav';

  const isForbiddenDrop = isDraggingFromMainNav && !!activeDragCardId && (() => {
    if (group.ownerCardId === activeDragCardId) return true;
    const ownedPage = groups.find(g => g.ownerCardId === activeDragCardId);
    if (!ownedPage) return false;
    // Own secondary nav
    if (connections.some(c => c.fromGroupId === ownedPage.id && c.toGroupId === group.id)) return true;
    // Child pages of own secondary navs
    const ownSecNavIds = connections
      .filter(c => c.fromGroupId === ownedPage.id && groups.find(g => g.id === c.toGroupId)?.prototypeRole === 'secondary-nav')
      .map(c => c.toGroupId);
    return ownSecNavIds.some(secNavId => connections.some(c => c.fromGroupId === secNavId && c.toGroupId === group.id));
  })();

  const groupCards = group.cardIds
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  // Find the owner card for display
  const ownerCard = group.ownerCardId
    ? cards.find(c => c.id === group.ownerCardId)
    : undefined;

  const isSecondaryNavPage = group.prototypeRole === 'page' &&
    connections.some(c => c.fromGroupId === group.id &&
      groups.find(g => g.id === c.toGroupId)?.prototypeRole === 'secondary-nav');

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
    'main-nav': 'bg-emerald-100 text-emerald-700 border-emerald-300',
    'secondary-nav': 'bg-violet-100 text-violet-700 border-violet-300',
    'page': 'bg-orange-100 text-orange-700 border-orange-300',
  };

  const roleBadgeStyle = roleBadgeStyles[group.prototypeRole];

  return (
    <>
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
      {/* Header */}
      {group.prototypeRole !== 'main-nav' && (
        <div className="bg-gray-50 border-b border-gray-300 px-4 py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className="text-[12px] font-semibold text-gray-800 truncate">
                {group.label}
              </h3>

              <span className={`px-1.5 py-px text-[10px] font-medium border rounded flex-shrink-0 ${roleBadgeStyle}`}>
                {group.prototypeRole}
              </span>
            </div>

            <div className="flex items-center gap-1 ml-2 flex-shrink-0 -mr-3">
              {group.prototypeRole === 'page' && !isSecondaryNavPage && (
                <button
                  onClick={() => addSecondaryNavToPage(group.id)}
                  className="px-2 py-1 text-xs text-emerald-700 hover:bg-[#6FAA9F]/20 rounded transition-colors"
                  title="Add secondary nav section"
                >
                  + Secondary nav
                </button>
              )}

              <button
                ref={deleteButtonRef}
                onClick={() => setConfirmingDelete(true)}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200/60 rounded transition-colors"
                title="Delete group"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`p-4 min-h-[120px] ${
          isOver && isForbiddenDrop
            ? 'bg-gray-100 border-2 border-gray-400 border-dashed'
            : isOver
            ? 'bg-[#047C66]/10 border-2 border-[#047C66] border-dashed'
            : ''
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
