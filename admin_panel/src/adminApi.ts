export type AdminUser = { _id: string; name: string; email: string; role: string };
export type CatalogRecord = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  logo?: string;
  category?: string;
  brand?: string;
  parentCategory?: string | null;
  isActive?: boolean;
};

export class RequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const base = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

const cookieHeaders = { "X-Auth-Mode": "cookie" };
let refreshing: Promise<boolean> | undefined;

function refreshSession() {
  const refresh = async () => {
    const profile = await fetch(base + "/users/profile", { credentials: "include", headers: cookieHeaders });
    if (profile.ok) return true;
    if (profile.status !== 401) return false;
    const response = await fetch(base + "/users/refresh", { method: "POST", credentials: "include", headers: cookieHeaders });
    return response.ok;
  };
  return navigator.locks ? navigator.locks.request("nexora-account-refresh", refresh) : refresh();
}

export async function request<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal) {
  const multipart = body instanceof FormData;
  const send = () => fetch(base + path, {
    method, signal, credentials: "include",
    headers: { "X-Auth-Mode": "cookie", ...(body !== undefined && !multipart ? { "Content-Type": "application/json" } : {}) },
    body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
  });
  let response = await send();
  if (response.status === 401 && !["/users/login", "/users/logout"].includes(path) && !signal?.aborted) {
    refreshing ??= refreshSession().finally(() => { refreshing = undefined; });
    if (await refreshing) response = await send();
  }
  const payload = await response.json().catch(() => undefined) as { data: T; message?: string; pagination?: { totalPages: number } } | undefined;
  if (!response.ok) {
    if (response.status === 401 && path !== "/users/login" && path !== "/users/profile") window.dispatchEvent(new Event("admin-session-expired"));
    throw new RequestError(response.status, response.status >= 500 ? "The server could not complete this operation." : payload?.message ?? "The operation failed.");
  }
  if (!payload) throw new Error("The server returned an invalid response.");
  return payload;
}

export async function listCatalog(path: string, signal?: AbortSignal) {
  const records: CatalogRecord[] = [];
  let page = 1;
  let totalPages: number;
  do {
    const response = await request<CatalogRecord[]>(`${path}?limit=100&page=${page}`, "GET", undefined, signal);
    records.push(...response.data);
    totalPages = Math.min(response.pagination?.totalPages ?? 1, 10000);
    page++;
  } while (page <= totalPages);
  return records;
}

export const validId = /^[a-f\d]{24}$/i;
export const errorMessage = (error: unknown) => error instanceof RequestError ? error.message : "Could not complete the request. Try again.";
