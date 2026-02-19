import './wireframe.css';
import { useProjectStore } from '../../store/projectStore';

interface WireframeTopNavProps {
  activeMainNavCardId: string | null;
  onMainNavClick: (cardId: string, index: number) => void;
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

  const mainNavCards = mainNavGroup
    ? mainNavGroup.cardIds
        .map((id) => cards.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => c !== undefined)
    : [];

  return (
    <div className="wf-topnav">
      <div className="wf-topnav-title">{meta.title}</div>
      <div className="wf-topnav-links">
        {mainNavCards.map((card, index) => (
          <div
            key={card.id}
            className={`wf-topnav-link ${
              activeMainNavCardId === card.id ? 'wf-topnav-link--active' : ''
            }`}
            onClick={() => onMainNavClick(card.id, index)}
          >
            {card.label}
          </div>
        ))}
      </div>
    </div>
  );
};
