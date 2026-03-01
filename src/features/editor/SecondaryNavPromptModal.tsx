import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useProjectStore } from '../../store/projectStore';

const GAP = 8;
const POPOVER_WIDTH = 256;

export const SecondaryNavPromptModal = () => {
  const prompt = useProjectStore((state) => state.pendingSecondaryNavPrompt);
  const setPendingSecondaryNavPrompt = useProjectStore((state) => state.setPendingSecondaryNavPrompt);
  const promoteToSecondaryNav = useProjectStore((state) => state.promoteToSecondaryNav);
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });

  useLayoutEffect(() => {
    if (!prompt) return;
    const cardEl = document.querySelector(`[data-card-id="${prompt.cardId}"]`);
    if (!cardEl) return;

    const rect = cardEl.getBoundingClientRect();

    // Prefer right of card; fall back to left if not enough room
    let left = rect.right + GAP;
    if (left + POPOVER_WIDTH > window.innerWidth - GAP) {
      left = rect.left - POPOVER_WIDTH - GAP;
    }

    // Vertically align with card top, clamp to viewport
    let top = rect.top;
    const estimatedHeight = 90;
    if (top + estimatedHeight > window.innerHeight - GAP) {
      top = window.innerHeight - estimatedHeight - GAP;
    }

    setStyle({ position: 'fixed', top, left, width: POPOVER_WIDTH, visibility: 'visible' });
  }, [prompt]);

  useEffect(() => {
    if (!prompt) return;
    const timer = setTimeout(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          setPendingSecondaryNavPrompt(null);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => clearTimeout(timer);
  }, [prompt, setPendingSecondaryNavPrompt]);

  if (!prompt) return null;

  const handleSecondaryNav = () => {
    promoteToSecondaryNav(prompt.cardId, prompt.targetPageGroupId);
    setPendingSecondaryNavPrompt(null);
  };

  return createPortal(
    <div
      ref={ref}
      style={style}
      className="z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4"
    >
      <p className="text-sm text-gray-700 mb-3">
        Should <span className="font-medium">"{prompt.cardLabel}"</span> be secondary nav instead?
      </p>
      <div className="flex justify-end">
        <button
          onClick={handleSecondaryNav}
          className="btn-cta px-3 py-1.5 text-xs font-medium rounded"
        >
          Move to secondary nav
        </button>
      </div>
    </div>,
    document.body
  );
};
