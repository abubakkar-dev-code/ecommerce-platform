import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../../api/api";
import apiError from "../../services/apiError";
import { setCredentials, type User } from "../../redux/slices/authSlice";
import type { RootState } from "../../redux/store";

export default function VerifyEmail() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const current = useSelector((state: RootState) => state.userInfo.users);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const token = new URLSearchParams(hash.slice(1)).get("token");
  const valid = !!token && /^[a-f\d]{64}$/.test(token);

  const verify = async () => {
    if (!valid || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post<{ data: User }>("/users/verify-email", { token });
      if (current?._id === data.data._id) dispatch(setCredentials({ user: data.data }));
      setDone(true);
      navigate("/verify-email", { replace: true });
    } catch (failure) {
      setError(apiError(failure, "Could not verify the email address."));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return <section className="mx-auto w-full max-w-md px-1 py-6">
    <div className="grid gap-4 store-panel">
      <h1 className="text-2xl font-bold">Verify your email</h1>
      {error && <p role="alert" className="text-error">{error}</p>}
      {done ? <p role="status">Your email is verified.</p>
        : valid ? <button type="button" disabled={busy} onClick={() => void verify()}
          className="rounded-lg bg-primary p-2 font-semibold text-white disabled:opacity-50">
          {busy ? "Verifying..." : "Confirm email address"}
        </button> : <p>This link is incomplete. Open your profile to request a new link.</p>}
      <Link to={current ? "/profile" : "/auth/login"} className="text-sm font-semibold text-primary">
        {current ? "Back to profile" : "Sign in"}
      </Link>
    </div>
  </section>;
}
