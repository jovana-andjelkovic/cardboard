import { useProjectStore } from '../../store/projectStore';

interface ConnectionBadgeProps {
  groupId: string;
}

export const ConnectionBadge = ({ groupId }: ConnectionBadgeProps) => {
  const groups = useProjectStore((state) => state.groups);
  const getConnectionsForGroup = useProjectStore((state) => state.getConnectionsForGroup);

  const { outgoing, incoming } = getConnectionsForGroup(groupId);

  if (outgoing.length === 0 && incoming.length === 0) {
    return null;
  }

  const outgoingGroups = outgoing
    .map((conn) => groups.find((g) => g.id === conn.toGroupId))
    .filter((g): g is NonNullable<typeof g> => g !== undefined);

  const incomingGroups = incoming
    .map((conn) => groups.find((g) => g.id === conn.fromGroupId))
    .filter((g): g is NonNullable<typeof g> => g !== undefined);

  return (
    <div className="mt-2 pt-2 border-t border-gray-200 text-xs">
      {outgoingGroups.length > 0 && (
        <div className="mb-1">
          <span className="text-gray-500">→ </span>
          <span className="text-gray-700">
            {outgoingGroups.map((g) => g.label).join(', ')}
          </span>
        </div>
      )}
      {incomingGroups.length > 0 && (
        <div>
          <span className="text-gray-500">← </span>
          <span className="text-gray-700">
            {incomingGroups.map((g) => g.label).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};
