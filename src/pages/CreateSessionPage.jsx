import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { localFileService } from '../services/LocalFileService';

const CreateSessionPage = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isLocalLoading, setIsLocalLoading] = useState(false);
    const [localError, setLocalError] = useState(null);

    const readDirectory = async (dirHandle, basePath = '') => {
        const files = [];
        for await (const [name, handle] of dirHandle.entries()) {
            const currentPath = basePath ? `${basePath}/${name}` : name;
            if (handle.kind === 'directory') {
                const nested = await readDirectory(handle, currentPath);
                files.push(...nested);
            } else if (handle.kind === 'file') {
                const file = await handle.getFile();
                const content = await file.text();
                localFileService.setFileHandle(currentPath, handle);
                files.push({
                    path: currentPath,
                    name: name,
                    content
                });
            }
        }
        return files;
    };

    const createSession = async () => {
        setError(null);
        setLocalError(null);

        try {
            if (!user?.userId) {
                throw new Error('Missing user id');
            }

            const API_BASE = import.meta.env.VITE_AUTH_URL;
            const response = await fetch(`${API_BASE}/api/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ ownerId: user.userId })
            });
            if (!response.ok) {
                throw new Error(`Create session failed: ${response.status}`);
            }

            const data = await response.json();
            const sessionId = data?.session?.sessionId || data?.sessionId || uuidv4();
            return sessionId;
        } catch (err) {
            console.error("Failed to create session", err);
            setError("Failed to create session. Please try again.");
            throw err;
        } finally {
        }
    };

    const handleCreateSession = async () => {
        setIsLoading(true);
        try {
            const sessionId = await createSession();
            navigate(`/session/${sessionId}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenLocalFolder = async () => {
        setIsLocalLoading(true);
        setLocalError(null);

        try {
            if (!window.showDirectoryPicker) {
                throw new Error('Your browser does not support local folder access. Use Chrome or Edge.');
            }

            const dirHandle = await window.showDirectoryPicker();
            localFileService.setRootHandle(dirHandle);

            const files = await readDirectory(dirHandle);
            if (!files.length) {
                throw new Error('Selected folder is empty.');
            }

            const sessionId = await createSession();
            navigate(`/session/${sessionId}`, {
                state: {
                    localMode: true,
                    localFiles: files
                }
            });
        } catch (err) {
            console.error('Failed to open local folder', err);
            setLocalError(err?.message || 'Failed to open local folder.');
        } finally {
            setIsLocalLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white relative">
            <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl">
                <h2 className="text-3xl font-bold mb-6 text-center">Start Coding</h2>

                <div className="space-y-6">
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <label className="block text-sm text-gray-400 mb-1">Your Display Name</label>
                        <div className="text-lg font-medium">{user?.name}</div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleCreateSession}
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg font-bold text-lg shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? 'Creating Workspace...' : 'Create New Session'}
                    </button>

                    <div className="text-center text-xs text-gray-500">or</div>

                    {localError && (
                        <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm">
                            {localError}
                        </div>
                    )}

                    <button
                        onClick={handleOpenLocalFolder}
                        disabled={isLocalLoading}
                        className="w-full py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLocalLoading ? 'Opening Folder...' : 'Open Local Folder (Beta)'}
                    </button>

                    <div className="text-center">
                        <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-300 text-sm">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateSessionPage;
