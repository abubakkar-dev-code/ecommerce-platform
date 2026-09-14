import { useState } from "react";
import authService from "../../services/auth.service";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await authService.resetPassword(formData, token);
      if (response.success) {
        toast.success("Password reset successful");
      }
    } catch (error) {
      toast.error(error.response.data.message)
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-text text-center">
          Reset Password
        </h1>

        <p className="mt-2 text-center text-muted">
          Enter your new password below.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-text">
              New Password
            </label>

            <input
              name="newPassword"
              type="password"
              placeholder="Enter new password"
              className="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-primary"
              value={formData.newPassword}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text">
              Confirm Password
            </label>

            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              className="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-primary"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-3 font-medium text-white hover:bg-primary-hover"
          >
            Reset Password
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Remember your password?{" "}
          <a href="/login" className="font-medium text-primary hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
