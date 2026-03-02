import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useProjectStore } from '../../store/projectStore';
import { Deck } from './Deck';
import { GroupsList } from './GroupsList';
import { CardItem } from './CardItem';
import { SecondaryNavPromptModal } from './SecondaryNavPromptModal';
import type { CardDefinition } from '../../store/types';

export const EditorPanel = () => {
  const cards = useProjectStore((state) => state.cards);
  const groups = useProjectStore((state) => state.groups);
  const connections = useProjectStore((state) => state.connections);
  const moveCard = useProjectStore((state) => state.moveCard);
  const returnCardToDeck = useProjectStore((state) => state.returnCardToDeck);
  const reorderCardInGroup = useProjectStore((state) => state.reorderCardInGroup);
  const dropCardToMainNav = useProjectStore((state) => state.dropCardToMainNav);
  const removeCardFromMainNav = useProjectStore((state) => state.removeCardFromMainNav);
  const dropCardToSecondaryNav = useProjectStore((state) => state.dropCardToSecondaryNav);
  const removeCardFromSecondaryNav = useProjectStore((state) => state.removeCardFromSecondaryNav);
  const setPendingSecondaryNavPrompt = useProjectStore((state) => state.setPendingSecondaryNavPrompt);

  const [activeCard, setActiveCard] = useState<CardDefinition | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = cards.find((c) => c.id === active.id);
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveCard(null);

    if (!over) return;

    const activeCardId = active.id as string;
    const overData = over.data.current;

    // Find where the card is coming from
    const sourceGroup = groups.find((g) => g.cardIds.includes(activeCardId));
    const isFromMainNav = sourceGroup?.prototypeRole === 'main-nav';
    const isFromSecondaryNav = sourceGroup?.prototypeRole === 'secondary-nav';

    // Scenario 1: Dropped on the deck
    if (over.id === 'deck') {
      if (isFromMainNav) {
        removeCardFromMainNav(activeCardId);
      } else if (isFromSecondaryNav) {
        removeCardFromSecondaryNav(activeCardId);
      } else {
        returnCardToDeck(activeCardId);
      }
      return;
    }

    // Helper: pages owned by a secondary-nav group must not gain another secondary nav
    const isSecondaryNavOwnedPage = (target: { prototypeRole: string; ownerCardId?: string | null }) =>
      target.prototypeRole === 'page' &&
      target.ownerCardId != null &&
      groups.some(g => g.prototypeRole === 'secondary-nav' && g.cardIds.includes(target.ownerCardId!));

    // Scenario 2: Dropped on a group
    if (overData?.type === 'group') {
      const targetGroup = overData.group;

      // Reordering within the same group — no-op if it's the only card
      if (sourceGroup?.id === targetGroup.id) {
        return;
      }

      // A card cannot be dropped into the page it owns
      if (targetGroup.ownerCardId === activeCardId) return;

      // Dropping into main-nav
      if (targetGroup.prototypeRole === 'main-nav') {
        if (isFromMainNav) {
          // Already in main-nav — treat as reorder to end (handled by card drop scenario)
          return;
        }
        dropCardToMainNav(activeCardId);
        return;
      }

      // Dropping into a page group from main-nav → prompt for secondary nav (only for direct pages, not child pages)
      if (targetGroup.prototypeRole === 'page' && isFromMainNav && !isSecondaryNavOwnedPage(targetGroup)) {
        moveCard(activeCardId, targetGroup.id, targetGroup.cardIds.length);
        const card = cards.find(c => c.id === activeCardId);
        setPendingSecondaryNavPrompt({
          cardId: activeCardId,
          targetPageGroupId: targetGroup.id,
          cardLabel: card?.label ?? activeCardId,
        });
        return;
      }

      // Block main-nav cards from being placed in any other page (e.g. secondary-nav-owned child pages)
      if (targetGroup.prototypeRole === 'page' && isFromMainNav) return;

      // Dropping into a secondary-nav group from outside → auto-create page
      // Block if this secondary-nav belongs to the page owned by the dragged card
      if (targetGroup.prototypeRole === 'secondary-nav' && sourceGroup?.id !== targetGroup.id) {
        const ownedPage = groups.find(g => g.ownerCardId === activeCardId);
        if (ownedPage && connections.some(c => c.fromGroupId === ownedPage.id && c.toGroupId === targetGroup.id)) return;
        dropCardToSecondaryNav(activeCardId, targetGroup.id);
        return;
      }

      // Dropping into any other group — normal move
      moveCard(activeCardId, targetGroup.id, targetGroup.cardIds.length);
      return;
    }

    // Scenario 3: Dropped on a card (reorder or cross-group move)
    if (overData?.type === 'card') {
      const targetGroupId = overData.groupId;
      const targetGroup = groups.find((g) => g.id === targetGroupId);

      if (!targetGroup) return;

      // A card cannot be dropped into the page it owns
      if (targetGroup.ownerCardId === activeCardId) return;

      const overCardId = over.id as string;
      const oldIndex = sourceGroup?.cardIds.indexOf(activeCardId) ?? -1;
      const newIndex = targetGroup.cardIds.indexOf(overCardId);

      // Reordering within the same group
      if (sourceGroup?.id === targetGroupId && oldIndex !== -1) {
        if (oldIndex !== newIndex) {
          reorderCardInGroup(targetGroupId, oldIndex, newIndex);
        }
        return;
      }

      // Cross-group moves
      if (targetGroup.prototypeRole === 'main-nav') {
        if (!isFromMainNav) {
          dropCardToMainNav(activeCardId);
        }
        // If already in main-nav, it's a reorder that was handled above
        return;
      }

      // Dropping into a page from main-nav → prompt (only for direct pages, not child pages)
      if (targetGroup.prototypeRole === 'page' && isFromMainNav && !isSecondaryNavOwnedPage(targetGroup)) {
        moveCard(activeCardId, targetGroupId, newIndex >= 0 ? newIndex : targetGroup.cardIds.length);
        const card = cards.find(c => c.id === activeCardId);
        setPendingSecondaryNavPrompt({
          cardId: activeCardId,
          targetPageGroupId: targetGroupId,
          cardLabel: card?.label ?? activeCardId,
        });
        return;
      }

      // Block main-nav cards from being placed in any other page (e.g. secondary-nav-owned child pages)
      if (targetGroup.prototypeRole === 'page' && isFromMainNav) return;

      // Dropping onto a card in a secondary-nav group from outside → auto-create page
      // Block if this secondary-nav belongs to the page owned by the dragged card
      if (targetGroup.prototypeRole === 'secondary-nav' && sourceGroup?.id !== targetGroupId) {
        const ownedPage = groups.find(g => g.ownerCardId === activeCardId);
        if (ownedPage && connections.some(c => c.fromGroupId === ownedPage.id && c.toGroupId === targetGroupId)) return;
        dropCardToSecondaryNav(activeCardId, targetGroupId);
        return;
      }

      // Normal cross-group move
      moveCard(activeCardId, targetGroupId, newIndex >= 0 ? newIndex : targetGroup.cardIds.length);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Deck - fixed header */}
        <div className="flex-shrink-0 bg-gray-50 px-6 py-3 border-b border-gray-200 z-10">
          <Deck />
        </div>

        {/* Groups - independently scrolling columns */}
        <div className="flex-1 overflow-hidden">
          <GroupsList />
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeCard ? (
          <div className="rotate-3 opacity-90">
            <CardItem card={activeCard} />
          </div>
        ) : null}
      </DragOverlay>

      {/* Secondary nav prompt modal */}
      <SecondaryNavPromptModal />
    </DndContext>
  );
};
