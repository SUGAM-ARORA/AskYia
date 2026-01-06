// frontend/src/store/authSlice.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import type { User } from "../services/authService";

interface DecodedToken {
  sub: string;
  exp: number;
  iat: number;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Helpers
  getUserInitial: () => string;
  isTokenValid: () => boolean;
}

const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      isLoading: false,
      error: null,

      login: (token: string, user: User) => {
        localStorage.setItem("access_token", token);
        set({
          isAuthenticated: true,
          token,
          user,
          error: null,
        });
      },

      logout: () => {
        localStorage.removeItem("access_token");
        set({
          isAuthenticated: false,
          token: null,
          user: null,
          error: null,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      getUserInitial: () => {
        const { user } = get();
        if (!user) return "U";
        
        if (user.full_name) {
          return user.full_name.charAt(0).toUpperCase();
        }
        
        const name = user.email.split("@")[0];
        return name.charAt(0).toUpperCase();
      },

      isTokenValid: () => {
        const { token } = get();
        if (!token) return false;
        return !isTokenExpired(token);
      },
    }),
    {
      name: "askyia-auth",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.token) {
          if (isTokenExpired(state.token)) {
            state.logout();
          }
        }
      },
    }
  )
);