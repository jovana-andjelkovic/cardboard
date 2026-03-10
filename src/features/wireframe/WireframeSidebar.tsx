import React from 'react';
import './wireframe.css';
import { useProjectStore } from '../../store/projectStore';
import type { Group } from '../../store/types';

interface WireframeSidebarProps {
  secondaryNavGroup: Group;
  activeSecondaryLinkId: string | null;
  onSecondaryLinkClick: (cardId: string) => void;
}

export const WireframeSidebar = ({
  secondaryNavGroup,
  activeSecondaryLinkId,
  onSecondaryLinkClick,
}: WireframeSidebarProps) => {
  const cards = useProjectStore((state) => state.cards);

  if (!secondaryNavGroup.navSections?.length) {
    const secondaryNavCards = secondaryNavGroup.cardIds
      .map((id) => cards.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined);
    return (
      <div className="wf-sidebar">
        {secondaryNavCards.map((card) => (
          <div
            key={card.id}
            className={`wf-sidebar-link ${activeSecondaryLinkId === card.id ? 'wf-sidebar-link--active' : ''}`}
            onClick={() => onSecondaryLinkClick(card.id)}
          >
            {card.label}
          </div>
        ))}
      </div>
    );
  }

  const cardToSection = new Map(
    secondaryNavGroup.navSections.flatMap(s => s.cardIds.map(id => [id, s.id]))
  );
  const result: React.ReactNode[] = [];
  let lastSectionId: string | null = null;
  for (const cardId of secondaryNavGroup.cardIds) {
    const sectionId = cardToSection.get(cardId) ?? null;
    if (sectionId !== lastSectionId && sectionId !== null) {
      const section = secondaryNavGroup.navSections.find(s => s.id === sectionId);
      result.push(<div key={`sep-${sectionId}`} className="wf-sidebar-section">{section?.label}</div>);
      lastSectionId = sectionId;
    }
    const card = cards.find(c => c.id === cardId);
    if (card) result.push(
      <div
        key={cardId}
        className={`wf-sidebar-link ${activeSecondaryLinkId === cardId ? 'wf-sidebar-link--active' : ''}`}
        onClick={() => onSecondaryLinkClick(cardId)}
      >
        {card.label}
      </div>
    );
  }

  return <div className="wf-sidebar">{result}</div>;
};
