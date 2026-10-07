import { useState } from "react";
import authService from "../../services/authService";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const Register = () => {
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
        console.log(response);
      }
    } catch (error) {
      toast.error("Registration failed");
      setErrors(error?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-background shadow-lg px-10 py-10  rounded-xl w-[30%]">
        <div className="text-center mb-3">
          <h1 className="text-2xl font-bold">Create new Account</h1>
          <p className="text-muted font-bold mt-2 text-medium">
            Create your account to get started
          </p>
        </div>
        <div className="mt-10">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <label className="mb-2 font-bold text-sm">Nmae</label>
              <input
                className="py-3 px-4 border border-gray-300 focus:outline-blue-800 rounded-md placeholder:text-muted placeholder:font-semibold"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </div>
            <div className="flex flex-col mt-5">
              <label className="mb-2 font-bold text-sm">Email</label>
              <input
                className="py-3 px-4 border border-gray-300 focus:outline-blue-800 rounded-md placeholder:text-muted placeholder:font-semibold"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
              />
            </div>
            <div className="flex flex-col mt-5">
              <label className="mb-2 font-bold text-sm">Password</label>
              <input
                className="py-3 px-4 border border-gray-300 focus:outline-blue-800 rounded-md placeholder:text-muted placeholder:font-semibold"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
            </div>
            <p className="text-red-600 text-semibold text-sm mt-4">{errors}</p>
            <div className="mt-5 flex flex-col gap-5">
              <button
                type="submit"
                className="bg-primary py-2 rounded-lg text-white font-bold"
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
              <button
                type="button"
                className="border border-gray-400 py-2 rounded-lg font-bold"
                onClick={(e) =>
                  toast.custom(
                    <div className="border-2 border-yellow-500 bg-yellow-100 text-yellow-700 p-4 rounded">
                      The Future is coming soon
                    </div>,
                  )
                }
              >
                Continue with Google
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
