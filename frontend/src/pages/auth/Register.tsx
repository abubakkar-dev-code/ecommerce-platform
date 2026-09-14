import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../services/auth.service";

const Register = () => {
  const navigate = useNavigate();
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
    try {
      const response = await authService.register(formData);
      if (response) {
        navigate("/");
      }
    } catch (error) {
      console.log(error?.message);
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
          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-3 font-medium text-white hover:bg-primary-hover"
          >
            Create Account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            to="/"
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
