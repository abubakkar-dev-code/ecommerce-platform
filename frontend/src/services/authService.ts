import api from "../api/api";

const login = async (data) => {
  const response = await api.post("/users/login", data);
  return response.data;
};

const register = async (data) => {
  const response = await api.post("/users/register", data);
  return response.data;
};
export default { login, register };
