import { useProjectStore } from '../../store/projectStore';

export const ConnectionPanel = () => {
  const groups = useProjectStore((state) => state.groups);
  const connections = useProjectStore((state) => state.connections);
  const removeConnection = useProjectStore((state) => state.removeConnection);

  if (connections.length === 0) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Connections</h3>
        <p className="text-xs text-gray-500">
          No connections yet. Enter connection mode to link navigation to pages.
        </p>
      </div>
    );
  }

  // Group connections by source
  const connectionsBySource = connections.reduce((acc, conn) => {
    const sourceId = conn.fromGroupId;
    if (!acc[sourceId]) {
      acc[sourceId] = [];
    }
    acc[sourceId].push(conn);
    return acc;
  }, {} as Record<string, typeof connections>);

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Connections ({connections.length})
      </h3>
      <div className="space-y-3">
        {Object.entries(connectionsBySource).map(([sourceId, conns]) => {
          const sourceGroup = groups.find((g) => g.id === sourceId);
          if (!sourceGroup) return null;

          return (
            <div key={sourceId} className="pb-3 border-b border-gray-200 last:border-b-0 last:pb-0">
              <div className="text-xs font-medium text-gray-600 mb-2">
                {sourceGroup.label}
              </div>
              <div className="space-y-1">
                {conns.map((conn) => {
                  const targetGroup = groups.find((g) => g.id === conn.toGroupId);
                  if (!targetGroup) return null;

                  return (
                    <div
                      key={`${conn.fromGroupId}-${conn.toGroupId}`}
                      className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1.5"
                    >
                      <span className="text-gray-700">
                        <span className="text-gray-400">→</span> {targetGroup.label}
                      </span>
                      <button
                        onClick={() => removeConnection(conn.fromGroupId, conn.toGroupId)}
                        className="text-red-500 hover:text-red-700 ml-2"
                        title="Remove connection"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
