import './wireframe.css';
import type { CardDefinition } from '../../store/types';

interface WireframeBlockProps {
  card: CardDefinition;
}

export const WireframeBlock = ({ card }: WireframeBlockProps) => {
  return (
    <div className="wf-block">
      <div className="wf-block-title">{card.label}</div>
      {card.description && (
        <div className="wf-block-description">{card.description}</div>
      )}
      <div className="wf-placeholder-lines">
        <div className="wf-placeholder-line wf-placeholder-line--full"></div>
        <div className="wf-placeholder-line wf-placeholder-line--85"></div>
        <div className="wf-placeholder-line wf-placeholder-line--92"></div>
        <div className="wf-placeholder-line wf-placeholder-line--60"></div>
      </div>
    </div>
  );
};
