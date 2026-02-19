import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { GroupZone } from './GroupZone';
import type { PrototypeRole } from '../../store/types';

interface GroupsListProps {
  onConnectionClick?: (groupId: string) => void;
}

export const GroupsList = ({ onConnectionClick }: GroupsListProps) => {
  const groups = useProjectStore((state) => state.groups);
  const addGroup = useProjectStore((state) => state.addGroup);

  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newRole, setNewRole] = useState<PrototypeRole>('page');

  // Sort groups: main-nav first, then by order
  const sortedGroups = [...groups].sort((a, b) => {
    if (a.prototypeRole === 'main-nav') return -1;
    if (b.prototypeRole === 'main-nav') return 1;
    return a.order - b.order;
  });

  const handleAddGroup = () => {
    if (newLabel.trim()) {
      addGroup(newLabel.trim(), newRole);
      setNewLabel('');
      setNewRole('page');
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setNewLabel('');
    setNewRole('page');
    setIsAdding(false);
  };

  return (
    <div>
      {/* Existing groups in columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {sortedGroups.map((group) => (
          <GroupZone key={group.id} group={group} onConnectionClick={onConnectionClick} />
        ))}
      </div>

      {/* Add group section */}
      {isAdding ? (
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Create New Group</h4>

          <input
            type="text"
            placeholder="Group name"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddGroup();
              if (e.key === 'Escape') handleCancel();
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Prototype Role
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="page"
                  checked={newRole === 'page'}
                  onChange={(e) => setNewRole(e.target.value as PrototypeRole)}
                  className="text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Page</span>
                <span className="text-xs text-gray-500">- Content area</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="secondary-nav"
                  checked={newRole === 'secondary-nav'}
                  onChange={(e) => setNewRole(e.target.value as PrototypeRole)}
                  className="text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Secondary Nav</span>
                <span className="text-xs text-gray-500">- Sidebar navigation</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddGroup}
              disabled={!newLabel.trim()}
              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Create Group
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors font-medium text-sm"
        >
          + Add Group
        </button>
      )}
    </div>
  );
};
