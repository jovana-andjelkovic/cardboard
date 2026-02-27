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

  const secondaryNavCards = secondaryNavGroup.cardIds
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  return (
    <div className="wf-sidebar">
      {secondaryNavCards.map((card) => (
        <div
          key={card.id}
          className={`wf-sidebar-link ${
            activeSecondaryLinkId === card.id ? 'wf-sidebar-link--active' : ''
          }`}
          onClick={() => onSecondaryLinkClick(card.id)}
        >
          {card.label}
        </div>
      ))}
    </div>
  );
};
