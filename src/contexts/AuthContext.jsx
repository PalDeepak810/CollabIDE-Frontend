import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { webSocketService } from '../services/WebSocketService';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const API_BASE = import.meta.env.VITE_AUTH_API_URL || 'http://127.0.0.1:8080';
const TOKEN_KEY = 'collabide_token';
const USER_KEY = 'collabide_auth_user';

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem(USER_KEY);
        return saved ? JSON.parse(saved) : null;
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (token) {
            webSocketService.setAuthToken(token);
        } else {
            webSocketService.setAuthToken(null);
        }
    }, [token]);

    useEffect(() => {
        if (!token || user) return;
        hydrate(token).catch(() => {
            logout();
        });
    }, [token, user]);

    const hydrate = async (accessToken) => {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (!res.ok) {
            throw new Error('Failed to fetch user');
        }
        const me = await res.json();
        const nextUser = {
            userId: String(me.userId ?? me.id ?? ''),
            email: me.email || '',
            name: me.email || `User-${me.userId}`
        };
        setUser(nextUser);
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        return nextUser;
    };

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) {
                throw new Error('Invalid credentials');
            }
            const data = await res.json();
            const accessToken = data.accessToken || data.token;
            if (!accessToken) {
                throw new Error('Missing token');
            }
            setToken(accessToken);
            localStorage.setItem(TOKEN_KEY, accessToken);
            await hydrate(accessToken);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (email, password) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) {
                throw new Error('Registration failed');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    };

    const value = useMemo(() => ({
        token,
        user,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout
    }), [token, user, isLoading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
