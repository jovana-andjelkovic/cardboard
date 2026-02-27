import { useProjectStore } from '../../store/projectStore';

export const SecondaryNavPromptModal = () => {
  const prompt = useProjectStore((state) => state.pendingSecondaryNavPrompt);
  const setPendingSecondaryNavPrompt = useProjectStore((state) => state.setPendingSecondaryNavPrompt);
  const promoteToSecondaryNav = useProjectStore((state) => state.promoteToSecondaryNav);

  if (!prompt) return null;

  const handleSecondaryNav = () => {
    promoteToSecondaryNav(prompt.cardId, prompt.targetPageGroupId);
    setPendingSecondaryNavPrompt(null);
  };

  const handleContentBlock = () => {
    // Card is already placed in the page — just dismiss
    setPendingSecondaryNavPrompt(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={handleContentBlock}
      />

      {/* Modal */}
      <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Create secondary navigation?
        </h3>
        <p className="text-sm text-gray-600 mb-5">
          <span className="font-medium">"{prompt.cardLabel}"</span> is a main nav item. Should it
          become a secondary navigation section on this page, or stay as a regular content block?
        </p>

        <div className="flex gap-2 justify-end">
          <button
            onClick={handleContentBlock}
            className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Content block
          </button>
          <button
            onClick={handleSecondaryNav}
            className="px-4 py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Secondary nav
          </button>
        </div>
      </div>
    </div>
  );
};
