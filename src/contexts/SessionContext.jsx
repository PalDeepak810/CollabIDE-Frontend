import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { webSocketService } from '../services/WebSocketService';
import { useUser } from './UserContext';

const SessionContext = createContext(null);

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
    const { user, tabId } = useUser();
    const [session, setSession] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    const [files, setFiles] = useState([]);
    const [activeUsers, setActiveUsers] = useState([]);
    const [fileVersions, setFileVersions] = useState({});
    const [remoteCursors, setRemoteCursors] = useState({});

    // Track connection state to prevent duplicate connections
    const isConnectingRef = useRef(false);
    const currentSessionIdRef = useRef(null);

    const joinSession = useCallback((sessionId) => {
        console.log('[SessionContext] joinSession called', {
            sessionId,
            isConnectingRef: isConnectingRef.current,
            currentSessionIdRef: currentSessionIdRef.current,
            isConnected
        });

        // Prevent duplicate connection attempts
        if (isConnectingRef.current || (currentSessionIdRef.current === sessionId && isConnected)) {
            console.log('[SessionContext] Already connecting or connected to session:', sessionId);
            return;
        }

        isConnectingRef.current = true;
        currentSessionIdRef.current = sessionId;

        console.log('[SessionContext] Calling webSocketService.connect()');
        webSocketService.connect(() => {
            console.log('[SessionContext] WebSocket connected successfully');
            isConnectingRef.current = false;
            setIsConnected(true);

            // Subscribe to session topic
            webSocketService.subscribe(`/topic/session/${sessionId}`, (message) => {
                handleSessionMessage(message);
            });

            // Send join event
            webSocketService.send(`/app/session/${sessionId}/join`, {
                userId: user.userId,
                name: user.name,
                tabId
            });

            setSession(prev => ({ id: sessionId, ownerId: prev?.ownerId }));
            sendActivity('ACTIVE');
        }, (error) => {
            console.error('[SessionContext] WebSocket connection failed:', error);
            isConnectingRef.current = false;
            currentSessionIdRef.current = null;
            setIsConnected(false);
        });
    }, [user, tabId, isConnected]);

    const joinDemoSession = (sessionId) => {
        setIsDemo(true);
        setIsConnected(true);
        setSession({ id: sessionId });
        setFiles([
            { path: 'main.js', name: 'main.js', content: '// Demo Mode\nconsole.log("Hello World");', version: 1 },
            { path: 'style.css', name: 'style.css', content: 'body { background: #333; }', version: 1 }
        ]);
        setActiveUsers([
            { userId: 'demo1', name: 'Alice (Bot)' },
            { userId: 'demo2', name: 'Bob (Bot)' },
            { userId: user.userId, name: user.name }
        ]);
        setFileVersions({ 'main.js': 1, 'style.css': 1 });
    };

    const createFile = (fileName) => {
        if (!isConnected && !isDemo) return;
        if (session && !isDemo) {
            webSocketService.send(`/app/session/${session.id}/files/create`, {
                path: fileName,
                name: fileName,
                content: '',
                userId: user.userId
            });
        }
        // Optimistic update
        setFiles(prev => [...prev, { path: fileName, name: fileName, content: '', version: 1 }]);
        setFileVersions(prev => ({ ...prev, [fileName]: 1 }));
    };

    const createFileWithContent = (filePath, content) => {
        if (!isConnected && !isDemo) return;
        const name = filePath.split('/').pop();
        if (session && !isDemo) {
            webSocketService.send(`/app/session/${session.id}/files/create`, {
                path: filePath,
                name: name,
                content: content ?? '',
                userId: user.userId
            });
        }
        // Optimistic update
        setFiles(prev => {
            if (prev.find(f => f.path === filePath)) return prev;
            return [...prev, { path: filePath, name: name, content: content ?? '', version: 1 }];
        });
        setFileVersions(prev => ({ ...prev, [filePath]: 1 }));
    };

    const deleteFile = (filePath) => {
        if (!isConnected && !isDemo) return;
        if (session && !isDemo) {
            webSocketService.send(`/app/session/${session.id}/files/delete`, {
                path: filePath
            });
        }
        // Optimistic update
        setFiles(prev => prev.filter(f => f.path !== filePath));
    };

    const sendEditOperation = (operation) => {
        if (!isConnected && !isDemo) return;

        const baseVersion = fileVersions[operation.filePath] || 1;

        if (session && !isDemo) {
            webSocketService.send(`/app/edit`, {
                sessionId: session.id,
                filePath: operation.filePath,
                userId: user.userId,
                baseVersion: baseVersion,
                type: operation.type,
                position: operation.position,
                length: operation.length,
                text: operation.text,
                timestamp: new Date().toISOString()
            });
            sendActivity('ACTIVE');
        }

        // Local Optimistic Update (Manual string manipulation for demo/preview)
        if (isDemo) {
            setFiles(prev => prev.map(f => {
                if (f.path === operation.filePath) {
                    let newContent = f.content;
                    if (operation.type === 'INSERT') {
                        newContent = f.content.slice(0, operation.position) + operation.text + f.content.slice(operation.position);
                    } else if (operation.type === 'DELETE') {
                        newContent = f.content.slice(0, operation.position) + f.content.slice(operation.position + operation.length);
                    }
                    return { ...f, content: newContent };
                }
                return f;
            }));
        }
    };

    const sendCursorUpdate = (payload) => {
        if (!isConnected && !isDemo) return;
        if (session && !isDemo) {
            webSocketService.send(`/app/cursor`, {
                sessionId: session.id,
                filePath: payload.filePath,
                userId: user.userId,
                name: user.name,
                line: payload.line,
                column: payload.column
            });
            sendActivity('ACTIVE');
        }
    };

    const sendActivity = (status) => {
        if (!isConnected && !isDemo) return;
        if (session && !isDemo) {
            webSocketService.send(`/app/activity`, {
                sessionId: session.id,
                userId: user.userId,
                name: user.name,
                status,
                timestamp: new Date().toISOString()
            });
        }
    };

    const upsertUser = (incoming) => {
        setActiveUsers(prev => {
            const next = [...prev];
            const idx = next.findIndex(u => u.userId === incoming.userId);
            if (idx >= 0) {
                next[idx] = { ...next[idx], ...incoming };
            } else {
                next.push(incoming);
            }
            return next;
        });
    };

    const handleSessionMessage = (message) => {
        // Handle both old structured messages and the new FileUpdateMessage directly
        const type = message.type || (message.content !== undefined ? 'FILE_UPDATE' : null);
        const normalizeFile = (file) => {
            if (!file) return null;
            const path = file.path || file.filePath;
            return {
                ...file,
                path,
                name: file.name || path
            };
        };

        switch (type) {
            case 'PRESENCE':
                if (message.users) {
                    const now = Date.now();
                    const users = message.users.map(u => ({
                        userId: u.userId,
                        name: u.name || u.userId,
                        tabId: u.tabId,
                        status: 'ACTIVE',
                        lastActiveAt: now
                    }));
                    setActiveUsers(users);
                }
                break;
            case 'FILE_CREATED':
                setFiles(prev => {
                    const normalized = normalizeFile(message.file);
                    if (!normalized) return prev;
                    if (prev.find(f => f.path === normalized.path)) return prev;
                    return [...prev, normalized];
                });
                break;
            case 'FILE_DELETED':
                setFiles(prev => {
                    const deletePath = message.file?.path || message.file?.filePath;
                    if (!deletePath) return prev;
                    return prev.filter(f => f.path !== deletePath);
                });
                break;
            case 'FILE_UPDATE':
                const update = message.file || message;
                const updatePath = update.filePath || update.path;
                if (!updatePath) break;
                setFiles(prev => {
                    const next = prev.map(f => f.path === updatePath ? { ...f, content: update.content } : f);
                    const exists = next.some(f => f.path === updatePath);
                    if (!exists) {
                        next.push(normalizeFile({ ...update, path: updatePath }));
                    }
                    return next;
                });
                setFileVersions(prev => ({ ...prev, [updatePath]: update.version }));
                break;
            case 'SESSION_STATE':
                if (message.files) {
                    const normalizedFiles = message.files
                        .map(normalizeFile)
                        .filter(Boolean);
                    setFiles(normalizedFiles);
                    const versions = {};
                    normalizedFiles.forEach(f => {
                        if (f?.path) {
                            versions[f.path] = f.version || 1;
                        }
                    });
                    setFileVersions(versions);
                }
                if (message.users) {
                    const now = Date.now();
                    const users = message.users.map(u => ({
                        userId: u.userId,
                        name: u.name || u.userId,
                        tabId: u.tabId,
                        status: 'ACTIVE',
                        lastActiveAt: now
                    }));
                    setActiveUsers(users);
                }
                if (message.ownerId) {
                    setSession(prev => ({
                        id: prev?.id,
                        ownerId: message.ownerId
                    }));
                }
                break;
            case 'ACTIVITY': {
                if (!message.userId) break;
                const lastActiveAt = message.timestamp ? new Date(message.timestamp).getTime() : Date.now();
                upsertUser({
                    userId: message.userId,
                    name: message.name || message.userId,
                    status: message.status || 'ACTIVE',
                    lastActiveAt
                });
                break;
            }
            case 'CURSOR':
                if (!message.filePath || !message.userId) break;
                setRemoteCursors(prev => ({
                    ...prev,
                    [message.filePath]: {
                        ...(prev[message.filePath] || {}),
                        [message.userId]: {
                            userId: message.userId,
                            name: message.name || message.userId,
                            line: message.line,
                            column: message.column
                        }
                    }
                }));
                break;
            case 'ERROR':
                console.error('Session Error:', message.payload);
                break;
            default:
                break;
        }
    };

    const leaveSession = () => {
        webSocketService.disconnect();
        isConnectingRef.current = false;
        currentSessionIdRef.current = null;
        setSession(null);
        setIsConnected(false);
        setActiveUsers([]);
        setFiles([]);
        setFileVersions({});
        setRemoteCursors({});
    };

    useEffect(() => {
        if (!isConnected) return;
        const interval = setInterval(() => {
            const now = Date.now();
            setActiveUsers(prev => prev.map(u => {
                const last = u.lastActiveAt || 0;
                const isIdle = now - last > 30000;
                return { ...u, status: isIdle ? 'IDLE' : 'ACTIVE' };
            }));
        }, 5000);
        return () => clearInterval(interval);
    }, [isConnected]);

    return (
        <SessionContext.Provider value={{
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
        }}>
            {children}
        </SessionContext.Provider>
    );
};
