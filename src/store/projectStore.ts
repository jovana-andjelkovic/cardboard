import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { ProjectState, CardDefinition, Group, PrototypeRole, Connection, PendingSecondaryNavPrompt } from './types';

interface ProjectActions {
  // Card actions
  addCard: (label: string, description?: string) => void;
  bulkAddCards: (cards: Array<{ label: string; description?: string }>) => void;
  replaceAllCards: (cards: Array<{ label: string; description?: string }>) => void;
  removeCard: (cardId: string) => void;
  updateCard: (cardId: string, updates: Partial<Omit<CardDefinition, 'id'>>) => void;

  // Group actions
  addGroup: (label: string, prototypeRole: PrototypeRole) => void;
  removeGroup: (groupId: string) => void;
  updateGroup: (groupId: string, updates: Partial<Omit<Group, 'id'>>) => void;

  // Card movement actions
  moveCard: (cardId: string, toGroupId: string, index: number) => void;
  returnCardToDeck: (cardId: string) => void;
  reorderCardInGroup: (groupId: string, fromIndex: number, toIndex: number) => void;

  // Implicit connection actions (Phase 5)
  dropCardToMainNav: (cardId: string) => void;
  removeCardFromMainNav: (cardId: string) => void;
  dropCardToSecondaryNav: (cardId: string, secNavGroupId: string) => void;
  removeCardFromSecondaryNav: (cardId: string) => void;
  promoteToSecondaryNav: (cardId: string, pageGroupId: string) => void;
  addSecondaryNavToPage: (pageGroupId: string) => void;

  // Connection actions (still used internally + for secondary nav)
  addConnection: (fromGroupId: string, toGroupId: string) => void;
  removeConnection: (fromGroupId: string, toGroupId: string) => void;
  getConnectionsForGroup: (groupId: string) => { outgoing: Connection[], incoming: Connection[] };

  // UI state
  setPendingSecondaryNavPrompt: (prompt: PendingSecondaryNavPrompt | null) => void;
  setMainNavPosition: (position: 'top' | 'left') => void;

  // Snapshot actions
  getSnapshot: () => ProjectState;
  loadSnapshot: (state: ProjectState) => void;
  resetProject: () => void;
  setTitle: (title: string) => void;
}

interface UIState {
  pendingSecondaryNavPrompt: PendingSecondaryNavPrompt | null;
  mainNavPosition: 'top' | 'left';
}

type ProjectStore = ProjectState & ProjectActions & UIState;

