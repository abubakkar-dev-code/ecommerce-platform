import { useState } from "react";
import authService from "../../services/authService";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const Login = () => {
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
    console.log("Button clicked");
    setLoading(true);
    try {
      const response = await authService.login(formData);
      if (response) {
        toast.success("Login successfull");
        console.log(response);
      }
    } catch (error) {
      toast.error("login failed");
      setErrors(error?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };
  console.log(errors);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-background shadow-lg px-10 py-10  rounded-xl w-[30%]">
        <div className="text-center mb-3">
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-muted font-bold mt-2 text-medium">
            Login to your account
          </p>
        </div>
        <div className="mt-10">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <label className="mb-2 font-bold text-sm">Email</label>
              <input
                name="email"
                className="py-3 px-4 border border-gray-300 focus:outline-blue-800 rounded-md placeholder:text-muted placeholder:font-semibold"
                type="email"
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
            <p className="text-red-600 text-semibold text-sm mt-2">{errors}</p>
            <div className="mt-5 flex flex-col gap-5">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary py-2 rounded-lg text-white font-bold"
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
              <button
                type="button"
                className="border border-gray-400 py-2 rounded-lg font-bold"
                onClick={() =>
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
                Don't have an account?
                <span className="text-primary font-bold text-sm ml-2">
                  <Link to="/auth/register"> Register</Link>
                </span>
              </p>
              <p className="mt-2 text-muted font-bold text-sm">
                Forgot your password?
                <span className="text-primary font-bold text-sm ml-2">
                  Reset Password
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
