import { api } from "./api";

export const login = async (email: string, password: string): Promise<string> => {
  const { data } = await api.post("/auth/login", { email, password });
  return data.access_token;
};
