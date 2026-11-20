import PasswordInput from "../../componenets/UI/PasswordInput";
import { useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api/api";
import apiError from "../../services/apiError";

function RecoveryForm({ token }: { token?: string }) {
  const reset = token !== undefined;
  const valid = !reset || /^[a-f\d]{64}$/i.test(token);
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid || pending.current) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const newPassword = String(fields.get("newPassword") ?? "");
    const confirmPassword = String(fields.get("confirmPassword") ?? "");
    if (reset && newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      if (reset) {
        await api.put("/users/reset-password", { newPassword, confirmPassword }, { params: { token } });
      } else {
        await api.post("/users/forgot-password", { email: String(fields.get("email") ?? "").trim() });
      }
      form.reset();
      setDone(true);
    } catch (failure) {
      setError(apiError(failure, "Could not complete your password request."));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const input = "store-input";
  return <section className="mx-auto w-full max-w-md px-1 py-6">
    <div className="grid gap-4 store-panel">
      <h1 className="text-2xl font-bold">{reset ? "Set a new password" : "Reset your password"}</h1>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      {!valid ? <p role="alert">This reset link is incomplete. <Link to="/auth/forgot-password" className="text-primary">Request a new link</Link>.</p>
        : done ? <p role="status">{reset ? "Your password was updated." : "If the email belongs to an account, a reset link will be sent."}</p>
        : <form onSubmit={(event) => void submit(event)} className="grid gap-4">
          {reset ? <>
            <label className="grid gap-1 text-sm font-semibold">New password
              <PasswordInput name="newPassword"  minLength={8} autoComplete="new-password" required className={input} />
            </label>
            <label className="grid gap-1 text-sm font-semibold">Confirm password
              <PasswordInput name="confirmPassword"  minLength={8} autoComplete="new-password" required className={input} />
            </label>
          </> : <label className="grid gap-1 text-sm font-semibold">Email
            <input name="email" type="email" autoComplete="email" maxLength={254} required className={input} />
          </label>}
          <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50">
            {busy ? "Submitting..." : reset ? "Update password" : "Send reset link"}
          </button>
        </form>}
      <Link to="/auth/login" className="text-sm font-semibold text-primary hover:underline">Back to sign in</Link>
    </div>
  </section>;
}

export function ForgotPassword() { return <RecoveryForm />; }

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  return <RecoveryForm key={token} token={token} />;
}
