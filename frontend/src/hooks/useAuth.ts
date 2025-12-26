import { useAuthStore } from "../store/authSlice";
import { login as loginApi } from "../services/authService";

export const useAuth = () => {
  const { isAuthenticated, login, logout } = useAuthStore();

  const loginWithEmail = async (email: string, password: string) => {
    const token = await loginApi(email, password);
    login(token);
  };

  return { isAuthenticated, loginWithEmail, logout };
};
