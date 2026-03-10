import React, { useState, useEffect } from 'react';
import './wireframe.css';
import { useProjectStore } from '../../store/projectStore';
import { WireframeTopNav } from './WireframeTopNav';
import { WireframeSidebar } from './WireframeSidebar';
import { WireframeContentArea } from './WireframeContentArea';
import { WireframeEmptyState } from './WireframeEmptyState';

export const WireframePreview = () => {
  const meta = useProjectStore((state) => state.meta);
  const cards = useProjectStore((state) => state.cards);
  const groups = useProjectStore((state) => state.groups);
  const connections = useProjectStore((state) => state.connections);
  const mainNavPosition = useProjectStore((state) => state.mainNavPosition);

  const [activeMainNavCardId, setActiveMainNavCardId] = useState<string | null>(
    () => groups.find(g => g.prototypeRole === 'main-nav')?.cardIds[0] ?? null
  );
  const [activeSecondaryNavCardId, setActiveSecondaryNavCardId] = useState<string | null>(null);

  const mainNavGroup = groups.find((g) => g.prototypeRole === 'main-nav');

  // Derive active page fresh from the store on every render — never stale
  const activePage = (() => {
    if (activeSecondaryNavCardId) {
      return groups.find(g => g.prototypeRole === 'page' && g.ownerCardId === activeSecondaryNavCardId) ?? null;
    }
    // Try the active card first, then fall back through main-nav cards in order
    const candidateIds = [activeMainNavCardId, ...(mainNavGroup?.cardIds ?? [])].filter((id): id is string => id !== null);
    for (const cardId of candidateIds) {
      const page = groups.find(g => g.prototypeRole === 'page' && g.ownerCardId === cardId);
      if (page) return page;
    }
    return null;
  })();

  // Derive active secondary nav fresh from the store on every render — never stale
  const activeSecondaryNav = (() => {
    if (!activeMainNavCardId) return null;
    const ownedPage = groups.find(g => g.prototypeRole === 'page' && g.ownerCardId === activeMainNavCardId);
    if (!ownedPage) return null;
    return groups.find(g =>
      g.prototypeRole === 'secondary-nav' &&
      connections.some(c => c.fromGroupId === ownedPage.id && c.toGroupId === g.id)
    ) ?? null;
  })();

  // Auto-activate the first nav card when main nav first gets a card
  useEffect(() => {
    if (activeMainNavCardId) return;
    if (!mainNavGroup || mainNavGroup.cardIds.length === 0) return;
    setActiveMainNavCardId(mainNavGroup.cardIds[0]);
  }, [mainNavGroup?.cardIds.length, activeMainNavCardId]);

  // If the active nav card is removed, fall back to the first remaining card
  useEffect(() => {
    if (!activeMainNavCardId) return;
    if (!mainNavGroup?.cardIds.includes(activeMainNavCardId)) {
      setActiveMainNavCardId(mainNavGroup?.cardIds[0] ?? null);
      setActiveSecondaryNavCardId(null);
    }
  }, [groups]);

  const handleMainNavClick = (cardId: string) => {
    setActiveMainNavCardId(cardId);
    setActiveSecondaryNavCardId(null);
  };

  const handleSecondaryNavClick = (cardId: string) => {
    setActiveSecondaryNavCardId(cardId);
  };

  const mainNavCards = mainNavGroup
    ? mainNavGroup.cardIds
        .map((id) => cards.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => c !== undefined)
    : [];

  const hasCards = groups.some((g) => g.cardIds.length > 0);

  if (!hasCards) {
    return (
      <div className="wf-shell">
        <WireframeEmptyState type="no-cards-sorted" />
      </div>
    );
  }

  if (mainNavPosition === 'left') {
    return (
      <div className="wf-shell wf-shell--leftnav">
        <div className="wf-leftnav">
          <div className="wf-leftnav-header">
            <div className="wf-leftnav-title">{meta.title}</div>
          </div>
          <div className="wf-leftnav-links">
            {(() => {
              if (!mainNavGroup?.navSections?.length) {
                return mainNavCards.map((card) => (
                  <div
                    key={card.id}
                    className={`wf-leftnav-link ${activeMainNavCardId === card.id ? 'wf-leftnav-link--active' : ''}`}
                    onClick={() => handleMainNavClick(card.id)}
                  >
                    {card.label}
                  </div>
                ));
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
                  result.push(<div key={`sep-${sectionId}`} className="wf-leftnav-section">{section?.label}</div>);
                  lastSectionId = sectionId;
                }
                const card = cards.find(c => c.id === cardId);
                if (card) result.push(
                  <div
                    key={cardId}
                    className={`wf-leftnav-link ${activeMainNavCardId === cardId ? 'wf-leftnav-link--active' : ''}`}
                    onClick={() => handleMainNavClick(cardId)}
                  >
                    {card.label}
                  </div>
                );
              }
              return result;
            })()}
          </div>
        </div>
        <div className="wf-leftnav-body">
          <div className="wf-content-row">
            {activeSecondaryNav && (
              <WireframeSidebar
                secondaryNavGroup={activeSecondaryNav}
                activeSecondaryLinkId={activeSecondaryNavCardId}
                onSecondaryLinkClick={(cardId) => handleSecondaryNavClick(cardId)}
              />
            )}
            <WireframeContentArea activePage={activePage} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wf-shell">
      <WireframeTopNav
        activeMainNavCardId={activeMainNavCardId}
        onMainNavClick={handleMainNavClick}
      />
      <div className="wf-content-row">
        {activeSecondaryNav && (
          <WireframeSidebar
            secondaryNavGroup={activeSecondaryNav}
            activeSecondaryLinkId={activeSecondaryNavCardId}
            onSecondaryLinkClick={(cardId) => handleSecondaryNavClick(cardId)}
          />
        )}
        <WireframeContentArea activePage={activePage} />
      </div>
    </div>
  );
};
