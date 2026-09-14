import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../services/auth.service";
import GoogleButton from "../../components/GoogleButton";
import toast from "react-hot-toast";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const hadnleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.register(formData);
      if (response) {
        toast.success("Account created successfully");
        navigate("/login");
      }
    } catch (error) {
      console.log(error?.response.data.message);
      setError(error?.response.data.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-text text-center">
          Create Account
        </h1>

        <p className="mt-2 text-center text-muted">
          Create your account to get started
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-text">
              Name
            </label>

            <input
              name="name"
              value={formData.name}
              type="text"
              placeholder="Enter your name"
              onChange={hadnleFormChange}
              className="w-full rounded-lg border border-border px-4 py-3 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text">
              Email
            </label>

            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={hadnleFormChange}
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
              value={formData.password}
              onChange={hadnleFormChange}
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
            {loading ? "Creating Account..." : "Create Account"}
          </button>
          <GoogleButton />
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            to="/login"
            className="cursor-pointer font-medium text-primary hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
