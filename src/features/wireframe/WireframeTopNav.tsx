import React from 'react';
import './wireframe.css';
import { useProjectStore } from '../../store/projectStore';

interface WireframeTopNavProps {
  activeMainNavCardId: string | null;
  onMainNavClick: (cardId: string) => void;
}

export const WireframeTopNav = ({
  activeMainNavCardId,
  onMainNavClick,
}: WireframeTopNavProps) => {
  const meta = useProjectStore((state) => state.meta);
  const cards = useProjectStore((state) => state.cards);
  const groups = useProjectStore((state) => state.groups);

  // Find the main-nav group
  const mainNavGroup = groups.find((g) => g.prototypeRole === 'main-nav');

  return (
    <div className="wf-topnav">
      <div className="wf-topnav-title">{meta.title}</div>
      <div className="wf-topnav-links">
        {(() => {
          if (!mainNavGroup) return null;
          if (!mainNavGroup.navSections?.length) {
            return mainNavGroup.cardIds.map((id) => {
              const card = cards.find(c => c.id === id);
              if (!card) return null;
              return (
                <div key={card.id} className={`wf-topnav-link ${activeMainNavCardId === card.id ? 'wf-topnav-link--active' : ''}`} onClick={() => onMainNavClick(card.id)}>
                  {card.label}
                </div>
              );
            });
          }
          const cardToSection = new Map(
            mainNavGroup.navSections.flatMap(s => s.cardIds.map(id => [id, s.id]))
          );
          const result: React.ReactNode[] = [];
          let lastSectionId: string | null = null;
          for (const cardId of mainNavGroup.cardIds) {
            const sectionId = cardToSection.get(cardId) ?? null;
            if (sectionId !== lastSectionId && sectionId !== null) {
              const section = mainNavGroup.navSections.find(s => s.id === sectionId);
              result.push(<div key={`sep-${sectionId}`} className="wf-topnav-section">{section?.label}</div>);
              lastSectionId = sectionId;
            }
            const card = cards.find(c => c.id === cardId);
            if (card) result.push(
              <div key={cardId} className={`wf-topnav-link ${activeMainNavCardId === cardId ? 'wf-topnav-link--active' : ''}`} onClick={() => onMainNavClick(cardId)}>
                {card.label}
              </div>
            );
          }
          return result;
        })()}
      </div>
    </div>
  );
};
