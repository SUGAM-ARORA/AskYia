// frontend/src/services/authService.ts
import { api } from "./api";

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  avatar_url?: string | null;
  is_email_verified?: boolean;
  oauth_provider?: string | null;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: User;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
}

// Login with email/password
export const login = async (email: string, password: string): Promise<string> => {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
  return data.access_token;
};

// Register new user
export const register = async (userData: RegisterData): Promise<User> => {
  const { data } = await api.post<User>("/auth/register", userData);
  return data;
};

// Get OAuth URL for Google
export const getGoogleAuthUrl = async (): Promise<string> => {
  const { data } = await api.get<{ auth_url: string }>("/auth/oauth/google");
  return data.auth_url;
};

// Get OAuth URL for GitHub
export const getGitHubAuthUrl = async (): Promise<string> => {
  const { data } = await api.get<{ auth_url: string }>("/auth/oauth/github");
  return data.auth_url;
};

// Request password reset
export const requestPasswordReset = async (email: string): Promise<void> => {
  await api.post("/auth/password/reset-request", { email });
};

// Reset password with token
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  await api.post("/auth/password/reset", {
    token,
    new_password: newPassword,
  });
};

// Get current user
export const getCurrentUser = async (): Promise<User> => {
  const { data } = await api.get<User>("/auth/me");
  return data;
};