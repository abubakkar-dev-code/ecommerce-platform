import api from "./api";

interface loginData {
  email: string;
  password: string;
}
interface register {
  name: string;
  email: string;
  password: string;
}
interface forgot {
  email: string;
}
interface reset {
  newPassword: string;
  confirmPassword: string;
}
const login = async (data: loginData) => {
  const response = await api.post("/users/login", data);
  return response.data;
};

const register = async (data: register) => {
  const response = await api.post("/users/register", data);
  return response.data;
};
const forgotPassword = async (data: forgot) => {
  const response = await api.post("/users/forgot-password", data);
  return response.data;
};
const resetPassword = async (data: reset, token: string) => {
  const response = await api.put(`/users/reset-password?token=${token}`, data);
  return response.data;
};
export default { login, register, forgotPassword, resetPassword };
