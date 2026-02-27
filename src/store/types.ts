// === Core Types ===

export type PrototypeRole = 'main-nav' | 'secondary-nav' | 'page';

// v2 — not implemented yet, but design the CardDefinition type to accommodate this later
export type CardDataType =
  | 'link'           // auto-assigned when card is in a nav group
  | 'content-block'  // auto-assigned when card is in a page group
  // v2 types (future):
  // | 'table' | 'chart' | 'form' | 'list' | 'hero' | 'media'
  ;

export type CardDefinition = {
  id: string;
  label: string;
  description?: string;
  // dataType is DERIVED from placement, not manually set (in v1)
  // v2 will allow manual override
};

export type Group = {
  id: string;
  label: string;
  cardIds: string[];           // ordered list of card IDs in this group
  prototypeRole: PrototypeRole;
  order: number;               // position in the wireframe
  linkedFrom?: string;         // DEPRECATED — kept for JSON import compatibility, do not write
  // The card ID that "owns" this group:
  // - For 'page' groups: the main-nav card that auto-created this page
  // - For 'secondary-nav' groups: the card that triggered secondary nav creation
  //   (undefined if secondary-nav was added manually via the button)
  ownerCardId?: string;
};

export type PendingSecondaryNavPrompt = {
  cardId: string;            // The main-nav card that was dragged into a page
  targetPageGroupId: string; // The page group it was dropped into
  cardLabel: string;         // For display in the modal
};

export type Connection = {
  fromGroupId: string;   // always a nav group
  toGroupId: string;     // a page or secondary-nav group
};

export type ProjectState = {
  meta: {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    version: number;       // increments on meaningful changes
  };
  cards: CardDefinition[];
  groups: Group[];
  connections: Connection[];
  unsortedCardIds: string[];  // cards not yet placed in any group
};
