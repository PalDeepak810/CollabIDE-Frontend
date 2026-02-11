import React, { useState } from 'react';

const FileExplorer = ({ files, activeFile, onFileSelect, onCreateFile, onDeleteFile }) => {
    const [newFileName, setNewFileName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (newFileName.trim()) {
            onCreateFile(newFileName.trim());
            setNewFileName('');
            setIsCreating(false);
        }
    };

    return (
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-semibold text-gray-300">Explorer</h3>
                <button
                    onClick={() => setIsCreating(true)}
                    className="text-gray-400 hover:text-white"
                    title="New File"
                >
                    +
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {isCreating && (
                    <form onSubmit={handleCreateSubmit} className="mb-2">
                        <input
                            type="text"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            placeholder="filename.js"
                            autoFocus
                            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm border border-blue-500 outline-none"
                            onBlur={() => !newFileName && setIsCreating(false)}
                        />
                    </form>
                )}

                {files.map((file, index) => (
                    <div
                        key={file.path || index}
                        className={`flex items-center justify-between px-3 py-2 rounded mb-1 cursor-pointer group ${activeFile?.path === file.path ? 'bg-blue-900/30 text-blue-300' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                            }`}
                        onClick={() => onFileSelect(file)}
                    >
                        <span className="text-sm truncate">{file.name || file.path}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteFile(file.path); }}
                            className="hidden group-hover:block text-gray-500 hover:text-red-400"
                        >
                            ×
                        </button>
                    </div>
                ))}

                {files.length === 0 && !isCreating && (
                    <div className="text-center text-gray-600 text-xs mt-4">
                        No files yet
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileExplorer;
