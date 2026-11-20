import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import SessionBoundary from "./componenets/auth/SessionBoundary";

const App = () => {
  return (
    <div>
      <Toaster toastOptions={{ duration: 2000 }} />
      <SessionBoundary><AppRoutes /></SessionBoundary>
    </div>
  );
};

export default App;
