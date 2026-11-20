import api from "../api/api";
import type { User } from "../redux/slices/authSlice";

const login = async (data: { email: string; password: string }) => {
  const response = await api.post<{ data: { user: User } }>("/users/login", data);
  return response.data;
};

const register = async (data: { name: string; email: string; password: string }) => {
  const response = await api.post("/users/register", data);
  return response.data;
};
const profile = async () => (await api.get<{ data: User }>("/users/profile")).data;
const logout = async () => { await api.post("/users/logout"); };
export default { login, register, profile, logout };
