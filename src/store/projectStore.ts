import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { ProjectState, CardDefinition, Group, PrototypeRole } from './types';

interface ProjectActions {
  // Card actions
  addCard: (label: string, description?: string) => void;
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

  // Connection actions
  addConnection: (fromGroupId: string, toGroupId: string) => void;
  removeConnection: (fromGroupId: string, toGroupId: string) => void;

  // Snapshot actions
  getSnapshot: () => ProjectState;
  loadSnapshot: (state: ProjectState) => void;
}

type ProjectStore = ProjectState & ProjectActions;

// Helper function to create initial state
const createInitialState = (): ProjectState => {
  const mainNavGroupId = nanoid();

  return {
    meta: {
      id: nanoid(),
      title: 'Untitled Project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    },
    cards: [],
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
    unsortedCardIds: [],
  };
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  ...createInitialState(),

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

  removeCard: (cardId: string) => {
    set((state) => {
      // Remove from cards array
      const cards = state.cards.filter(card => card.id !== cardId);

      // Remove from unsorted
      const unsortedCardIds = state.unsortedCardIds.filter(id => id !== cardId);

      // Remove from groups
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
    // Reject if trying to add another main-nav
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

    // Cannot delete main-nav
    if (group?.prototypeRole === 'main-nav') {
      console.warn('Cannot delete main-nav group.');
      return;
    }

    set((state) => {
      const group = state.groups.find(g => g.id === groupId);
      if (!group) return state;

      // Return cards to unsorted deck
      const unsortedCardIds = [...state.unsortedCardIds, ...group.cardIds];

      // Remove group
      const groups = state.groups.filter(g => g.id !== groupId);

      // Remove connections involving this group
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
      // Remove card from current location (unsorted or another group)
      let unsortedCardIds = state.unsortedCardIds.filter(id => id !== cardId);
      let groups = state.groups.map(group => ({
        ...group,
        cardIds: group.cardIds.filter(id => id !== cardId),
      }));

      // Insert into target group at specified index
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
      // Remove from all groups
      const groups = state.groups.map(group => ({
        ...group,
        cardIds: group.cardIds.filter(id => id !== cardId),
      }));

      // Add to unsorted if not already there
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

  // Connection actions
  addConnection: (fromGroupId: string, toGroupId: string) => {
    const state = get();
    const fromGroup = state.groups.find(g => g.id === fromGroupId);
    const toGroup = state.groups.find(g => g.id === toGroupId);

    // Validate: from must be nav, to must be page/secondary-nav
    if (!fromGroup || !toGroup) {
      console.warn('Invalid group IDs for connection.');
      return;
    }

    if (fromGroup.prototypeRole !== 'main-nav' && fromGroup.prototypeRole !== 'secondary-nav') {
      console.warn('Connection source must be a nav group.');
      return;
    }

    if (toGroup.prototypeRole !== 'page' && toGroup.prototypeRole !== 'secondary-nav') {
      console.warn('Connection target must be a page or secondary-nav group.');
      return;
    }

    // Check if connection already exists
    const exists = state.connections.some(
      conn => conn.fromGroupId === fromGroupId && conn.toGroupId === toGroupId
    );

    if (exists) {
      console.warn('Connection already exists.');
      return;
    }

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
    set(snapshot);
  },
}));
