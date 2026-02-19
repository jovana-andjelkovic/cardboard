import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { ProjectState, CardDefinition, Group, PrototypeRole, Connection } from './types';

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
  getConnectionsForGroup: (groupId: string) => { outgoing: Connection[], incoming: Connection[] };

  // Connection mode actions
  setConnectionMode: (on: boolean) => void;
  setSelectedSource: (groupId: string | null) => void;

  // Snapshot actions
  getSnapshot: () => ProjectState;
  loadSnapshot: (state: ProjectState) => void;
}

interface UIState {
  isConnectionMode: boolean;
  selectedSourceGroupId: string | null;
}

type ProjectStore = ProjectState & ProjectActions & UIState;

// Helper function to create initial state
const createInitialState = (): ProjectState => {
  const mainNavGroupId = nanoid();
  const pageGroupId = nanoid();

  // Sample cards for a project management app
  const sampleCards: CardDefinition[] = [
    { id: nanoid(), label: 'Dashboard', description: 'Overview of all projects and tasks' },
    { id: nanoid(), label: 'My Tasks', description: 'Personal task list' },
    { id: nanoid(), label: 'Team Members', description: 'View and manage team' },
    { id: nanoid(), label: 'Project Settings', description: 'Configure project preferences' },
    { id: nanoid(), label: 'Calendar', description: 'Schedule and deadlines' },
    { id: nanoid(), label: 'Notifications', description: 'Activity alerts' },
    { id: nanoid(), label: 'Reports', description: 'Analytics and insights' },
    { id: nanoid(), label: 'Billing', description: 'Payment and invoices' },
    { id: nanoid(), label: 'Profile Settings', description: 'User preferences' },
    { id: nanoid(), label: 'Activity Feed', description: 'Recent updates' },
    { id: nanoid(), label: 'File Storage', description: 'Document repository' },
    { id: nanoid(), label: 'Integrations', description: 'Third-party apps' },
    { id: nanoid(), label: 'Help Center', description: 'Documentation and support' },
    { id: nanoid(), label: 'Search', description: 'Find anything' },
    { id: nanoid(), label: 'Time Tracking', description: 'Log hours worked' },
  ];

  const projectsPageId = nanoid();
  const settingsPageId = nanoid();

  return {
    meta: {
      id: nanoid(),
      title: 'Project Management App',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    },
    cards: sampleCards,
    groups: [
      {
        id: mainNavGroupId,
        label: 'Main Navigation',
        cardIds: [],
        prototypeRole: 'main-nav',
        order: 0,
      },
      {
        id: pageGroupId,
        label: 'Dashboard Page',
        cardIds: [],
        prototypeRole: 'page',
        order: 1,
      },
      {
        id: projectsPageId,
        label: 'Projects Page',
        cardIds: [],
        prototypeRole: 'page',
        order: 2,
      },
      {
        id: settingsPageId,
        label: 'Settings Page',
        cardIds: [],
        prototypeRole: 'page',
        order: 3,
      },
    ],
    connections: [
      // Sample connections to demonstrate the feature
      { fromGroupId: mainNavGroupId, toGroupId: pageGroupId },
      { fromGroupId: mainNavGroupId, toGroupId: projectsPageId },
    ],
    unsortedCardIds: sampleCards.map(card => card.id),
  };
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  ...createInitialState(),

  // UI State
  isConnectionMode: false,
  selectedSourceGroupId: null,

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

  getConnectionsForGroup: (groupId: string) => {
    const state = get();
    const outgoing = state.connections.filter(conn => conn.fromGroupId === groupId);
    const incoming = state.connections.filter(conn => conn.toGroupId === groupId);
    return { outgoing, incoming };
  },

  // Connection mode actions
  setConnectionMode: (on: boolean) => {
    set({
      isConnectionMode: on,
      selectedSourceGroupId: on ? null : null, // Clear selection when toggling mode
    });
  },

  setSelectedSource: (groupId: string | null) => {
    set({ selectedSourceGroupId: groupId });
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
    set({
      ...snapshot,
      // Preserve UI state when loading snapshot
      isConnectionMode: false,
      selectedSourceGroupId: null,
    });
  },
}));
