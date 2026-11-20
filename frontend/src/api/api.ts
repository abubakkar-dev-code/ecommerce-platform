import axios from "axios";
import store from "../redux/store";
import { clearCredentials } from "../redux/slices/authSlice";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json", "X-Auth-Mode": "cookie" },
});
const sessionApi = axios.create(api.defaults);
const excluded = new Set(["/users/login", "/users/register", "/users/refresh", "/users/update-password", "/users/logout", "/users/reset-password", "/users/forgot-password"]);
let refreshing: Promise<void> | undefined;

async function refreshSession() {
  if (navigator.locks) {
    return navigator.locks.request("nexora-account-refresh", async () => {
      try {
        await sessionApi.get("/users/profile");
        return;
      } catch (failure) {
        if (!axios.isAxiosError(failure) || failure.response?.status !== 401) throw failure;
      }
      await sessionApi.post("/users/refresh");
    });
  }
  await sessionApi.post("/users/refresh");
}

api.interceptors.response.use((response) => response, async (failure: unknown) => {
  if (!axios.isAxiosError(failure) || failure.response?.status !== 401 || !failure.config) throw failure;
  const config = failure.config as typeof failure.config & { sessionRetried?: boolean };
  if (excluded.has(config.url ?? "") || config.signal?.aborted) throw failure;
  if (config.sessionRetried) {
    store.dispatch(clearCredentials());
    throw failure;
  }
  config.sessionRetried = true;
  refreshing ??= refreshSession().finally(() => { refreshing = undefined; });
  try {
    await refreshing;
  } catch (error) {
    if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) store.dispatch(clearCredentials());
    throw error;
  }
  return api.request(config);
});

export default api;
