import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { webSocketService } from '../services/WebSocketService';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const API_BASE = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8082';
const TOKEN_KEY = 'collabide_token';
const USER_KEY  = 'collabide_auth_user';

// Read a meaningful error message from any response shape the Auth service returns
const extractErrorMessage = async (res, fallback) => {
    try {
        const body = await res.json();
        return body?.message || body?.error || fallback;
    } catch {
        return fallback;
    }
};

export const AuthProvider = ({ children }) => {
    const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser]       = useState(() => {
        const saved = localStorage.getItem(USER_KEY);
        return saved ? JSON.parse(saved) : null;
    });
    const [isLoading, setIsLoading] = useState(false);

    // Stable ref so logout() can be called inside effects without stale closure
    const logoutRef = useRef(null);

    const logout = () => {
        webSocketService.setAuthToken(null);
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    };
    logoutRef.current = logout;

    // Keep WebSocket token in sync
    useEffect(() => {
        webSocketService.setAuthToken(token || null);
    }, [token]);

    // On page reload — if token exists but user was cleared, re-hydrate
    useEffect(() => {
        if (!token || user) return;
        hydrate(token).catch(() => logoutRef.current());
    }, [token, user]);

    // Map Auth service UserDto → internal user shape
    const mapUser = (dto) => ({
        userId: String(dto.id ?? ''),
        email:  dto.email  || '',
        name:   dto.name   || dto.email || `User-${dto.id}`,
    });

    const hydrate = async (accessToken) => {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) throw new Error('Session expired');
        const dto = await res.json();
        const nextUser = mapUser(dto);
        setUser(nextUser);
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        return nextUser;
    };

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) {
                const msg = await extractErrorMessage(res, 'Invalid credentials');
                throw new Error(msg);
            }
            const data = await res.json();
            // Auth service returns TokenResponse { accessToken, refreshToken, expiresIn, userDto }
            const accessToken = data.accessToken || data.token;
            if (!accessToken) throw new Error('No token received');

            localStorage.setItem(TOKEN_KEY, accessToken);
            setToken(accessToken);
            webSocketService.setAuthToken(accessToken);

            // Use userDto from login response directly — avoids an extra /me round-trip
            const nextUser = data.userDto ? mapUser(data.userDto) : await hydrate(accessToken);
            setUser(nextUser);
            localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (email, password, name) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Auth service UserDto accepts: email, password, name
                body: JSON.stringify({ email, password, name: name || email.split('@')[0] })
            });
            if (!res.ok) {
                const msg = await extractErrorMessage(res, 'Registration failed');
                throw new Error(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const value = useMemo(() => ({
        token,
        user,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
    }), [token, user, isLoading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
