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
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { useProjectStore } from '../../store/projectStore';
import { Deck } from './Deck';
import { GroupsList } from './GroupsList';
import { CardItem } from './CardItem';
import type { CardDefinition } from '../../store/types';

export const EditorPanel = () => {
  const cards = useProjectStore((state) => state.cards);
  const groups = useProjectStore((state) => state.groups);
  const moveCard = useProjectStore((state) => state.moveCard);
  const returnCardToDeck = useProjectStore((state) => state.returnCardToDeck);
  const reorderCardInGroup = useProjectStore((state) => state.reorderCardInGroup);

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

    if (!over) {
      // Dropped outside any drop zone - do nothing
      return;
    }

    const activeCardId = active.id as string;
    const overData = over.data.current;

    // Scenario 1: Dropped on the deck
    if (over.id === 'deck') {
      returnCardToDeck(activeCardId);
      return;
    }

    // Find which group (if any) the active card is currently in
    const sourceGroup = groups.find((g) => g.cardIds.includes(activeCardId));

    // Scenario 2: Dropped on a group
    if (overData?.type === 'group') {
      const targetGroup = overData.group;

      // If it's the same group and there's only one card, do nothing
      if (sourceGroup?.id === targetGroup.id) {
        return;
      }

      // Move to the end of the target group
      moveCard(activeCardId, targetGroup.id, targetGroup.cardIds.length);
      return;
    }

    // Scenario 3: Dropped on a card (for reordering within a group)
    if (overData?.type === 'card') {
      const targetGroupId = overData.groupId;
      const targetGroup = groups.find((g) => g.id === targetGroupId);

      if (!targetGroup) return;

      const overCardId = over.id as string;
      const oldIndex = targetGroup.cardIds.indexOf(activeCardId);
      const newIndex = targetGroup.cardIds.indexOf(overCardId);

      // Reordering within the same group
      if (sourceGroup?.id === targetGroupId && oldIndex !== -1) {
        if (oldIndex !== newIndex) {
          reorderCardInGroup(targetGroupId, oldIndex, newIndex);
        }
      } else {
        // Moving from deck or different group to this position
        moveCard(activeCardId, targetGroupId, newIndex);
      }
      return;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-auto">
        <div className="p-6 space-y-6">
          {/* Deck - sticky at top */}
          <div className="sticky top-0 z-10 bg-white pb-4">
            <Deck />
          </div>

          {/* Groups */}
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
    </DndContext>
  );
};
