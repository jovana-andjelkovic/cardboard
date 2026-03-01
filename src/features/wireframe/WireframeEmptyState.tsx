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

const steps = [
  {
    number: '1',
    heading: 'Add your cards',
    detail: 'Use "+ Add Card" in the deck to create cards, or import a Markdown list.',
  },
  {
    number: '2',
    heading: 'Build your navigation',
    detail: 'Drag cards into the Main Nav group. Each card becomes a top-level nav item and gets its own page.',
  },
  {
    number: '3',
    heading: 'Fill your pages',
    detail: 'Drop cards into page groups to add content blocks. Cards represent sections, features, or components.',
  },
  {
    number: '4',
    heading: 'Preview here',
    detail: 'This panel updates live. Click nav items to navigate between pages.',
  },
];

export const WireframeEmptyState = ({ type }: WireframeEmptyStateProps) => {
  if (type === 'no-cards-sorted') {
    return (
      <div className="wf-empty">
        <div className="wf-empty-title">Your wireframe will appear here</div>
        <div className="wf-empty-message">Follow these steps in the editor on the left:</div>
        <ol className="wf-steps">
          {steps.map((step) => (
            <li key={step.number} className="wf-step">
              <span className="wf-step-number">{step.number}</span>
              <div>
                <div className="wf-step-heading">{step.heading}</div>
                <div className="wf-step-detail">{step.detail}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const { title, message } = messages[type];

  return (
    <div className="wf-empty">
      <div className="wf-empty-title">{title}</div>
      <div className="wf-empty-message">{message}</div>
    </div>
  );
};
