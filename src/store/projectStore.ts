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

  // Nav section actions (sections within main-nav)
  addNavSection: (groupId: string, label: string) => void;
  removeNavSection: (groupId: string, sectionId: string) => void;
  assignCardToNavSection: (groupId: string, cardId: string, sectionId: string | null) => void;
  addCardToNavSection: (groupId: string, sectionId: string | null, label: string, description?: string) => void;

  // Connection actions (still used internally + for secondary nav)
  addConnection: (fromGroupId: string, toGroupId: string) => void;
  removeConnection: (fromGroupId: string, toGroupId: string) => void;
  getConnectionsForGroup: (groupId: string) => { outgoing: Connection[], incoming: Connection[] };

  // UI state
  setPendingSecondaryNavPrompt: (prompt: PendingSecondaryNavPrompt | null) => void;
  setMainNavPosition: (position: 'top' | 'left') => void;

  // Bulk edit action
  reconcileCards: (newCardList: Array<{ label: string; description?: string }>) => void;

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

  // Task manager card set — all start unsorted
  const cards: CardDefinition[] = [
    { id: nanoid(), label: 'Dashboard', description: 'Overview of tasks and activity' },
    { id: nanoid(), label: 'My Tasks', description: 'Tasks assigned to you' },
    { id: nanoid(), label: 'Team Tasks', description: 'Tasks across the whole team' },
    { id: nanoid(), label: 'Completed', description: 'Finished and closed tasks' },
    { id: nanoid(), label: 'Inbox', description: 'New assignments and mentions' },
    { id: nanoid(), label: 'Calendar', description: 'Deadlines and scheduled work' },
    { id: nanoid(), label: 'Reports', description: 'Progress and performance insights' },
    { id: nanoid(), label: 'Notifications', description: 'Activity alerts and updates' },
    { id: nanoid(), label: 'Team Members', description: 'Manage people and roles' },
    { id: nanoid(), label: 'Attachments', description: 'Files linked to tasks' },
    { id: nanoid(), label: 'Archive', description: 'Older completed work' },
    { id: nanoid(), label: 'Settings', description: 'Preferences and configuration' },
    { id: nanoid(), label: 'Help', description: 'Documentation and support' },
  ];

  return {
    meta: {
      id: nanoid(),
      title: 'Untitled project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    },
    cards,
    groups: [
      {
        id: mainNavGroupId,
        label: 'Main Navigation',
        cardIds: [],
        prototypeRole: 'main-nav',
        order: 0,
      },
    ],
    connections: [],
    unsortedCardIds: cards.map(c => c.id),
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
          // Re-derive section.cardIds order from new group.cardIds order
          const newNavSections = group.navSections?.map(section => ({
            ...section,
            cardIds: newCardIds.filter(id => section.cardIds.includes(id)),
          }));
          return { ...group, cardIds: newCardIds, navSections: newNavSections };
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

      // Add card to the target main-nav group
      groups = groups.map(group => {
        if (group.id === mainNavGroup.id) {
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
            return {
              ...g,
              cardIds: g.cardIds.filter(id => id !== cardId),
              navSections: g.navSections?.map(s => ({
                ...s,
                cardIds: s.cardIds.filter(id => id !== cardId),
              })),
            };
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

    // Block if this secondary-nav belongs to the page owned by the card being dropped
    const ownedPage = state.groups.find(g => g.ownerCardId === cardId);
    if (ownedPage && state.connections.some(c => c.fromGroupId === ownedPage.id && c.toGroupId === secNavGroupId)) return;

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
            return {
              ...g,
              cardIds: g.cardIds.filter(id => id !== cardId),
              navSections: g.navSections?.map(s => ({
                ...s,
                cardIds: s.cardIds.filter(id => id !== cardId),
              })),
            };
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
    // Bail if this page already has a secondary-nav connected to it
    const alreadyHasSecNav = state.connections.some(c =>
      c.fromGroupId === pageGroupId &&
      state.groups.find(g => g.id === c.toGroupId)?.prototypeRole === 'secondary-nav'
    );
    if (alreadyHasSecNav) return;
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

  addNavSection: (groupId: string, label: string) => {
    set((state) => ({
      groups: state.groups.map(g =>
        g.id === groupId
          ? { ...g, navSections: [...(g.navSections ?? []), { id: nanoid(), label, cardIds: [] }] }
          : g
      ),
      meta: {
        ...state.meta,
        updatedAt: new Date().toISOString(),
        version: state.meta.version + 1,
      },
    }));
  },

  removeNavSection: (groupId: string, sectionId: string) => {
    set((state) => {
      const group = state.groups.find(g => g.id === groupId);
      if (!group) return state;

      // Cards in deleted section stay in group.cardIds (become unsectioned)
      const newNavSections = (group.navSections ?? []).filter(s => s.id !== sectionId);

      // Rebuild group.cardIds: unsectioned first, then remaining sections
      const remainingSectionCardIds = new Set(newNavSections.flatMap(s => s.cardIds));
      const unsectionedIds = group.cardIds.filter(id => !remainingSectionCardIds.has(id));
      const newGroupCardIds = [
        ...unsectionedIds,
        ...newNavSections.flatMap(s => s.cardIds),
      ];

      return {
        groups: state.groups.map(g =>
          g.id === groupId
            ? { ...g, cardIds: newGroupCardIds, navSections: newNavSections }
            : g
        ),
        meta: {
          ...state.meta,
          updatedAt: new Date().toISOString(),
          version: state.meta.version + 1,
        },
      };
    });
  },

  assignCardToNavSection: (groupId: string, cardId: string, sectionId: string | null) => {
    set((state) => {
      const group = state.groups.find(g => g.id === groupId);
      if (!group) return state;

      // Remove card from all sections
      const newNavSections = (group.navSections ?? []).map(s => ({
        ...s,
        cardIds: s.cardIds.filter(id => id !== cardId),
      }));

      // Add to target section if provided
      if (sectionId) {
        const targetIdx = newNavSections.findIndex(s => s.id === sectionId);
        if (targetIdx >= 0) {
          newNavSections[targetIdx] = {
            ...newNavSections[targetIdx],
            cardIds: [...newNavSections[targetIdx].cardIds, cardId],
          };
        }
      }

      // Rebuild group.cardIds: unsectioned first, then sections in order
      const inSectionIds = new Set(newNavSections.flatMap(s => s.cardIds));
      const unsectionedIds = group.cardIds.filter(id => !inSectionIds.has(id));
      const newGroupCardIds = [
        ...unsectionedIds,
        ...newNavSections.flatMap(s => s.cardIds),
      ];

      return {
        groups: state.groups.map(g =>
          g.id === groupId
            ? { ...g, cardIds: newGroupCardIds, navSections: newNavSections }
            : g
        ),
        meta: {
          ...state.meta,
          updatedAt: new Date().toISOString(),
          version: state.meta.version + 1,
        },
      };
    });
  },

  addCardToNavSection: (groupId: string, sectionId: string | null, label: string, description?: string) => {
    const state = get();
    const mainNavGroup = state.groups.find(g => g.id === groupId && g.prototypeRole === 'main-nav');
    if (!mainNavGroup) return;

    const newCardId = nanoid();
    const newCard: CardDefinition = { id: newCardId, label, ...(description ? { description } : {}) };

    const newPageId = nanoid();
    const newPage: Group = {
      id: newPageId,
      label: `${label} Page`,
      cardIds: [],
      prototypeRole: 'page',
      order: state.groups.length,
      ownerCardId: newCardId,
    };

    // Add to target section's cardIds if provided
    const newNavSections = sectionId
      ? (mainNavGroup.navSections ?? []).map(s =>
          s.id === sectionId ? { ...s, cardIds: [...s.cardIds, newCardId] } : s
        )
      : mainNavGroup.navSections;

    // Rebuild group.cardIds: unsectioned first, then sections in order
    const inSectionIds = new Set((newNavSections ?? []).flatMap(s => s.cardIds));
    const existingUnsectioned = mainNavGroup.cardIds.filter(id => !inSectionIds.has(id));
    const newGroupCardIds = sectionId
      ? [...existingUnsectioned, ...(newNavSections ?? []).flatMap(s => s.cardIds)]
      : [...existingUnsectioned, newCardId, ...(newNavSections ?? []).flatMap(s => s.cardIds)];

    set((state) => ({
      cards: [...state.cards, newCard],
      groups: [
        ...state.groups.map(g =>
          g.id === groupId
            ? { ...g, cardIds: newGroupCardIds, navSections: newNavSections }
            : g
        ),
        newPage,
      ],
      connections: [
        ...state.connections,
        { fromGroupId: groupId, toGroupId: newPageId },
      ],
      meta: {
        ...state.meta,
        updatedAt: new Date().toISOString(),
        version: state.meta.version + 1,
      },
    }));
  },

  reconcileCards: (newCardList) => {
    const state = get();

    // Update existing cards by position (preserves ID → group placement stays intact)
    const matchCount = Math.min(newCardList.length, state.cards.length);
    for (let i = 0; i < matchCount; i++) {
      const nc = newCardList[i];
      const existing = state.cards[i];
      get().updateCard(existing.id, { label: nc.label, description: nc.description });
    }

    // Add any extra cards beyond the existing count → unsorted
    const toAdd = newCardList.slice(state.cards.length);
    if (toAdd.length > 0) get().bulkAddCards(toAdd);
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
