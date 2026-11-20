import PasswordInput from "../../componenets/UI/PasswordInput";
import { useRef, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import { clearCredentials, setCredentials, type User } from "../../redux/slices/authSlice";
import type { RootState } from "../../redux/store";
import apiError from "../../services/apiError";
import BrowserSessions from "./BrowserSessions";

const input = "store-input";
const button = "store-button";

export default function Profile() {
  const user = useSelector((state: RootState) => state.userInfo.users);
  const dispatch = useDispatch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);

  const submit = async (event: FormEvent<HTMLFormElement>, mode: "profile" | "password") => {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      if (mode === "profile") {
        const { data } = await api.put<{ data: User }>("/users/update-profile", body);
        dispatch(setCredentials({ user: data.data }));
        toast.success("Profile saved");
      } else {
        await api.put("/users/update-password", body);
        form.reset();
        toast.success("Password updated. Sign in again.");
        dispatch(clearCredentials());
      }
    } catch (failure) {
      setError(apiError(failure, "Could not save your changes."));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const requestVerification = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await api.post("/users/email-verification");
      toast.success("Check your inbox for the verification link.");
    } catch (failure) {
      setError(apiError(failure, "Could not send the verification email."));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  if (!user) return null;
  return <section className="store-page space-y-6">
    <h1 className="store-title">Your account</h1>
    <nav aria-label="Account shortcuts" className="flex flex-wrap gap-4 text-sm font-semibold text-primary">
      <Link className="store-secondary" to="/orders">Orders</Link><Link className="store-secondary" to="/wishlist">Wishlist</Link><Link className="store-secondary" to="/checkout#shipping-addresses">Saved addresses</Link>
    </nav>
    {error && <p role="alert" className="text-error">{error}</p>}
    <div className="grid items-start gap-5 md:grid-cols-2">
      <form key={JSON.stringify([user._id, user.name, user.email])} onSubmit={(event) => void submit(event, "profile")} className="grid gap-4 rounded-xl border border-border p-5">
        <h2 className="text-lg font-bold">Personal information</h2>
        <label className="grid gap-1 text-sm font-semibold">Name
          <input className={input} name="name" autoComplete="name" defaultValue={user.name} required />
        </label>
        <label className="grid gap-1 text-sm font-semibold">Email
          <input className={input} type="email" name="email" autoComplete="email" defaultValue={user.email} required />
        </label>
        {user.emailVerified ? <p className="text-sm text-success">Email verified</p>
          : <button type="button" disabled={busy} onClick={() => void requestVerification()} className="w-fit text-sm font-semibold text-primary">Send email verification link</button>}
        <button disabled={busy} className={button}>Save profile</button>
      </form>
      <form onSubmit={(event) => void submit(event, "password")} className="grid gap-4 rounded-xl border border-border p-5">
        <h2 className="text-lg font-bold">Change password</h2>
        <label className="grid gap-1 text-sm font-semibold">Current password
          <PasswordInput className={input}  name="currentPassword" autoComplete="current-password" required />
        </label>
        <label className="grid gap-1 text-sm font-semibold">New password
          <PasswordInput className={input}  name="newPassword" autoComplete="new-password" minLength={8} required />
        </label>
        <button disabled={busy} className={button}>Update password</button>
      </form>
    </div>
    <BrowserSessions />
  </section>;
}
