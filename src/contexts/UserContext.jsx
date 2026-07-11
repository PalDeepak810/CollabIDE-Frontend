import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';

const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const { user: authUser } = useAuth();

    // Always derive from authUser when available, fall back to guest only when not authenticated
    const [user, setUser] = useState(() =>
        authUser || { userId: uuidv4(), name: `Guest-${Math.floor(Math.random() * 1000)}` }
    );

    const [tabId] = useState(() => {
        const saved = sessionStorage.getItem('collabide_tab_id');
        if (saved) return saved;
        const id = uuidv4();
        sessionStorage.setItem('collabide_tab_id', id);
        return id;
    });

    // Sync whenever auth state changes (login, logout, hydration completes)
    useEffect(() => {
        if (authUser) {
            setUser(authUser);
        } else {
            // Logged out — reset to guest
            setUser({ userId: uuidv4(), name: `Guest-${Math.floor(Math.random() * 1000)}` });
        }
    }, [authUser]);

    const updateName = (name) => setUser(prev => ({ ...prev, name }));

    return (
        <UserContext.Provider value={{ user, tabId, updateName }}>
            {children}
        </UserContext.Provider>
    );
};
