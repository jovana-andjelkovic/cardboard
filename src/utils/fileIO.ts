import type { ProjectState } from '../store/types';

/**
 * Exports all cards to a downloadable .md file in heading format
 */
export const exportCardsToMarkdown = (state: ProjectState): void => {
  const lines: string[] = [`# ${state.meta.title}`, ''];

  for (const card of state.cards) {
    lines.push(`## ${card.label}`);
    if (card.description) {
      lines.push(card.description);
    }
    lines.push('');
  }

  const markdown = lines.join('\n');
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${state.meta.title || 'cards'}-cards-${Date.now()}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Exports the project state to a downloadable JSON file
 */
export const exportToFile = (state: ProjectState): void => {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${state.meta.title || 'project'}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Imports project state from an uploaded JSON file
 */
export const importFromFile = (file: File): Promise<ProjectState> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const state = JSON.parse(json) as ProjectState;
        resolve(state);
      } catch (error) {
        reject(new Error('Failed to parse JSON file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};
