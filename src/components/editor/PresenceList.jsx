import React from 'react';

const PresenceList = ({ users }) => {
    const palette = [
        'from-amber-400 to-amber-600',
        'from-emerald-400 to-emerald-600',
        'from-cyan-400 to-cyan-600',
        'from-blue-400 to-blue-600',
        'from-indigo-400 to-indigo-600',
        'from-pink-400 to-pink-600',
        'from-rose-400 to-rose-600',
        'from-orange-400 to-orange-600',
        'from-lime-400 to-lime-600',
        'from-teal-400 to-teal-600'
    ];

    const hashString = (value) => {
        let hash = 0;
        for (let i = 0; i < value.length; i += 1) {
            hash = ((hash << 5) - hash) + value.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    };

    return (
        <div className="w-56 bg-gray-900 border-l border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800">
                <h3 className="font-semibold text-gray-300">Online ({users.length})</h3>
            </div>
            <div className="p-4 flex flex-col gap-3">
                {users.map((user) => {
                    const baseName = user.name || user.userId || 'User';
                    const tabSuffix = user.tabId ? ` • ${user.tabId.slice(0, 4)}` : '';
                    const displayName = `${baseName}${tabSuffix}`;
                    const key = `${user.userId || 'user'}:${user.tabId || 'default'}`;
                    const colorClass = palette[hashString(key) % palette.length];
                    const initials = getInitials(baseName);
                    return (
                    <div key={key} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-xs font-bold text-white shadow`}>
                            {initials}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-gray-200">{displayName}</span>
                            <span className={`text-xs ${user.status === 'IDLE' ? 'text-amber-400' : 'text-green-400'}`}>
                                {user.status === 'IDLE' ? 'Idle' : 'Active'}
                            </span>
                        </div>
                    </div>
                )})}
                {users.length === 0 && (
                    <div className="text-gray-500 text-sm italic">Waiting for connection...</div>
                )}
            </div>
        </div>
    );
};

export default PresenceList;
