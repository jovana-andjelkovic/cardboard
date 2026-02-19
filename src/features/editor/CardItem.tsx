import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { CardDefinition, Group } from '../../store/types';

interface CardItemProps {
  card: CardDefinition;
  group?: Group;  // If provided, shows the card's context/type based on group role
}

export const CardItem = React.memo(({ card, group }: CardItemProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  // Determine card type based on group role
  const cardType = group
    ? group.prototypeRole === 'page'
      ? 'content-block'
      : 'link'
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        {/* Type indicator dot */}
        {cardType && (
          <div
            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
              cardType === 'link' ? 'bg-blue-500' : 'bg-orange-500'
            }`}
            title={cardType}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 text-sm">{card.label}</div>
          {card.description && (
            <div className="text-xs text-gray-500 mt-0.5 truncate">
              {card.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CardItem.displayName = 'CardItem';
