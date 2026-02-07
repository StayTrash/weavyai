/**
 * Auth utilities (client-safe).
 * For server-side getAuthUser, use '@/lib/auth-server'.
 */

export type { AuthUser } from './auth-server';

// Client-side storage keys and helpers (used by legacy API client or future use)
export const AUTH_TOKEN_KEY = 'weavyai:token';
export const AUTH_USER_KEY = 'weavyai:user';

export function getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getStoredUser(): unknown {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(AUTH_USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function setStoredUser(user: unknown): void {
    if (typeof window === 'undefined') return;
    if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_USER_KEY);
}

export function isAuthenticated(): boolean {
    return !!getStoredToken();
}

export function clearAuth(): void {
    setStoredToken(null);
    setStoredUser(null);
}
