import './wireframe.css';

export type EmptyStateType =
  | 'no-cards-sorted'
  | 'no-connections'
  | 'no-page-connected'
  | 'empty-page';

interface WireframeEmptyStateProps {
  type: EmptyStateType;
}

const messages = {
  'no-cards-sorted': {
    title: 'No cards sorted yet',
    message: 'Sort cards into groups in the editor to see your prototype',
  },
  'no-connections': {
    title: 'No connections created',
    message: 'Create connections between nav groups and pages to enable navigation',
  },
  'no-page-connected': {
    title: 'No page connected',
    message: 'This nav item has no connected page. Use connection mode in the editor to link it.',
  },
  'empty-page': {
    title: 'Empty page',
    message: 'Add cards to this page group in the editor to see content here.',
  },
};

export const WireframeEmptyState = ({ type }: WireframeEmptyStateProps) => {
  const { title, message } = messages[type];

  return (
    <div className="wf-empty">
      <div className="wf-empty-title">{title}</div>
      <div className="wf-empty-message">{message}</div>
    </div>
  );
};
