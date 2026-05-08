"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError, registerAuthCallbacks } from "./api";
import type { LoginUser, AuthTokens, Profile } from "./types";

interface AuthContextValue {
  user: LoginUser | null;
  tokens: AuthTokens | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginUser>;
  logout: () => Promise<void>;
  setAuth: (user: LoginUser, tokens: AuthTokens) => void;
  refreshUser: () => Promise<void>;
  fetchProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function getStoredTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  const access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");
  if (access && refresh) return { access, refresh };
  return null;
}

function getStoredUser(): LoginUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getStoredProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("profile");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function storeAuth(user: LoginUser, tokens: AuthTokens) {
  localStorage.setItem("access_token", tokens.access);
  localStorage.setItem("refresh_token", tokens.refresh);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("profile");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginUser | null>(() => getStoredUser());
  const [tokens, setTokens] = useState<AuthTokens | null>(() => getStoredTokens());
  const [profile, setProfile] = useState<Profile | null>(() => getStoredProfile());
  const [loading] = useState(false);
  const router = useRouter();

  const fetchProfile = useCallback(async (): Promise<Profile | null> => {
    const currentTokens = getStoredTokens();
    if (!currentTokens) return null;
    try {
      const data = await apiFetch<Profile>("/users/profile/setup/", {
        token: currentTokens.access,
      });
      setProfile(data);
      localStorage.setItem("profile", JSON.stringify(data));
      return data;
    } catch {
      return null;
    }
  }, []);

  // Mark hydration complete after mount + fetch profile if logged in
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (getStoredTokens()) fetchProfile();

    // Register interceptor callbacks so api.ts can refresh & force-logout
    registerAuthCallbacks({
      getRefreshToken: () => localStorage.getItem("refresh_token"),
      onTokenRefreshed: (newAccess) => {
        localStorage.setItem("access_token", newAccess);
        setTokens((prev) => prev ? { ...prev, access: newAccess } : { access: newAccess, refresh: localStorage.getItem("refresh_token") ?? "" });
      },
      onForceLogout: () => {
        clearAuth();
        setUser(null);
        setTokens(null);
        setProfile(null);
        router.push("/auth/signin?session_expired=1");
      },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setAuth = useCallback((user: LoginUser, tokens: AuthTokens) => {
    storeAuth(user, tokens);
    setUser(user);
    setTokens(tokens);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginUser> => {
      const data = await apiFetch<{
        access: string;
        refresh: string;
        user: LoginUser;
      }>("/users/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const authTokens: AuthTokens = {
        access: data.access,
        refresh: data.refresh,
      };

      storeAuth(data.user, authTokens);
      setUser(data.user);
      setTokens(authTokens);

      return data.user;
    },
    []
  );

  const logout = useCallback(async () => {
    const currentTokens = getStoredTokens();
    if (currentTokens?.refresh) {
      try {
        await apiFetch("/users/sign-out/", {
          method: "POST",
          body: JSON.stringify({ refresh: currentTokens.refresh }),
          token: currentTokens.access,
        });
      } catch {
        // Ignore errors during sign-out
      }
    }
    clearAuth();
    setUser(null);
    setTokens(null);
    setProfile(null);
    router.push("/auth/signin");
  }, [router]);

  const refreshUser = useCallback(async () => {
    const currentTokens = getStoredTokens();
    if (!currentTokens) return;

    try {
      const userData = await apiFetch<{
        id: number;
        email: string;
        username: string;
        role: "student" | "tutor" | "admin" | "parent";
        is_approved: boolean;
        is_email_verified: boolean;
        is_profile_complete: boolean;
        is_parent_managed_child: boolean;
        can_self_subscribe: boolean;
      }>("/users/profile/", { token: currentTokens.access });

      const updatedUser: LoginUser = {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        role: userData.role,
        is_approved: userData.is_approved,
        is_profile_complete: userData.is_profile_complete,
        is_parent_managed_child: userData.is_parent_managed_child,
        can_self_subscribe: userData.can_self_subscribe,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Try refreshing the token
        try {
          const refreshData = await apiFetch<{ access: string }>(
            "/users/token/refresh/",
            {
              method: "POST",
              body: JSON.stringify({ refresh: currentTokens.refresh }),
            }
          );
          const newTokens = { ...currentTokens, access: refreshData.access };
          localStorage.setItem("access_token", newTokens.access);
          setTokens(newTokens);
        } catch {
          clearAuth();
          setUser(null);
          setTokens(null);
        }
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, tokens, profile, loading, login, logout, setAuth, refreshUser, fetchProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
