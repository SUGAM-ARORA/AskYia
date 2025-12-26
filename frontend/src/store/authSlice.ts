import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  token?: string;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem("access_token"),
  token: localStorage.getItem("access_token") || undefined,
  login: (token: string) => {
    localStorage.setItem("access_token", token);
    set({ isAuthenticated: true, token });
  },
  logout: () => {
    localStorage.removeItem("access_token");
    set({ isAuthenticated: false, token: undefined });
  },
}));
