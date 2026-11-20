import PasswordInput from "../../componenets/UI/PasswordInput";
import { useState } from "react";
import authService from "../../services/authService";
import toast from "react-hot-toast";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { isAxiosError } from "axios";
import { setCredentials } from "../../redux/slices/authSlice";

interface LoginResponse {
  data?: {
    user?: {
      _id?: string;
      id?: string;
      name: string;
      email: string;
      role: string;
    };
  };
}

interface LoginErrorResponse {
  message?: string;
}

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors("");
    try {
      const response: LoginResponse = await authService.login(formData);
      const { user } = response.data ?? {};
      if (!user) {
        throw new Error("The login response was incomplete. Please try again.");
      }

      dispatch(setCredentials({ user }));
      toast.success("Login successful");
      const from = location.state?.from;
      navigate(typeof from === "string" && from.startsWith("/") && !from.startsWith("//") && !from.startsWith("/auth") ? from : "/", { replace: true });
    } catch (error) {
      const message = isAxiosError<LoginErrorResponse>(error)
        ? (error.response?.data?.message ?? "Login failed. Please try again.")
        : error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      toast.error(message);
      setErrors(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid place-items-center px-1 py-6">
      <div className="store-panel w-full max-w-md">
        <div className="mb-3">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="mt-2 text-sm text-muted">
            Access your account and orders.
          </p>
        </div>
        <div className="mt-7">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <label htmlFor="email" className="mb-2 font-bold text-sm">
                Email
              </label>
              <input
                id="email"
                name="email"
                className="store-input"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
              />
            </div>
            <div className="flex flex-col mt-5">
              <label htmlFor="password" className="mb-2 font-bold text-sm">
                Password
              </label>
              <PasswordInput
                id="password"
                className="store-input"

                name="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
            </div>
            <p role="alert" className="text-red-600 text-semibold text-sm mt-2">{errors}</p>
            <div className="mt-5 flex flex-col gap-5">
              <button
                type="submit"
                disabled={loading}
                className="store-button w-full"
              >
                {loading ? (
                  <>
                    {" "}
                    <span className="inline-block mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    Logging in
                  </>
                ) : (
                  "Login"
                )}
              </button>

            </div>
            {import.meta.env.VITE_GOOGLE_OAUTH_ENABLED === "true" && <a className="mt-5 block rounded-lg border border-border p-2 text-center font-semibold" href={`${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "")}/users/google`}>Continue with Google</a>}
            <div className="mt-5 text-center">
              <p className="mb-2 text-muted font-bold text-sm">
                Don't have an account?
                <span className="text-primary font-bold text-sm ml-2">
                  <Link to="/auth/register"> Register</Link>
                </span>
              </p>
              <p className="mt-2 text-muted font-bold text-sm">
                Forgot your password?
                <span className="text-primary font-bold text-sm ml-2">
                  <Link to="/auth/forgot-password">Reset password</Link>
                </span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
