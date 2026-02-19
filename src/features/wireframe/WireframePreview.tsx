import { useState, useEffect } from 'react';
import './wireframe.css';
import { useProjectStore } from '../../store/projectStore';
import { WireframeTopNav } from './WireframeTopNav';
import { WireframeSidebar } from './WireframeSidebar';
import { WireframeContentArea } from './WireframeContentArea';
import { WireframeEmptyState } from './WireframeEmptyState';
import type { Group } from '../../store/types';

export const WireframePreview = () => {
  const groups = useProjectStore((state) => state.groups);
  const connections = useProjectStore((state) => state.connections);

  const [activeMainNavCardId, setActiveMainNavCardId] = useState<string | null>(null);
  const [activeSecondaryNavCardId, setActiveSecondaryNavCardId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<Group | null>(null);
  const [activeSecondaryNav, setActiveSecondaryNav] = useState<Group | null>(null);

  // Find the main nav group
  const mainNavGroup = groups.find((g) => g.prototypeRole === 'main-nav');

  // Initialize on first render - activate the first main nav link if connections exist
  useEffect(() => {
    if (!mainNavGroup || activeMainNavCardId) return;

    const mainNavConnections = connections.filter(
      (conn) => conn.fromGroupId === mainNavGroup.id
    );

    if (mainNavConnections.length > 0 && mainNavGroup.cardIds.length > 0) {
      // Activate the first nav link
      handleMainNavClick(mainNavGroup.cardIds[0], 0);
    }
  }, [mainNavGroup, connections]); // Only run on mount or when these change

  /**
   * Handle click on main nav link
   * Approach A (index-based): First card → first connection, etc.
   */
  const handleMainNavClick = (cardId: string, index: number) => {
    if (!mainNavGroup) return;

    setActiveMainNavCardId(cardId);
    setActiveSecondaryNavCardId(null);
    setActiveSecondaryNav(null);

    // Find the connection at the same index
    const mainNavConnections = connections.filter(
      (conn) => conn.fromGroupId === mainNavGroup.id
    );

    const connection = mainNavConnections[index];

    if (!connection) {
      // No connection for this index
      setActivePage(null);
      return;
    }

    const targetGroup = groups.find((g) => g.id === connection.toGroupId);

    if (!targetGroup) {
      setActivePage(null);
      return;
    }

    // If target is a page, show it directly
    if (targetGroup.prototypeRole === 'page') {
      setActivePage(targetGroup);
      setActiveSecondaryNav(null);
      return;
    }

    // If target is a secondary-nav, show the sidebar and navigate to its first connected page
    if (targetGroup.prototypeRole === 'secondary-nav') {
      setActiveSecondaryNav(targetGroup);

      // Find the first connection from this secondary nav to a page
      const secondaryNavConnections = connections.filter(
        (conn) => conn.fromGroupId === targetGroup.id
      );

      if (secondaryNavConnections.length > 0 && targetGroup.cardIds.length > 0) {
        // Activate the first secondary nav link
        const firstCardId = targetGroup.cardIds[0];
        setActiveSecondaryNavCardId(firstCardId);

        const firstTargetGroup = groups.find(
          (g) => g.id === secondaryNavConnections[0].toGroupId
        );

        setActivePage(firstTargetGroup || null);
      } else {
        // Secondary nav has no connections
        setActivePage(null);
      }
    }
  };

  /**
   * Handle click on secondary nav link
   * Approach A (index-based): First card → first connection, etc.
   */
  const handleSecondaryNavClick = (cardId: string, index: number) => {
    if (!activeSecondaryNav) return;

    setActiveSecondaryNavCardId(cardId);

    // Find the connection at the same index
    const secondaryNavConnections = connections.filter(
      (conn) => conn.fromGroupId === activeSecondaryNav.id
    );

    const connection = secondaryNavConnections[index];

    if (!connection) {
      setActivePage(null);
      return;
    }

    const targetGroup = groups.find((g) => g.id === connection.toGroupId);
    setActivePage(targetGroup || null);
  };

  // Handle edge case: if active page is deleted, fall back
  useEffect(() => {
    if (activePage && !groups.find((g) => g.id === activePage.id)) {
      setActivePage(null);
      setActiveMainNavCardId(null);
      setActiveSecondaryNavCardId(null);
      setActiveSecondaryNav(null);
    }
  }, [groups, activePage]);

  // Determine what to render
  const hasCards = groups.some((g) => g.cardIds.length > 0);
  const hasConnections = connections.length > 0;

  if (!hasCards) {
    return (
      <div className="wf-shell">
        <WireframeEmptyState type="no-cards-sorted" />
      </div>
    );
  }

  if (!hasConnections) {
    return (
      <div className="wf-shell">
        <WireframeTopNav
          activeMainNavCardId={activeMainNavCardId}
          onMainNavClick={handleMainNavClick}
        />
        <WireframeEmptyState type="no-connections" />
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
            onSecondaryLinkClick={handleSecondaryNavClick}
          />
        )}
        <WireframeContentArea activePage={activePage} />
      </div>
    </div>
  );
};
