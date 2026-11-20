import PasswordInput from "../../componenets/UI/PasswordInput";
import { useState } from "react";
import { isAxiosError } from "axios";
import authService from "../../services/authService";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState("");
  const [loading, setLoading] = useState(false);
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
    try {
      const response = await authService.register(formData);
      if (response) {
        toast.success("Registered successfully");
        navigate("/auth/login", { replace: true });
      }
    } catch (error) {
      toast.error("Registration failed");
      const message = isAxiosError<{ message?: unknown }>(error)
        ? error.response?.data?.message
        : undefined;
      setErrors(typeof message === "string" ? message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="grid place-items-center px-1 py-6">
      <div className="store-panel w-full max-w-md">
        <div className="mb-3">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-muted">
            Save items and track your orders.
          </p>
        </div>
        <div className="mt-7">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <label htmlFor="name" className="mb-2 font-bold text-sm">Name</label>
              <input
                className="store-input"
                type="text"
                name="name"
                id="name"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </div>
            <div className="flex flex-col mt-5">
              <label htmlFor="email" className="mb-2 font-bold text-sm">Email</label>
              <input
                className="store-input"
                type="email"
                name="email"
                id="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
              />
            </div>
            <div className="flex flex-col mt-5">
              <label htmlFor="password" className="mb-2 font-bold text-sm">Password</label>
              <PasswordInput
                className="store-input"

                name="password"
                id="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
            </div>
            <p role="alert" className="text-red-600 text-semibold text-sm mt-4">{errors}</p>
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
                    Registering
                  </>
                ) : (
                  "Register"
                )}
              </button>

            </div>
            <div className="mt-5 text-center">
              <p className="mb-2 text-muted font-bold text-sm">
                Already have an account?
                <span className="text-primary font-bold text-sm ml-2">
                  <Link to="/auth/login"> Login</Link>
                </span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
