import { useProjectStore } from '../../store/projectStore';
import { GroupZone } from './GroupZone';


export const GroupsList = () => {
  const groups = useProjectStore((state) => state.groups);
  const connections = useProjectStore((state) => state.connections);
  const mainNavPosition = useProjectStore((state) => state.mainNavPosition);
  const setMainNavPosition = useProjectStore((state) => state.setMainNavPosition);

  const mainNavGroup = groups.find(g => g.prototypeRole === 'main-nav');

  if (!mainNavGroup) {
    return (
      <div className="text-sm text-gray-500 text-center py-8">
        No main navigation group found.
      </div>
    );
  }

  return (
    <div>
      {/* Paired layout: nav on left, pages on right */}
      <div className="flex gap-0 items-start">
        {/* Left column: main-nav group */}
        <div className="w-56 flex-shrink-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Main Nav
            </div>
            <div className="flex border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => setMainNavPosition('top')}
                className={`px-2 py-0.5 text-xs transition-colors ${
                  mainNavPosition === 'top'
                    ? 'bg-gray-600 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
                title="Top navigation"
              >
                Top
              </button>
              <button
                onClick={() => setMainNavPosition('left')}
                className={`px-2 py-0.5 text-xs transition-colors ${
                  mainNavPosition === 'left'
                    ? 'bg-gray-600 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
                title="Left navigation"
              >
                Left
              </button>
            </div>
          </div>
          <GroupZone group={mainNavGroup} />
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center self-stretch pt-8 px-3">
          <div className="w-px flex-1 bg-gray-200" />
        </div>

        {/* Right column: pages paired with their nav cards */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Pages
          </div>

          {mainNavGroup.cardIds.length === 0 ? (
            <div className="text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              Drag cards from the deck into Main Nav to create pages
            </div>
          ) : (
            <div className="space-y-4">
              {mainNavGroup.cardIds.map((navCardId) => {
                // Find the page owned by this nav card
                const ownedPage = groups.find(
                  g => g.prototypeRole === 'page' && g.ownerCardId === navCardId
                );

                // Find secondary-nav groups connected from the owned page
                const secondaryNavGroups = ownedPage
                  ? groups.filter(g =>
                      g.prototypeRole === 'secondary-nav' &&
                      connections.some(c => c.fromGroupId === ownedPage.id && c.toGroupId === g.id)
                    )
                  : [];

                return (
                  <div key={navCardId}>
                    {ownedPage ? (
                      <div>
                        <GroupZone group={ownedPage} />
                        {/* Secondary nav groups indented below the page */}
                        {secondaryNavGroups.length > 0 && (
                          <div className="mt-2 ml-6 space-y-2">
                            {secondaryNavGroups.map(secNav => {
                              // Find pages owned by cards in this secondary nav
                              const secNavCardPages = secNav.cardIds
                                .map(cid => groups.find(g => g.prototypeRole === 'page' && g.ownerCardId === cid))
                                .filter((g): g is typeof groups[0] => g !== undefined);

                              return (
                                <div key={secNav.id} className="relative">
                                  {/* Indent connector */}
                                  <div className="absolute -left-3 top-4 w-3 h-px bg-gray-300" />
                                  <GroupZone group={secNav} />
                                  {secNavCardPages.length > 0 && (
                                    <div className="mt-2 ml-6 space-y-2">
                                      {secNavCardPages.map(page => (
                                        <div key={page.id} className="relative">
                                          <div className="absolute -left-3 top-4 w-3 h-px bg-gray-300" />
                                          <GroupZone group={page} />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Orphaned nav card (no page yet — shouldn't happen with new system, but guard)
                      <div className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg p-4">
                        No page for this nav item yet
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Orphaned pages and secondary-nav groups (not owned by any main-nav card) */}
          {(() => {
            const ownedPageIds = new Set(
              mainNavGroup.cardIds
                .map(cardId => groups.find(g => g.prototypeRole === 'page' && g.ownerCardId === cardId)?.id)
                .filter((id): id is string => id !== undefined)
            );

            const connectedSecNavIds = new Set(
              connections
                .filter(c => ownedPageIds.has(c.fromGroupId))
                .map(c => c.toGroupId)
            );

            const orphanedGroups = groups.filter(g =>
              g.prototypeRole !== 'main-nav' &&
              !ownedPageIds.has(g.id) &&
              !connectedSecNavIds.has(g.id) &&
              // Exclude pages owned by cards in any secondary-nav group
              !(g.prototypeRole === 'page' && g.ownerCardId &&
                groups.some(secNav =>
                  secNav.prototypeRole === 'secondary-nav' && secNav.cardIds.includes(g.ownerCardId!)
                ))
            );

            if (orphanedGroups.length === 0) return null;

            return (
              <div className="mt-6">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                  Other groups
                </div>
                <div className="space-y-4">
                  {orphanedGroups.map(group => (
                    <GroupZone key={group.id} group={group} />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
