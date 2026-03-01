import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { CardDefinition, Group } from '../../store/types';
import { ConfirmPopover } from './ConfirmPopover';

interface CardItemProps {
  card: CardDefinition;
  group?: Group;  // If provided, shows the card's context/type based on group role
  onRemove?: () => void;
  onEdit?: (label: string, description?: string) => void;
  onCancelEdit?: () => void;
  onStartEdit?: () => void;
  isEditing?: boolean;
}

const TOOLTIP_WIDTH = 224; // w-56
const TOOLTIP_GAP = 8;

export const CardItem = React.memo(({ card, group, onRemove, onEdit, onCancelEdit, onStartEdit, isEditing = false }: CardItemProps) => {
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
  const labelRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLDivElement>(null);
  const removeButtonRef = useRef<HTMLButtonElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [editLabel, setEditLabel] = useState(card.label);
  const [editDescription, setEditDescription] = useState(card.description ?? '');
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setRefs = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    cardRef.current = el;
  };

  const isTruncated = () => {
    const labelEl = labelRef.current;
    const descEl = descRef.current;
    if (labelEl && labelEl.scrollWidth > labelEl.offsetWidth) return true;
    if (descEl && descEl.scrollWidth > descEl.offsetWidth) return true;
    return false;
  };

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => {
      if (!cardRef.current || !isTruncated()) return;
      const rect = cardRef.current.getBoundingClientRect();

      // Horizontal: left-align with card, clamp to viewport
      let left = rect.left;
      if (left + TOOLTIP_WIDTH > window.innerWidth - TOOLTIP_GAP) {
        left = window.innerWidth - TOOLTIP_WIDTH - TOOLTIP_GAP;
      }
      if (left < TOOLTIP_GAP) left = TOOLTIP_GAP;

      // Vertical: prefer above, fall back to below if not enough room
      const below = rect.top < 80;

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

  // Sync local edit state when entering edit mode
  React.useEffect(() => {
    if (isEditing) {
      setEditLabel(card.label);
      setEditDescription(card.description ?? '');
    }
  }, [isEditing, card.label, card.description]);

  const handleEditSave = () => {
    if (!editLabel.trim()) return;
    onEdit?.(editLabel.trim(), editDescription.trim() || undefined);
  };

  const handleEditCancel = () => {
    setEditLabel(card.label);
    setEditDescription(card.description ?? '');
    onCancelEdit?.();
  };

  // Determine card type based on group role
  const cardType = group
    ? group.prototypeRole === 'page'
      ? 'content-block'
      : 'link'
    : null;

  const dotColor: Record<string, string> = {
    'main-nav': 'bg-emerald-600',
    'secondary-nav': 'bg-violet-600',
    'page': 'bg-orange-500',
  };

  if (isEditing) {
    return (
      <div
        ref={setRefs}
        style={style}
        className="relative bg-white border border-emerald-400 rounded-lg p-3 shadow-sm"
      >
        <input
          type="text"
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleEditSave();
            if (e.key === 'Escape') handleEditCancel();
          }}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          autoFocus
        />
        <input
          type="text"
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleEditSave();
            if (e.key === 'Escape') handleEditCancel();
          }}
          placeholder="Description (optional)"
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
        <div className="flex gap-2">
          <button
            onClick={handleEditSave}
            className="btn-cta px-3 py-1 text-xs font-medium rounded"
          >
            Save
          </button>
          <button
            onClick={handleEditCancel}
            className="btn-secondary px-3 py-1 text-xs font-medium rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setRefs}
      style={style}
      {...listeners}
      {...attributes}
      data-card-id={card.id}
      className="relative group/card bg-white border border-gray-300 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
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
          <div className="font-semibold leading-snug">{card.label}</div>
          {card.description && (
            <div className="mt-1 text-gray-300 leading-snug">{card.description}</div>
          )}
        </div>,
        document.body
      )}

      {(onEdit || onRemove) && (
        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
          {onEdit && (
            <button
              className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-emerald-600 hover:bg-gray-100"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onStartEdit?.(); }}
              tabIndex={-1}
              aria-label="Edit card"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 1.5a1.207 1.207 0 0 1 1.707 1.707L3.5 9.914 1 10.5l.586-2.5L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {onRemove && (
            <>
              <button
                ref={removeButtonRef}
                className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 text-base leading-none"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setConfirmingRemove(true); }}
                tabIndex={-1}
                aria-label="Remove card"
              >
                &times;
              </button>
              {confirmingRemove && removeButtonRef.current && (
                <ConfirmPopover
                  anchor={removeButtonRef.current.getBoundingClientRect()}
                  message={`Remove "${card.label}"?`}
                  confirmLabel="Remove"
                  onConfirm={() => { setConfirmingRemove(false); onRemove(); }}
                  onCancel={() => setConfirmingRemove(false)}
                />
              )}
            </>
          )}
        </div>
      )}

      <div className="flex items-start gap-2">
        {/* Type indicator dot */}
        {cardType && group && (
          <div
            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor[group.prototypeRole]}`}
          />
        )}

        <div className="flex-1 min-w-0">
          <div ref={labelRef} className="font-medium text-gray-900 text-sm truncate">{card.label}</div>
          {card.description && (
            <div ref={descRef} className="text-xs text-gray-500 mt-0.5 truncate">
              {card.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CardItem.displayName = 'CardItem';
