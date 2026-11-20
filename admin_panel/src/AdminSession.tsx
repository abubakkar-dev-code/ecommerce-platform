import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { errorMessage, request, RequestError, type AdminUser } from "./adminApi";

export default function AdminSession({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const expire = () => setUser(null);
    window.addEventListener("admin-session-expired", expire);
    request<AdminUser>("/users/profile", "GET", undefined, controller.signal).then(
      ({ data }) => { if (!controller.signal.aborted) setUser(data); },
      (failure: unknown) => {
        if (!controller.signal.aborted) {
          setUser(null);
          if (!(failure instanceof RequestError && failure.status === 401)) setError(errorMessage(failure));
        }
      },
    );
    return () => { controller.abort(); window.removeEventListener("admin-session-expired", expire); };
  }, []);

  const action = async (operation: () => Promise<void>) => {
    if (pending.current) return;
    pending.current = true;
    setError("");
    setBusy(true);
    try { await operation(); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { pending.current = false; setBusy(false); }
  };

  const login = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const credentials = Object.fromEntries(new FormData(event.currentTarget));
    void action(async () => setUser((await request<{ user: AdminUser }>("/users/login", "POST", credentials)).data.user));
  };

  const logout = () => void action(async () => {
    await request("/users/logout", "POST");
    setUser(null);
  });

  if (user === undefined) return <p role="status" className="p-6">Checking session...</p>;
  if (!user) return <main className="mx-auto grid min-h-dvh w-full max-w-md content-center px-4 py-12">
    <form onSubmit={login} className="admin-panel grid gap-4 border-t-4 border-t-primary">
      <h1 className="text-3xl font-extrabold tracking-tight">Nexora admin sign in</h1>
      {error && <p role="alert" className="text-error">{error}</p>}
      <label className="grid gap-1 text-sm font-semibold">Email<input required type="email" name="email" autoComplete="email" className="admin-input" /></label>
      <label className="grid gap-1 text-sm font-semibold">Password<input required type="password" name="password" autoComplete="current-password" className="admin-input" /></label>
      <button disabled={busy} className="rounded-lg bg-primary p-2 font-semibold text-white disabled:opacity-50">{busy ? "Signing in..." : "Sign in"}</button>
    </form>
  </main>;

  return <>
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-4 py-3 text-sm sm:px-6">
      <span className="break-all font-semibold text-muted">{user.email}</span>
      <button type="button" disabled={busy} onClick={logout} className="font-semibold text-primary disabled:opacity-50">Sign out</button>
      {error && <p role="alert" className="w-full text-error">{error}</p>}
    </header>
    {user.role === "admin" ? children : <p role="alert" className="p-6">An administrator account is required.</p>}
  </>;
}
