import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import FileExplorer from '../components/editor/FileExplorer';
import CodeEditor from '../components/editor/CodeEditor';
import PresenceList from '../components/editor/PresenceList';
import { useSession } from '../contexts/SessionContext';

const EditorPage = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const {
        session,
        isConnected,
        files,
        activeUsers,
        remoteCursors,
        joinSession,
        joinDemoSession,
        leaveSession,
        createFile,
        createFileWithContent,
        deleteFile,
        sendEditOperation,
        sendCursorUpdate
    } = useSession();

    const [activeFile, setActiveFile] = useState(null);
    const localInitRef = useRef(false);
    const localFiles = location.state?.localFiles;
    const localMode = location.state?.localMode;

    useEffect(() => {
        if (sessionId && (!session || session.id !== sessionId)) {
            joinSession(sessionId);
        }
        // Only cleanup on unmount, not on every dependency change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    useEffect(() => {
        if (!isConnected) return;
        if (!localMode || !localFiles || localInitRef.current) return;
        localInitRef.current = true;
        localFiles.forEach(f => {
            if (f?.path) {
                createFileWithContent(f.path, f.content ?? '');
            }
        });
    }, [isConnected, localMode, localFiles, createFileWithContent]);

    // Sync active file content if it updates remotely
    useEffect(() => {
        if (activeFile) {
            const updatedFile = files.find(f => f.path === activeFile.path);
            if (updatedFile) {
                setActiveFile(updatedFile);
            } else {
                // File deleted
                setActiveFile(null);
            }
        }
    }, [files]);

    if (!isConnected) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-gray-400">Connecting to Session...</div>
                    <button
                        onClick={() => joinDemoSession(sessionId)}
                        className="mt-4 text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                        Enter Demo Mode (Offline)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <MainLayout>
            <FileExplorer
                files={files}
                activeFile={activeFile}
                onFileSelect={setActiveFile}
                onCreateFile={createFile}
                onDeleteFile={deleteFile}
            />

            {activeFile ? (
                <CodeEditor
                    content={activeFile.content}
                    filePath={activeFile.path}
                    onEdit={sendEditOperation}
                    onCursorChange={sendCursorUpdate}
                    remoteCursors={remoteCursors[activeFile.path] || {}}
                />
            ) : (
                <div className="flex-1 bg-[#1e1e1e] flex items-center justify-center text-gray-500">
                    Select a file to start editing
                </div>
            )}

            <PresenceList users={activeUsers} />
        </MainLayout>
    );
};

export default EditorPage;
