import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { isAxiosError } from "axios";
import type { RootState } from "../../redux/store";
import { clearCredentials, sessionError, setCredentials } from "../../redux/slices/authSlice";
import authService from "../../services/authService";

export default function SessionBoundary({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const status = useSelector((state: RootState) => state.userInfo.status);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    authService.profile().then((response) => {
      if (active) dispatch(setCredentials({ user: response.data }));
    }).catch((error: unknown) => {
      if (!active) return;
      dispatch(isAxiosError(error) && [401, 403].includes(error.response?.status || 0)
        ? clearCredentials() : sessionError());
    });
    return () => { active = false; };
  }, [dispatch, attempt]);
  if (status === "checking") return <p role="status" className="p-8 text-center">Checking your session…</p>;
  return <>
    {status === "error" && <div role="alert" className="border-b border-border px-4 py-3 text-center text-sm">
      Could not check your session.{" "}
      <button type="button" onClick={() => setAttempt((value) => value + 1)} className="font-semibold text-primary underline">Retry</button>
    </div>}
    {children}
  </>;
}