// Helper function to create initial state
const createInitialState = (): ProjectState => {
  const mainNavGroupId = nanoid();

  // Sample cards for a project management app
  const dashboardCard: CardDefinition = { id: nanoid(), label: 'Dashboard', description: 'Overview of all projects and tasks' };
  const projectsCard: CardDefinition = { id: nanoid(), label: 'Projects', description: 'Manage your projects' };
  const settingsCard: CardDefinition = { id: nanoid(), label: 'Settings', description: 'Configure preferences' };

  // Page content cards
  const activityFeedCard: CardDefinition = { id: nanoid(), label: 'Activity Feed', description: 'Recent updates' };
  const reportsCard: CardDefinition = { id: nanoid(), label: 'Reports', description: 'Analytics and insights' };

  // Secondary nav cards for Projects page
  const activeProjectsCard: CardDefinition = { id: nanoid(), label: 'Active Projects', description: 'In-progress projects' };
  const archivedCard: CardDefinition = { id: nanoid(), label: 'Archived', description: 'Completed projects' };

  // Unsorted cards
  const unsortedCards: CardDefinition[] = [
    { id: nanoid(), label: 'Team Members', description: 'View and manage team' },
    { id: nanoid(), label: 'Calendar', description: 'Schedule and deadlines' },
    { id: nanoid(), label: 'Notifications', description: 'Activity alerts' },
    { id: nanoid(), label: 'Billing', description: 'Payment and invoices' },
    { id: nanoid(), label: 'Help Center', description: 'Documentation and support' },
  ];

  const allCards = [
    dashboardCard,
    projectsCard,
    settingsCard,
    activityFeedCard,
    reportsCard,
    activeProjectsCard,
    archivedCard,
    ...unsortedCards,
  ];

  // Auto-created pages (owned by nav cards)
  const dashboardPageId = nanoid();
  const projectsPageId = nanoid();
  const settingsPageId = nanoid();

  // Secondary nav group for Projects page
  const projectsSecNavId = nanoid();

  // Pages owned by secondary nav cards
  const activeProjectsPageId = nanoid();
  const archivedPageId = nanoid();

  const groups: Group[] = [
    {
      id: mainNavGroupId,
      label: 'Main Navigation',
      cardIds: [dashboardCard.id, projectsCard.id, settingsCard.id],
      prototypeRole: 'main-nav',
      order: 0,
    },
    {
      id: dashboardPageId,
      label: 'Dashboard Page',
      cardIds: [activityFeedCard.id, reportsCard.id],
      prototypeRole: 'page',
      order: 1,
      ownerCardId: dashboardCard.id,
    },
    {
      id: projectsPageId,
      label: 'Projects Page',
      cardIds: [],
      prototypeRole: 'page',
      order: 2,
      ownerCardId: projectsCard.id,
    },
    {
      id: settingsPageId,
      label: 'Settings Page',
      cardIds: [],
      prototypeRole: 'page',
      order: 3,
      ownerCardId: settingsCard.id,
    },
    {
      id: projectsSecNavId,
      label: 'Projects Nav',
      cardIds: [activeProjectsCard.id, archivedCard.id],
      prototypeRole: 'secondary-nav',
      order: 4,
    },
    {
      id: activeProjectsPageId,
      label: 'Active Projects Page',
      cardIds: [],
      prototypeRole: 'page',
      order: 5,
      ownerCardId: activeProjectsCard.id,
    },
    {
      id: archivedPageId,
      label: 'Archived Page',
      cardIds: [],
      prototypeRole: 'page',
      order: 6,
      ownerCardId: archivedCard.id,
    },
  ];

  const connections: Connection[] = [
    { fromGroupId: mainNavGroupId, toGroupId: dashboardPageId },
    { fromGroupId: mainNavGroupId, toGroupId: projectsPageId },
    { fromGroupId: mainNavGroupId, toGroupId: settingsPageId },
    { fromGroupId: projectsPageId, toGroupId: projectsSecNavId },
    { fromGroupId: projectsSecNavId, toGroupId: activeProjectsPageId },
    { fromGroupId: projectsSecNavId, toGroupId: archivedPageId },
  ];

  return {
    meta: {
      id: nanoid(),
      title: 'Untitled project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    },
    cards: allCards,
    groups,
    connections,
    unsortedCardIds: unsortedCards.map(c => c.id),
  };
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  ...createInitialState(),

  // UI State
  pendingSecondaryNavPrompt: null,
  mainNavPosition: 'left',

  // Card actions
  addCard: (label: string, description?: string) => {
    const newCard: CardDefinition = {
      id: nanoid(),
      label,
      description,
    };

    set((state) => ({
      cards: [...state.cards, newCard],
      unsortedCardIds: [...state.unsortedCardIds, newCard.id],
      meta: {
        ...state.meta,
        updatedAt: new Date().toISOString(),
        version: state.meta.version + 1,
      },
    }));
  },

  bulkAddCards: (cards) => {
    if (cards.length === 0) return;

    const newCards: CardDefinition[] = cards.map((c) => ({
      id: nanoid(),
      label: c.label,
      ...(c.description ? { description: c.description } : {}),
    }));

    set((state) => ({
      cards: [...state.cards, ...newCards],
      unsortedCardIds: [...state.unsortedCardIds, ...newCards.map((c) => c.id)],
      meta: {
        ...state.meta,
        updatedAt: new Date().toISOString(),
        version: state.meta.version + 1,
      },
    }));
  },

  replaceAllCards: (cards) => {
    const newCards: CardDefinition[] = cards.map((c) => ({
      id: nanoid(),
      label: c.label,
      ...(c.description ? { description: c.description } : {}),
    }));

    set((state) => ({
      cards: newCards,
      unsortedCardIds: newCards.map((c) => c.id),
      groups: [
        {
          id: nanoid(),
          label: 'Main Navigation',
          cardIds: [],
          prototypeRole: 'main-nav' as const,
          order: 0,
        },
      ],
      connections: [],
      pendingSecondaryNavPrompt: null,
      meta: {
        ...state.meta,
        updatedAt: new Date().toISOString(),
        version: state.meta.version + 1,
      },
    }));
  },

  removeCard: (cardId: string) => {
    set((state) => {
      const cards = state.cards.filter(card => card.id !== cardId);
      const unsortedCardIds = state.unsortedCardIds.filter(id => id !== cardId);
      const groups = state.groups.map(group => ({
        ...group,
        cardIds: group.cardIds.filter(id => id !== cardId),
      }));

      return {
        cards,
        unsortedCardIds,
        groups,
        meta: {
          ...state.meta,
          updatedAt: new Date().toISOString(),
          version: state.meta.version + 1,
        },
      };
    });
  },

  updateCard: (cardId: string, updates: Partial<Omit<CardDefinition, 'id'>>) => {
    set((state) => ({
      cards: state.cards.map(card =>
        card.id === cardId ? { ...card, ...updates } : card
      ),
      meta: {
        ...state.meta,
        updatedAt: new Date().toISOString(),
        version: state.meta.version + 1,
      },
    }));
  },

  // Group actions
  addGroup: (label: string, prototypeRole: PrototypeRole) => {
    const state = get();
    const hasMainNav = state.groups.some(g => g.prototypeRole === 'main-nav');

    if (prototypeRole === 'main-nav' && hasMainNav) {
      console.warn('Cannot add another main-nav group. Only one is allowed.');
      return;
    }

    const newGroup: Group = {
      id: nanoid(),
      label,
      cardIds: [],
      prototypeRole,
      order: state.groups.length,
    };

    set((state) => ({
      groups: [...state.groups, newGroup],
      meta: {
        ...state.meta,
        updatedAt: new Date().toISOString(),
        version: state.meta.version + 1,
      },
    }));
  },

  removeGroup: (groupId: string) => {
    const state = get();
    const group = state.groups.find(g => g.id === groupId);

    if (!group) return;

    // Cannot delete main-nav
    if (group.prototypeRole === 'main-nav') {
      console.warn('Cannot delete main-nav group.');
      return;
    }

    // If deleting a page that has an ownerCardId, cascade via removeCardFromMainNav
    if (group.prototypeRole === 'page' && group.ownerCardId) {
      get().removeCardFromMainNav(group.ownerCardId);
      return;
    }

    // Otherwise: normal removal (secondary-nav or unowned page)
    set((state) => {
      const group = state.groups.find(g => g.id === groupId);
      if (!group) return state;

      const unsortedCardIds = [...state.unsortedCardIds, ...group.cardIds];
      const groups = state.groups.filter(g => g.id !== groupId);
      const connections = state.connections.filter(
        conn => conn.fromGroupId !== groupId && conn.toGroupId !== groupId
      );

      return {
        groups,
        unsortedCardIds,
        connections,
        meta: {
          ...state.meta,
          updatedAt: new Date().toISOString(),
          version: state.meta.version + 1,
        },
      };
    });
  },

  updateGroup: (groupId: string, updates: Partial<Omit<Group, 'id'>>) => {
    set((state) => ({
      groups: state.groups.map(group =>
        group.id === groupId ? { ...group, ...updates } : group
      ),
      meta: {
        ...state.meta,
        updatedAt: new Date().toISOString(),
        version: state.meta.version + 1,
      },
    }));
  },

  // Card movement actions
  moveCard: (cardId: string, toGroupId: string, index: number) => {
    set((state) => {
      let unsortedCardIds = state.unsortedCardIds.filter(id => id !== cardId);
      let groups = state.groups.map(group => ({
        ...group,
        cardIds: group.cardIds.filter(id => id !== cardId),
      }));

      groups = groups.map(group => {
        if (group.id === toGroupId) {
          const newCardIds = [...group.cardIds];
          newCardIds.splice(index, 0, cardId);
          return { ...group, cardIds: newCardIds };
        }
        return group;
      });

      return {
        unsortedCardIds,
        groups,
        meta: {
          ...state.meta,
          updatedAt: new Date().toISOString(),
          version: state.meta.version + 1,
        },
      };
    });
  },

  returnCardToDeck: (cardId: string) => {
    set((state) => {
      const groups = state.groups.map(group => ({
        ...group,
        cardIds: group.cardIds.filter(id => id !== cardId),
      }));

      const unsortedCardIds = state.unsortedCardIds.includes(cardId)
        ? state.unsortedCardIds
        : [...state.unsortedCardIds, cardId];

      return {
        groups,
        unsortedCardIds,
        meta: {
          ...state.meta,
          updatedAt: new Date().toISOString(),
          version: state.meta.version + 1,
        },
      };
    });
  },

  reorderCardInGroup: (groupId: string, fromIndex: number, toIndex: number) => {
    set((state) => ({
      groups: state.groups.map(group => {
        if (group.id === groupId) {
          const newCardIds = [...group.cardIds];
          const [movedCard] = newCardIds.splice(fromIndex, 1);
          newCardIds.splice(toIndex, 0, movedCard);
          return { ...group, cardIds: newCardIds };
        }
        return group;
      }),
      meta: {
        ...state.meta,
        updatedAt: new Date().toISOString(),
        version: state.meta.version + 1,
      },
    }));
  },

  // --- Phase 5: Implicit connection actions ---

  dropCardToMainNav: (cardId: string) => {
    const state = get();
    const mainNavGroup = state.groups.find(g => g.prototypeRole === 'main-nav');
    if (!mainNavGroup) return;

    const card = state.cards.find(c => c.id === cardId);
    if (!card) return;

    const newPageId = nanoid();
    const newPage: Group = {
      id: newPageId,
      label: `${card.label} Page`,
      cardIds: [],
      prototypeRole: 'page',
      order: state.groups.length,
      ownerCardId: cardId,
    };

    set((state) => {
      // Remove card from its current location
      const unsortedCardIds = state.unsortedCardIds.filter(id => id !== cardId);
      let groups = state.groups.map(group => ({
        ...group,
        cardIds: group.cardIds.filter(id => id !== cardId),
      }));

      // Add card to main-nav
      groups = groups.map(group => {
        if (group.prototypeRole === 'main-nav') {
          return { ...group, cardIds: [...group.cardIds, cardId] };
        }
        return group;
      });

      // Add the new page group
      groups = [...groups, newPage];

      // Add connection: main-nav → new page
      const connections = [
        ...state.connections,
        { fromGroupId: mainNavGroup.id, toGroupId: newPageId },
      ];

      return {
        unsortedCardIds,
        groups,
        connections,
        meta: {
          ...state.meta,
          updatedAt: new Date().toISOString(),
          version: state.meta.version + 1,
        },
      };
    });
  },

  removeCardFromMainNav: (cardId: string) => {
    // Single cascade path: removes nav card, its page, any secondary navs linked to the page
    set((state) => {
      const mainNavGroup = state.groups.find(g => g.prototypeRole === 'main-nav');
      if (!mainNavGroup) return state;

      // Find the page owned by this card
      const ownedPage = state.groups.find(
        g => g.prototypeRole === 'page' && g.ownerCardId === cardId
      );

      // Find secondary-nav groups connected FROM the owned page
      const secondaryNavIds = ownedPage
        ? state.connections
            .filter(c => c.fromGroupId === ownedPage.id)
            .map(c => c.toGroupId)
            .filter(id => state.groups.find(g => g.id === id && g.prototypeRole === 'secondary-nav'))
        : [];

      const secondaryNavGroups = state.groups.filter(g => secondaryNavIds.includes(g.id));

      // Find pages owned by cards in secondary nav groups (deep cascade)
      const secondaryNavCardPages = secondaryNavGroups
        .flatMap(g => g.cardIds)
        .map(cid => state.groups.find(g => g.prototypeRole === 'page' && g.ownerCardId === cid))
        .filter((g): g is Group => g !== undefined);

      // Collect all card IDs to return to deck
      const cardsToReturn = [
        cardId,
        ...(ownedPage?.cardIds ?? []),
        ...secondaryNavGroups.flatMap(g => g.cardIds),
        ...secondaryNavCardPages.flatMap(g => g.cardIds),
      ];

      // Remove duplicates and filter out cards already unsorted
      const newUnsortedCardIds = [
        ...state.unsortedCardIds.filter(id => !cardsToReturn.includes(id)),
        ...cardsToReturn,
      ];

      // IDs of groups to remove (including secondary nav card pages)
      const groupIdsToRemove = new Set([
        ...(ownedPage ? [ownedPage.id] : []),
        ...secondaryNavIds,
        ...secondaryNavCardPages.map(g => g.id),
      ]);

      // Remove nav card from main-nav, remove deleted groups
      const groups = state.groups
        .filter(g => !groupIdsToRemove.has(g.id))
        .map(g => {
          if (g.prototypeRole === 'main-nav') {
            return { ...g, cardIds: g.cardIds.filter(id => id !== cardId) };
          }
          return g;
        });

      // Remove all connections involving deleted groups or the main-nav card's page
      const connections = state.connections.filter(
        c => !groupIdsToRemove.has(c.fromGroupId) && !groupIdsToRemove.has(c.toGroupId)
      );

      return {
        groups,
        connections,
        unsortedCardIds: newUnsortedCardIds,
        meta: {
          ...state.meta,
          updatedAt: new Date().toISOString(),
          version: state.meta.version + 1,
        },
      };
    });
  },

  dropCardToSecondaryNav: (cardId: string, secNavGroupId: string) => {
    const state = get();
    const secNavGroup = state.groups.find(g => g.id === secNavGroupId);
    if (!secNavGroup) return;

    const card = state.cards.find(c => c.id === cardId);
    if (!card) return;

    const newPageId = nanoid();
    const newPage: Group = {
      id: newPageId,
      label: `${card.label} Page`,
      cardIds: [],
      prototypeRole: 'page',
      order: state.groups.length,
      ownerCardId: cardId,
    };

    set((state) => {
      // Remove card from its current location
      const unsortedCardIds = state.unsortedCardIds.filter(id => id !== cardId);
      let groups = state.groups.map(group => ({
        ...group,
        cardIds: group.cardIds.filter(id => id !== cardId),
      }));

      // Add card to the secondary-nav group
      groups = groups.map(group => {
        if (group.id === secNavGroupId) {
          return { ...group, cardIds: [...group.cardIds, cardId] };
        }
        return group;
      });

      // Add the new page group
      groups = [...groups, newPage];

      // Add connection: secondary-nav → new page
      const connections = [
        ...state.connections,
        { fromGroupId: secNavGroupId, toGroupId: newPageId },
      ];

      return {
        unsortedCardIds,
        groups,
        connections,
        meta: {
          ...state.meta,
          updatedAt: new Date().toISOString(),
          version: state.meta.version + 1,
        },
      };
    });
  },

  removeCardFromSecondaryNav: (cardId: string) => {
    set((state) => {
      // Find the page owned by this card
      const ownedPage = state.groups.find(
        g => g.prototypeRole === 'page' && g.ownerCardId === cardId
      );

      // Find the secondary-nav group containing this card
      const secNavGroup = state.groups.find(
        g => g.prototypeRole === 'secondary-nav' && g.cardIds.includes(cardId)
      );

      // Collect all card IDs to return to deck
      const cardsToReturn = [
        cardId,
        ...(ownedPage?.cardIds ?? []),
      ];

      const newUnsortedCardIds = [
        ...state.unsortedCardIds.filter(id => !cardsToReturn.includes(id)),
        ...cardsToReturn,
      ];

      const groupIdsToRemove = new Set([
        ...(ownedPage ? [ownedPage.id] : []),
      ]);

      // Remove card from its secondary-nav group, remove owned page, remove connections
      const groups = state.groups
        .filter(g => !groupIdsToRemove.has(g.id))
        .map(g => {
          if (g.id === secNavGroup?.id) {
            return { ...g, cardIds: g.cardIds.filter(id => id !== cardId) };
          }
          return g;
        });

      const connections = state.connections.filter(
        c => !groupIdsToRemove.has(c.fromGroupId) && !groupIdsToRemove.has(c.toGroupId)
      );

      return {
        groups,
        connections,
        unsortedCardIds: newUnsortedCardIds,
        meta: {
          ...state.meta,
          updatedAt: new Date().toISOString(),
          version: state.meta.version + 1,
        },
      };
    });
  },

  promoteToSecondaryNav: (cardId: string, pageGroupId: string) => {
    // Card is already in the page. Move it into the page's secondary-nav group,
    // creating one if it doesn't exist yet.
    const state = get();

    // Find existing secondary-nav connected to this page
    const existingSecNavId = state.connections
      .find(c => c.fromGroupId === pageGroupId &&
        state.groups.find(g => g.id === c.toGroupId)?.prototypeRole === 'secondary-nav')
      ?.toGroupId ?? null;

    const newSecNavId = existingSecNavId ?? nanoid();
    const newGroups: Group[] = existingSecNavId ? [] : [{
      id: newSecNavId,
      label: 'Secondary Navigation',
      cardIds: [],
      prototypeRole: 'secondary-nav',
      order: state.groups.length,
    }];
    const newConnections = existingSecNavId ? [] : [
      { fromGroupId: pageGroupId, toGroupId: newSecNavId },
    ];

    set((state) => ({
      groups: [
        ...state.groups.map(g => {
          if (g.id === pageGroupId) {
            // Remove card from the page
            return { ...g, cardIds: g.cardIds.filter(id => id !== cardId) };
          }
          if (g.id === newSecNavId) {
            // Add card to existing secondary-nav
            return { ...g, cardIds: [...g.cardIds, cardId] };
          }
          return g;
        }),
        // Append new secondary-nav if created
        ...newGroups.map(g => g.id === newSecNavId ? { ...g, cardIds: [cardId] } : g),
      ],
      connections: [...state.connections, ...newConnections],
      meta: {
        ...state.meta,
        updatedAt: new Date().toISOString(),
        version: state.meta.version + 1,
      },
    }));
  },

  addSecondaryNavToPage: (pageGroupId: string) => {
    const state = get();
    const newSecNavId = nanoid();
    const newSecNav: Group = {
      id: newSecNavId,
      label: 'Secondary Navigation',
      cardIds: [],
      prototypeRole: 'secondary-nav',
      order: state.groups.length,
    };

    set((state) => ({
      groups: [...state.groups, newSecNav],
      connections: [
        ...state.connections,
        { fromGroupId: pageGroupId, toGroupId: newSecNavId },
      ],
      meta: {
        ...state.meta,
        updatedAt: new Date().toISOString(),
        version: state.meta.version + 1,
      },
    }));
  },

  // Connection actions (used internally; secondary nav still uses explicit connections)
  addConnection: (fromGroupId: string, toGroupId: string) => {
    const state = get();
    const fromGroup = state.groups.find(g => g.id === fromGroupId);
    const toGroup = state.groups.find(g => g.id === toGroupId);

    if (!fromGroup || !toGroup) return;

    const exists = state.connections.some(
      conn => conn.fromGroupId === fromGroupId && conn.toGroupId === toGroupId
    );
    if (exists) return;

    set((state) => ({
      connections: [
        ...state.connections,
        { fromGroupId, toGroupId },
      ],
      meta: {
        ...state.meta,
        updatedAt: new Date().toISOString(),
        version: state.meta.version + 1,
      },
    }));
  },

  removeConnection: (fromGroupId: string, toGroupId: string) => {
    set((state) => ({
      connections: state.connections.filter(
        conn => !(conn.fromGroupId === fromGroupId && conn.toGroupId === toGroupId)
      ),
      meta: {
        ...state.meta,
        updatedAt: new Date().toISOString(),
        version: state.meta.version + 1,
      },
    }));
  },

  getConnectionsForGroup: (groupId: string) => {
    const state = get();
    const outgoing = state.connections.filter(conn => conn.fromGroupId === groupId);
    const incoming = state.connections.filter(conn => conn.toGroupId === groupId);
    return { outgoing, incoming };
  },

  // UI state
  setPendingSecondaryNavPrompt: (prompt: PendingSecondaryNavPrompt | null) => {
    set({ pendingSecondaryNavPrompt: prompt });
  },

  setMainNavPosition: (position) => set({ mainNavPosition: position }),

  // Snapshot actions
  getSnapshot: () => {
    const state = get();
    return {
      meta: state.meta,
      cards: state.cards,
      groups: state.groups,
      connections: state.connections,
      unsortedCardIds: state.unsortedCardIds,
    };
  },

  loadSnapshot: (snapshot: ProjectState) => {
    // Reconcile: ensure every main-nav card has a corresponding page group
    const mainNavGroup = snapshot.groups.find(g => g.prototypeRole === 'main-nav');
    if (mainNavGroup) {
      const extraGroups: Group[] = [];
      const extraConnections: Connection[] = [];
      for (const cardId of mainNavGroup.cardIds) {
        const hasPage = snapshot.groups.some(g => g.prototypeRole === 'page' && g.ownerCardId === cardId);
        if (!hasPage) {
          const card = snapshot.cards.find(c => c.id === cardId);
          const newPageId = nanoid();
          extraGroups.push({
            id: newPageId,
            label: `${card?.label ?? 'Untitled'} Page`,
            cardIds: [],
            prototypeRole: 'page',
            order: snapshot.groups.length + extraGroups.length,
            ownerCardId: cardId,
          });
          extraConnections.push({ fromGroupId: mainNavGroup.id, toGroupId: newPageId });
        }
      }
      if (extraGroups.length > 0) {
        snapshot = {
          ...snapshot,
          groups: [...snapshot.groups, ...extraGroups],
          connections: [...snapshot.connections, ...extraConnections],
        };
      }
    }

    // Reconcile: move cards from orphaned groups back to unsorted
    {
      const mn = snapshot.groups.find(g => g.prototypeRole === 'main-nav');
      const ownedPageIds = new Set(
        (mn?.cardIds ?? [])
          .map(cardId => snapshot.groups.find(g => g.prototypeRole === 'page' && g.ownerCardId === cardId)?.id)
          .filter((id): id is string => id !== undefined)
      );
      const connectedSecNavIds = new Set(
        snapshot.connections
          .filter(c => ownedPageIds.has(c.fromGroupId))
          .map(c => c.toGroupId)
      );
      const orphanedGroups = snapshot.groups.filter(g =>
        g.prototypeRole !== 'main-nav' &&
        !ownedPageIds.has(g.id) &&
        !connectedSecNavIds.has(g.id) &&
        !(g.prototypeRole === 'page' && g.ownerCardId &&
          snapshot.groups.some(secNav =>
            secNav.prototypeRole === 'secondary-nav' && secNav.cardIds.includes(g.ownerCardId!)
          ))
      );
      if (orphanedGroups.length > 0) {
        const rescuedCardIds = orphanedGroups.flatMap(g => g.cardIds);
        const orphanedGroupIds = new Set(orphanedGroups.map(g => g.id));
        snapshot = {
          ...snapshot,
          groups: snapshot.groups.filter(g => !orphanedGroupIds.has(g.id)),
          connections: snapshot.connections.filter(
            c => !orphanedGroupIds.has(c.fromGroupId) && !orphanedGroupIds.has(c.toGroupId)
          ),
          unsortedCardIds: [...snapshot.unsortedCardIds, ...rescuedCardIds],
        };
      }
    }

    set({
      ...snapshot,
      pendingSecondaryNavPrompt: null,
    });
  },

  setTitle: (title: string) => {
    set((state) => ({
      meta: {
        ...state.meta,
        title: title.trim() || 'Untitled project',
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  resetProject: () => {
    set((state) => ({
      unsortedCardIds: state.cards.map((c) => c.id),
      groups: [
        {
          id: nanoid(),
          label: 'Main Navigation',
          cardIds: [],
          prototypeRole: 'main-nav' as const,
          order: 0,
        },
      ],
      connections: [],
      pendingSecondaryNavPrompt: null,
      meta: {
        ...state.meta,
        updatedAt: new Date().toISOString(),
        version: state.meta.version + 1,
      },
    }));
  },
}));
