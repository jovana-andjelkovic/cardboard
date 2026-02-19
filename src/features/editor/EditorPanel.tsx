import { useState, useEffect } from 'react';
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
import { ConnectionPanel } from '../connections/ConnectionPanel';
import type { CardDefinition } from '../../store/types';

export const EditorPanel = () => {
  const cards = useProjectStore((state) => state.cards);
  const groups = useProjectStore((state) => state.groups);
  const moveCard = useProjectStore((state) => state.moveCard);
  const returnCardToDeck = useProjectStore((state) => state.returnCardToDeck);
  const reorderCardInGroup = useProjectStore((state) => state.reorderCardInGroup);

  // Connection mode state
  const isConnectionMode = useProjectStore((state) => state.isConnectionMode);
  const selectedSourceGroupId = useProjectStore((state) => state.selectedSourceGroupId);
  const setConnectionMode = useProjectStore((state) => state.setConnectionMode);
  const setSelectedSource = useProjectStore((state) => state.setSelectedSource);
  const addConnection = useProjectStore((state) => state.addConnection);

  const [activeCard, setActiveCard] = useState<CardDefinition | null>(null);

  // Clear selection on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isConnectionMode) {
        setSelectedSource(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConnectionMode, setSelectedSource]);

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

  // Handle connection click
  const handleConnectionClick = (groupId: string) => {
    if (!isConnectionMode) return;

    const clickedGroup = groups.find((g) => g.id === groupId);
    if (!clickedGroup) return;

    // If no source selected, select this group as source (if valid)
    if (!selectedSourceGroupId) {
      const isValidSource =
        clickedGroup.prototypeRole === 'main-nav' ||
        clickedGroup.prototypeRole === 'secondary-nav';
      if (isValidSource) {
        setSelectedSource(groupId);
      }
      return;
    }

    // If clicking the selected source again, deselect it
    if (selectedSourceGroupId === groupId) {
      setSelectedSource(null);
      return;
    }

    // Otherwise, try to create a connection
    const isValidTarget =
      clickedGroup.prototypeRole === 'page' ||
      clickedGroup.prototypeRole === 'secondary-nav';

    if (isValidTarget) {
      addConnection(selectedSourceGroupId, groupId);
      setSelectedSource(null); // Clear selection after creating connection
    }
  };

  const editorContent = (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        {/* Connection mode toggle and panel */}
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setConnectionMode(!isConnectionMode)}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  isConnectionMode
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isConnectionMode ? '✓ Connection Mode' : '🔗 Edit Connections'}
              </button>
              {isConnectionMode && selectedSourceGroupId && (
                <span className="text-sm text-gray-600">
                  Click a target page or section to connect
                </span>
              )}
            </div>
          </div>
          <div className="w-80">
            <ConnectionPanel />
          </div>
        </div>

        {/* Deck - sticky at top */}
        <div className="sticky top-0 z-10 bg-white pb-4">
          <Deck />
        </div>

        {/* Groups */}
        <GroupsList onConnectionClick={handleConnectionClick} />
      </div>
    </div>
  );

  // Wrap in DndContext only if not in connection mode
  if (isConnectionMode) {
    return editorContent;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {editorContent}

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
