import React from 'react';

const StatusBar = ({ status = 'Ready', error = null }) => {
    return (
        <div className="h-6 bg-blue-600 text-white text-xs flex items-center px-4 justify-between select-none">
            <div className="flex items-center gap-4">
                <span>{status}</span>
                {error && <span className="text-red-200 bg-red-800 px-2 rounded">{error}</span>}
            </div>
            <div>
                CollabIDE v0.1.0
            </div>
        </div>
    );
};

export default StatusBar;
