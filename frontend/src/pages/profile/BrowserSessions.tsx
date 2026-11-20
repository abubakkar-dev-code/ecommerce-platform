import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import api from "../../api/api";
import { clearCredentials } from "../../redux/slices/authSlice";
import apiError from "../../services/apiError";

type Session = { _id: string; current: boolean; createdAt: string; updatedAt: string };

export default function BrowserSessions() {
  const dispatch = useDispatch();
  const [sessions, setSessions] = useState<Session[]>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    const request = new AbortController();
    api.get<{ data: Session[] }>("/users/sessions", { signal: request.signal }).then(
      ({ data }) => { if (!request.signal.aborted) setSessions(data.data); },
      (failure: unknown) => { if (!request.signal.aborted) setError(apiError(failure, "Could not load browser sessions.")); },
    );
    return () => request.abort();
  }, []);

  const revoke = async (session?: Session) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      if (session) await api.delete(`/users/sessions/${session._id}`);
      else await api.post("/users/logout-all");
      if (!session || session.current) dispatch(clearCredentials());
      else setSessions((items) => items?.filter((item) => item._id !== session._id));
    } catch (failure) {
      setError(apiError(failure, "Could not revoke the session."));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return <section className="store-panel space-y-3">
    <h2 className="text-lg font-bold">Browser sessions</h2>
    {error && <p role="alert" className="text-error">{error}</p>}
    {!sessions && !error && <p role="status">Loading sessions...</p>}
    {sessions?.length === 0 && <p>No active browser sessions.</p>}
    <ul className="divide-y divide-border">
      {sessions?.map((session) => <li key={session._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div>
          <p className="font-semibold">{session.current ? "Current browser session" : "Other browser session"}</p>
          <p className="text-sm text-muted">Last renewed {new Date(session.updatedAt).toLocaleString("en-IN")}</p>
        </div>
        <button type="button" disabled={busy} onClick={() => void revoke(session)} className="text-sm font-semibold text-error disabled:opacity-50">Sign out session</button>
      </li>)}
    </ul>
    {!!sessions?.length && <button type="button" disabled={busy} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-error"
      onClick={() => void revoke()}>Sign out all browser sessions</button>}
  </section>;
}
