import React from 'react';
import { useSession } from '../../contexts/SessionContext';
import { useUser } from '../../contexts/UserContext';
import { Link, useNavigate } from 'react-router-dom';
import { localFileService } from '../../services/LocalFileService';
import { useAuth } from '../../contexts/AuthContext';

const TopBar = () => {
    const { session, isConnected, activeUsers, leaveSession, files } = useSession();
    const { user } = useUser();
    const { logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
    };

    const handleSaveLocal = async () => {
        if (!localFileService.hasRoot()) {
            alert('No local folder is connected.');
            return;
        }
        try {
            await localFileService.writeAll(files);
            alert('Saved to local folder.');
        } catch (err) {
            console.error('Save to local failed', err);
            alert('Failed to save to local folder.');
        }
    };

    const handleLogout = () => {
        leaveSession();
        logout();
        navigate('/login');
    };

    return (
        <div className="h-14 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4 text-white">
            <div className="flex items-center gap-4">
                <Link to="/" className="font-bold text-xl text-blue-400">CollabIDE</Link>
                {session && (
                    <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-md text-sm">
                        <span className="text-gray-400">Session:</span>
                        <span className="font-mono">{session.id}</span>
                        <button
                            onClick={handleCopyLink}
                            className="ml-2 text-xs bg-blue-600 hover:bg-blue-500 px-2 py-0.5 rounded"
                        >
                            Copy
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                {localFileService.hasRoot() && session?.ownerId === user?.userId && (
                    <button
                        onClick={handleSaveLocal}
                        className="text-xs bg-emerald-700 hover:bg-emerald-600 px-2 py-1 rounded"
                        title="Write current files to your local folder"
                    >
                        Save to Local
                    </button>
                )}
                {isConnected ? (
                    <span className="flex items-center gap-2 text-sm text-green-400">
                        <span className="w-2 h-2 rounded-full bg-green-400 block"></span>
                        Connected
                    </span>
                ) : (
                    <span className="flex items-center gap-2 text-sm text-red-400">
                        <span className="w-2 h-2 rounded-full bg-red-400 block"></span>
                        Disconnected
                    </span>
                )}

                <div className="text-sm text-gray-300">
                    User: <span className="font-semibold">{user?.name}</span>
                    {user?.email && <span className="text-gray-500 ml-2">({user.email})</span>}
                </div>

                {isAuthenticated && (
                    <button
                        onClick={handleLogout}
                        className="text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded"
                    >
                        Logout
                    </button>
                )}

                {session && (
                    <button
                        onClick={leaveSession}
                        className="text-sm bg-red-900/50 hover:bg-red-900 text-red-200 px-3 py-1.5 rounded border border-red-800 transition-colors"
                    >
                        Leave
                    </button>
                )}
            </div>
        </div>
    );
};

export default TopBar;
