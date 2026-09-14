import{ useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../redux/hooks";
import { setCredentials } from "../../redux/slices/auth.slice";

import authService from "../../services/auth.service";

const GoogleSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleGoogleSuccess = async () => {
      const token = searchParams.get("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        localStorage.setItem("token", token);

        const response = await authService.userProfile();
        const user = response.data;
        console.log(response);
        dispatch(
          setCredentials({
            user,
            token,
          }),
        );

        navigate("/");
      } catch (error) {
        console.error("Google authentication failed:", error);

        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    handleGoogleSuccess();
  }, [searchParams, navigate, dispatch]);

  return <div>Google Login Successful</div>;
};

export default GoogleSuccess;
