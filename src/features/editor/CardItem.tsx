import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { CardDefinition, Group } from '../../store/types';

interface CardItemProps {
  card: CardDefinition;
  group?: Group;  // If provided, shows the card's context/type based on group role
}

const TOOLTIP_WIDTH = 224; // w-56
const TOOLTIP_GAP = 8;

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

  const cardRef = useRef<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowBelow, setArrowBelow] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setRefs = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    cardRef.current = el;
  };

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();

      // Horizontal: left-align with card, clamp to viewport
      let left = rect.left;
      if (left + TOOLTIP_WIDTH > window.innerWidth - TOOLTIP_GAP) {
        left = window.innerWidth - TOOLTIP_WIDTH - TOOLTIP_GAP;
      }
      if (left < TOOLTIP_GAP) left = TOOLTIP_GAP;

      // Vertical: prefer above, fall back to below if not enough room
      const spaceAbove = rect.top;
      const below = spaceAbove < 80;

      setArrowBelow(below);
      setTooltipStyle(
        below
          ? { position: 'fixed', top: rect.bottom + TOOLTIP_GAP, left }
          : { position: 'fixed', top: rect.top - TOOLTIP_GAP, left, transform: 'translateY(-100%)' }
      );
      setShowTooltip(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setShowTooltip(false);
  };

  const handleMouseDown = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setShowTooltip(false);
  };

  // Determine card type based on group role
  const cardType = group
    ? group.prototypeRole === 'page'
      ? 'content-block'
      : 'link'
    : null;

  return (
    <div
      ref={setRefs}
      style={style}
      {...listeners}
      {...attributes}
      className="relative bg-white border border-gray-300 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
    >
      {/* Tooltip rendered in a portal so it's never clipped by any container */}
      {showTooltip && !isDragging && createPortal(
        <div
          style={{ ...tooltipStyle, width: TOOLTIP_WIDTH, zIndex: 9999 }}
          className="bg-gray-900 text-white text-xs rounded-lg p-2.5 shadow-lg pointer-events-none"
        >
          {/* Arrow pointing down (tooltip above card) */}
          {!arrowBelow && (
            <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />
          )}
          <div className="font-semibold leading-snug">{card.label}</div>
          {card.description && (
            <div className="mt-1 text-gray-300 leading-snug">{card.description}</div>
          )}
          {/* Arrow pointing up (tooltip below card) */}
          {arrowBelow && (
            <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900" />
          )}
        </div>,
        document.body
      )}

      <div className="flex items-start gap-2">
        {/* Type indicator dot */}
        {cardType && (
          <div
            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
              cardType === 'link' ? 'bg-blue-500' : 'bg-orange-500'
            }`}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 text-sm truncate">{card.label}</div>
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
