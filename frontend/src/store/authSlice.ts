import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub: string; // email
  exp: number;
}

interface AuthState {
  isAuthenticated: boolean;
  token?: string;
  userEmail?: string;
  login: (token: string) => void;
  logout: () => void;
  getUserInitial: () => string;
}

const getEmailFromToken = (token: string): string | undefined => {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.sub;
  } catch {
    return undefined;
  }
};

const storedToken = localStorage.getItem("access_token");
const initialEmail = storedToken ? getEmailFromToken(storedToken) : undefined;

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: !!storedToken,
  token: storedToken || undefined,
  userEmail: initialEmail,
  
  login: (token: string) => {
    localStorage.setItem("access_token", token);
    const email = getEmailFromToken(token);
    set({ isAuthenticated: true, token, userEmail: email });
  },
  
  logout: () => {
    localStorage.removeItem("access_token");
    set({ isAuthenticated: false, token: undefined, userEmail: undefined });
  },
  
  getUserInitial: () => {
    const { userEmail } = get();
    if (!userEmail) return "U";
    
    // Get first letter of email (before @)
    const name = userEmail.split("@")[0];
    return name.charAt(0).toUpperCase();
  },
}));