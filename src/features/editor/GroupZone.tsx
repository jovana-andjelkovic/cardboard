import React, { useRef, useState } from 'react';
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


interface NavSectionDropZoneProps {
  sectionId: string;
  groupId: string;
  isEmpty: boolean;
  children: React.ReactNode;
}

const NavSectionDropZone = ({ sectionId, groupId, isEmpty, children }: NavSectionDropZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `nav-section-${sectionId}`,
    data: { type: 'nav-section', groupId, sectionId },
  });
  return (
    <div
      ref={setNodeRef}
      className={`rounded transition-colors ${isOver ? 'bg-[#047C66]/10 ring-1 ring-[#047C66]/40' : ''} ${isEmpty ? 'min-h-[28px]' : ''}`}
    >
      {children}
      {isEmpty && (
        <div className={`text-xs text-center py-1.5 ${isOver ? 'text-[#047C66]' : 'text-gray-300'}`}>
          Drop card here
        </div>
      )}
    </div>
  );
};

interface NavUnsortedDropZoneProps {
  groupId: string;
  position: 'top' | 'bottom';
  children?: React.ReactNode;
}

const NavUnsortedDropZone = ({ groupId, position, children }: NavUnsortedDropZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `nav-unsorted-${position}-${groupId}`,
    data: { type: 'nav-unsorted', groupId },
  });
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);
  return (
    <div
      ref={setNodeRef}
      className={`rounded transition-colors ${isOver ? 'bg-[#047C66]/10 ring-1 ring-[#047C66]/40' : 'ring-1 ring-gray-200'} ${isEmpty ? 'min-h-[28px]' : ''}`}
    >
      {children}
      {isEmpty && (
        <div className={`text-xs text-center py-1.5 ${isOver ? 'text-[#047C66]' : 'text-gray-300'}`}>
          Drop card here
        </div>
      )}
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
  const addNavSection = useProjectStore((state) => state.addNavSection);
  const removeNavSection = useProjectStore((state) => state.removeNavSection);


  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState('');


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

  const handleAddSection = () => {
    const label = newSectionLabel.trim();
    if (label) {
      addNavSection(group.id, label);
      setNewSectionLabel('');
      setIsAddingSection(false);
    }
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
        {group.prototypeRole !== 'page' ? (
          // Main-nav and secondary-nav rendering with sections support
          <>
            <SortableContext items={groupCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {(() => {
                const sectionCardIds = new Set((group.navSections ?? []).flatMap(s => s.cardIds));
                const unsectionedCards = groupCards.filter(c => !sectionCardIds.has(c.id));

                const hasSections = (group.navSections?.length ?? 0) > 0;

                return (
                  <div className="space-y-2">
                    {/* Unsorted top — always visible when sections exist, or plain list when no sections */}
                    {hasSections ? (
                      <div>
                        <div className="flex items-center px-1 mb-1">
                          <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">Unsorted</span>
                        </div>
                        <NavUnsortedDropZone groupId={group.id} position="top">
                          {unsectionedCards.length > 0 && (
                            <div className="space-y-1 p-1">
                              {unsectionedCards.map(card => (
                                <SortableCard key={card.id} card={card} group={group} />
                              ))}
                            </div>
                          )}
                        </NavUnsortedDropZone>
                      </div>
                    ) : (
                      <>
                        {groupCards.length === 0 && (
                          <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg py-8 text-gray-400 text-sm">
                            Drop cards here
                          </div>
                        )}
                        {unsectionedCards.map(card => (
                          <SortableCard key={card.id} card={card} group={group} />
                        ))}
                      </>
                    )}

                      {/* Named sections */}
                      {(group.navSections ?? []).map(section => {
                        const sectionCards = section.cardIds
                          .map(id => cards.find(c => c.id === id))
                          .filter((c): c is NonNullable<typeof c> => c !== undefined);
                        return (
                          <div key={section.id} className="mt-2">
                            {/* Section header */}
                            <div className="flex items-center justify-between px-1 mb-1">
                              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                                {section.label}
                              </span>
                              <button
                                onClick={() => removeNavSection(group.id, section.id)}
                                className="text-gray-300 hover:text-gray-500 transition-colors text-xs leading-none px-0.5"
                                title="Remove section"
                              >
                                ✕
                              </button>
                            </div>
                            {/* Section drop zone */}
                            <NavSectionDropZone
                              sectionId={section.id}
                              groupId={group.id}
                              isEmpty={sectionCards.length === 0}
                            >
                              <div className="space-y-1">
                                {sectionCards.map(card => (
                                  <SortableCard key={card.id} card={card} group={group} />
                                ))}
                              </div>
                            </NavSectionDropZone>
                          </div>
                        );
                      })}

                      {/* Unsorted bottom — only when sections exist */}
                      {hasSections && (
                        <div className="mt-2">
                          <div className="flex items-center px-1 mb-1">
                            <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">Unsorted</span>
                          </div>
                          <NavUnsortedDropZone groupId={group.id} position="bottom" />
                        </div>
                      )}

                      {/* Add section UI */}
                      <div className="pt-2">
                        {isAddingSection ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              placeholder="Section label"
                              value={newSectionLabel}
                              onChange={(e) => setNewSectionLabel(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddSection();
                                if (e.key === 'Escape') { setIsAddingSection(false); setNewSectionLabel(''); }
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600"
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <button onClick={handleAddSection} className="btn-cta px-2 py-0.5 text-xs font-medium rounded">Add</button>
                              <button onClick={() => { setIsAddingSection(false); setNewSectionLabel(''); }} className="btn-secondary px-2 py-0.5 text-xs font-medium rounded">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsAddingSection(true)}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors w-full text-left px-1"
                          >
                            + Add section
                          </button>
                        )}
                      </div>
                    </div>
                  );
              })()}
            </SortableContext>
          </>
        ) : (
          // Simple rendering for page groups
          groupCards.length > 0 ? (
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
          )
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
