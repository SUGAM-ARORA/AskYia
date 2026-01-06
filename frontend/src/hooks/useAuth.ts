// frontend/src/hooks/useAuth.ts
import { useCallback, useState } from "react";
import { useAuthStore } from "../store/authSlice";
import * as authService from "../services/authService";

export const useAuth = () => {
  const {
    isAuthenticated,
    user,
    token,
    login,
    logout,
    setUser,
    getUserInitial,
  } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const accessToken = await authService.login(email, password);
        login(accessToken);
      } catch (err: any) {
        const message = err.response?.data?.detail || "Failed to sign in";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [login]
  );

  const registerWithEmail = useCallback(
    async (email: string, password: string, fullName?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        // Register
        await authService.register({
          email,
          password,
          full_name: fullName,
        });
        // Then login
        const accessToken = await authService.login(email, password);
        login(accessToken);
      } catch (err: any) {
        const message = err.response?.data?.detail || "Failed to create account";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [login]
  );

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authUrl = await authService.getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (err: any) {
      const message = err.response?.data?.detail || "Google sign in is not available";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGitHub = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authUrl = await authService.getGitHubAuthUrl();
      window.location.href = authUrl;
    } catch (err: any) {
      const message = err.response?.data?.detail || "GitHub sign in is not available";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(
    async (email: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await authService.requestPasswordReset(email);
      } catch {
        // Don't show error to prevent email enumeration
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const resetPassword = useCallback(
    async (resetToken: string, newPassword: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await authService.resetPassword(resetToken, newPassword);
      } catch (err: any) {
        const message = err.response?.data?.detail || "Failed to reset password";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithGitHub,
    requestPasswordReset,
    resetPassword,
    logout,
    clearError,
    getUserInitial,
  };
};