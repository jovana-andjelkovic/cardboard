import './wireframe.css';
import { useProjectStore } from '../../store/projectStore';
import { WireframeBlock } from './WireframeBlock';
import { WireframeEmptyState } from './WireframeEmptyState';
import type { Group } from '../../store/types';

interface WireframeContentAreaProps {
  activePage: Group | null;
}

export const WireframeContentArea = ({ activePage }: WireframeContentAreaProps) => {
  const cards = useProjectStore((state) => state.cards);

  if (!activePage) {
    return <WireframeEmptyState type="no-page-connected" />;
  }

  const pageCards = activePage.cardIds
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  return (
    <div className="wf-content">
      <div className="wf-page-title">{activePage.label}</div>
      {pageCards.length > 0 ? (
        pageCards.map((card) => <WireframeBlock key={card.id} card={card} />)
      ) : (
        <WireframeEmptyState type="empty-page" />
      )}
    </div>
  );
};
