import { useEffect } from "react";
import authService from "../../services/auth.service";
import { useAppDispatch } from "../../redux/hooks";
import { setCredentials, logout } from "../../redux/slices/auth.slice";

const AuthInitializer = () => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }
      try {
        const response = await authService.userProfile();
        dispatch(
          setCredentials({
            user: response.data.user,
            token,
          }),
        );
        console.log("Profile response:", response);
      } catch (error) {
        console.log("Authentication failed:", error);
        localStorage.removeItem("token");
        dispatch(logout());
      }
    };

    checkAuth();
  }, []);
  return null;
};

export default AuthInitializer;
