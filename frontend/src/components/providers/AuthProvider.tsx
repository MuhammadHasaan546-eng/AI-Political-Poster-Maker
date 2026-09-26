"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiGetMe, apiLogin, apiLogout, apiRegister } from "@/lib/api-client";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (input: {
    name: string;
    identifier: string;
    password: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = "sbp_auth_user";

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Session provider.
 *
 * The httpOnly `token` cookie set by the backend is the source of truth: on
 * mount we call `/api/auth/me` to rehydrate the session from the server, and
 * only fall back to the cached localStorage copy if the network is unreachable.
 * Logging out clears the server cookie first, then the local cache.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    /** Read the optimistic local cache (used only if the server is unreachable). */
    const readCached = (): User | null => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as User) : null;
      } catch {
        return null;
      }
    };

    const writeCached = (next: User | null) => {
      try {
        if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        else window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Storage may be unavailable (private mode).
      }
    };

    void (async () => {
      try {
        // Rehydrate directly from the server-side httpOnly cookie.
        const me = await apiGetMe();
        if (cancelled) return;
        setUser(me);
        writeCached(me);
      } catch {
        // Backend unreachable — fall back to the optimistic local cache.
        if (!cancelled) setUser(readCached());
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: User | null) => {
    setUser(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be unavailable (private mode).
    }
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const next = await apiLogin(identifier, password);
      persist(next);
      return next;
    },
    [persist],
  );

  const register = useCallback(
    async (input: { name: string; identifier: string; password: string }) => {
      const next = await apiRegister(input);
      persist(next);
      return next;
    },
    [persist],
  );

  /** Clear the server cookie first, then the local session cache. */
  const logout = useCallback(async () => {
    await apiLogout();
    persist(null);
  }, [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, login, register, logout }),
    [user, ready, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>.");
  return ctx;
}
