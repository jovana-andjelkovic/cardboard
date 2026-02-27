export type ParsedCard = {
  label: string;
  description?: string;
};

export function parseMarkdownCards(markdown: string): ParsedCard[] {
  try {
    const normalized = markdown.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');

    const hasHeadings = lines.some((l) => /^## /.test(l));
    const hasList = lines.some((l) => /^- /.test(l));

    if (hasHeadings) {
      return parseHeadingFormat(lines);
    } else if (hasList) {
      return parseListFormat(lines);
    }

    return [];
  } catch {
    return [];
  }
}

function parseHeadingFormat(lines: string[]): ParsedCard[] {
  const cards: ParsedCard[] = [];
  let currentLabel: string | null = null;
  let descriptionLines: string[] = [];

  const flush = () => {
    if (currentLabel === null) return;
    const label = currentLabel.trim();
    if (!label) return;
    const description = descriptionLines.join(' ').trim();
    cards.push(description ? { label, description } : { label });
  };

  for (const line of lines) {
    const headingMatch = line.match(/^## (.+)/);
    if (headingMatch) {
      flush();
      currentLabel = headingMatch[1];
      descriptionLines = [];
    } else if (currentLabel !== null && line.trim()) {
      descriptionLines.push(line.trim());
    }
  }

  flush();
  return cards;
}

function parseListFormat(lines: string[]): ParsedCard[] {
  const cards: ParsedCard[] = [];

  for (const line of lines) {
    if (!line.startsWith('- ')) continue;
    const content = line.slice(2);
    const colonIdx = content.indexOf(': ');

    if (colonIdx !== -1) {
      const label = content.slice(0, colonIdx).trim();
      const description = content.slice(colonIdx + 2).trim();
      if (!label) continue;
      cards.push(description ? { label, description } : { label });
    } else {
      const label = content.trim();
      if (!label) continue;
      cards.push({ label });
    }
  }

  return cards;
}
