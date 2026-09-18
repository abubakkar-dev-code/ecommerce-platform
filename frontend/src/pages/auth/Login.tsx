import { useState } from "react";
import authService from "../../services/auth.service";
import { setCredentials } from "../../redux/slices/auth.slice";
import { Link, useNavigate } from "react-router-dom";
import GoogleButton from "../../components/GoogleButton";
import { useAppDispatch } from "../../redux/hooks";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const handleFormData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(formData);
      if (response) {
        toast.success("Login successfull");
        console.log("resposne", response);
        navigate("/");

        localStorage.setItem("token", response.data.token);
        dispatch(
          setCredentials({
            user: response.data.user,
            token: response.data.token,
          }),
        );
      }
    } catch (error:any) {
      (setError(
        error.response?.data?.message || "Login failed. Please try again.",
      ),
        console.log(error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-text text-center">
          Welcome Back
        </h1>

        <p className="mt-2 text-center text-muted">Login to your account</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-text">
              Email
            </label>

            <input
              name="email"
              type="email"
              value={formData?.email}
              onChange={handleFormData}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text">
              Password
            </label>

            <input
              name="password"
              type="password"
              value={formData?.password}
              onChange={handleFormData}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-primary"
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 font-medium text-white hover:bg-primary-hover"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <GoogleButton />
          <p className="mt-3 text-center text-muted text-sm">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="cursor-pointer font-medium text-primary hover:underline"
            >
              Register
            </Link>
          </p>
          <p className="mt-3 text-center text-muted text-sm">
            Forgot your password?{" "}
            <Link
              to="/forgot-password"
              className="cursor-pointer font-medium text-primary hover:underline"
            >
              Reset Password
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
