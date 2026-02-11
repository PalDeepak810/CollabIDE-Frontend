import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';

const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const { user: authUser } = useAuth();
    const [user, setUser] = useState(() => {
        return authUser || {
            userId: uuidv4(),
            name: `User-${Math.floor(Math.random() * 1000)}`
        };
    });
    const [tabId] = useState(() => {
        const savedTab = sessionStorage.getItem('collabide_tab_id');
        if (savedTab) return savedTab;
        const newTabId = uuidv4();
        sessionStorage.setItem('collabide_tab_id', newTabId);
        return newTabId;
    });

    useEffect(() => {
        if (authUser) {
            setUser(authUser);
        }
    }, [authUser]);

    const updateName = (name) => {
        setUser(prev => ({ ...prev, name }));
    };

    return (
        <UserContext.Provider value={{ user, tabId, updateName }}>
            {children}
        </UserContext.Provider>
    );
};
